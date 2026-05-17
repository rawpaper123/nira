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
        poster: null,
        simulationExpanded: false,
        weekNumber: 0,
        compatDimensions: {
            interest_overlap: 0,
            personality_complement: 0,
            schedule_compatibility: 0,
            chemistry_from_sim: 0,
        },
        matchStatus: 'loading', // loading | waiting | ready | accepted | rejected
        accepting: false,
    },

    timeoutTimer: null,

    onLoad(options) {
        if (options && options.from === 'push') {
            console.log('Opened match page from push:', options.match_id || '');
        }
        this.setData({ matchId: (options && options.match_id) || '' });
        this.loadMatch();
    },

    onUnload() {
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    },

    async loadMatch() {
        if (!app.isLoggedIn()) {
            this.setData({
                loading: false,
                matchStatus: 'not_joined',
                errorMsg: '先登录并完成档案，再来看本周匹配。',
            });
            return;
        }

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

        // 3. 优先从后端查询当前匹配结果/队列状态
        const userId = app.getUserId();

        try {
            const result = await api.getMatchResult(userId);
            clearTimeout(this.timeoutTimer);
            this.handleMatchResult(result);
            return;
        } catch (err) {
            console.log('getMatchResult failed:', err.message);
        }

        // 4. Development fallback: trigger weekly mock locally
        try {
            const testResult = await api.weeklyMatch(userId, '上海');
            clearTimeout(this.timeoutTimer);
            this.handleMatchResult(testResult);
        } catch (err) {
            clearTimeout(this.timeoutTimer);
            this.setData({
                loading: false,
                matchStatus: app.isJoinedQueue() ? 'waiting' : 'not_joined',
                loadError: false,
                errorMsg: app.isJoinedQueue() ? '还没有匹配结果，晚点再来看看。' : '先加入本周匹配队列。',
            });
        }
    },

    applyMatchData(matchData) {
        const compat = matchData.compatibility || {};
        const poster = this.normalizePoster(matchData);
        this.setData({
            loading: false,
            matchData,
            score: Math.round((matchData.score || 0) * 100),
            reasoning: compat.reasoning || '',
            simulationScenes: matchData.simulation || [],
            poster,
            weekNumber: matchData.week_number || 0,
            matchStatus: 'ready',
            compatDimensions: {
                interest_overlap: Math.round((compat.interest_overlap || 0) * 100),
                personality_complement: Math.round((compat.personality_complement || 0) * 100),
                schedule_compatibility: Math.round((compat.schedule_compatibility || 0) * 100),
                chemistry_from_sim: Math.round((compat.chemistry_from_sim || 0) * 100),
            },
        });
        app.setMatchResult(matchData);
    },

    handleMatchResult(result) {
        const match = (result.matches && result.matches[0]) || null;
        if (!match) {
            this.setData({
                loading: false,
                matchStatus: result.status === 'not_joined' ? 'not_joined' : 'waiting',
                errorMsg: result.message || '',
            });
            return;
        }

        const compat = match.compatibility || {};
        const poster = this.normalizePoster(match);
        this.setData({
            loading: false,
            matchData: match,
            score: Math.round((match.score || 0) * 100),
            reasoning: compat.reasoning || '',
            simulationScenes: match.simulation || [],
            poster,
            weekNumber: result.week_number || 0,
            matchStatus: 'ready',
            compatDimensions: {
                interest_overlap: Math.round((compat.interest_overlap || 0) * 100),
                personality_complement: Math.round((compat.personality_complement || 0) * 100),
                schedule_compatibility: Math.round((compat.schedule_compatibility || 0) * 100),
                chemistry_from_sim: Math.round((compat.chemistry_from_sim || compat.overall_score || 0) * 100),
            },
        });

        app.setMatchResult(match);
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

    normalizePoster(match) {
        if (!match) return null;
        if (match.poster && match.poster.copy) return match.poster;
        if (match.poster_copy) {
            return {
                status: 'mocked',
                type: 'text_card',
                title: '这次见面适合轻松一点',
                subtitle: match.suggested_activity || '低压力活动搭子',
                copy: match.poster_copy,
                style: 'black_white_minimal',
                tags: match.suggested_activity ? [match.suggested_activity] : [],
            };
        }
        return null;
    },

    toggleSimulation() {
        this.setData({ simulationExpanded: !this.data.simulationExpanded });
    },

    // ---- 接受 / 拒绝 ----

    async onAccept() {
        const match = this.data.matchData;
        if (!match || !match.match_id || this.data.accepting) return;

        this.setData({ accepting: true, matchStatus: 'accepted' });

        try {
            const userId = app.getUserId();
            const acceptResult = await api.acceptMatch(match.match_id, userId, 'a');
            app.setGroupInfo({
                group_id: acceptResult.group_id || '',
                match_id: match.match_id,
                status: acceptResult.status || 'accepted_first',
            });
        } catch (err) {
            console.log('acceptMatch failed, using local fallback:', err.message);
            app.setGroupInfo({
                group_id: `local-group-${Date.now()}`,
                match_id: match.match_id,
                status: 'local_accepted',
            });
        }

        app.addMatchHistory({
            activity: match.compatibility && match.compatibility.reasoning
                ? match.compatibility.reasoning.slice(0, 8) : '活动',
            score: this.data.score,
            status: 'accepted',
        });
        wx.showToast({ title: '已接受匹配', icon: 'success' });
        setTimeout(() => {
            this.setData({ accepting: false });
            wx.navigateTo({
                url: `/pages/schedule/schedule?matchId=${match.match_id}`,
            });
        }, 700);
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
                        wx.switchTab({ url: '/pages/index/index' });
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
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        this.setData({ loading: true, loadError: false, matchStatus: 'loading', errorMsg: '' });
        this.loadMatch();
    },

    onGoHome() {
        wx.switchTab({ url: '/pages/index/index' });
    },
});
