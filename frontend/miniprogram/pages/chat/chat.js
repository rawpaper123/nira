const api = require('../../utils/api');
const app = getApp();

const MSG_STORAGE = 'nira_chat_messages';
const HISTORY_STORAGE = 'nira_chat_history';

Page({
    data: {
        messages: [],
        inputValue: '',
        inputPlaceholder: '你的小名或昵称...',
        isAiTyping: false,
        chatComplete: false,
        chatHistory: '',
        userId: '',
        step: 0,
        preferredName: '',
        preferredStyle: '',
        preferredGender: 'any',
        preferredType: '',
    },

    onLoad() {
        this.setData({ userId: app.getUserId() });

        if (!app.isLoggedIn()) {
            wx.navigateTo({ url: '/pages/login/phone/index' });
            this.addAiMessage('先登录一下下，登录完我就继续帮你整理档案～');
            return;
        }

        this.loadChatHistory();
    },

    onShow() {
        this.setData({ userId: app.getUserId() });
    },

    // ---- 聊天记录持久化 ----

    loadChatHistory() {
        const saved = wx.getStorageSync(MSG_STORAGE);
        const profile = app.getProfile();
        const savedName = wx.getStorageSync('nira_preferred_name') || (profile && profile.preferred_name) || '';

        if (saved && saved.length > 0) {
            const chatComplete = app.isProfileComplete();
            this.setData({
                messages: saved,
                chatHistory: wx.getStorageSync(HISTORY_STORAGE) || '',
                chatComplete,
                preferredName: savedName,
                step: chatComplete ? 6 : 0,
                inputPlaceholder: chatComplete ? '' : '继续说说你的偏好...',
            });
        } else if (app.isProfileComplete()) {
            this.setData({
                chatComplete: true,
                preferredName: savedName,
                inputPlaceholder: '',
            });
            this.addAiMessage(
                `${savedName || '朋友'}，你的档案已经准备好了。\n\n` +
                '回首页就能看到当前状态。'
            );
        } else {
            this.addAiMessage(
                '嗨！我是 Nira～\n\n' +
                '先说说你怎么称呼吧？朋友们平时叫你啥？'
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

        if (step === 1) {
            this.handleNicknameReply(text);
        } else if (step === 4) {
            this.handleGenderTypeReply(text);
        } else if (step === 5) {
            this.handleStyleReply(text);
        } else if (step >= 6) {
            this.buildProfile();
        } else {
            this.followUp(step);
        }
    },

    handleNicknameReply(name) {
        this.setData({
            preferredName: name,
            inputPlaceholder: '说说你喜欢什么...',
        });
        wx.setStorageSync('nira_preferred_name', name);

        this.setData({ isAiTyping: true });
        setTimeout(() => {
            this.setData({ isAiTyping: false });
            this.addAiMessage(
                `${name}是吧，记住了！\n\n` +
                '聊聊你喜欢啥呗？周末一般怎么过，平时有什么爱好，随便说～'
            );
        }, 600 + Math.random() * 400);
    },

    followUp(step) {
        const name = this.data.preferredName;
        const responses = [
            '',
            `哦？还有别的吗${name ? ' ' + name : ''}？户外、桌游、看展、做饭，有没有感兴趣的？`,
            '了解！那周末一般啥时候比较空呀？上午下午晚上都说说～',
            '最后两个小问题：这次想遇到什么样的人？比如男生 / 女生 / 都可以，或者直接描述你喜欢的性格和相处感。',
        ];
        this.setData({ isAiTyping: true });
        setTimeout(() => {
            this.setData({ isAiTyping: false });
            this.addAiMessage(responses[step] || '嗯嗯，还有啥想补充的不？');
        }, 800 + Math.random() * 600);
    },

    handleGenderTypeReply(text) {
        const preferredGender = this.detectPreferredGender(text);
        this.setData({ preferredGender, preferredType: text });
        wx.setStorageSync('nira_preferred_gender', preferredGender);
        wx.setStorageSync('nira_preferred_type', text);

        this.setData({ isAiTyping: true });
        setTimeout(() => {
            this.setData({ isAiTyping: false });
            this.addAiMessage(
                '懂了懂了。\n\n' +
                '再问一个：你平时审美偏什么风格？比如 Y2K、动漫风、极简高级感、氛围感、治愈系、复古，或者你自己描述也行。'
            );
        }, 600 + Math.random() * 400);
    },

    handleStyleReply(text) {
        this.setData({ preferredStyle: text });
        wx.setStorageSync('nira_preferred_style', text);

        this.setData({ isAiTyping: true });
        setTimeout(() => {
            this.setData({ isAiTyping: false });
            this.addAiMessage(`${text}是吧，品味不错。\n\n我这就给你整理档案，稍等一下哈。`);
            setTimeout(() => {
                this.buildProfile();
            }, 600);
        }, 600 + Math.random() * 400);
    },

    detectPreferredGender(text) {
        if (text.indexOf('男') !== -1) return 'male';
        if (text.indexOf('女') !== -1) return 'female';
        return 'any';
    },

    // ---- 画像构建 ----

    async buildProfile() {
        if (!app.isLoggedIn()) {
            wx.navigateTo({ url: '/pages/login/phone/index' });
            return;
        }

        this.setData({ isAiTyping: true });

        const name = this.data.preferredName || wx.getStorageSync('nira_preferred_name') || '朋友';
        const style = this.data.preferredStyle || wx.getStorageSync('nira_preferred_style') || '';
        const preferredGender = this.data.preferredGender || wx.getStorageSync('nira_preferred_gender') || 'any';
        const preferredType = this.data.preferredType || wx.getStorageSync('nira_preferred_type') || '';

        const profileInput = [
            `我的昵称/小名是：${name}`,
            style ? `我的审美/视觉风格偏好是：${style}` : '',
            preferredGender ? `我偏好的连接对象性别：${preferredGender}` : '',
            preferredType ? `我想要的搭子/偏好类型：${preferredType}` : '',
            '',
            this.data.chatHistory,
        ].filter(Boolean).join('\n');

        try {
            const profile = await api.buildProfile(this.data.userId, profileInput);
            if (!profile.preferred_name) profile.preferred_name = name;
            if (!profile.preferred_style) profile.preferred_style = style;
            if (!profile.preferred_gender) profile.preferred_gender = preferredGender;
            if (!profile.preferred_type) profile.preferred_type = preferredType;

            this.finishProfile(profile, false);
        } catch (err) {
            const localProfile = {
                preferred_name: name,
                interests: ['咖啡探店', '城市漫步'],
                activity_types: ['coffee_chat', 'city_walk'],
                personality_tags: ['chill', 'social'],
                bio: '有点会玩，也有点会生活',
                preferred_style: style || '极简高级感',
                preferred_gender: preferredGender,
                preferred_type: preferredType,
                availability: { weekdays: ['evening'], weekends: ['afternoon', 'evening'] },
                photo_urls: [],
                photo_status: 'pending',
            };
            this.finishProfile(localProfile, true);
        }
    },

    finishProfile(profile, isLocalMode) {
        const name = profile.preferred_name || this.data.preferredName || '朋友';
        const interests = (profile.interests || []).join('、');
        const activities = (profile.activity_types || []).join('、');
        const tags = (profile.personality_tags || []).join('、');
        const style = profile.preferred_style || '';
        const preferredType = profile.preferred_type || '';

        this.setData({ isAiTyping: false });
        this.addAiMessage(
            `${name}，你的档案搞定啦${isLocalMode ? '（本地模式）' : ''}！看看准不准～\n\n` +
            `兴趣：${interests}\n` +
            `活动：${activities}\n` +
            `性格：${tags}\n` +
            (style ? `风格：${style}\n` : '') +
            (preferredType ? `理想相处感：${preferredType}\n` : '') +
            '\n回首页就能看到当前状态。'
        );

        app.setProfile(profile);
        this.setData({ chatComplete: true, inputPlaceholder: '' });
    },

    onGoHome() {
        wx.reLaunch({ url: '/pages/index/index' });
    },
});
