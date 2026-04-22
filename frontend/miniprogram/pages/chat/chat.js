const api = require('../../utils/api');
const app = getApp();

const MSG_STORAGE = 'nira_chat_messages';
const HISTORY_STORAGE = 'nira_chat_history';

Page({
    data: {
        messages: [],
        inputValue: '',
        inputPlaceholder: '说说你喜欢什么...',
        isAiTyping: false,
        chatComplete: false,
        chatHistory: '',
        userId: '',
        step: 0,
        isJoiningQueue: false,
        joinError: '',
        alreadyJoined: false,
    },

    onLoad() {
        this.setData({ userId: app.getUserId() });
        this.loadChatHistory();
    },

    // ---- 聊天记录持久化 ----

    loadChatHistory() {
        const saved = wx.getStorageSync(MSG_STORAGE);
        if (saved && saved.length > 0) {
            const chatComplete = app.isProfileComplete();
            const alreadyJoined = app.isJoinedQueue();
            this.setData({
                messages: saved,
                chatHistory: wx.getStorageSync(HISTORY_STORAGE) || '',
                chatComplete,
                alreadyJoined,
                step: chatComplete ? 3 : 0,
            });
        } else {
            this.addAiMessage(
                '嗨！我是 Nira AI 🤖\n\n' +
                '告诉我你的兴趣爱好吧～比如你喜欢什么活动、周末一般什么时候有空？\n\n' +
                '随便聊，我会帮你找到最合适的活动搭子！'
            );
        }
    },

    saveMessages() {
        try {
            wx.setStorageSync(MSG_STORAGE, this.data.messages);
            wx.setStorageSync(HISTORY_STORAGE, this.data.chatHistory);
        } catch (e) {
            console.error('saveMessages failed:', e);
        }
    },

    // ---- 消息操作 ----

    addAiMessage(text) {
        const messages = this.data.messages;
        messages.push({ id: Date.now() + '_ai', text, isUser: false });
        this.setData({ messages });
        this.saveMessages();
        this.scrollToBottom();
    },

    addUserMessage(text) {
        const messages = this.data.messages;
        messages.push({ id: Date.now() + '_user', text, isUser: true });
        this.setData({
            messages,
            chatHistory: (this.data.chatHistory ? this.data.chatHistory + '\n' : '') + text,
        });
        this.saveMessages();
        this.scrollToBottom();
    },

    scrollToBottom() {
        setTimeout(() => {
            wx.pageScrollTo({ scrollTop: 99999, duration: 300 });
        }, 100);
    },

    // ---- 输入与发送 ----

    onInputChange(e) {
        this.setData({ inputValue: e.detail.value });
    },

    onSend() {
        const text = this.data.inputValue.trim();
        if (!text || this.data.isAiTyping || this.data.chatComplete) return;

        this.addUserMessage(text);
        this.setData({ inputValue: '' });

        const step = this.data.step + 1;
        this.setData({ step });

        if (step >= 3) {
            this.buildProfile();
        } else {
            this.followUp(step);
        }
    },

    followUp(step) {
        const responses = [
            '有意思！还有别的爱好吗？比如户外、桌游、看展之类的？',
            '了解啦～你周末一般什么时间段比较空呀？上午、下午还是晚上？',
        ];
        this.setData({ isAiTyping: true });
        setTimeout(() => {
            this.setData({ isAiTyping: false });
            this.addAiMessage(responses[step - 1] || '好的，再聊聊你的偏好？');
        }, 800 + Math.random() * 600);
    },

    // ---- 画像构建 ----

    async buildProfile() {
        this.setData({ isAiTyping: true });

        try {
            const result = await api.buildProfile(this.data.userId, this.data.chatHistory);

            const profile = result;
            const interests = (profile.interests || []).join('、');
            const activities = (profile.activity_types || []).join('、');
            const tags = (profile.personality_tags || []).join('、');

            this.setData({ isAiTyping: false });
            this.addAiMessage(
                `画像生成好啦！✨\n\n` +
                `兴趣：${interests}\n` +
                `活动：${activities}\n` +
                `性格：${tags}\n\n` +
                `点击下方按钮，加入本周匹配队列！`
            );

            app.setProfile(profile);
            this.setData({ chatComplete: true });
        } catch (err) {
            this.setData({ isAiTyping: false });

            const localProfile = {
                interests: ['户外运动', '咖啡'],
                activity_types: ['hiking', 'coffee_chat'],
                personality_tags: ['extrovert', 'adventurous'],
                bio: '热情开朗的活动爱好者',
                availability: { weekdays: ['evening'], weekends: ['morning', 'afternoon'] },
            };

            this.addAiMessage(
                `画像生成好啦！✨（本地模式）\n\n` +
                `兴趣：${localProfile.interests.join('、')}\n` +
                `活动：${localProfile.activity_types.join('、')}\n` +
                `性格：${localProfile.personality_tags.join('、')}\n\n` +
                `点击下方按钮，加入本周匹配队列。`
            );

            app.setProfile(localProfile);
            this.setData({ chatComplete: true });
        }
    },

    // ---- 加入匹配队列（Ditto 模式） ----

    async onJoinQueue() {
        if (this.data.isJoiningQueue) return;

        this.setData({ isJoiningQueue: true, joinError: '' });

        try {
            const profile = app.getProfile();
            await api.joinQueue(this.data.userId, profile);
            this.onQueueJoined();
        } catch (err) {
            // API 失败也本地入队（开发模式降级）
            console.log('joinQueue API failed, local fallback:', err.message);
            this.onQueueJoined();
        }
    },

    onQueueJoined() {
        app.joinQueue();
        this.setData({ isJoiningQueue: false, alreadyJoined: true });

        this.addAiMessage(
            '已成功加入本周匹配队列！🎉\n\n' +
            '下周三 19:00 将为你揭晓匹配结果，届时会通过消息通知你。\n\n' +
            '现在可以返回首页等待啦～'
        );
    },

    onGoHome() {
        wx.reLaunch({ url: '/pages/index/index' });
    },
});
