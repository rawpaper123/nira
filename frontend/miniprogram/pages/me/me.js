const app = getApp();

Page({
    data: {
        nickname: 'Nira 用户',
        userId: '',
        profileComplete: false,
        joinedQueue: false,
        profileTags: [],
        matchHistory: [],
    },

    onShow() {
        this.refreshData();
    },

    refreshData() {
        const profile = app.getProfile();
        const profileComplete = app.isProfileComplete();
        const joinedQueue = app.isJoinedQueue();
        const userId = app.getUserId();

        let profileTags = [];
        if (profile) {
            const interests = profile.interests || [];
            const tags = profile.personality_tags || [];
            profileTags = [...interests, ...tags].slice(0, 6);
        }

        this.setData({
            nickname: (profile && profile.bio) ? profile.bio.slice(0, 10) : 'Nira 用户',
            userId: userId ? userId.slice(0, 8) : '',
            profileComplete,
            joinedQueue,
            profileTags,
            matchHistory: app.getMatchHistory(),
        });
    },

    // ---- 操作 ----

    onEditProfile() {
        wx.switchTab({ url: '/pages/chat/chat' });
    },

    onNotificationTap() {
        wx.showModal({
            title: '通知设置',
            content: '匹配结果将在每周三 19:00 通过微信消息推送给你',
            showCancel: false,
            confirmText: '知道了',
        });
    },

    onPrivacyTap() {
        wx.showModal({
            title: '隐私政策',
            content: 'Nira 严格保护你的个人隐私。所有数据仅用于匹配，不会分享给第三方。',
            showCancel: false,
            confirmText: '知道了',
        });
    },

    onAboutTap() {
        wx.showModal({
            title: '关于 Nira',
            content: 'Nira — Z 世代活动搭子撮合平台\n\nAI 帮你找到最合拍的人，安排最棒的活动。\n\nv0.1.0 MVP',
            showCancel: false,
            confirmText: '知道了',
        });
    },

    onLogout() {
        wx.showModal({
            title: '确认退出',
            content: '退出后将清除所有本地数据',
            confirmText: '确认退出',
            confirmColor: '#000000',
            success(res) {
                if (res.confirm) {
                    app.resetProfile();
                    wx.reLaunch({ url: '/pages/index/index' });
                }
            },
        });
    },
});
