/* =============================================================
 * 南国红豆 · 管理后台 admin.js（Vue3 + Vant + ECharts，电脑端）
 * 统计分析、热度地图、公开演出审核、报名管理、数据表浏览 —— 均在此后台。
 * 独立登录态（ngh_admin_token），仅「管理员」角色可进入。
 * ============================================================= */
(function () {
  'use strict';
  const { createApp, reactive, ref, computed, onMounted, onUnmounted, nextTick, defineComponent } = Vue;
  const { showToast, showSuccessToast, showFailToast, showConfirmDialog } = vant;

  /* ---------------- 全局状态 ---------------- */
  const store = reactive({ admin: null, ready: false, page: 'dashboard', overview: null });
  const seal = ART.seal('粤', 84);
  const fmt = n => (n == null ? '—' : Number(n).toLocaleString());
  const fmtK = n => n >= 1e8 ? (n / 1e8).toFixed(1) + '亿' : (n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : String(n));

  async function refreshOverview() { try { store.overview = await API.adminOverview(); } catch (e) {} }

  /* ---------------- 地图加载（一次） ---------------- */
  const PROV_MAP = { '广东': '广东省', '广西': '广西壮族自治区', '香港': '香港特别行政区', '澳门': '澳门特别行政区', '北京': '北京市', '上海': '上海市', '海南': '海南省' };
  const CH_LABEL = { offline: '线下演出', bilibili: '哔哩哔哩', douyin: '抖音', wechat: '视频号', tv: '电视/电台' };
  let mapsLoaded = false;
  async function ensureMaps() {
    if (mapsLoaded) return;
    const [gd, cn] = await Promise.all([
      fetch('vendor/maps/guangdong.json').then(r => r.json()),
      fetch('vendor/maps/china.json').then(r => r.json()),
    ]);
    echarts.registerMap('guangdong', gd);
    echarts.registerMap('china', cn);
    mapsLoaded = true;
  }

  /* ============================================================
   *  登录
   * ========================================================== */
  const AdminLogin = defineComponent({
    template: `
    <div class="admin-login">
      <div class="login-card">
        <div class="lc-brand">
          <img :src="seal"/>
          <h1>南国红豆 · 管理后台</h1>
          <div class="lc-sub">粤 剧 文 化 传 承</div>
        </div>
        <van-form @submit="submit">
          <van-cell-group inset>
            <van-field v-model="username" label="账号" placeholder="管理员账号" left-icon="manager-o" :rules="[{required:true,message:'请输入账号'}]"/>
            <van-field v-model="password" type="password" label="密码" placeholder="登录密码" left-icon="lock" :rules="[{required:true,message:'请输入密码'}]"/>
          </van-cell-group>
          <div style="padding:18px 16px 4px"><van-button round block type="danger" native-type="submit" :loading="busy">登 录 后 台</van-button></div>
        </van-form>
        <div class="lc-tip">演示管理员：admin / 123456</div>
      </div>
    </div>`,
    setup() {
      const username = ref('admin'), password = ref('123456'), busy = ref(false);
      async function submit() {
        busy.value = true;
        try {
          const r = await API.login(username.value, password.value);
          if (!r.user || r.user.role !== '管理员') { API.setToken(null); throw new Error('该账号无管理员权限'); }
          API.setToken(r.token); store.admin = r.user;
          await refreshOverview();
          showSuccessToast('欢迎回来，' + r.user.nickname);
        } catch (e) { showFailToast(e.message); }
        finally { busy.value = false; }
      }
      return { username, password, busy, submit, seal };
    },
  });

  /* ============================================================
   *  概览仪表盘
   * ========================================================== */
  const Dashboard = defineComponent({
    template: `
    <div>
      <div class="kpi-grid">
        <div class="kpi-card warn click" @click="goEvents">
          <van-icon class="kc-ic" name="todo-list-o"/>
          <div class="kc-n">{{ ov.pending||0 }}</div><div class="kc-l">待审核演出申请</div>
        </div>
        <div class="kpi-card click" @click="goEvents"><van-icon class="kc-ic" name="calendar-o"/><div class="kc-n">{{ ov.approved||0 }}</div><div class="kc-l">已发布演出</div></div>
        <div class="kpi-card click" @click="goSignups"><van-icon class="kc-ic" name="friends-o"/><div class="kc-n">{{ ov.signups||0 }}</div><div class="kc-l">演出报名数</div></div>
        <div class="kpi-card"><van-icon class="kc-ic" name="play-circle-o"/><div class="kc-n">{{ ov.operas||0 }}</div><div class="kc-l">剧目</div></div>
        <div class="kpi-card"><van-icon class="kc-ic" name="manager-o"/><div class="kc-n">{{ ov.artists||0 }}</div><div class="kc-l">名家</div></div>
        <div class="kpi-card"><van-icon class="kc-ic" name="music-o"/><div class="kc-n">{{ ov.media||0 }}</div><div class="kc-l">视听资源</div></div>
        <div class="kpi-card"><van-icon class="kc-ic" name="comment-o"/><div class="kc-n">{{ ov.comments||0 }}</div><div class="kc-l">评论</div></div>
        <div class="kpi-card"><van-icon class="kc-ic" name="contact"/><div class="kc-n">{{ ov.users||0 }}</div><div class="kc-l">用户</div></div>
        <div class="kpi-card click" @click="goHeat"><van-icon class="kc-ic" name="chart-trending-o"/><div class="kc-n">{{ fmtK(ov.samples||0) }}</div><div class="kc-l">热度样本</div></div>
      </div>

      <div class="grid-2-1">
        <div class="panel">
          <div class="panel-h"><span class="bar"></span><h3>年度演出趋势</h3><span class="ph-right">演出场次 / 线上热度</span></div>
          <div class="panel-b"><div ref="trendEl" class="chart"></div></div>
        </div>
        <div class="panel">
          <div class="panel-h"><span class="bar"></span><h3>传播渠道占比</h3></div>
          <div class="panel-b"><div ref="channelEl" class="chart"></div></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-h"><span class="bar"></span><h3>待审核演出申请</h3><span class="ph-right" @click="goEvents" style="cursor:pointer;color:var(--red)">前往审核 ›</span></div>
        <div class="panel-b">
          <div class="empty" v-if="!pending.length">暂无待审核的演出申请</div>
          <div class="data-table" v-else>
            <table class="dt">
              <thead><tr><th>演出名称</th><th>剧目</th><th>城市 / 场馆</th><th>日期</th><th>申请人</th></tr></thead>
              <tbody><tr v-for="e in pending" :key="e.id">
                <td>{{ e.title }}</td><td>{{ e.opera_title }}</td><td>{{ e.city }} · {{ e.venue }}</td>
                <td>{{ e.date }} {{ e.time }}</td><td>{{ e.applicant_name }}</td>
              </tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`,
    setup() {
      const ov = computed(() => store.overview || {});
      const trendEl = ref(null), channelEl = ref(null), pending = ref([]);
      const charts = {};
      const goEvents = () => store.page = 'events';
      const goSignups = () => store.page = 'signups';
      const goHeat = () => store.page = 'heat';
      function onResize() { Object.values(charts).forEach(c => c && c.resize()); }
      onMounted(async () => {
        await refreshOverview();
        try {
          const data = await API.heat();
          pending.value = await API.adminEvents('pending');
          await nextTick();
          charts.trend = echarts.init(trendEl.value);
          charts.trend.setOption({
            grid: { left: 52, right: 20, top: 30, bottom: 30 },
            tooltip: { trigger: 'axis' }, legend: { data: ['演出场次', '线上热度'], top: 2 },
            xAxis: { type: 'category', data: data.byYear.map(y => y.year) },
            yAxis: [{ type: 'value' }],
            series: [
              { name: '演出场次', type: 'bar', data: data.byYear.map(y => y.shows), itemStyle: { color: '#c9a227' }, barWidth: '48%' },
              { name: '线上热度', type: 'line', smooth: true, data: data.byYear.map(y => y.online), itemStyle: { color: '#9e1b1b' }, areaStyle: { opacity: .12 } },
            ],
          });
          charts.channel = echarts.init(channelEl.value);
          charts.channel.setOption({
            tooltip: { trigger: 'item', formatter: '{b}：{c} 场 ({d}%)' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: ['42%', '66%'], center: ['50%', '46%'],
              data: data.byChannel.map(c => ({ name: CH_LABEL[c.channel] || c.channel, value: c.shows })),
              color: ['#9e1b1b', '#c9a227', '#1f5a4c', '#2a3f6e', '#b66'] }],
          });
          window.addEventListener('resize', onResize);
        } catch (e) { showFailToast(e.message); }
      });
      onUnmounted(() => { window.removeEventListener('resize', onResize); Object.values(charts).forEach(c => c && c.dispose()); });
      return { ov, trendEl, channelEl, pending, goEvents, goSignups, goHeat, fmtK };
    },
  });

  /* ============================================================
   *  热度分析
   * ========================================================== */
  const CHANNELS = [
    { k: 'offline', label: '线下演出' }, { k: 'bilibili', label: '哔哩哔哩' }, { k: 'douyin', label: '抖音' },
    { k: 'wechat', label: '视频号' }, { k: 'tv', label: '电视/电台' },
  ];
  const HeatPage = defineComponent({
    template: `
    <div>
      <div class="filter-bar">
        <div class="fb-item">
          <span class="fb-label">时段</span>
          <div class="seg sm">
            <span class="seg-i" :class="{on:period==='all'}" @click="setPeriod('all')">全部</span>
            <span class="seg-i" :class="{on:period==='d10'}" @click="setPeriod('d10')">近十年</span>
            <span class="seg-i" :class="{on:period==='d5'}" @click="setPeriod('d5')">近五年</span>
            <span class="seg-i" :class="{on:period==='cur'}" @click="setPeriod('cur')">{{ maxY||'今年' }}年</span>
          </div>
        </div>
        <div class="fb-item">
          <span class="fb-label">渠道</span>
          <select class="fb-select" v-model="channel" @change="reload">
            <option value="all">全部渠道</option>
            <option v-for="c in channels" :key="c.k" :value="c.k">{{ c.label }}</option>
          </select>
        </div>
        <span class="fb-spacer"></span>
        <span class="fb-stat">当前样本 <b>{{ fmtK(ov.shows||0) }}</b> 条<template v-if="ov.minY"> · {{ ov.minY }}–{{ ov.maxY }}</template></span>
        <van-loading v-if="busy" size="18" color="#9e1b1b"/>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card"><div class="kc-n">{{ fmtK(ov.shows||0) }}</div><div class="kc-l">演出 / 传播样本</div></div>
        <div class="kpi-card"><div class="kc-n">{{ fmtK(ov.audience||0) }}</div><div class="kc-l">线下观众</div></div>
        <div class="kpi-card"><div class="kc-n">{{ fmtK(ov.online||0) }}</div><div class="kc-l">线上播放</div></div>
        <div class="kpi-card"><div class="kc-n">{{ fmtK(ov.heat||0) }}</div><div class="kc-l">综合热度指数</div></div>
        <div class="kpi-card"><div class="kc-n">{{ ov.regions||0 }}</div><div class="kc-l">覆盖地区</div></div>
      </div>
      <div class="panel">
        <div class="panel-h"><span class="bar"></span><h3>粤剧传播热度地图</h3>
          <span class="ph-right">
            <span class="map-toggle">
              <span class="mt-btn" :class="{on:mode==='gd'}" @click="setMode('gd')">广东 · 城市热度</span>
              <span class="mt-btn" :class="{on:mode==='cn'}" @click="setMode('cn')">全国 · 省域分布</span>
            </span>
          </span>
        </div>
        <div class="panel-b">
          <div ref="mapEl" class="chart tall"></div>
          <div class="legend-note">热度指数 = Σ(现场观众 + 0.15 × 线上播放量) × 年份权重，按地区聚合自 {{ fmtK(ov.shows||0) }} 条演出样本。颜色越深热度越高，金色圆点大小代表该地样本规模。</div>
        </div>
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel-h"><span class="bar"></span><h3>年度演出趋势</h3><span class="ph-right">演出场次 / 线上播放</span></div><div class="panel-b"><div ref="trendEl" class="chart"></div></div></div>
        <div class="panel"><div class="panel-h"><span class="bar"></span><h3>传播渠道占比</h3></div><div class="panel-b"><div ref="channelEl" class="chart"></div></div></div>
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel-h"><span class="bar"></span><h3>剧目热度榜</h3></div><div class="panel-b"><div ref="topEl" class="chart" style="height:360px"></div></div></div>
        <div class="panel"><div class="panel-h"><span class="bar"></span><h3>海外传播（华人聚居地）</h3><span class="ph-right">{{ overseas.length }} 地 · 同源演出样本</span></div>
          <div class="panel-b">
            <div class="empty" v-if="!overseas.length">当前筛选下暂无海外样本</div>
            <div class="data-table" v-else><table class="dt">
              <thead><tr><th>地区</th><th>演出场次</th><th>现场观众</th><th>线上播放</th><th>热度指数</th></tr></thead>
              <tbody><tr v-for="p in overseas" :key="p.name">
                <td>{{ p.name }}</td><td>{{ fmt(p.shows) }}</td><td>{{ fmt(p.audience) }}</td>
                <td>{{ fmt(p.online) }}</td><td>{{ fmt(p.heat) }}</td>
              </tr></tbody>
            </table></div>
          </div>
        </div>
      </div>
    </div>`,
    setup() {
      const mapEl = ref(null), trendEl = ref(null), channelEl = ref(null), topEl = ref(null);
      const ov = reactive({ shows: 0, audience: 0, online: 0, heat: 0, regions: 0, minY: '', maxY: '' });
      const overseas = ref([]); const mode = ref('gd');
      const period = ref('all'); const channel = ref('all'); const busy = ref(false);
      const maxY = computed(() => ov.maxY || '');
      const channels = CHANNELS;
      let data = null; const charts = {};
      function chart(key, el) { if (charts[key]) charts[key].dispose(); charts[key] = echarts.init(el); return charts[key]; }

      function filterObj() {
        const f = {};
        if (channel.value !== 'all') f.channel = channel.value;
        if (period.value !== 'all' && ov.maxY) {
          if (period.value === 'd10') f.from = ov.maxY - 9;
          else if (period.value === 'd5') f.from = ov.maxY - 4;
          else if (period.value === 'cur') { f.from = ov.maxY; f.to = ov.maxY; }
        }
        return f;
      }
      function renderMap() {
        if (!mapEl.value || !data) return;
        const c = chart('map', mapEl.value);
        const isGd = mode.value === 'gd';
        const series = isGd ? data.cities : data.provinces;
        const mapName = isGd ? 'guangdong' : 'china';
        const mapData = series.map(s => ({ name: isGd ? s.name : (PROV_MAP[s.name] || s.name), value: s.heat }));
        const max = Math.max(...series.map(s => s.heat), 1);
        const points = data.points.filter(p => !p.overseas && (isGd ? p.province === '广东' : true))
          .map(p => ({ name: p.name, value: [p.lng, p.lat, p.heat] }));
        c.setOption({
          tooltip: { trigger: 'item', formatter: p => {
            if (p.seriesType === 'effectScatter') return `${p.name}<br/>热度：${(p.value[2] || 0).toLocaleString()}`;
            const v = p.value; return `${p.name}<br/>热度：${(v == null || isNaN(v)) ? '暂无' : v.toLocaleString()}`;
          } },
          visualMap: { min: 0, max, left: 16, bottom: 20, calculable: true, seriesIndex: 0,
            inRange: { color: ['#fbe9d0', '#e8a87c', '#c8402f', '#9e1b1b', '#6c0f10'] }, itemHeight: 120 },
          geo: { map: mapName, roam: true, aspectScale: isGd ? 0.92 : 0.78, zoom: isGd ? 1.05 : 1.2,
            label: { show: isGd, fontSize: 10, color: '#5b4a3c' },
            itemStyle: { borderColor: '#fff', borderWidth: .8, areaColor: '#f5ead4' },
            emphasis: { label: { show: true }, itemStyle: { areaColor: '#e6c45a' } } },
          series: [
            { type: 'map', geoIndex: 0, data: mapData },
            { type: 'effectScatter', coordinateSystem: 'geo', data: points,
              symbolSize: v => Math.max(6, Math.min(34, Math.sqrt(v[2]) / 180)),
              rippleEffect: { scale: 2.6 }, itemStyle: { color: '#c9a227', shadowBlur: 8, shadowColor: 'rgba(158,27,27,.4)' }, zlevel: 2 },
          ],
        });
      }
      function renderTrend() {
        const c = chart('trend', trendEl.value);
        c.setOption({
          grid: { left: 52, right: 20, top: 30, bottom: 30 }, tooltip: { trigger: 'axis' },
          legend: { data: ['演出场次', '线上播放'], top: 2 },
          xAxis: { type: 'category', data: data.byYear.map(y => y.year) }, yAxis: [{ type: 'value' }],
          series: [
            { name: '演出场次', type: 'bar', data: data.byYear.map(y => y.shows), itemStyle: { color: '#c9a227' }, barWidth: '48%' },
            { name: '线上播放', type: 'line', smooth: true, data: data.byYear.map(y => y.online), itemStyle: { color: '#9e1b1b' }, areaStyle: { opacity: .12 } },
          ],
        });
      }
      function renderChannel() {
        const c = chart('channel', channelEl.value);
        c.setOption({
          tooltip: { trigger: 'item', formatter: '{b}：{c} 场 ({d}%)' }, legend: { bottom: 0 },
          series: [{ type: 'pie', radius: ['42%', '66%'], center: ['50%', '46%'],
            data: data.byChannel.map(x => ({ name: CH_LABEL[x.channel] || x.channel, value: x.shows })),
            color: ['#9e1b1b', '#c9a227', '#1f5a4c', '#2a3f6e', '#b66'] }],
        });
      }
      function renderTop() {
        const c = chart('top', topEl.value);
        const rows = [...data.topOperas].reverse();
        c.setOption({
          grid: { left: 92, right: 28, top: 12, bottom: 24 },
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          xAxis: { type: 'value' }, yAxis: { type: 'category', data: rows.map(r => r.title) },
          series: [{ type: 'bar', data: rows.map(r => r.heat), itemStyle: { color: '#9e1b1b', borderRadius: [0, 4, 4, 0] }, barWidth: '60%' }],
        });
      }
      async function reload() {
        busy.value = true;
        try {
          data = await API.heat(filterObj());
          Object.assign(ov, data.overview || {});
          overseas.value = data.points.filter(p => p.overseas).sort((a, b) => b.heat - a.heat);
          await nextTick();
          renderMap(); renderTrend(); renderChannel(); renderTop();
        } catch (e) { showFailToast(e.message); }
        finally { busy.value = false; }
      }
      function setPeriod(p) { period.value = p; reload(); }
      function setMode(m) { mode.value = m; nextTick(renderMap); }
      function onResize() { Object.values(charts).forEach(c => c && c.resize()); }
      onMounted(async () => {
        try { await ensureMaps(); await reload(); window.addEventListener('resize', onResize); }
        catch (e) { showFailToast(e.message); }
      });
      onUnmounted(() => { window.removeEventListener('resize', onResize); Object.values(charts).forEach(c => c && c.dispose()); });
      return { mapEl, trendEl, channelEl, topEl, ov, overseas, mode, period, channel, channels, busy, maxY, setMode, setPeriod, reload, fmt, fmtK };
    },
  });

  /* ============================================================
   *  公开演出审核
   * ========================================================== */
  const STATUS = { pending: '待审核', approved: '已通过', rejected: '未通过' };
  const EventsPage = defineComponent({
    template: `
    <div>
      <div class="seg">
        <span class="seg-i" :class="{on:status==='pending'}" @click="load('pending')">待审核<i class="n">{{ count.pending }}</i></span>
        <span class="seg-i" :class="{on:status==='approved'}" @click="load('approved')">已通过<i class="n">{{ count.approved }}</i></span>
        <span class="seg-i" :class="{on:status==='rejected'}" @click="load('rejected')">未通过<i class="n">{{ count.rejected }}</i></span>
        <span class="seg-i" :class="{on:status===''}" @click="load('')">全部<i class="n">{{ count.total }}</i></span>
      </div>
      <div class="panel">
        <div class="panel-h"><span class="bar"></span><h3>演出申请列表</h3><span class="ph-right">共 {{ list.length }} 条</span></div>
        <div class="panel-b">
          <van-loading v-if="loading" class="center-load" color="#9e1b1b"/>
          <div class="empty" v-else-if="!list.length">暂无{{ status?label(status):'' }}记录</div>
          <div class="data-table" v-else>
            <table class="dt">
              <thead><tr><th>演出名称</th><th>剧目</th><th>城市 / 场馆</th><th>日期时间</th><th>名额</th><th>申请人</th><th>状态</th><th class="col-act">操作</th></tr></thead>
              <tbody>
                <tr v-for="e in list" :key="e.id">
                  <td class="lk" :title="e.intro" @click="detail(e)">{{ e.title }}</td>
                  <td>{{ e.opera_title || '—' }}</td>
                  <td>{{ e.city }} · {{ e.venue }}</td>
                  <td>{{ e.date }} {{ e.time }}</td>
                  <td>{{ e.capacity>0 ? (e.signupPeople+' / '+e.capacity) : '不限' }}</td>
                  <td>{{ e.applicant_name }}</td>
                  <td><span class="status-tag" :class="'status-'+e.status" :title="e.review_note||''">{{ label(e.status) }}</span></td>
                  <td class="col-act">
                    <div class="row-actions">
                      <van-button v-if="e.status!=='approved'" size="small" class="btn-ghost btn-key" @click="review(e,'approve')">{{ e.status==='rejected'?'改为通过':'通过' }}</van-button>
                      <van-button v-if="e.status!=='rejected'" size="small" class="btn-ghost" @click="review(e,'reject')">{{ e.status==='approved'?'撤下':'驳回' }}</van-button>
                      <van-button size="small" class="btn-ghost btn-plain" @click="detail(e)">详情</van-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <van-dialog v-model:show="dlg" :title="action==='approve'?'通过演出申请':'驳回演出申请'" show-cancel-button
                  confirm-button-color="#9e1b1b" :before-close="confirm">
        <div class="dialog-form" v-if="cur">
          <div class="df-title">{{ cur.title }}</div>
          <div class="df-warn" v-if="action==='reject' && cur.signupPeople>0">注意：该演出已有 {{ cur.signupPeople }} 人报名，撤下后将不再对外展示。</div>
          <van-field v-model="note" type="textarea" autosize rows="3" maxlength="120" show-word-limit
                     :label="action==='approve'?'审核备注':'驳回理由'"
                     :placeholder="action==='approve'?'可填写审核备注（选填）':'请填写驳回理由，便于申请人修改后重新提交'"/>
        </div>
      </van-dialog>

      <van-dialog v-model:show="ddlg" title="演出申请详情" :show-cancel-button="false"
                  confirm-button-text="关闭" confirm-button-color="#9e1b1b">
        <div class="ev-detail" v-if="cur">
          <div class="evd-head">
            <h4>{{ cur.title }}</h4>
            <span class="status-tag" :class="'status-'+cur.status">{{ label(cur.status) }}</span>
          </div>
          <div class="evd-grid">
            <div><span>上演剧目</span><b>{{ cur.opera_title || '—' }}</b></div>
            <div><span>演出团体</span><b>{{ cur.troupe || '—' }}</b></div>
            <div><span>时间</span><b>{{ cur.date }} {{ cur.time }}</b></div>
            <div><span>城市 / 场馆</span><b>{{ cur.city }} · {{ cur.venue }}</b></div>
            <div class="full"><span>详细地址</span><b>{{ cur.address || '—' }}</b></div>
            <div><span>票价</span><b>{{ cur.price || '—' }}</b></div>
            <div><span>报名 / 名额</span><b>{{ cur.signupPeople }} / {{ cur.capacity>0?cur.capacity:'不限' }}</b></div>
            <div><span>申请人</span><b>{{ cur.applicant_name }}</b></div>
            <div><span>联系方式</span><b>{{ cur.contact || '—' }}</b></div>
            <div><span>申请时间</span><b>{{ cur.created || '—' }}</b></div>
            <div><span>审核时间</span><b>{{ cur.reviewed_at || '—' }}</b></div>
          </div>
          <div class="evd-block"><span>演出介绍</span><p>{{ cur.intro || '—' }}</p></div>
          <div class="evd-block" v-if="cur.review_note"><span>审核意见</span><p>{{ cur.review_note }}</p></div>
          <div class="evd-foot" v-if="cur.status==='approved'">
            <van-button size="small" class="btn-ghost btn-key" @click="gotoSignups(cur)">查看报名名单（{{ cur.signupPeople }} 人）</van-button>
          </div>
        </div>
      </van-dialog>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true); const status = ref('pending');
      const count = reactive({ pending: 0, approved: 0, rejected: 0, total: 0 });
      const dlg = ref(false), ddlg = ref(false), cur = ref(null), action = ref('approve'), note = ref('');
      const label = s => STATUS[s] || s;
      function syncCount() {
        const o = store.overview || {};
        count.pending = o.pending || 0; count.approved = o.approved || 0;
        count.rejected = o.rejected || 0; count.total = o.events || 0;
      }
      async function load(s) {
        status.value = s; loading.value = true;
        try { list.value = await API.adminEvents(s); } finally { loading.value = false; }
        syncCount();
      }
      function review(e, act) { cur.value = e; action.value = act; note.value = act === 'reject' ? (e.review_note || '') : ''; dlg.value = true; }
      function detail(e) { cur.value = e; ddlg.value = true; }
      async function confirm(act) {
        if (act !== 'confirm') return true;
        if (action.value === 'reject' && !note.value.trim()) { showToast('请填写驳回理由'); return false; }
        try {
          await API.reviewEvent(cur.value.id, action.value, note.value.trim());
          showSuccessToast(action.value === 'approve' ? '已通过，演出已对外发布' : '已驳回');
          await refreshOverview(); await load(status.value); return true;
        } catch (e) { showFailToast(e.message); return false; }
      }
      function gotoSignups(e) { ddlg.value = false; store.signupEventId = e.id; store.page = 'signups'; }
      onMounted(() => load('pending'));
      return { list, loading, status, count, dlg, ddlg, cur, action, note, label, load, review, detail, confirm, gotoSignups };
    },
  });

  /* ============================================================
   *  报名管理
   * ========================================================== */
  const SignupsPage = defineComponent({
    template: `
    <div>
      <div class="panel">
        <div class="panel-h"><span class="bar"></span><h3>选择演出查看报名名单</h3></div>
        <div class="panel-b">
          <div class="chip-wrap" v-if="events.length">
            <span class="data-chip" :class="{on:curId===e.id}" v-for="e in events" :key="e.id" @click="pick(e.id)">
              {{ e.title }}<i>{{ e.signupPeople }}人</i>
            </span>
          </div>
          <div class="empty" v-else>暂无已发布的演出</div>
        </div>
      </div>

      <div class="panel" v-if="detail">
        <div class="panel-h"><span class="bar"></span><h3>{{ detail.event.title }} · 报名名单</h3>
          <span class="ph-right">已报名 {{ detail.event.signupPeople }} 人 / {{ detail.event.capacity>0?detail.event.capacity:'不限' }}</span>
        </div>
        <div class="panel-b">
          <div class="empty" v-if="!detail.signups.length">暂无报名</div>
          <div class="data-table" v-else>
            <table class="dt">
              <thead><tr><th>#</th><th>姓名</th><th>电话</th><th>人数</th><th>备注</th><th>报名时间</th></tr></thead>
              <tbody><tr v-for="(s,i) in detail.signups" :key="s.id">
                <td>{{ i+1 }}</td><td>{{ s.name }}</td><td>{{ s.phone||'—' }}</td><td>{{ s.num }}</td>
                <td>{{ s.note||'—' }}</td><td>{{ s.created }}</td>
              </tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`,
    setup() {
      const events = ref([]); const curId = ref(''); const detail = ref(null);
      async function pick(id) { curId.value = id; detail.value = await API.eventSignups(id); }
      onMounted(async () => {
        events.value = (await API.adminEvents('')).filter(e => e.status === 'approved');
        const want = store.signupEventId && events.value.some(e => e.id === store.signupEventId) ? store.signupEventId : (events.value[0] && events.value[0].id);
        store.signupEventId = null;
        if (want) await pick(want);
      });
      return { events, curId, detail, pick };
    },
  });

  /* ============================================================
   *  数据表浏览
   * ========================================================== */
  const CELL = {
    status:  { pending: '待审核', approved: '已通过', rejected: '未通过' },
    type:    { video: '视频', audio: '音频', opera: '剧目', artist: '名家', media: '媒体' },
    channel: { offline: '线下演出', bilibili: '哔哩哔哩', douyin: '抖音', wechat: '视频号', tv: '电视/电台' },
    grp:     { hangdang: '行当', ticai: '题材', niandai: '年代', liupai: '流派' },
  };
  const GROUP_ORDER = ['内容资料', '用户互动', '公开演出', '热度数据'];
  const DataPage = defineComponent({
    template: `
    <div>
      <div class="data-toolbar">
        <div class="dt-group" v-for="g in groups" :key="g.label">
          <span class="dtg-label">{{ g.label }}</span>
          <span class="data-chip" :class="{on:cur===t.name}" v-for="t in g.items" :key="t.name" @click="load(t.name)">{{ t.label }}<i>{{ t.count }}</i></span>
        </div>
      </div>
      <div class="panel">
        <div class="panel-h"><span class="bar"></span><h3>{{ tbl ? tbl.label + '表' : '数据表' }}</h3>
          <span class="ph-right" v-if="tbl">共 {{ tbl.total.toLocaleString() }} 条<template v-if="tbl.total>tbl.rows.length">（显示前 {{ tbl.rows.length }} 条）</template></span></div>
        <div class="panel-b">
          <div class="dt-filterbar">
            <div class="dt-search">
              <van-icon name="search"/>
              <input v-model="q" @input="onSearch" :placeholder="'搜索'+(tbl?tbl.label:'')+'（名称 / 关键字）'"/>
              <van-icon v-if="q" name="cross" @click="clearSearch"/>
            </div>
            <select v-for="f in (tbl&&tbl.filters||[])" :key="f.key" class="fb-select" v-model="fval[f.key]" @change="reload">
              <option value="">全部{{ f.label }}</option>
              <option v-for="o in f.options" :key="o" :value="o">{{ optLabel(f.key,o) }}</option>
            </select>
            <span class="fb-spacer"></span>
            <span class="fb-reset" v-if="q || hasFilter" @click="resetAll"><van-icon name="replay"/> 清除</span>
          </div>
          <van-loading v-if="loading" class="center-load" color="#9e1b1b"/>
          <div class="empty" v-else-if="tbl && !tbl.rows.length">没有符合条件的记录</div>
          <div class="data-table" v-else-if="tbl">
            <table class="dt">
              <thead><tr><th v-for="c in tbl.columns" :key="c.key">{{ c.label }}</th></tr></thead>
              <tbody><tr v-for="(r,i) in tbl.rows" :key="i"><td v-for="c in tbl.columns" :key="c.key" :title="r[c.key]">{{ fmtCell(c.key, r[c.key]) }}</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`,
    setup() {
      const tables = ref([]); const tbl = ref(null); const cur = ref('opera'); const loading = ref(true);
      const q = ref(''); const fval = reactive({}); let timer = null;
      const catMap = {};                         // 分类编码 → 中文名（题材/流派/行当/年代）
      const CAT_KEYS = ['genre', 'troupe', 'era', 'role', 'school'];
      const groups = computed(() => GROUP_ORDER
        .map(label => ({ label, items: tables.value.filter(t => t.group === label) }))
        .filter(g => g.items.length));
      const hasFilter = computed(() => Object.keys(fval).some(k => fval[k]));
      function fmtCell(key, v) {
        if (v === null || v === undefined || v === '') return '—';
        if (key === 'is_core') return v ? '是' : '否';
        if (CELL[key]) return CELL[key][v] || v;
        if (CAT_KEYS.includes(key) && catMap[v]) return catMap[v];
        return v;
      }
      const optLabel = (key, v) => fmtCell(key, v);
      function params() {
        const p = { limit: 300 };
        if (q.value.trim()) p.q = q.value.trim();
        Object.keys(fval).forEach(k => { if (fval[k]) p[k] = fval[k]; });
        return p;
      }
      async function fetchTable() {
        loading.value = true;
        try {
          tbl.value = await API.table(cur.value, params());
          (tbl.value.filters || []).forEach(f => { if (!(f.key in fval)) fval[f.key] = ''; });
        } finally { loading.value = false; }
      }
      async function load(name) {
        cur.value = name; q.value = '';
        Object.keys(fval).forEach(k => delete fval[k]);
        await fetchTable();
      }
      function onSearch() { clearTimeout(timer); timer = setTimeout(fetchTable, 300); }
      function reload() { fetchTable(); }
      function clearSearch() { q.value = ''; fetchTable(); }
      function resetAll() { q.value = ''; Object.keys(fval).forEach(k => fval[k] = ''); fetchTable(); }
      onMounted(async () => {
        tables.value = await API.tables();
        try { (await API.table('category', { limit: 500 })).rows.forEach(r => { catMap[r.id] = r.name; }); } catch (e) {}
        // 支持 #/data/<表名> 直接定位某张表（便于直链/截图）
        const sub = (location.hash.split('/')[2] || '').trim();
        const valid = tables.value.some(t => t.name === sub);
        await load(valid ? sub : 'opera');
      });
      return { tables, tbl, cur, loading, q, fval, groups, hasFilter, load, reload, onSearch, clearSearch, resetAll, fmtCell, optLabel };
    },
  });

  /* ============================================================
   *  根组件（登录态 + 侧栏框架）
   * ========================================================== */
  const MENU = [
    { key: 'dashboard', icon: 'bar-chart-o', label: '概览' },
    { key: 'heat', icon: 'chart-trending-o', label: '热度分析' },
    { key: 'events', icon: 'todo-list-o', label: '演出审核' },
    { key: 'signups', icon: 'friends-o', label: '报名管理' },
    { key: 'data', icon: 'records', label: '数据管理' },
  ];
  const PAGES = { dashboard: Dashboard, heat: HeatPage, events: EventsPage, signups: SignupsPage, data: DataPage };
  const TITLES = { dashboard: ['数据概览', '平台运营与内容总览'], heat: ['粤剧热度分析', '基于演出样本统计聚合的传播热度'],
    events: ['公开演出审核', '受理用户演出申请，审核后对外发布'], signups: ['报名管理', '查看各场演出的观众报名名单'],
    data: ['数据管理', '浏览底层 SQLite 各数据表'] };

  const AdminApp = defineComponent({
    components: { AdminLogin },
    template: `
    <div v-if="!ready" style="height:100vh;display:flex;align-items:center;justify-content:center;background:#3a0708;color:#fff7e6">
      <van-loading color="#e6c45a" size="30">载入后台…</van-loading>
    </div>
    <admin-login v-else-if="!admin"/>
    <div v-else class="admin-shell">
      <aside class="sidebar">
        <div class="sb-brand"><img :src="seal"/><div><div class="sb-tt">南国红豆</div><div class="sb-st">管 理 后 台</div></div></div>
        <nav class="sb-menu">
          <div class="sb-item" :class="{on:page===m.key}" v-for="m in menu" :key="m.key" @click="page=m.key">
            <van-icon :name="m.icon"/><span>{{ m.label }}</span>
            <span class="sb-badge" v-if="m.key==='events' && pending>0">{{ pending }}</span>
          </div>
        </nav>
        <div class="sb-foot">
          <div class="sb-user">当前管理员<br/><b>{{ admin.nickname }}</b></div>
          <van-button size="small" block icon="cross" @click="logout">退出登录</van-button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <h2>{{ title[0] }}</h2><span class="tb-sub">{{ title[1] }}</span>
          <div class="tb-right"><van-icon name="manager-o"/> {{ admin.nickname }}（管理员）</div>
        </header>
        <section class="content"><component :is="pageComp" :key="page"/></section>
      </main>
    </div>`,
    setup() {
      const ready = computed(() => store.ready);
      const admin = computed(() => store.admin);
      const page = computed({ get: () => store.page, set: v => store.page = v });
      const menu = MENU;
      const pending = computed(() => (store.overview && store.overview.pending) || 0);
      const title = computed(() => TITLES[store.page] || ['', '']);
      const pageComp = computed(() => PAGES[store.page] || Dashboard);
      function logout() {
        showConfirmDialog({ title: '退出登录', message: '确定退出管理后台吗？', confirmButtonColor: '#9e1b1b' })
          .then(async () => { try { await API.logout(); } catch (e) {} API.setToken(null); store.admin = null; })
          .catch(() => {});
      }
      return { ready, admin, page, menu, pending, title, pageComp, logout, seal };
    },
  });

  /* ---------------- 启动 ---------------- */
  // 支持通过 URL hash 指定初始页（便于直链/截图），如 #/heat、#/data
  const VALID_PAGES = ['dashboard', 'heat', 'events', 'signups', 'data'];
  function applyHashPage() {
    const seg = location.hash.replace(/^#\/?/, '').split('/')[0].trim();
    if (VALID_PAGES.includes(seg)) store.page = seg;
  }
  window.addEventListener('hashchange', applyHashPage);
  async function bootstrap() {
    if (API.token()) {
      try { store.admin = await API.adminMe(); await refreshOverview(); }
      catch (e) { API.setToken(null); }
    }
    applyHashPage();
    store.ready = true;
  }
  const app = createApp(AdminApp);
  app.use(vant);
  bootstrap().then(() => app.mount('#admin'));
})();
