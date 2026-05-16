const api = require('../../utils/api');
const app = getApp();

const MSG_STORAGE = 'nira_chat_messages';
const HISTORY_STORAGE = 'nira_chat_history';

Page({
    data: {
        messages: [],
        inputValue: '',
        inputPlaceholder: '随便说说你自己，Nira 会边聊边整理',
        onboardingHint: '再聊两句，Nira 就能帮你加入本周匹配',
        isAiTyping: false,
        chatComplete: false,
        chatHistory: '',
        userId: '',
        isJoiningQueue: false,
        joinError: '',
        alreadyJoined: false,
        preferredName: '',
        preferredGender: '',
        preferredType: '',
        conversationId: '',
    },

    onLoad(options) {
        this.setData({ userId: app.getUserId() });

        if (!app.isLoggedIn()) {
            wx.navigateTo({ url: '/pages/login/phone/index' });
            this.addAiMessage('先登录一下下，登录完我就继续帮你整理档案～');
            return;
        }
        this.loadChatHistory();
    },

    onShow() {
        if (app.isLoggedIn()) {
            this.setData({
                userId: app.getUserId(),
                alreadyJoined: app.isJoinedQueue(),
            });
        }
    },
    // ---- Chat history ----

    loadChatHistory() {
        const saved = (wx.getStorageSync(MSG_STORAGE) || []).map((message) => ({
            ...message,
            text: message.text || '',
            imageUrl: message.imageUrl || '',
        }));
        const profile = app.getProfile();
        const savedName = wx.getStorageSync('nira_preferred_name') || (profile && profile.preferred_name) || '';

        if (saved && saved.length > 0) {
            const chatComplete = app.isProfileComplete();
            const alreadyJoined = app.isJoinedQueue();
            this.setData({
                messages: saved,
                chatHistory: wx.getStorageSync(HISTORY_STORAGE) || '',
                chatComplete,
                alreadyJoined,
                preferredName: savedName,
                conversationId: wx.getStorageSync('nira_profile_conversation_id') || '',
                inputPlaceholder: '还想补充或修改什么，直接说就行',
                onboardingHint: chatComplete ? '档案信息够用了，也可以继续修改偏好' : '再聊两句，Nira 就能帮你加入本周匹配',
            });
        } else if (app.isProfileComplete()) {
            this.setData({
                chatComplete: true,
                alreadyJoined: app.isJoinedQueue(),
                preferredName: savedName,
                inputPlaceholder: '',
            });
            this.addAiMessage(
                `${savedName || '朋友'}，你的档案已经准备好了。\n\n` +
                (app.isJoinedQueue() ? '你已经在本周匹配队列里，回首页看看状态就好。' : '现在可以直接加入本周匹配队列。')
            );
        } else {
            this.setData({
                conversationId: wx.getStorageSync('nira_profile_conversation_id') || '',
                inputPlaceholder: '随便说说你自己，Nira 会边聊边整理',
                onboardingHint: '再聊两句，Nira 就能帮你加入本周匹配',
            });
            this.addAiMessage(
                '嗨，我是 Nira。你可以随便说说自己，喜欢的活动、想认识什么样的人、什么时候方便都行。\n\n我会边聊边帮你整理，不用按表格填。'
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
        if (!text || this.data.isAiTyping) return;

        this.addUserMessage(text);
        this.setData({ inputValue: '' });
        this.sendProfileChat(text);
    },

    async sendProfileChat(text) {
        if (!app.isLoggedIn()) {
            wx.navigateTo({ url: '/pages/login/phone/index' });
            return;
        }

        const conversationId = this.data.conversationId || wx.getStorageSync('nira_profile_conversation_id') || `local-${Date.now()}`;
        wx.setStorageSync('nira_profile_conversation_id', conversationId);

        this.setData({ isAiTyping: true, conversationId });

        try {
            const result = await api.profileChat(this.data.userId || app.getUserId(), text, conversationId);
            const profile = result.profile || null;
            const completion = result.completion || {};
            const patch = result.profile_patch || {};

            if (profile) {
                app.globalData.profile = profile;
                wx.setStorageSync('profile', profile);
                if (completion.is_ready) {
                    app.setProfile(profile);
                } else {
                    app.globalData.profileCompleted = false;
                    wx.setStorageSync('profileCompleted', false);
                }
                wx.setStorageSync('profilePatch', patch);
                if (profile.preferred_name) {
                    wx.setStorageSync('nira_preferred_name', profile.preferred_name);
                    this.setData({ preferredName: profile.preferred_name });
                }
                this.setData({
                    preferredGender: profile.preferred_gender || '',
                    preferredType: profile.preferred_type || '',
                });
            }

            this.setData({
                isAiTyping: false,
                chatComplete: !!completion.is_ready,
                alreadyJoined: app.isJoinedQueue(),
                inputPlaceholder: '还想补充或修改什么，直接说就行',
                onboardingHint: completion.is_ready
                    ? '信息够用了，可以加入本周匹配；想改偏好也可以继续聊'
                    : '再聊两句，Nira 就能帮你加入本周匹配',
            });
            this.addAiMessage(result.reply || '我记下了。你可以继续补充，也可以先加入本周匹配。');
        } catch (err) {
            this.setData({ isAiTyping: false });
            this.addAiMessage('这条我刚刚没连上后端，先别急。你可以再发一次，我会继续帮你整理偏好。');
        }
    },

    onContinueChat() {
        this.setData({
            chatComplete: false,
            inputPlaceholder: '想改名字、活动、时间或偏好都可以直接说',
            onboardingHint: '继续说就行，Nira 会更新你的偏好',
        });
    },

    // ---- Join match queue ----

    async onJoinQueue() {
        if (this.data.isJoiningQueue) return;

        this.setData({ isJoiningQueue: true, joinError: '' });
        try {
            const profile = app.getProfile();
            const result = await api.joinQueue(this.data.userId, profile);
            if (result.status === 'profile_required') {
                this.setData({ isJoiningQueue: false, joinError: result.message || '请先完成画像' });
                return;
            }
            this.onQueueJoined();
        } catch (err) {
            console.log('joinQueue API failed, local fallback:', err.message);
            this.onQueueJoined();
        }
    },

    onQueueJoined() {
        app.joinQueue();
        const name = this.data.preferredName;
        this.setData({ isJoiningQueue: false, alreadyJoined: true });

        this.addAiMessage(
            `${name}，搞定！已经把你放进这周的匹配队列了 🎉\n\n` +
            '下周三 19:00 会出匹配结果，到时候消息会通知你～\n\n' +
            '先回首页等着吧，有消息我第一个告诉你！'
        );
    },
    onGoHome() {
        wx.reLaunch({ url: '/pages/index/index' });
    }
});
