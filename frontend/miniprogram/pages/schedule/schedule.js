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
        activityId: '',
        status: '',
        confirming: false,
    },

    onLoad(options) {
        const cachedMatch = app.getCurrentMatch();
        const matchId = (options && (options.matchId || options.match_id)) || (cachedMatch && cachedMatch.match_id);
        if (!matchId) {
            this.setData({
                loading: false,
                loadError: true,
                errorMsg: '还没有匹配结果，等 Nira 先帮你配到活动搭子～',
            });
            return;
        }
        this.setData({ matchId });
        this.loadActivity();
    },

    async loadActivity() {
        this.setData({ loading: true, loadError: false });

        // 尝试从缓存的匹配结果中获取 profile 数据，用于 arrange-simple
        const match = app.getCurrentMatch();
        const profile = app.getProfile();
        const activityPlan = app.getActivityPlan();

        // 如果已经有活动方案缓存，直接用
        if (activityPlan && activityPlan.plan && activityPlan.match_id === this.data.matchId) {
            this.applyResult(activityPlan);
            return;
        }

        try {
            // 优先尝试 arrange-simple（不需要数据库）
            const result = await api.arrangeActivitySimple({
                match_id: this.data.matchId,
                profile_a: profile ? this._extractProfile(profile) : null,
                profile_b: match ? this._extractProfileFromMatch(match) : null,
                compatibility: match && match.compatibility ? match.compatibility : null,
                city: '上海',
            });
            this.applyResult(result);
            app.setActivityPlan(result);
            return;
        } catch (err) {
            console.log('arrange-simple failed:', err.message);
        }

        // fallback: 尝试 arrange（需要数据库）
        try {
            const result = await api.arrangeActivity(this.data.matchId);
            this.applyResult(result);
            app.setActivityPlan(result);
            return;
        } catch (err) {
            console.log('arrange failed:', err.message);
        }

        // 最终 fallback: 使用 test/match 的 activity_plan（如果有）
        if (activityPlan && activityPlan.activity_plan) {
            const ap = activityPlan.activity_plan;
            const result = {
                plan: ap.plan || {},
                poster_copy: ap.poster_copy || '',
                group_welcome: ap.group_welcome || '',
            };
            this.applyResult(result);
            return;
        }

        this.setData({
            loading: false,
            loadError: true,
            errorMsg: '活动安排失败，请确认后端服务已启动',
        });
    },

    applyResult(result) {
        const plan = this.normalizePlan(result.plan || {});
        if (result.status === 'missing_match' || !plan.title) {
            this.setData({
                loading: false,
                loadError: true,
                errorMsg: result.group_welcome || '还没有匹配结果，暂时不能安排活动',
                status: result.status || '',
            });
            return;
        }

        this.setData({
            loading: false,
            plan,
            posterCopy: result.poster_copy || '',
            groupWelcome: result.group_welcome || result.chat_group_qrcode || '',
            status: result.status || plan.status || 'planned',
            activityId: result.activity_id || result.plan_id || '',
        });
    },

    normalizePlan(plan) {
        return {
            ...plan,
            location: plan.location || plan.suggested_location || '待确认地点',
            suggested_location: plan.suggested_location || plan.location || '待确认地点',
            suggested_time: plan.suggested_time || '本周末下午',
            duration: plan.duration || '1.5-2 小时',
            reason: plan.reason || plan.description || '',
            status: plan.status || 'planned',
            tips: plan.tips || [],
        };
    },

    _extractProfile(profile) {
        return {
            preferred_name: profile.preferred_name || '',
            interests: profile.interests || [],
            activity_types: profile.activity_types || [],
            personality_tags: profile.personality_tags || [],
            bio: profile.bio || '',
            preferred_style: profile.preferred_style || '',
        };
    },

    _extractProfileFromMatch(match) {
        // 从匹配结果中提取用户 B 的画像（如果有）
        if (match.profile_b) return this._extractProfile(match.profile_b);
        return {
            preferred_name: match.matched_user_name || match.user_b_nickname || '活动搭子',
            interests: ['看展', 'city_walk'],
            activity_types: ['exhibition', 'city_walk'],
            personality_tags: ['introvert', 'artsy'],
            bio: '文艺范',
        };
    },

    async onConfirm() {
        if (!this.data.matchId || !this.data.plan) {
            wx.showToast({ title: '还没有可确认的活动', icon: 'none' });
            return;
        }

        this.setData({ confirming: true });
        const planData = {
            plan: this.data.plan,
            poster_copy: this.data.posterCopy,
            group_welcome: this.data.groupWelcome,
            match_id: this.data.matchId,
            activity_id: this.data.activityId,
            status: this.data.status || 'planned',
        };
        app.setActivityPlan(planData);

        try {
            const groupInfo = await api.confirmSchedule({
                match_id: this.data.matchId,
                activity_id: this.data.activityId,
                plan: this.data.plan,
                group_welcome: this.data.groupWelcome,
            });
            app.setGroupInfo(groupInfo);
            this.setData({ confirming: false });
            wx.navigateTo({
                url: `/pages/group/group?group_id=${groupInfo.group_id || ''}&match_id=${this.data.matchId}`,
            });
        } catch (err) {
            console.log('confirmSchedule failed, using local fallback:', err.message);
            const fallback = this._buildLocalGroup(planData);
            app.setGroupInfo(fallback);
            this.setData({ confirming: false });
            wx.navigateTo({
                url: `/pages/group/group?group_id=${fallback.group_id}&match_id=${this.data.matchId}`,
            });
        }
    },

    _buildLocalGroup(planData) {
        return {
            group_id: `local-group-${Date.now()}`,
            match_id: planData.match_id,
            activity_id: planData.activity_id || `local-plan-${Date.now()}`,
            plan_id: planData.activity_id || '',
            group_name: 'Nira 活动搭子小队',
            members: [
                { role: 'me', name: '你', status: 'accepted' },
                { role: 'partner', name: '活动搭子', status: 'invited' },
                { role: 'assistant', name: 'Nira', status: 'online' },
            ],
            welcome_message: planData.group_welcome || '你们这次的见面已经安排好啦。先不用急着尬聊，Nira 给你们准备了几个轻松开场。',
            icebreaker_questions: [
                '这次活动里你最想先试哪一部分？',
                '最近在城市里发现过什么还不错的小地方？',
                '如果这次还顺路加一站，你会选咖啡、书店还是散步？',
            ],
            activity_summary: {
                title: planData.plan.title || '轻量活动安排',
                activity_type: planData.plan.activity_type || 'coffee_chat',
                suggested_time: planData.plan.suggested_time || '',
                suggested_location: planData.plan.suggested_location || planData.plan.location || '',
                reason: planData.plan.reason || planData.plan.description || '',
                tips: planData.plan.tips || [],
            },
            status: 'local_group_created',
            messages: [],
        };
    },

    onRetry() {
        this.loadActivity();
    },
});
