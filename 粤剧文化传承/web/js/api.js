/* =============================================================
 * api.js —— 前端 REST API 客户端
 * 统一封装对 Node + SQLite 后端（/api/*）的调用；
 * 登录令牌持久化于 localStorage，自动注入请求头。
 * ============================================================= */
const API = (() => {
  // 令牌存储键可被页面覆盖（管理后台使用独立令牌，避免与用户端互相影响）
  const TKEY = window.__TOKEN_KEY__ || 'ngh_token';
  const token = () => localStorage.getItem(TKEY);
  const setToken = t => t ? localStorage.setItem(TKEY, t) : localStorage.removeItem(TKEY);

  function qs(obj) {
    if (!obj) return '';
    const p = Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return p.length ? '?' + p.join('&') : '';
  }

  async function req(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    const t = token();
    if (t) headers.Authorization = 'Bearer ' + t;
    let res;
    try {
      res = await fetch('/api' + url, {
        method, headers, body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error('网络连接失败，请确认后端服务已启动');
    }
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json() : await res.text();
    if (!res.ok) {
      if (res.status === 401) setToken(null);
      throw new Error((data && data.error) || ('请求失败（' + res.status + '）'));
    }
    return data;
  }
  const get = u => req('GET', u);
  const post = (u, b) => req('POST', u, b);
  const put = (u, b) => req('PUT', u, b);

  return {
    token, setToken,
    /* 账号 */
    login: (username, password) => post('/auth/login', { username, password }),
    register: (username, password, nickname) => post('/auth/register', { username, password, nickname }),
    me: () => get('/auth/me'),
    logout: () => post('/auth/logout', {}),
    updateProfile: p => put('/auth/profile', p),
    changePassword: (oldPwd, newPwd) => put('/auth/password', { oldPwd, newPwd }),
    /* 内容 */
    categories: () => get('/categories'),
    operas: q => get('/operas' + qs(q)),
    opera: id => get('/operas/' + id),
    artists: () => get('/artists'),
    artist: id => get('/artists/' + id),
    media: q => get('/media' + qs(q)),
    mediaOne: id => get('/media/' + id),
    lyricsList: () => get('/lyrics'),
    lyric: id => get('/lyrics/' + id),
    /* 互动 */
    favorites: () => get('/favorites'),
    favCheck: (type, targetId) => get('/favorites/check' + qs({ type, targetId })),
    favToggle: (type, targetId) => post('/favorites/toggle', { type, targetId }),
    comments: (type, targetId) => get('/comments' + qs({ type, targetId })),
    myComments: () => get('/comments/mine'),
    addComment: c => post('/comments', c),
    likeComment: id => post('/comments/' + id + '/like', {}),
    learn: () => get('/learn'),
    setLearn: (lyricsId, progress) => post('/learn', { lyricsId, progress }),
    history: () => get('/history'),
    addHistory: h => post('/history', h),
    /* 公开演出（用户端） */
    shows: () => get('/shows'),
    show: id => get('/shows/' + id),
    applyShow: data => post('/shows/apply', data),
    myApplications: () => get('/shows/mine'),
    signupShow: (id, data) => post('/shows/' + id + '/signup', data),
    cancelSignup: id => req('DELETE', '/shows/' + id + '/signup'),
    mySignups: () => get('/shows/signups/mine'),
    /* 热度分析（可按年份区间 from/to + 渠道 channel 筛选） */
    heat: filter => get('/stats/heat' + qs(filter)),
    overview: filter => get('/stats/overview' + qs(filter)),
    /* 问戏 AI 助手（仅客户端） */
    askSuggest: () => get('/assistant/suggest'),
    ask: messages => post('/assistant/ask', { messages }),
    /* 管理后台 */
    adminMe: () => get('/admin/me'),
    adminOverview: () => get('/admin/overview'),
    adminEvents: status => get('/admin/events' + qs({ status })),
    reviewEvent: (id, action, note) => post('/admin/events/' + id + '/review', { action, note }),
    eventSignups: id => get('/admin/events/' + id + '/signups'),
    tables: () => get('/admin/tables'),
    table: (name, params) => get('/admin/table/' + name + qs(typeof params === 'object' ? params : { limit: params })),
  };
})();
window.API = API;
