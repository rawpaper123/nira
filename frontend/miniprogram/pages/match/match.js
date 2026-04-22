const api = require('../../utils/api');
const app = getApp();

const MATCH_TIMEOUT = 30000; // 30秒超时

Page({
    data: {
        loading: true,
        loadError: false,
        errorMsg: '',
        matchData: null,
        score: 0,
        reasoning: '',
        simulationScenes: [],
        simulationExpanded: false,
        weekNumber: 0,
        compatDimensions: {
            interest_overlap: 0,
            personality_complement: 0,
            schedule_compatibility: 0,
            chemistry_from_sim: 0,
        },
        matchStatus: 'loading', // loading | waiting | ready | accepted | rejected
    },

    timeoutTimer: null,

    onLoad() {
        this.loadMatch();
    },

    onUnload() {
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    },

    async loadMatch() {
        // 1. 先检查本地是否已有匹配结果
        const cached = app.getCurrentMatch();
        if (cached && cached.score) {
            this.applyMatchData(cached);
            return;
        }

        // 2. 启动 30 秒超时
        this.timeoutTimer = setTimeout(() => {
            if (this.data.loading) {
                this.setData({
                    loading: false,
                    matchStatus: 'waiting',
                });
            }
        }, MATCH_TIMEOUT);

        // 3. 尝试从后端拉取匹配结果
        const userId = app.getUserId();

        try {
            const result = await api.weeklyMatch(userId, '上海');
            clearTimeout(this.timeoutTimer);
            this.handleMatchResult(result);
            return;
        } catch (err) {
            console.log('weeklyMatch failed:', err.message);
        }

        // 4. 降级到 test API
        try {
            const profile = app.getProfile();
            const userAInput = wx.getStorageSync('nira_chat_history') || '我喜欢户外运动和咖啡';
            const partnerInput = '我是个文艺范的女生，喜欢看展、city walk，最近想尝试户外活动但一个人不太敢去';

            const testResult = await api.testMatch(userAInput, partnerInput, '上海');
            clearTimeout(this.timeoutTimer);
            this.handleTestResult(testResult);
        } catch (err) {
            clearTimeout(this.timeoutTimer);
            this.setData({
                loading: false,
                loadError: true,
                errorMsg: '后端服务未启动，请先运行后端 API',
            });
        }
    },

    applyMatchData(matchData) {
        const compat = matchData.compatibility || {};
        this.setData({
            loading: false,
            matchData,
            score: Math.round((matchData.score || 0) * 100),
            reasoning: compat.reasoning || '',
            simulationScenes: matchData.simulation || [],
            weekNumber: matchData.week_number || 0,
            matchStatus: 'ready',
            compatDimensions: {
                interest_overlap: Math.round((compat.interest_overlap || 0) * 100),
                personality_complement: Math.round((compat.personality_complement || 0) * 100),
                schedule_compatibility: Math.round((compat.schedule_compatibility || 0) * 100),
                chemistry_from_sim: Math.round((compat.chemistry_from_sim || 0) * 100),
            },
        });
    },

    handleMatchResult(result) {
        const match = (result.matches && result.matches[0]) || null;
        if (!match) {
            this.setData({ loading: false, matchStatus: 'waiting' });
            return;
        }

        const compat = match.compatibility || {};
        this.setData({
            loading: false,
            matchData: match,
            score: Math.round((match.score || 0) * 100),
            reasoning: compat.reasoning || '',
            simulationScenes: match.simulation || [],
            weekNumber: result.week_number || 0,
            matchStatus: 'ready',
            compatDimensions: {
                interest_overlap: Math.round((compat.interest_overlap || 0) * 100),
                personality_complement: Math.round((compat.personality_complement || 0) * 100),
                schedule_compatibility: Math.round((compat.schedule_compatibility || 0) * 100),
                chemistry_from_sim: Math.round((compat.chemistry_from_sim || compat.overall_score || 0) * 100),
            },
        });

        app.setCurrentMatch(match);
    },

    handleTestResult(result) {
        const compat = result.compatibility || {};
        const sim = result.simulation || {};

        const matchData = {
            match_id: 'test-' + Date.now(),
            user_b_nickname: '活动搭子',
            user_b_avatar: null,
            score: compat.overall_score || 0.8,
            simulation: (sim.scenes || []).map(s => ({
                scenario: s.scenario,
                conversation_snippet: s.conversation_snippet,
                vibe_score: s.vibe_score,
            })),
            compatibility: compat,
        };

        this.setData({
            loading: false,
            matchData,
            score: Math.round((compat.overall_score || 0) * 100),
            reasoning: compat.reasoning || '',
            simulationScenes: matchData.simulation,
            weekNumber: 202616,
            matchStatus: 'ready',
            compatDimensions: {
                interest_overlap: Math.round((compat.interest_overlap || 0) * 100),
                personality_complement: Math.round((compat.personality_complement || 0) * 100),
                schedule_compatibility: Math.round((compat.schedule_compatibility || 0) * 100),
                chemistry_from_sim: Math.round((compat.chemistry_from_sim || 0) * 100),
            },
        });

        app.setCurrentMatch(matchData);
    },

    toggleSimulation() {
        this.setData({ simulationExpanded: !this.data.simulationExpanded });
    },

    // ---- 接受 / 拒绝 ----

    onAccept() {
        this.setData({ matchStatus: 'accepted' });
        wx.showToast({ title: '已接受匹配！', icon: 'success' });
        // 进入活动安排页
        const match = this.data.matchData;
        if (match) {
            setTimeout(() => {
                wx.navigateTo({
                    url: `/pages/schedule/schedule?matchId=${match.match_id}`,
                });
            }, 1000);
        }
    },

    onReject() {
        const that = this;
        wx.showModal({
            title: '确认拒绝',
            content: '拒绝后将加入下周重新匹配队列',
            confirmText: '确认拒绝',
            cancelText: '再想想',
            success(res) {
                if (res.confirm) {
                    that.setData({ matchStatus: 'rejected' });
                    app.leaveQueue();
                    app.setCurrentMatch(null);
                    wx.showToast({ title: '已拒绝，下周重新匹配', icon: 'none' });
                    setTimeout(() => {
                        wx.reLaunch({ url: '/pages/index/index' });
                    }, 1500);
                }
            },
        });
    },

    onArrangeActivity() {
        const match = this.data.matchData;
        if (!match) return;
        wx.navigateTo({
            url: `/pages/schedule/schedule?matchId=${match.match_id}`,
        });
    },

    onRetry() {
        this.setData({ loading: true, loadError: false });
        this.loadMatch();
    },

    onGoHome() {
        wx.reLaunch({ url: '/pages/index/index' });
    },
});
