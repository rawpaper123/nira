const api = require('../../utils/api');
const app = getApp();

Page({
    data: {
        loading: true,
        loadError: false,
        errorMsg: '',
        plan: null,
        posterCopy: '',
        groupWelcome: '',
        matchId: '',
    },

    onLoad(options) {
        const matchId = options.matchId;
        if (!matchId) {
            this.setData({ loading: false, loadError: true, errorMsg: '缺少匹配信息' });
            return;
        }
        this.setData({ matchId });
        this.loadActivity();
    },

    async loadActivity() {
        try {
            const result = await api.arrangeActivity(this.data.matchId);
            this.setData({
                loading: false,
                plan: result.plan,
                posterCopy: result.poster_copy || '',
                groupWelcome: result.chat_group_qrcode || '',
            });
            app.setActivityPlan(result);
        } catch (err) {
            console.log('arrangeActivity failed:', err.message);
            this.setData({
                loading: false,
                loadError: true,
                errorMsg: '活动安排失败，请确认后端服务已启动',
            });
        }
    },

    onConfirm() {
        const planData = {
            plan: this.data.plan,
            posterCopy: this.data.posterCopy,
            groupWelcome: this.data.groupWelcome,
        };
        // 通过 globalData 传递数据给 group 页
        app.setActivityPlan(planData);

        wx.navigateTo({ url: '/pages/group/group' });
    },

    onRetry() {
        this.setData({ loading: true, loadError: false });
        this.loadActivity();
    },
});
