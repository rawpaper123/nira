App({
    onLaunch() {
        console.log('Nira 小程序启动');
        this.ensureUserId();
    },

    globalData: {
        apiBase: 'http://localhost:8000',
        userInfo: null,
        profile: null,
        currentMatch: null,
        activityPlan: null,
        userId: null,
        profileCompleted: false,
        joinedQueue: false,
    },

    ensureUserId() {
        let userId = wx.getStorageSync('nira_user_id');
        if (!userId) {
            userId = this.generateUUID();
            wx.setStorageSync('nira_user_id', userId);
        }
        this.globalData.userId = userId;
        return userId;
    },

    getUserId() {
        if (!this.globalData.userId) this.ensureUserId();
        return this.globalData.userId;
    },

    // ---- Profile State ----

    isProfileComplete() {
        if (!this.globalData.profileCompleted) {
            this.globalData.profileCompleted = wx.getStorageSync('profileCompleted') === true;
        }
        return this.globalData.profileCompleted;
    },

    setProfile(profile) {
        this.globalData.profile = profile;
        this.globalData.profileCompleted = true;
        wx.setStorageSync('profile', profile);
        wx.setStorageSync('profileCompleted', true);
    },

    getProfile() {
        if (!this.globalData.profile) {
            this.globalData.profile = wx.getStorageSync('profile') || null;
        }
        return this.globalData.profile;
    },

    resetProfile() {
        this.globalData.profile = null;
        this.globalData.profileCompleted = false;
        this.globalData.currentMatch = null;
        this.globalData.joinedQueue = false;
        wx.removeStorageSync('profile');
        wx.removeStorageSync('profileCompleted');
        wx.removeStorageSync('currentMatch');
        wx.removeStorageSync('joinedQueue');
        wx.removeStorageSync('nira_chat_messages');
        wx.removeStorageSync('nira_chat_history');
    },

    // ---- User Info ----

    setUserInfo(info) {
        this.globalData.userInfo = info;
        wx.setStorageSync('userInfo', info);
    },

    getUserInfo() {
        if (!this.globalData.userInfo) {
            this.globalData.userInfo = wx.getStorageSync('userInfo') || null;
        }
        return this.globalData.userInfo;
    },

    // ---- Match ----

    setCurrentMatch(match) {
        this.globalData.currentMatch = match;
        wx.setStorageSync('currentMatch', match);
    },

    getCurrentMatch() {
        if (!this.globalData.currentMatch) {
            this.globalData.currentMatch = wx.getStorageSync('currentMatch') || null;
        }
        return this.globalData.currentMatch;
    },

    // ---- Queue ----

    joinQueue() {
        this.globalData.joinedQueue = true;
        wx.setStorageSync('joinedQueue', true);
    },

    isJoinedQueue() {
        if (!this.globalData.joinedQueue) {
            this.globalData.joinedQueue = wx.getStorageSync('joinedQueue') === true;
        }
        return this.globalData.joinedQueue;
    },

    leaveQueue() {
        this.globalData.joinedQueue = false;
        wx.removeStorageSync('joinedQueue');
    },

    // ---- Activity ----

    setActivityPlan(plan) {
        this.globalData.activityPlan = plan;
        wx.setStorageSync('activityPlan', plan);
    },

    getActivityPlan() {
        if (!this.globalData.activityPlan) {
            this.globalData.activityPlan = wx.getStorageSync('activityPlan') || null;
        }
        return this.globalData.activityPlan;
    },

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },
});
