App({
    onLaunch() {
        console.log('Nira 小程序启动');
        this.ensureUserId();
        this.doWxLogin();
    },

    globalData: {
        apiBase: 'http://localhost:8000',
        userInfo: null,
        profile: null,
        currentMatch: null,
        matchResult: null,
        activityPlan: null,
        groupInfo: null,
        userId: null,
        openid: null,
        phone: null,
        token: null,
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

    getOpenId() {
        return this.globalData.openid || wx.getStorageSync('nira_openid') || '';
    },

    // ---- Phone Login ----

    isLoggedIn() {
        return !!(this.globalData.phone || wx.getStorageSync('nira_phone'));
    },

    getPhone() {
        return this.globalData.phone || wx.getStorageSync('nira_phone') || '';
    },

    loginWithPhone(data) {
        if (data.phone) {
            this.globalData.phone = data.phone;
            wx.setStorageSync('nira_phone', data.phone);
        }
        if (data.openid) {
            this.globalData.openid = data.openid;
            wx.setStorageSync('nira_openid', data.openid);
        }
        if (data.userId) {
            this.globalData.userId = data.userId;
            wx.setStorageSync('nira_user_id', data.userId);
        }
        if (data.token) {
            this.globalData.token = data.token;
            wx.setStorageSync('token', data.token);
        }
    },

    logout() {
        this.globalData.phone = null;
        this.globalData.token = null;
        wx.removeStorageSync('nira_phone');
        wx.removeStorageSync('token');
    },

    doWxLogin() {
        const cached = wx.getStorageSync('nira_openid');
        if (cached) {
            this.globalData.openid = cached;
            return;
        }

        if ((this.globalData.apiBase || '').indexOf('localhost') !== -1) {
            const devOpenid = 'dev_local_openid';
            this.globalData.openid = devOpenid;
            wx.setStorageSync('nira_openid', devOpenid);
            return;
        }

        const api = require('./utils/api');
        wx.login({
            success: (res) => {
                if (res.code) {
                    api.login(res.code).then((data) => {
                        this.globalData.openid = data.openid;
                        wx.setStorageSync('nira_openid', data.openid);
                        // 如果后端返回了更稳定的 user_id，也更新
                        if (data.user_id) {
                            this.globalData.userId = data.user_id;
                            wx.setStorageSync('nira_user_id', data.user_id);
                        }
                    }).catch((err) => {
                        console.warn('wx.login 后端接口失败:', err);
                    });
                }
            },
            fail: () => {
                console.warn('wx.login 调用失败');
            },
        });
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
        this.globalData.matchResult = null;
        this.globalData.activityPlan = null;
        this.globalData.groupInfo = null;
        this.globalData.joinedQueue = false;
        wx.removeStorageSync('profile');
        wx.removeStorageSync('profileCompleted');
        wx.removeStorageSync('currentMatch');
        wx.removeStorageSync('matchResult');
        wx.removeStorageSync('activityPlan');
        wx.removeStorageSync('groupInfo');
        wx.removeStorageSync('joinedQueue');
        wx.removeStorageSync('nira_chat_messages');
        wx.removeStorageSync('nira_chat_history');
        wx.removeStorageSync('nira_profile_conversation_id');
        wx.removeStorageSync('profilePatch');
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
        this.globalData.matchResult = match;
        wx.setStorageSync('currentMatch', match);
        wx.setStorageSync('matchResult', match);
    },

    getCurrentMatch() {
        if (!this.globalData.currentMatch) {
            this.globalData.currentMatch = wx.getStorageSync('currentMatch') || wx.getStorageSync('matchResult') || null;
        }
        return this.globalData.currentMatch;
    },

    setMatchResult(match) {
        this.setCurrentMatch(match);
    },

    getMatchResult() {
        return this.getCurrentMatch();
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

    // ---- Group ----

    setGroupInfo(info) {
        const normalized = this.normalizeGroupInfo(info);
        this.globalData.groupInfo = normalized;
        wx.setStorageSync('groupInfo', normalized);
    },

    getGroupInfo() {
        if (!this.globalData.groupInfo) {
            this.globalData.groupInfo = wx.getStorageSync('groupInfo') || null;
        }
        if (this.globalData.groupInfo) {
            this.globalData.groupInfo = this.normalizeGroupInfo(this.globalData.groupInfo);
            wx.setStorageSync('groupInfo', this.globalData.groupInfo);
        }
        return this.globalData.groupInfo;
    },

    normalizeGroupInfo(info) {
        if (!info) return null;
        return {
            ...info,
            group_id: info.group_id || info.groupId || '',
            match_id: info.match_id || info.matchId || '',
            activity_id: info.activity_id || info.activityId || info.plan_id || info.planId || '',
            plan_id: info.plan_id || info.planId || info.activity_id || info.activityId || '',
        };
    },

    // ---- Match History ----

    addMatchHistory(entry) {
        const history = wx.getStorageSync('matchHistory') || [];
        history.unshift({
            id: Date.now(),
            date: new Date().toLocaleDateString('zh-CN'),
            activity: entry.activity || '未知活动',
            score: entry.score || 0,
            status: entry.status || 'accepted',
            statusText: { accepted: '已接受', rejected: '已拒绝', completed: '已完成' }[entry.status] || '已接受',
        });
        // 最多保留 20 条
        if (history.length > 20) history.length = 20;
        wx.setStorageSync('matchHistory', history);
    },

    getMatchHistory() {
        return wx.getStorageSync('matchHistory') || [];
    },

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    },
});
