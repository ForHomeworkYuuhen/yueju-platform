/* =============================================================
 * 南国红豆 · 粤剧文化传承平台  ——  app.js（Vue3 + Vant4）
 * 单页应用：哈希路由 + Vant 组件 + 真实后端（REST）数据。
 * 设计取向：克制的图标、规范的组件用法、贴近真实移动端模式。
 * ============================================================= */
(function () {
  'use strict';
  const { createApp, reactive, ref, computed, onMounted, onUnmounted, nextTick, watch, defineComponent } = Vue;
  const { showToast, showSuccessToast, showFailToast, showLoadingToast, closeToast,
          showConfirmDialog, showImagePreview } = vant;

  /* ---------------- 全局状态 / 路由 ---------------- */
  const state = reactive({ user: null, ready: false });
  const route = reactive({ name: 'home', id: '' });

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    const [name, id] = h.split('/');
    return { name: name || 'home', id: id || '' };
  }
  function applyRoute() { const r = parseHash(); route.name = r.name; route.id = r.id; window.scrollTo(0, 0); }
  window.addEventListener('hashchange', applyRoute);
  const go = h => { location.hash = h.startsWith('#') ? h : '#/' + h; };
  const back = () => (history.length > 1 ? history.back() : go('#/home'));

  /* ---------------- 美术 / 工具 ---------------- */
  const PHOTOS = ['opera01', 'opera02'];
  function hashStr(s) { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  const photoBg = seed => `assets/img/${PHOTOS[hashStr(seed) % PHOTOS.length]}.jpg`;
  const poster = o => ART.poster(o.title, o.palette, { sub: o.alias });
  const avatar = a => ART.avatar(a.name || a.nickname, a.palette != null ? a.palette : a.avatar_seed);
  const sealLogo = (t, s) => ART.seal(t || '粤', s || 88);
  const fmtK = n => n >= 10000 ? (n / 10000).toFixed(1) + '万' : (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n));
  const TYPE_LABEL = { opera: '剧目', artist: '名家', media: '视听' };

  /* ---------------- 语音：戏词朗读 / 跟唱（Web Speech API，离线可用） ---------------- */
  const Speech = (() => {
    const synth = window.speechSynthesis || null;
    let voices = [];
    function loadVoices() { if (synth) voices = synth.getVoices() || []; }
    if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }
    // 优先粤语（zh-HK / yue），退而求其次普通话（zh-CN），保证有声音
    function pickVoice() {
      if (!voices.length) loadVoices();
      const by = re => voices.find(v => re.test(v.lang) || re.test(v.name));
      return by(/yue|HK|粤|Cantonese/i) || by(/zh[-_]?CN|Chinese|普通话|Mandarin/i) || by(/^zh/i) || voices[0] || null;
    }
    const supported = !!synth;
    function speak(text, { rate = 1, onend } = {}) {
      if (!synth) { onend && onend(); return false; }
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'zh-CN'; }
      u.rate = rate; u.pitch = 1; u.volume = 1;
      if (onend) u.onend = onend, u.onerror = onend;
      synth.speak(u);
      return true;
    }
    function cancel() { if (synth) synth.cancel(); }
    const isCantonese = () => { const v = pickVoice(); return !!(v && /yue|HK|Cantonese/i.test(v.lang + v.name)); };
    return { supported, speak, cancel, isCantonese };
  })();

  /* ============================================================
   *  共享组件
   * ========================================================== */

  // 底部导航（Dock）：清晰的线性图标 + 文字标签 + 选中态；尺寸统一
  const TABS = [
    { name: 'home', icon: 'wap-home-o', label: '首页' },
    { name: 'operas', icon: 'play-circle-o', label: '剧目' },
    { name: 'media', icon: 'music-o', label: '戏苑' },
    { name: 'shows', icon: 'calendar-o', label: '演出' },
    { name: 'me', icon: 'user-o', label: '我的' },
  ];
  // 路由 → 所属 Tab（详情/二级页也保持对应 Tab 高亮）
  const TAB_OF = {
    home: 'home', operas: 'operas', opera: 'operas', media: 'media', play: 'media',
    shows: 'shows', show: 'shows', apply: 'shows', mysignups: 'shows', myapplications: 'shows',
    me: 'me', favorites: 'me', mycomments: 'me', learnlist: 'me', history: 'me', editprofile: 'me',
    lyrics: 'operas', learn: 'operas', ask: 'home',
  };
  const AppTabbar = defineComponent({
    template: `
      <van-tabbar :model-value="active" @change="onChange" active-color="#9e1b1b"
                  inactive-color="#9c8a76" :fixed="false" :border="true" class="app-dock">
        <van-tabbar-item v-for="t in tabs" :key="t.name" :name="t.name" :icon="t.icon">{{ t.label }}</van-tabbar-item>
      </van-tabbar>`,
    setup() {
      const tabs = TABS;
      const active = computed(() => TAB_OF[route.name] || '');
      const onChange = name => go('#/' + name);
      return { tabs, active, onChange };
    },
  });

  // 区块标题
  const SectionTitle = defineComponent({
    props: { seal: String, title: String, more: String, to: String },
    emits: ['more'],
    template: `
      <div class="section-title">
        <span class="seal" v-if="seal">{{ seal }}</span>
        <h2>{{ title }}</h2>
        <span class="more" v-if="more" @click="$emit('more')">{{ more }}</span>
      </div>`,
  });

  // 剧目小卡（横向滚动）
  const OperaCard = defineComponent({
    props: { opera: Object },
    template: `
      <div class="opera-card" @click="go('#/opera/'+opera.id)">
        <img class="poster" :src="poster(opera)" :alt="opera.title"/>
        <span class="learn-pill" v-if="opera.hasLyrics" @click.stop="go('#/opera/'+opera.id)"><van-icon name="music-o"/> 学唱</span>
        <div class="oc-t">{{ opera.title }}</div>
        <div class="oc-m">
          <van-tag plain type="danger" size="mini">{{ opera.genreName }}</van-tag>
          <span class="oc-hot">热度 {{ fmtK(opera.popularity) }}</span>
        </div>
      </div>`,
    setup() { return { go, poster, fmtK }; },
  });

  // 媒体行
  const MediaRow = defineComponent({
    props: { media: Object },
    template: `
      <div class="media-row" @click="go('#/play/'+media.id)">
        <div class="mr-cover" :style="{backgroundImage:'url('+photoBg(media.id)+')'}">
          <span class="mr-play">{{ media.type==='video' ? '▶' : '♪' }}</span>
        </div>
        <div class="mr-info">
          <div class="mr-t">{{ media.title }}</div>
          <div class="mr-d">{{ media.intro }}</div>
          <div class="mr-tags">
            <van-tag :type="media.type==='video'?'danger':'success'" plain size="mini">{{ media.type==='video'?'视频':'音频' }}</van-tag>
            <span class="mr-meta">{{ media.performer }} · {{ media.duration }}</span>
          </div>
        </div>
        <van-icon name="arrow" class="mr-go"/>
      </div>`,
    setup() { return { go, photoBg }; },
  });

  // 评论区（用于详情页）
  const CommentSection = defineComponent({
    props: { type: String, targetId: String },
    template: `
      <div class="block" id="commentBlock">
        <div class="blk-h"><span class="bar"></span><h3>戏迷评论（{{ list.length }}）</h3></div>
        <div class="cm-input" v-if="user">
          <img class="cm-av" :src="avatar(user)"/>
          <div class="cm-input-main">
            <van-rate v-model="rating" :size="18" color="#c9a227" void-icon="star" void-color="#e4d6b8"/>
            <van-field v-model="text" rows="2" autosize type="textarea" maxlength="200"
                       placeholder="说说你的观感…" show-word-limit/>
            <div class="cm-submit"><van-button size="small" type="danger" @click="post">发表评论</van-button></div>
          </div>
        </div>
        <van-empty v-if="!loading && !list.length" description="还没有评论，来抢沙发" image-size="64"/>
        <div class="comment" v-for="c in list" :key="c.id">
          <img class="cm-av" :src="avatar(c)"/>
          <div class="cm-b">
            <div class="cm-top">
              <span class="cm-n">{{ c.nickname }}</span>
              <van-rate :model-value="c.rating" readonly :size="12" color="#c9a227" void-color="#e4d6b8"/>
            </div>
            <div class="cm-c">{{ c.content }}</div>
            <div class="cm-f">
              <span>{{ c.created }}</span>
              <span class="cm-like" :class="{on:c._liked}" @click="like(c)">
                <van-icon name="good-job-o"/> {{ c.likes }}
              </span>
            </div>
          </div>
        </div>
      </div>`,
    setup(props) {
      const list = ref([]); const text = ref(''); const rating = ref(5); const loading = ref(true);
      const user = computed(() => state.user);
      async function load() { loading.value = true; try { list.value = await API.comments(props.type, props.targetId); } finally { loading.value = false; } }
      async function post() {
        if (!text.value.trim()) return showToast('评论内容不能为空');
        const c = await API.addComment({ type: props.type, targetId: props.targetId, content: text.value.trim(), rating: rating.value });
        list.value.unshift(c); text.value = ''; rating.value = 5; showSuccessToast('评论已发表');
      }
      async function like(c) { const r = await API.likeComment(c.id); c.likes = r.likes; c._liked = true; }
      onMounted(load);
      return { list, text, rating, loading, user, post, like, avatar };
    },
  });

  /* ============================================================
   *  页面：登录 / 注册
   * ========================================================== */
  const LoginView = defineComponent({
    template: `
    <div class="auth">
      <div class="auth-bg" :style="{backgroundImage:'url('+bg+')'}"></div>
      <div class="auth-veil"></div>
      <div class="auth-inner">
        <div class="brand">
          <img :src="seal" alt="印"/>
          <h1>南国红豆</h1>
          <div class="sub">粤 剧 文 化 传 承</div>
          <div class="poem">一声梆黄韵 · 半部岭南史</div>
        </div>
        <van-form @submit="submit" class="auth-form">
          <van-cell-group inset>
            <van-field v-model="username" name="u" placeholder="请输入账号" left-icon="manager-o"
                       :rules="[{required:true,message:'请输入账号'}]"/>
            <van-field v-if="isReg" v-model="nickname" placeholder="昵称（雅号）" left-icon="smile-o"/>
            <van-field v-model="password" type="password" placeholder="请输入密码" left-icon="lock"
                       :rules="[{required:true,message:'请输入密码'}]"/>
            <van-field v-if="isReg" v-model="password2" type="password" placeholder="确认密码" left-icon="lock"/>
          </van-cell-group>
          <div class="auth-actions">
            <van-button round block type="danger" native-type="submit" :loading="busy">
              {{ isReg ? '注 册 入 园' : '登 录' }}
            </van-button>
          </div>
        </van-form>
        <div class="switch">
          {{ isReg ? '已有账号？' : '还未注册？' }}
          <b @click="toggle">{{ isReg ? '返回登录' : '立即注册' }}</b>
        </div>
        <div class="hint" v-if="!isReg">演示账号：liyuan / 123456　（管理后台：/admin）</div>
      </div>
    </div>`,
    setup() {
      const isReg = computed(() => route.name === 'register');
      const username = ref(''); const nickname = ref(''); const password = ref(''); const password2 = ref('');
      const busy = ref(false);
      const bg = photoBg('login'); const seal = sealLogo('粤', 96);
      if (!isReg.value) { username.value = 'liyuan'; password.value = '123456'; }
      watch(isReg, v => { if (!v) { username.value = 'liyuan'; password.value = '123456'; } else { username.value = ''; password.value = ''; } });
      const toggle = () => go(isReg.value ? '#/login' : '#/register');
      async function submit() {
        busy.value = true;
        try {
          let r;
          if (isReg.value) {
            if (password.value.length < 4) return showToast('密码至少 4 位');
            if (password.value !== password2.value) return showToast('两次密码不一致');
            r = await API.register(username.value, password.value, nickname.value);
          } else {
            r = await API.login(username.value, password.value);
          }
          API.setToken(r.token); state.user = r.user;
          showSuccessToast('欢迎回到梨园，' + r.user.nickname);
          go('#/home');
        } catch (e) { showFailToast(e.message); }
        finally { busy.value = false; }
      }
      return { isReg, username, nickname, password, password2, busy, bg, seal, toggle, submit };
    },
  });

  /* ============================================================
   *  页面：首页
   * ========================================================== */
  const HomeView = defineComponent({
    components: { OperaCard, MediaRow, SectionTitle },
    template: `
    <div class="page has-tab">
      <van-nav-bar title="南国红豆">
        <template #right><van-icon name="search" size="20" @click="go('#/operas')"/></template>
      </van-nav-bar>
      <div class="page-body">
        <van-skeleton title :row="6" :loading="loading">
          <van-swipe class="hero" :autoplay="4500" indicator-color="#e6c45a" lazy-render>
            <van-swipe-item v-for="o in featured" :key="o.id" @click="go('#/opera/'+o.id)">
              <div class="hero-img" :style="{backgroundImage:'url('+photoBg(o.id)+')'}"></div>
              <div class="hero-veil"></div>
              <div class="hero-txt">
                <van-tag color="#c9a227" text-color="#3a2705">{{ o.genreName }} · {{ o.premiere }}年</van-tag>
                <h2>{{ o.title }}</h2>
                <p>{{ o.summary }}</p>
              </div>
            </van-swipe-item>
          </van-swipe>

          <van-grid :column-num="4" :border="false" class="quick">
            <van-grid-item icon="bars" text="剧目大观" @click="go('#/operas')"/>
            <van-grid-item icon="records" text="戏词学唱" @click="go('#/lyrics')"/>
            <van-grid-item icon="friends-o" text="名家档案" @click="go('#/artists')"/>
            <van-grid-item icon="calendar-o" text="公开演出" @click="go('#/shows')"/>
          </van-grid>

          <div class="today" v-if="todayLyric" @click="go('#/learn/'+todayLyric.id)">
            <div class="tt">— 今 日 戏 词 —</div>
            <div class="tw">“{{ todayLyric.note }}”</div>
            <div class="tf">《{{ todayLyric.title }}》 · {{ todayLyric.source }} · 点击学唱 ›</div>
          </div>

          <div class="ai-entry" @click="go('#/ask')">
            <div class="ae-orb"><img :src="seal"/></div>
            <div class="ae-main">
              <div class="ae-t">问戏 · 智能助手</div>
              <div class="ae-s">关于粤剧的剧情、名家、唱腔，随时为你解答</div>
            </div>
            <van-icon name="arrow" class="ae-go"/>
          </div>

          <div class="section">
            <section-title seal="剧" title="热门剧目" more="全部 ›" @more="go('#/operas')"/>
          </div>
          <div class="h-scroll"><opera-card v-for="o in hotOperas" :key="o.id" :opera="o"/></div>

          <div class="section">
            <section-title seal="名" title="梨园名家" more="全部 ›" @more="go('#/artists')"/>
          </div>
          <div class="h-scroll">
            <div class="artist-mini" v-for="a in hotArtists" :key="a.id" @click="go('#/artist/'+a.id)">
              <img :src="avatar(a)"/>
              <div class="am-n">{{ a.name }}</div>
              <div class="am-t">{{ (a.title||'').split(' · ')[0] }}</div>
            </div>
          </div>

          <div class="section">
            <section-title seal="听" title="视听精选" more="全部 ›" @more="go('#/media')"/>
          </div>
          <div class="list"><media-row v-for="m in hotMedia" :key="m.id" :media="m"/></div>
          <div style="height:12px"></div>
        </van-skeleton>
      </div>
      <app-tabbar/>
    </div>`,
    setup() {
      const loading = ref(true);
      const featured = ref([]); const hotOperas = ref([]); const hotArtists = ref([]);
      const hotMedia = ref([]); const todayLyric = ref(null);
      onMounted(async () => {
        try {
          const [operas, artists, media, lyrics] = await Promise.all([
            API.operas({ sort: 'popularity' }), API.artists(), API.media(), API.lyricsList(),
          ]);
          hotOperas.value = operas.slice(0, 8);
          featured.value = operas.slice(0, 4);
          hotArtists.value = artists.slice(0, 8);
          hotMedia.value = media.slice(0, 3);
          todayLyric.value = lyrics[new Date().getDate() % lyrics.length];
        } catch (e) { showFailToast(e.message); }
        finally { loading.value = false; }
      });
      return { loading, featured, hotOperas, hotArtists, hotMedia, todayLyric, go, photoBg, avatar, seal: sealLogo('粤', 88) };
    },
  });

  /* ============================================================
   *  页面：剧目大观（检索 + 筛选）
   * ========================================================== */
  const OperasView = defineComponent({
    components: { SectionTitle },
    template: `
    <div class="page has-tab">
      <van-nav-bar title="剧目大观"/>
      <div class="page-body">
        <van-search v-model="kw" placeholder="搜索剧目 / 别名 / 编剧" shape="round" @update:model-value="run"/>
        <div class="filter-block" v-if="cats">
          <chip-row label="题材" :items="cats.ticai" v-model="f.genre" @change="run"/>
          <chip-row label="年代" :items="cats.niandai" v-model="f.era" @change="run"/>
          <chip-row label="流派剧团" :items="cats.liupai" v-model="f.troupe" @change="run"/>
          <chip-row label="行当" :items="cats.hangdang" v-model="f.role" @change="run"/>
        </div>
        <div class="section" style="margin-bottom:4px">
          <section-title seal="目" title="检索结果" :more="'共 '+list.length+' 出'"/>
        </div>
        <van-loading v-if="loading" class="center-loading" color="#9e1b1b"/>
        <van-empty v-else-if="!list.length" description="未找到符合条件的剧目"/>
        <div class="list" v-else>
          <div class="card opera-line" v-for="o in list" :key="o.id" @click="go('#/opera/'+o.id)">
            <img class="poster" :src="poster(o)"/>
            <div class="ol-info">
              <h3>{{ o.title }}<span class="ol-alias">· {{ o.alias }}</span></h3>
              <div class="ol-sum">{{ o.summary }}</div>
              <div class="ol-tags">
                <van-tag plain type="danger" size="mini">{{ o.genreName }}</van-tag>
                <van-tag plain type="warning" size="mini">{{ o.troupeName }}</van-tag>
                <span class="learn-chip" :class="{on:o.hasLyrics}">
                  <van-icon name="music-o"/>{{ o.hasLyrics ? '可学唱 '+o.lyricsCount+' 段' : '暂无戏词' }}
                </span>
              </div>
            </div>
            <van-icon name="arrow" class="ol-go"/>
          </div>
        </div>
        <div style="height:12px"></div>
      </div>
      <app-tabbar/>
    </div>`,
    setup() {
      const cats = ref(null); const list = ref([]); const loading = ref(true); const kw = ref('');
      const f = reactive({ genre: '', era: '', troupe: '', role: '' });
      let timer = null;
      async function run() {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          loading.value = true;
          try { list.value = await API.operas({ ...f, kw: kw.value }); }
          finally { loading.value = false; }
        }, 180);
      }
      onMounted(async () => { cats.value = await API.categories(); await run(); });
      return { cats, list, loading, kw, f, run, go, poster };
    },
  });

  // 横向 chip 选择行
  const ChipRow = defineComponent({
    props: { label: String, items: Array, modelValue: String },
    emits: ['update:modelValue', 'change'],
    template: `
      <div class="filter-group">
        <div class="fg-label">{{ label }}</div>
        <div class="chips">
          <span class="chip" :class="{on:modelValue===''}" @click="sel('')">全部</span>
          <span class="chip" :class="{on:modelValue===it.id}" v-for="it in items" :key="it.id" @click="sel(it.id)">{{ it.name }}</span>
        </div>
      </div>`,
    setup(props, { emit }) {
      const sel = v => { emit('update:modelValue', v); emit('change'); };
      return { sel };
    },
  });

  /* ============================================================
   *  页面：剧目详情
   * ========================================================== */
  const OperaDetail = defineComponent({
    components: { CommentSection, MediaRow },
    template: `
    <div class="page has-bar">
      <van-nav-bar :title="opera ? opera.title : '剧目'" left-arrow @click-left="back"/>
      <div class="page-body" v-if="opera">
        <div class="detail-hero">
          <div class="dh-img" :style="{backgroundImage:'url('+photoBg(opera.id)+')'}"></div>
          <div class="dh-veil"></div>
          <img class="dh-poster" :src="poster(opera)"/>
          <div class="dh-meta">
            <h1>{{ opera.title }}</h1>
            <div class="dh-sub">{{ opera.alias }} · {{ opera.playwright }} 编</div>
            <div class="dh-tags">
              <van-tag color="rgba(255,247,230,.18)" text-color="#fff7e6">{{ opera.genreName }}</van-tag>
              <van-tag color="rgba(255,247,230,.18)" text-color="#fff7e6">{{ opera.troupeName }}</van-tag>
              <van-tag color="rgba(255,247,230,.18)" text-color="#fff7e6">{{ opera.premiere }}年首演</van-tag>
            </div>
          </div>
        </div>

        <div class="block">
          <div class="blk-h"><span class="bar"></span><h3>剧情简介</h3></div>
          <p class="txt">{{ opera.summary }}</p>
          <div class="quote">{{ opera.highlight }}</div>
        </div>

        <div class="block">
          <div class="blk-h"><span class="bar"></span><h3>剧目档案</h3></div>
          <van-cell-group inset class="meta-cells">
            <van-cell title="行当" :value="opera.rolesText"/>
            <van-cell title="流派" :value="opera.troupeName"/>
            <van-cell title="首演" :value="opera.premiere+' 年 · '+opera.region"/>
            <van-cell title="时长" :value="opera.duration"/>
            <van-cell title="名折" :value="opera.famous.map(f=>'《'+f+'》').join(' ')"/>
          </van-cell-group>
        </div>

        <div class="block" v-if="opera.cast && opera.cast.length">
          <div class="blk-h"><span class="bar"></span><h3>名伶担纲</h3></div>
          <div class="cast">
            <div class="c" v-for="c in opera.cast" :key="c.artist.id" @click="go('#/artist/'+c.artist.id)">
              <img :src="avatar(c.artist)"/>
              <div class="cn">{{ c.artist.name }}</div>
              <div class="cr">饰 {{ c.role }}</div>
            </div>
          </div>
        </div>

        <div class="block" v-if="opera.media && opera.media.length">
          <div class="blk-h"><span class="bar"></span><h3>相关视听</h3></div>
          <media-row v-for="m in opera.media" :key="m.id" :media="m"/>
        </div>

        <div class="block" v-if="opera.lyrics && opera.lyrics.length">
          <div class="blk-h"><span class="bar"></span><h3>戏词学唱</h3>
            <span class="blk-more" @click="goLearn"><van-icon name="music-o"/> 开始学唱</span>
          </div>
          <van-cell-group inset>
            <van-cell v-for="l in opera.lyrics" :key="l.id" :title="l.title" :label="l.note" is-link
                      @click="go('#/learn/'+l.id)">
              <template #icon><div class="ly-badge sm">词</div></template>
            </van-cell>
          </van-cell-group>
        </div>

        <comment-section type="opera" :target-id="opera.id" :key="opera.id"/>
        <div style="height:74px"></div>
      </div>

      <div class="action-bar" v-if="opera">
        <van-button class="ab-fav" :class="{on:fav}" @click="toggleFav">
          <van-icon :name="fav?'like':'like-o'"/><span>{{ fav?'已收藏':'收藏' }}</span>
        </van-button>
        <van-button class="ab-fav ab-learn" :class="{on:opera.hasLyrics}" :disabled="!opera.hasLyrics" @click="goLearn">
          <van-icon name="music-o"/><span>{{ opera.hasLyrics ? '学唱' : '无戏词' }}</span>
        </van-button>
        <van-button type="danger" class="ab-main" @click="goLearn" v-if="opera.hasLyrics">学唱戏词 ›</van-button>
        <van-button type="danger" class="ab-main" @click="scrollComment" v-else>观赏 · 评论 ›</van-button>
      </div>
    </div>`,
    setup() {
      const opera = ref(null); const fav = ref(false);
      async function load(id) {
        try {
          opera.value = await API.opera(id);
          API.addHistory({ type: 'opera', targetId: id, title: opera.value.title }).catch(() => {});
          fav.value = (await API.favCheck('opera', id)).fav;
        } catch (e) { showFailToast(e.message); }
      }
      async function toggleFav() { const r = await API.favToggle('opera', opera.value.id); fav.value = r.fav; showToast(r.fav ? '已加入收藏' : '已取消收藏'); }
      const scrollComment = () => document.getElementById('commentBlock')?.scrollIntoView({ behavior: 'smooth' });
      function goLearn() {
        const ls = opera.value && opera.value.lyrics;
        if (ls && ls.length) go('#/learn/' + ls[0].id);
        else showToast('本剧目暂未收录戏词');
      }
      onMounted(() => load(route.id));
      return { opera, fav, toggleFav, scrollComment, goLearn, go, back, poster, avatar, photoBg };
    },
  });

  /* ============================================================
   *  页面：视听戏苑
   * ========================================================== */
  const MediaView = defineComponent({
    components: { MediaRow },
    template: `
    <div class="page has-tab">
      <van-nav-bar title="视听戏苑"/>
      <div class="page-body">
        <van-search v-model="kw" placeholder="搜索唱段 / 演员" shape="round" @update:model-value="run"/>
        <van-tabs v-model:active="type" @change="run" color="#9e1b1b" title-active-color="#9e1b1b" class="mt-tabs">
          <van-tab title="全部" name=""/>
          <van-tab title="视频" name="video"/>
          <van-tab title="音频" name="audio"/>
        </van-tabs>
        <van-loading v-if="loading" class="center-loading" color="#9e1b1b"/>
        <van-empty v-else-if="!list.length" description="暂无相关视听资源"/>
        <div class="list" v-else><media-row v-for="m in list" :key="m.id" :media="m"/></div>
        <div style="height:12px"></div>
      </div>
      <app-tabbar/>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true); const kw = ref(''); const type = ref('');
      let timer = null;
      async function run() {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          loading.value = true;
          try { list.value = await API.media({ type: type.value, kw: kw.value }); }
          finally { loading.value = false; }
        }, 160);
      }
      onMounted(run);
      return { list, loading, kw, type, run };
    },
  });

  /* ============================================================
   *  页面：播放器（模拟）
   * ========================================================== */
  const PlayView = defineComponent({
    components: { CommentSection },
    template: `
    <div class="page">
      <van-nav-bar :title="media ? (media.type==='video'?'视频':'听曲') : '播放'" left-arrow @click-left="back"/>
      <div class="page-body" v-if="media">
        <!-- 真实视频：哔哩哔哩官方播放器嵌入 -->
        <div class="video-wrap" v-if="media.type==='video' && media.embed_url">
          <iframe :src="media.embed_url" scrolling="no" border="0" frameborder="no"
                  framespacing="0" allowfullscreen="true"></iframe>
        </div>
        <!-- 真实音频 / 模拟播放器 -->
        <div v-else class="player" :class="{audio:media.type==='audio', paused:!playing}">
          <div class="pl-img" :style="{backgroundImage:'url('+photoBg(media.id)+')'}"></div>
          <div class="pl-veil"></div>
          <div class="pl-disc"><img :src="discImg"/></div>
          <button class="pl-play" @click="toggle"><van-icon :name="playing?'pause':'play'"/></button>
          <span class="pl-live" v-if="hasRealAudio">真实音频</span>
        </div>
        <!-- 真实音频元素（自定义控件驱动） -->
        <audio v-if="hasRealAudio" ref="audioEl" :src="media.audio_url" preload="metadata"
               @timeupdate="onTime" @loadedmetadata="onMeta" @ended="onEnded" @error="onErr"></audio>

        <div class="pl-ctrl">
          <div class="pl-tt">{{ media.title }}</div>
          <div class="pl-pf">{{ media.performer }} · {{ media.operaTitle?('《'+media.operaTitle+'》'):'' }} · {{ media.year }}年</div>
          <template v-if="media.type!=='video' || !media.embed_url">
            <van-slider v-model="pos" :max="total||1" active-color="#9e1b1b" @change="seek" class="pl-slider"/>
            <div class="pl-time"><span>{{ fmt(pos) }}</span><span>{{ total?fmt(total):media.duration }}</span></div>
          </template>
          <div class="src-note" v-if="media.src_note"><van-icon name="info-o"/> {{ media.src_note }}</div>
          <div class="pl-actions">
            <van-button plain hairline icon="link-o" size="small" @click="openSource">原平台 / 来源</van-button>
            <van-button :type="fav?'danger':'default'" :icon="fav?'like':'like-o'" size="small" @click="toggleFav">{{ fav?'已收藏':'收藏' }}</van-button>
          </div>
        </div>
        <div class="block">
          <div class="blk-h"><span class="bar"></span><h3>简介</h3></div>
          <p class="txt">{{ media.intro }}</p>
        </div>
        <comment-section type="media" :target-id="media.id" :key="media.id"/>
        <div style="height:12px"></div>
      </div>
    </div>`,
    setup() {
      const media = ref(null); const fav = ref(false);
      const playing = ref(false); const pos = ref(0); const total = ref(0);
      const audioEl = ref(null);
      const hasRealAudio = computed(() => media.value && media.value.type === 'audio' && !!media.value.audio_url);
      let timer = null;
      const discImg = computed(() => media.value ? ART.poster(media.value.operaTitle || media.value.title, hashStr(media.value.id) % 6) : '');
      function durSec(d) { const [a, b] = String(d || '0:0').split(':').map(Number); return a * 60 + (b || 0); }
      function fmt(s) { s = Math.max(0, Math.floor(s || 0)); const m = Math.floor(s / 60), x = s % 60; return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); }
      function toggle() {
        if (hasRealAudio.value && audioEl.value) {
          if (audioEl.value.paused) { audioEl.value.play().then(() => playing.value = true).catch(() => showToast('音频加载失败，请检查网络')); }
          else { audioEl.value.pause(); playing.value = false; }
          return;
        }
        // 模拟播放（无真实源时）
        playing.value = !playing.value;
        clearInterval(timer);
        if (playing.value) timer = setInterval(() => { pos.value++; if (pos.value >= total.value) { pos.value = total.value; playing.value = false; clearInterval(timer); } }, 1000);
      }
      function onTime() { if (audioEl.value) pos.value = audioEl.value.currentTime; }
      function onMeta() { if (audioEl.value && isFinite(audioEl.value.duration)) total.value = audioEl.value.duration; }
      function onEnded() { playing.value = false; pos.value = total.value; }
      function onErr() { showFailToast('音频源加载失败'); playing.value = false; }
      function seek(v) { pos.value = v; if (hasRealAudio.value && audioEl.value) audioEl.value.currentTime = v; }
      function openSource() { if (media.value.source) window.open(media.value.source, '_blank'); else showToast('暂无原平台链接'); }
      async function toggleFav() { const r = await API.favToggle('media', media.value.id); fav.value = r.fav; showToast(r.fav ? '已加入收藏' : '已取消收藏'); }
      onMounted(async () => {
        media.value = await API.mediaOne(route.id);
        total.value = durSec(media.value.duration);
        API.addHistory({ type: 'media', targetId: media.value.id, title: media.value.title }).catch(() => {});
        try { fav.value = (await API.favCheck('media', media.value.id)).fav; } catch (e) {}
      });
      onUnmounted(() => { clearInterval(timer); if (audioEl.value) audioEl.value.pause(); });
      return { media, fav, playing, pos, total, audioEl, hasRealAudio, discImg, toggle, onTime, onMeta, onEnded, onErr, seek, openSource, toggleFav, fmt, back, photoBg };
    },
  });

  /* ============================================================
   *  页面：名家档案 + 详情
   * ========================================================== */
  const ArtistsView = defineComponent({
    components: { SectionTitle },
    template: `
    <div class="page has-tab">
      <van-nav-bar title="梨园名家"/>
      <div class="page-body">
        <div class="section" style="margin-bottom:2px">
          <section-title seal="角" title="名家档案馆" :more="list.length+' 位'"/>
        </div>
        <van-loading v-if="loading" class="center-loading" color="#9e1b1b"/>
        <div class="grid2" v-else>
          <div class="card artist-card" v-for="a in list" :key="a.id" @click="go('#/artist/'+a.id)">
            <img class="av" :src="avatar(a)"/>
            <div class="ac-n">{{ a.name }}</div>
            <div class="ac-t">{{ (a.title||'').split(' · ')[0] }}</div>
            <div class="ac-y">{{ a.birth }}{{ a.death?('－'+a.death):' 至今' }} · {{ a.schoolName }}</div>
          </div>
        </div>
        <div style="height:14px"></div>
      </div>
      <app-tabbar/>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      onMounted(async () => { try { list.value = await API.artists(); } finally { loading.value = false; } });
      return { list, loading, go, avatar };
    },
  });

  const ArtistDetail = defineComponent({
    components: { CommentSection },
    template: `
    <div class="page has-bar">
      <van-nav-bar :title="artist ? artist.name : '名家'" left-arrow @click-left="back"/>
      <div class="page-body" v-if="artist">
        <div class="detail-hero artist">
          <div class="dh-img" :style="{backgroundImage:'url('+banner+')'}"></div>
          <div class="dh-veil"></div>
          <img class="dh-poster round" :src="avatar(artist)"/>
          <div class="dh-meta">
            <h1>{{ artist.name }}</h1>
            <div class="dh-sub">{{ artist.title }}</div>
            <div class="dh-tags">
              <van-tag color="rgba(255,247,230,.18)" text-color="#fff7e6">{{ artist.roleName }}</van-tag>
              <van-tag color="rgba(255,247,230,.18)" text-color="#fff7e6">{{ artist.schoolName }}</van-tag>
              <van-tag color="rgba(255,247,230,.18)" text-color="#fff7e6">{{ artist.region }}</van-tag>
            </div>
          </div>
        </div>

        <div class="block">
          <div class="blk-h"><span class="bar"></span><h3>艺术生平</h3></div>
          <van-cell-group inset class="meta-cells">
            <van-cell title="生卒" :value="artist.birth+' － '+(artist.death||'至今')"/>
            <van-cell title="行当" :value="artist.roleName"/>
            <van-cell title="籍贯" :value="artist.region"/>
          </van-cell-group>
          <p class="txt" style="margin-top:10px">{{ artist.bio }}</p>
          <div class="quote">{{ artist.achievement }}</div>
        </div>

        <div class="block" v-if="artist.works && artist.works.length">
          <div class="blk-h"><span class="bar"></span><h3>代表剧目</h3></div>
          <div class="h-scroll" style="padding-left:0;padding-right:0">
            <div class="opera-card" v-for="o in artist.works" :key="o.id" @click="go('#/opera/'+o.id)">
              <img class="poster" :src="poster(o)"/>
              <div class="oc-t">{{ o.title }}</div>
              <div class="oc-m"><span class="oc-hot">{{ o.playedRole?('饰 '+o.playedRole):o.genreName }}</span></div>
            </div>
          </div>
        </div>

        <comment-section type="artist" :target-id="artist.id" :key="artist.id"/>
        <div style="height:74px"></div>
      </div>

      <div class="action-bar" v-if="artist">
        <van-button class="ab-fav" :class="{on:fav}" @click="toggleFav">
          <van-icon :name="fav?'like':'like-o'"/><span>{{ fav?'已关注':'关注' }}</span>
        </van-button>
        <van-button type="danger" class="ab-main" @click="scrollComment">致敬名家 ›</van-button>
      </div>
    </div>`,
    setup() {
      const artist = ref(null); const fav = ref(false); const banner = ref('');
      async function toggleFav() { const r = await API.favToggle('artist', artist.value.id); fav.value = r.fav; showToast(r.fav ? '已关注名家' : '已取消关注'); }
      const scrollComment = () => document.getElementById('commentBlock')?.scrollIntoView({ behavior: 'smooth' });
      onMounted(async () => {
        artist.value = await API.artist(route.id);
        banner.value = ART.banner(artist.value.palette);
        API.addHistory({ type: 'artist', targetId: artist.value.id, title: artist.value.name }).catch(() => {});
        fav.value = (await API.favCheck('artist', artist.value.id)).fav;
      });
      return { artist, fav, banner, toggleFav, scrollComment, go, back, poster, avatar };
    },
  });

  /* ============================================================
   *  页面：戏词学唱
   * ========================================================== */
  const LyricsPicker = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="戏词学唱" left-arrow @click-left="back"/>
      <div class="page-body">
        <div class="learn-hero">
          <div class="lh-t">逐句 · 跟唱经典名段</div>
          <div class="lh-s">每段附原文、注音与释义，可点句朗读、整段跟唱、逐句标记已学会。共 {{ list.length }} 段精选戏词。</div>
        </div>
        <van-loading v-if="loading" class="center-loading" color="#9e1b1b"/>
        <van-cell-group inset v-else>
          <van-cell v-for="l in list" :key="l.id" :title="l.title" :label="l.source + ' · ' + l.note" is-link
                    @click="go('#/learn/'+l.id)">
            <template #icon><div class="ly-badge">词</div></template>
            <template #right-icon>
              <span class="learn-go">{{ l.lines ? l.lines.length+' 句 ›' : '学唱 ›' }}</span>
            </template>
          </van-cell>
        </van-cell-group>
        <div style="height:14px"></div>
      </div>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      onMounted(async () => { try { list.value = await API.lyricsList(); } finally { loading.value = false; } });
      return { list, loading, go, back };
    },
  });

  const LearnView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="戏词学唱" left-arrow @click-left="back"/>
      <div class="page-body" v-if="ly" ref="scroller">
        <div class="detail-hero" style="height:140px">
          <div class="dh-img" :style="{backgroundImage:'url('+photoBg(ly.id)+')'}"></div>
          <div class="dh-veil"></div>
          <div class="dh-meta"><h1 style="font-size:23px">{{ ly.title }}</h1><div class="dh-sub">{{ ly.source }}</div></div>
        </div>
        <div class="quote" style="margin:14px 14px 8px">{{ ly.note }}<span class="ly-src">—— {{ ly.source }}</span></div>

        <!-- 进度：以「已学会句数」为准 -->
        <div class="learn-progress">
          <span>学唱进度 {{ shown }}%　<i>已学会 {{ learned.size }} / {{ total }} 句</i></span>
          <van-progress :percentage="shown" color="#9e1b1b" track-color="#e4d6b8" :show-pivot="false"/>
        </div>

        <!-- 跟唱控制条 -->
        <div class="sing-bar">
          <van-button class="sing-main" :type="playing?'warning':'danger'" round
                      :icon="playing?'pause':'play'" @click="playing ? stopSing() : startSing()">
            {{ playing ? '暂停跟唱' : '整段跟唱' }}
          </van-button>
          <div class="rate-pick">
            <span v-for="r in rates" :key="r.v" class="rate" :class="{on:rate===r.v}" @click="setRate(r.v)">{{ r.t }}</span>
          </div>
        </div>
        <div class="sing-tip" v-if="!Speech.supported">当前环境不支持语音朗读，可阅读注音自行跟唱。</div>
        <div class="sing-tip" v-else-if="!voiceCanto">提示：未检测到粤语语音包，将用普通话朗读注音示意。</div>

        <div class="lyric">
          <div class="ly-line" :class="{open:opened.has(i), active:cur===i, done:learned.has(i)}"
               v-for="(ln,i) in ly.lines" :key="i" :ref="el=>setLineRef(el,i)">
            <div class="ly-no">{{ learned.has(i) ? '✓' : i+1 }}</div>
            <div class="ly-line-main" @click="tog(i)">
              <div class="ly-text">{{ ln.text }}</div>
              <div class="ly-yin">{{ ln.yin }}</div>
              <div class="ly-exp" v-show="opened.has(i)">{{ ln.exp }}</div>
            </div>
            <div class="ly-ops">
              <button class="ly-op" :class="{playing:cur===i&&playing}" @click.stop="playLine(i)" title="朗读本句">
                <van-icon :name="cur===i&&playing ? 'volume' : 'volume-o'"/>
              </button>
              <button class="ly-op" :class="{on:learned.has(i)}" @click.stop="toggleLearned(i)" title="标记已学会">
                <van-icon name="success"/>
              </button>
            </div>
          </div>
        </div>

        <div class="learn-foot">
          <van-button block type="danger" icon="success" @click="finishAll">全部标记已学会</van-button>
          <van-button block plain type="danger" style="margin-top:10px" icon="replay" @click="reset">重新研习</van-button>
        </div>
        <div style="height:14px"></div>
      </div>
    </div>`,
    setup() {
      const ly = ref(null);
      const opened = reactive(new Set([0]));   // 展开释义的句
      const learned = reactive(new Set());     // 已学会的句（驱动进度）
      const progress = ref(0);                 // 服务端已存进度
      const playing = ref(false);              // 跟唱中
      const cur = ref(-1);                     // 当前朗读句
      const rate = ref(0.9);
      const rates = [{ t: '慢速', v: 0.7 }, { t: '正常', v: 0.9 }, { t: '稍快', v: 1.1 }];
      const scroller = ref(null);
      const lineEls = {};
      const setLineRef = (el, i) => { if (el) lineEls[i] = el; };

      const total = computed(() => (ly.value && ly.value.lines.length) || 1);
      // 进度 = max(服务端已存, 已学会句占比)
      const shown = computed(() => Math.max(progress.value, Math.round(learned.size / total.value * 100)));
      const voiceCanto = computed(() => Speech.isCantonese());
      let saveTimer = null;
      function saveSoon() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { if (ly.value) API.setLearn(ly.value.id, shown.value).catch(() => {}); }, 500);
      }
      function setRate(v) { rate.value = v; }
      function tog(i) { opened.has(i) ? opened.delete(i) : opened.add(i); }
      function toggleLearned(i) {
        learned.has(i) ? learned.delete(i) : learned.add(i);
        saveSoon();
      }
      function scrollToLine(i) {
        const el = lineEls[i], box = scroller.value;
        if (!el || !box) return;
        const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
        box.scrollTo({ top, behavior: 'smooth' });
      }
      // 朗读单句（点喇叭）
      function playLine(i) {
        Speech.cancel();
        const wasPlaying = playing.value; playing.value = false;
        cur.value = i; opened.add(i); scrollToLine(i);
        Speech.speak(ly.value.lines[i].text, { rate: rate.value, onend: () => { if (!playing.value) cur.value = -1; } });
        if (wasPlaying) {/* 单句打断整段 */}
      }
      // 整段顺序跟唱（卡拉OK）
      function startSing() {
        if (!ly.value) return;
        playing.value = true;
        const from = cur.value >= 0 && cur.value < total.value ? cur.value : 0;
        step(from);
      }
      function step(i) {
        if (!playing.value) return;
        if (i >= ly.value.lines.length) { playing.value = false; cur.value = -1; showSuccessToast('跟唱完成'); return; }
        cur.value = i; opened.add(i); scrollToLine(i);
        const go = () => {
          if (!playing.value) return;
          learned.add(i); saveSoon();           // 跟唱过的句计入已学会
          setTimeout(() => step(i + 1), 360);
        };
        if (!Speech.speak(ly.value.lines[i].text, { rate: rate.value, onend: go })) {
          // 无语音环境：按字数估时推进
          setTimeout(go, 900 + ly.value.lines[i].text.length * 220);
        }
      }
      function stopSing() { playing.value = false; Speech.cancel(); }
      function reset() { opened.clear(); opened.add(0); learned.clear(); cur.value = -1; stopSing(); saveSoon(); }
      async function finishAll() {
        for (let i = 0; i < total.value; i++) learned.add(i);
        try { await API.setLearn(ly.value.id, 100); progress.value = 100; showSuccessToast('已学会全段，记入学唱记录'); }
        catch (e) { showFailToast(e.message); }
      }
      onMounted(async () => {
        ly.value = await API.lyric(route.id);
        try { const recs = await API.learn(); const r = recs.find(x => x.lyrics_id === ly.value.id); progress.value = r ? r.progress : 0; } catch (e) {}
      });
      onUnmounted(() => { clearTimeout(saveTimer); Speech.cancel(); });
      return { ly, opened, learned, progress, playing, cur, rate, rates, shown, total, voiceCanto, Speech,
               scroller, setLineRef, setRate, tog, toggleLearned, playLine, startSing, stopSing, reset, finishAll, back, photoBg };
    },
  });

  /* ============================================================
   *  页面：我的
   * ========================================================== */
  const MeView = defineComponent({
    template: `
    <div class="page has-tab">
      <div class="page-body" style="padding:0">
        <div class="profile-head" v-if="u">
          <div class="ph-row">
            <img class="ph-av" :src="avatar(u)"/>
            <div class="ph-main">
              <div class="ph-n">{{ u.nickname }}</div>
              <div class="ph-s">{{ u.signature }}</div>
              <span class="ph-role">{{ u.role }} · {{ u.region }}</span>
            </div>
            <span class="ph-edit" @click="go('#/editprofile')"><van-icon name="edit"/> 编辑</span>
          </div>
          <div class="stat-row">
            <div class="st" @click="go('#/favorites')"><b>{{ stat.fav }}</b><span>收藏</span></div>
            <div class="st" @click="go('#/mycomments')"><b>{{ stat.cmt }}</b><span>评论</span></div>
            <div class="st" @click="go('#/learnlist')"><b>{{ stat.learn }}</b><span>学唱</span></div>
          </div>
        </div>

        <van-cell-group inset class="me-menu">
          <van-cell icon="chat-o" title="问戏 · 智能助手" label="AI 解答粤剧剧情、名家、唱腔与戏词" is-link @click="go('#/ask')"/>
          <van-cell icon="like-o" title="我的收藏" :value="stat.fav+' 项'" is-link @click="go('#/favorites')"/>
          <van-cell icon="music-o" title="学唱记录" :value="stat.learn+' 段'" is-link @click="go('#/learnlist')"/>
          <van-cell icon="chat-o" title="我的评论" :value="stat.cmt+' 条'" is-link @click="go('#/mycomments')"/>
          <van-cell icon="underway-o" title="浏览历史" :value="stat.his+' 条'" is-link @click="go('#/history')"/>
        </van-cell-group>
        <van-cell-group inset class="me-menu">
          <van-cell icon="calendar-o" title="公开演出" is-link @click="go('#/shows')"/>
          <van-cell icon="completed" title="我的报名" is-link @click="go('#/mysignups')"/>
          <van-cell icon="records" title="我的演出申请" is-link @click="go('#/myapplications')"/>
          <van-cell icon="add-o" title="申请公开演出" is-link @click="go('#/apply')"/>
        </van-cell-group>
        <van-cell-group inset class="me-menu">
          <van-cell icon="lock" title="修改密码" is-link @click="openPwd"/>
          <van-cell icon="info-o" title="关于平台" is-link @click="go('#/about')"/>
          <van-cell icon="revoke" title="退出登录" is-link title-class="logout-title" @click="logout"/>
        </van-cell-group>
        <div class="me-ver">南国红豆 · 粤剧文化传承平台　v2.0</div>
      </div>

      <van-dialog v-model:show="showPwd" title="修改密码" show-cancel-button
                  confirm-button-color="#9e1b1b" :before-close="savePwd">
        <div class="dialog-form">
          <van-field v-model="pwd.o" type="password" label="原密码" placeholder="请输入原密码"/>
          <van-field v-model="pwd.n" type="password" label="新密码" placeholder="至少 4 位"/>
          <van-field v-model="pwd.n2" type="password" label="确认" placeholder="再次输入新密码"/>
        </div>
      </van-dialog>

      <app-tabbar/>
    </div>`,
    setup() {
      const u = computed(() => state.user);
      const stat = reactive({ fav: 0, cmt: 0, learn: 0, his: 0 });
      const showPwd = ref(false);
      const pwd = reactive({ o: '', n: '', n2: '' });
      onMounted(async () => {
        try {
          const [f, c, l, h] = await Promise.all([API.favorites(), API.myComments(), API.learn(), API.history()]);
          stat.fav = f.length; stat.cmt = c.length; stat.learn = l.length; stat.his = h.length;
        } catch (e) {}
      });
      function openPwd() { pwd.o = pwd.n = pwd.n2 = ''; showPwd.value = true; }
      async function savePwd(action) {
        if (action !== 'confirm') return true;
        if (pwd.n.length < 4) { showToast('新密码至少 4 位'); return false; }
        if (pwd.n !== pwd.n2) { showToast('两次新密码不一致'); return false; }
        try { await API.changePassword(pwd.o, pwd.n); showSuccessToast('密码修改成功'); return true; }
        catch (e) { showFailToast(e.message); return false; }
      }
      function logout() {
        showConfirmDialog({ title: '退出登录', message: '确定要退出当前账号吗？', confirmButtonColor: '#9e1b1b' })
          .then(async () => { try { await API.logout(); } catch (e) {} API.setToken(null); state.user = null; go('#/login'); })
          .catch(() => {});
      }
      return { u, stat, showPwd, pwd, avatar, go, openPwd, savePwd, logout };
    },
  });

  /* ============================================================
   *  页面：编辑资料（独立页面）
   * ========================================================== */
  const GENDERS = ['男', '女', '保密'];
  const EditProfileView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="编辑资料" left-arrow @click-left="back"/>
      <div class="page-body" v-if="u">
        <div class="edit-hero">
          <img class="eh-av" :src="preview"/>
          <div class="eh-name">{{ f.nickname || u.nickname }}</div>
          <div class="eh-tip">选择头像样式</div>
          <div class="avatar-pick">
            <div class="ap-i" v-for="s in 6" :key="s" :class="{on:f.avatar_seed===s-1}" @click="f.avatar_seed=s-1">
              <img :src="avatarSeed(f.nickname||u.nickname, s-1)"/>
            </div>
          </div>
        </div>
        <van-cell-group inset class="edit-form">
          <van-field v-model="f.nickname" label="昵称" placeholder="给自己起个雅号" maxlength="16" show-word-limit/>
          <van-field v-model="f.signature" label="签名" placeholder="一句话签名" type="textarea" autosize maxlength="50" show-word-limit/>
          <van-field label="性别">
            <template #input>
              <van-radio-group v-model="f.gender" direction="horizontal">
                <van-radio v-for="g in genders" :key="g" :name="g" checked-color="#9e1b1b">{{ g }}</van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <van-field v-model="f.region" label="地区" placeholder="所在地区，如：广州"/>
          <van-field label="账号" :model-value="u.username" readonly input-align="left"/>
        </van-cell-group>
        <div class="edit-actions">
          <van-button block round type="danger" :loading="busy" @click="save">保 存 资 料</van-button>
          <van-button block plain round style="margin-top:10px" @click="back">取 消</van-button>
        </div>
        <div style="height:16px"></div>
      </div>
    </div>`,
    setup() {
      const u = computed(() => state.user);
      const f = reactive({ nickname: '', signature: '', region: '', gender: '保密', avatar_seed: 0 });
      const busy = ref(false);
      const genders = GENDERS;
      const avatarSeed = (name, s) => ART.avatar(name || '粤', s);
      const preview = computed(() => ART.avatar(f.nickname || (u.value && u.value.nickname) || '粤', f.avatar_seed));
      onMounted(() => {
        if (!u.value) return go('#/login');
        f.nickname = u.value.nickname; f.signature = u.value.signature;
        f.region = u.value.region; f.gender = u.value.gender || '保密';
        f.avatar_seed = u.value.avatar_seed || 0;
      });
      async function save() {
        if (!f.nickname.trim()) return showToast('昵称不能为空');
        busy.value = true;
        try {
          await API.updateProfile({ ...f });
          state.user = await API.me();
          showSuccessToast('资料已更新'); back();
        } catch (e) { showFailToast(e.message); }
        finally { busy.value = false; }
      }
      return { u, f, busy, genders, avatarSeed, preview, save, back, go };
    },
  });

  /* ============================================================
   *  页面：列表（收藏 / 评论 / 学唱 / 历史）
   * ========================================================== */
  const FavoritesView = defineComponent({
    components: { MediaRow },
    template: `
    <div class="page">
      <van-nav-bar title="我的收藏" left-arrow @click-left="back"/>
      <div class="page-body">
        <van-loading v-if="loading" class="center-loading" color="#9e1b1b"/>
        <van-empty v-else-if="!favs.length" description="还没有收藏，去剧目里发现喜欢的吧"/>
        <div class="list" v-else>
          <div v-for="f in favs" :key="f.id">
            <div class="card opera-line" v-if="f.type==='opera' && f.target" @click="go('#/opera/'+f.target.id)">
              <img class="poster" :src="poster(f.target)"/>
              <div class="ol-info"><h3>{{ f.target.title }}</h3><div class="ol-sum">{{ f.target.summary }}</div></div>
              <van-icon name="arrow" class="ol-go"/>
            </div>
            <div class="card opera-line" v-else-if="f.type==='artist' && f.target" @click="go('#/artist/'+f.target.id)">
              <img class="poster round60" :src="avatar(f.target)"/>
              <div class="ol-info"><h3>{{ f.target.name }}</h3><div class="ol-sum">{{ f.target.bio }}</div></div>
              <van-icon name="arrow" class="ol-go"/>
            </div>
            <media-row v-else-if="f.type==='media' && f.target" :media="f.target"/>
          </div>
        </div>
        <div style="height:12px"></div>
      </div>
    </div>`,
    setup() {
      const favs = ref([]); const loading = ref(true);
      onMounted(async () => { try { favs.value = await API.favorites(); } finally { loading.value = false; } });
      return { favs, loading, go, back, poster, avatar };
    },
  });

  const MyCommentsView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="我的评论" left-arrow @click-left="back"/>
      <div class="page-body">
        <van-empty v-if="!loading && !list.length" description="还没有发表评论"/>
        <div class="pad">
          <div class="card cm-card" v-for="c in list" :key="c.id" @click="open(c)">
            <div class="cm-target">{{ label(c.type) }}</div>
            <div class="cm-c">{{ c.content }}</div>
            <div class="cm-f">
              <van-rate :model-value="c.rating" readonly :size="12" color="#c9a227" void-color="#e4d6b8"/>
              <span><van-icon name="good-job-o"/> {{ c.likes }}</span>
              <span>{{ c.created }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      const label = t => TYPE_LABEL[t] || t;
      const open = c => go('#/' + (c.type === 'media' ? 'play' : c.type) + '/' + c.target_id);
      onMounted(async () => { try { list.value = await API.myComments(); } finally { loading.value = false; } });
      return { list, loading, label, open, back };
    },
  });

  const LearnListView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="学唱记录" left-arrow @click-left="back"/>
      <div class="page-body">
        <van-empty v-if="!loading && !list.length" description="还没有学唱记录，去戏词里学一段吧"/>
        <van-cell-group inset>
          <van-cell v-for="r in list" :key="r.id" :title="r.lyrics?r.lyrics.title:r.lyrics_id" is-link
                    @click="go('#/learn/'+r.lyrics_id)">
            <template #label>
              <van-progress :percentage="r.progress" color="#9e1b1b" track-color="#e4d6b8" :show-pivot="false" style="margin:6px 0"/>
              <span class="muted">进度 {{ r.progress }}% · {{ r.last }}</span>
            </template>
            <template #icon><div class="ly-badge">词</div></template>
          </van-cell>
        </van-cell-group>
      </div>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      onMounted(async () => { try { list.value = await API.learn(); } finally { loading.value = false; } });
      return { list, loading, go, back };
    },
  });

  const HistoryView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="浏览历史" left-arrow @click-left="back"/>
      <div class="page-body">
        <van-empty v-if="!loading && !list.length" description="暂无浏览记录"/>
        <van-cell-group inset>
          <van-cell v-for="h in list" :key="h.id" :title="h.title" :label="label(h.type)+' · '+h.time" is-link
                    @click="open(h)"/>
        </van-cell-group>
      </div>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      const label = t => TYPE_LABEL[t] || t;
      const open = h => go('#/' + (h.type === 'media' ? 'play' : h.type) + '/' + h.target_id);
      onMounted(async () => { try { list.value = await API.history(); } finally { loading.value = false; } });
      return { list, loading, label, open, back };
    },
  });

  /* ============================================================
   *  页面：公开演出（列表 / 详情 / 报名 / 申请 / 我的）
   * ========================================================== */
  function isPast(d) { return d && d < new Date().toISOString().slice(0, 10); }

  // 演出卡片
  const ShowCard = defineComponent({
    props: { ev: Object },
    template: `
      <div class="show-card" @click="go('#/show/'+ev.id)">
        <div class="sc-poster" :style="{background:'linear-gradient(135deg,'+pal(ev.poster_seed).bg+','+pal(ev.poster_seed).deep+')'}">
          <span class="sc-date"><b>{{ day(ev.date) }}</b>{{ month(ev.date) }}</span>
          <span class="sc-opera">{{ (ev.opera_title||ev.title).slice(0,4) }}</span>
        </div>
        <div class="sc-info">
          <div class="sc-t">{{ ev.title }}</div>
          <div class="sc-m"><van-icon name="location-o"/> {{ ev.city }} · {{ ev.venue }}</div>
          <div class="sc-m"><van-icon name="clock-o"/> {{ ev.date }} {{ ev.time }}</div>
          <div class="sc-f">
            <span class="sc-price">{{ ev.price }}</span>
            <span class="sc-seat" :class="{full:ev.remaining===0}">
              {{ ev.capacity>0 ? (ev.remaining>0 ? ('余 '+ev.remaining+' 位') : '名额已满') : '名额不限' }}
            </span>
          </div>
        </div>
      </div>`,
    setup() {
      const pal = s => ART.pal(s);
      const day = d => (d || '').slice(8, 10);
      const month = d => (d || '').slice(5, 7) + '月';
      return { go, pal, day, month };
    },
  });

  const ShowsView = defineComponent({
    components: { ShowCard, SectionTitle },
    template: `
    <div class="page has-tab">
      <van-nav-bar title="公开演出">
        <template #right><span class="nav-act" @click="go('#/apply')"><van-icon name="plus"/> 申请</span></template>
      </van-nav-bar>
      <div class="page-body">
        <div class="shows-banner">
          <div class="sb-t">岭南粤韵 · 好戏连台</div>
          <div class="sb-s">浏览各地公开演出，一键报名；也可申请发布你的演出。</div>
          <div class="sb-btns">
            <van-button size="small" round icon="records" @click="go('#/mysignups')">我的报名</van-button>
            <van-button size="small" round icon="completed" @click="go('#/myapplications')">我的申请</van-button>
          </div>
        </div>
        <div class="section"><section-title seal="演" title="近期演出" :more="list.length+' 场'"/></div>
        <van-loading v-if="loading" class="center-loading" color="#9e1b1b"/>
        <van-empty v-else-if="!list.length" description="暂无公开演出，点击右上角申请发布"/>
        <div class="list" v-else><show-card v-for="e in list" :key="e.id" :ev="e"/></div>
        <div style="height:14px"></div>
      </div>
      <app-tabbar/>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      onMounted(async () => { try { list.value = await API.shows(); } catch (e) { showFailToast(e.message); } finally { loading.value = false; } });
      return { list, loading, go };
    },
  });

  const ShowDetail = defineComponent({
    template: `
    <div class="page has-bar">
      <van-nav-bar :title="ev ? '演出详情' : '演出'" left-arrow @click-left="back"/>
      <div class="page-body" v-if="ev">
        <div class="detail-hero" style="height:180px">
          <div class="dh-img" :style="{background:'linear-gradient(135deg,'+pal.bg+','+pal.deep+')'}"></div>
          <div class="dh-veil"></div>
          <div class="dh-meta" style="left:16px">
            <van-tag color="#c9a227" text-color="#3a2705">{{ ev.date }} {{ ev.time }}</van-tag>
            <h1 style="font-size:23px">{{ ev.title }}</h1>
            <div class="dh-sub">{{ ev.troupe }} · 上演《{{ ev.opera_title }}》</div>
          </div>
        </div>
        <div class="block">
          <van-cell-group inset class="meta-cells">
            <van-cell title="城市" :value="ev.city"/>
            <van-cell title="场馆" :value="ev.venue"/>
            <van-cell title="地址" :value="ev.address||'—'"/>
            <van-cell title="时间" :value="ev.date+' '+ev.time"/>
            <van-cell title="票价" :value="ev.price"/>
            <van-cell title="名额" :value="ev.capacity>0 ? (ev.signupPeople+' / '+ev.capacity+' 人已报名') : '不限'"/>
            <van-cell title="主办" :value="ev.applicant_name"/>
          </van-cell-group>
        </div>
        <div class="block">
          <div class="blk-h"><span class="bar"></span><h3>演出介绍</h3></div>
          <p class="txt">{{ ev.intro || '暂无介绍' }}</p>
        </div>
        <div class="block" v-if="ev.mySignup">
          <div class="signed-tip"><van-icon name="checked"/> 您已报名（{{ ev.mySignup.num }} 人），请按时到场观看。</div>
        </div>
        <div style="height:80px"></div>
      </div>
      <div class="action-bar" v-if="ev">
        <van-button class="ab-fav" @click="openMap"><van-icon name="location-o"/><span>地址</span></van-button>
        <van-button v-if="ev.mySignup" class="ab-main" plain type="danger" @click="cancel">取消报名</van-button>
        <van-button v-else type="danger" class="ab-main" :disabled="ev.remaining===0" @click="openSignup">
          {{ ev.remaining===0 ? '名额已满' : '我要报名' }}
        </van-button>
      </div>

      <van-dialog v-model:show="showForm" title="演出报名" show-cancel-button confirm-button-color="#9e1b1b" :before-close="submit">
        <div class="dialog-form">
          <van-field v-model="form.name" label="姓名" placeholder="观众姓名"/>
          <van-field v-model="form.phone" label="电话" placeholder="联系电话" type="tel"/>
          <van-field label="人数">
            <template #input>
              <div class="num-row">
                <van-stepper v-model="form.num" :min="1" :max="maxNum" integer button-size="28px" input-width="44px"/>
                <span class="stepper-hint" v-if="ev && ev.capacity>0">剩余 {{ ev.remaining }} 个名额</span>
              </div>
            </template>
          </van-field>
          <van-field v-model="form.note" label="备注" placeholder="选填" type="textarea" autosize/>
        </div>
      </van-dialog>
    </div>`,
    setup() {
      const ev = ref(null); const showForm = ref(false);
      const form = reactive({ name: '', phone: '', num: 1, note: '' });
      const pal = computed(() => ev.value ? ART.pal(ev.value.poster_seed) : ART.pal(0));
      // 报名人数上限：不限名额时最多 10 人，否则不超过剩余名额
      const maxNum = computed(() => {
        const e = ev.value; if (!e || !e.capacity || e.capacity <= 0) return 10;
        return Math.max(1, e.remaining != null ? e.remaining : e.capacity);
      });
      async function load() { ev.value = await API.show(route.id); }
      function openSignup() {
        if (!state.user) return go('#/login');
        form.name = state.user.nickname; form.phone = ''; form.num = 1; form.note = '';
        showForm.value = true;
      }
      async function submit(action) {
        if (action !== 'confirm') return true;
        try {
          await API.signupShow(ev.value.id, { name: form.name, phone: form.phone, num: Number(form.num) || 1, note: form.note });
          showSuccessToast('报名成功'); await load(); return true;
        } catch (e) { showFailToast(e.message); return false; }
      }
      function cancel() {
        showConfirmDialog({ title: '取消报名', message: '确定取消本场演出的报名吗？', confirmButtonColor: '#9e1b1b' })
          .then(async () => { await API.cancelSignup(ev.value.id); showToast('已取消报名'); await load(); }).catch(() => {});
      }
      function openMap() { showToast(ev.value.city + ' · ' + ev.value.venue + (ev.value.address ? '（' + ev.value.address + '）' : '')); }
      onMounted(async () => {
        await load();
        // 便于直链/截图：?signup=1 自动弹出报名框
        if (/[?&]signup=1/.test(location.href) && state.user) nextTick(openSignup);
      });
      return { ev, pal, showForm, form, maxNum, openSignup, submit, cancel, openMap, back };
    },
  });

  const ApplyShowView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="申请公开演出" left-arrow @click-left="back"/>
      <div class="page-body">
        <div class="quote" style="margin:14px">填写演出信息提交申请，经平台管理员审核通过后，将在「公开演出」中展示并开放观众报名。</div>
        <van-form @submit="submit">
          <van-cell-group inset>
            <van-field v-model="f.title" label="演出名称" placeholder="如：仙凤鸣经典《帝女花》" :rules="[{required:true,message:'请填写演出名称'}]"/>
            <van-field v-model="f.opera_title" label="上演剧目" placeholder="如：帝女花"/>
            <van-field v-model="f.troupe" label="演出团体" placeholder="如：广州粤剧院"/>
            <van-field v-model="f.city" label="城市" placeholder="如：广州" :rules="[{required:true,message:'请填写城市'}]"/>
            <van-field v-model="f.venue" label="场馆" placeholder="如：广东粤剧艺术中心" :rules="[{required:true,message:'请填写场馆'}]"/>
            <van-field v-model="f.address" label="详细地址" placeholder="选填"/>
            <van-field v-model="f.date" label="演出日期" placeholder="选择日期" readonly is-link @click="showDate=true" :rules="[{required:true,message:'请选择日期'}]"/>
            <van-field v-model="f.time" label="演出时间" placeholder="如：19:30"/>
            <van-field v-model="f.price" label="票价" placeholder="如：80 / 180 元 或 免费"/>
            <van-field v-model="f.capacity" label="可报名名额" placeholder="0 表示不限" type="digit"/>
            <van-field v-model="f.contact" label="联系方式" placeholder="电话 / 微信"/>
            <van-field v-model="f.intro" label="演出介绍" placeholder="简要介绍演出内容" type="textarea" autosize rows="3"/>
          </van-cell-group>
          <div style="padding:16px"><van-button block round type="danger" native-type="submit" :loading="busy">提交申请</van-button></div>
        </van-form>
      </div>
      <van-popup v-model:show="showDate" position="bottom" round>
        <van-date-picker v-model="dateArr" title="选择演出日期" :min-date="minDate" :max-date="maxDate"
                         @confirm="onDate" @cancel="showDate=false"/>
      </van-popup>
    </div>`,
    setup() {
      const f = reactive({ title: '', opera_title: '', troupe: '', city: '', venue: '', address: '', date: '', time: '19:30', price: '', capacity: '0', contact: '', intro: '' });
      const busy = ref(false); const showDate = ref(false);
      const minDate = new Date(); const maxDate = new Date(Date.now() + 365 * 864e5);
      const dateArr = ref([String(minDate.getFullYear()), String(minDate.getMonth() + 1).padStart(2, '0'), String(minDate.getDate()).padStart(2, '0')]);
      function onDate({ selectedValues }) { f.date = selectedValues.join('-'); showDate.value = false; }
      async function submit() {
        busy.value = true;
        try { await API.applyShow({ ...f, capacity: Number(f.capacity) || 0 }); showSuccessToast('申请已提交，待审核'); go('#/myapplications'); }
        catch (e) { showFailToast(e.message); }
        finally { busy.value = false; }
      }
      return { f, busy, showDate, dateArr, minDate, maxDate, onDate, submit, back };
    },
  });

  const STATUS_LABEL = { pending: '待审核', approved: '已通过', rejected: '未通过' };
  const MyApplicationsView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="我的演出申请" left-arrow @click-left="back">
        <template #right><span class="nav-act" @click="go('#/apply')"><van-icon name="plus"/> 申请</span></template>
      </van-nav-bar>
      <div class="page-body">
        <van-empty v-if="!loading && !list.length" description="还没有申请，去发布一场演出吧"/>
        <div class="list">
          <div class="card opera-line" v-for="e in list" :key="e.id" @click="go('#/show/'+e.id)" style="align-items:flex-start">
            <div class="ol-info">
              <h3>{{ e.title }}</h3>
              <div class="ol-sum">{{ e.city }} · {{ e.venue }} · {{ e.date }} {{ e.time }}</div>
              <div class="ol-tags">
                <van-tag :type="e.status==='approved'?'success':(e.status==='rejected'?'danger':'warning')">{{ label(e.status) }}</van-tag>
                <van-tag plain type="primary" v-if="e.status==='approved'">报名 {{ e.signupPeople }} 人</van-tag>
              </div>
              <div class="review-note" v-if="e.review_note">审核意见：{{ e.review_note }}</div>
            </div>
          </div>
        </div>
        <div style="height:14px"></div>
      </div>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      const label = s => STATUS_LABEL[s] || s;
      onMounted(async () => { try { list.value = await API.myApplications(); } finally { loading.value = false; } });
      return { list, loading, label, go, back };
    },
  });

  const MySignupsView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="我的报名" left-arrow @click-left="back"/>
      <div class="page-body">
        <van-empty v-if="!loading && !list.length" description="还没有报名记录，去看看公开演出吧"/>
        <van-cell-group inset>
          <van-cell v-for="s in list" :key="s.id" :title="s.event_title" is-link @click="go('#/show/'+s.event_id)">
            <template #label>
              <span class="muted">{{ s.event_date }} {{ s.event_time }} · {{ s.event_city }} {{ s.event_venue }}</span><br/>
              <span class="muted">报名 {{ s.num }} 人 · {{ statusLabel(s.event_status) }}</span>
            </template>
          </van-cell>
        </van-cell-group>
        <div style="height:14px"></div>
      </div>
    </div>`,
    setup() {
      const list = ref([]); const loading = ref(true);
      const statusLabel = s => STATUS_LABEL[s] || s;
      onMounted(async () => { try { list.value = await API.mySignups(); } finally { loading.value = false; } });
      return { list, loading, statusLabel, go, back };
    },
  });

  /* ============================================================
   *  页面：关于
   * ========================================================== */
  const AboutView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="关于平台" left-arrow @click-left="back"/>
      <div class="page-body">
        <div class="about-brand"><img :src="seal"/><h1>南国红豆</h1><div class="muted">粤剧文化传承平台 v2.0</div></div>
        <van-cell-group inset>
          <div class="about-card">本平台聚焦国家级非物质文化遗产、联合国人类非遗代表作——<b>粤剧</b>的数字化传承，提供剧目分类查询、视频音频库、名家档案、收藏评论、戏词学唱与<b>热度地图分析</b>等功能。</div>
        </van-cell-group>
        <van-cell-group inset style="margin-top:12px">
          <van-cell title="技术架构" value="Vue3 + Vant4 / Node + SQLite"/>
          <van-cell title="数据接口" value="REST API"/>
          <van-cell title="热度样本" value="爬取 + 大样本采集"/>
        </van-cell-group>
        <div class="quote" style="margin:14px">资料整理自公开权威来源，仅作教学演示与文化传播之用。</div>
      </div>
    </div>`,
    setup() { return { back, seal: sealLogo('粤', 88) }; },
  });

  /* ============================================================
   *  页面：问戏 AI 助手（接入大模型，仅客户端）
   * ========================================================== */
  const AskView = defineComponent({
    template: `
    <div class="page">
      <van-nav-bar title="问戏 · 智能助手" left-arrow @click-left="back">
        <template #right><van-icon name="delete-o" size="19" @click="clearChat"/></template>
      </van-nav-bar>
      <div class="page-body ask-body" ref="scroller">
        <div class="ask-intro" v-if="!msgs.length">
          <div class="ai-avatar"><img :src="seal"/></div>
          <div class="ai-hi-t">我是粤剧小助手「红豆」</div>
          <div class="ai-hi-s">剧情典故、行当流派、名家生平、唱腔戏词……戏曲的事，尽管问我。</div>
          <div class="ask-suggest" v-if="suggests.length">
            <div class="as-label">试试这样问 ——</div>
            <div class="as-chip" v-for="(q,i) in suggests" :key="i" @click="send(q)">
              <van-icon name="chat-o"/><span>{{ q }}</span>
            </div>
          </div>
        </div>

        <div class="chat" v-else>
          <div class="msg" :class="m.role" v-for="(m,i) in msgs" :key="i">
            <div class="msg-av" v-if="m.role==='assistant'"><img :src="seal"/></div>
            <div class="msg-av user" v-else><img :src="userAvatar"/></div>
            <div class="bubble" :class="{err:m.error}">
              <span v-if="m.pending" class="typing"><i></i><i></i><i></i></span>
              <template v-else>{{ m.content }}</template>
            </div>
          </div>
        </div>
      </div>

      <div class="ask-input">
        <van-field v-model="draft" class="ask-field" type="textarea" rows="1" autosize
                   :placeholder="busy ? '红豆正在思考…' : '问问关于粤剧的任何问题'"
                   :readonly="busy" @keypress="onKey"/>
        <van-button class="ask-send" round type="danger" :disabled="busy || !draft.trim()" @click="send()">
          <van-icon name="guide-o" v-if="!busy"/>
          <van-loading v-else size="18" color="#fff"/>
        </van-button>
      </div>
    </div>`,
    setup() {
      const msgs = reactive([]);        // {role:'user'|'assistant', content, pending?, error?}
      const draft = ref('');
      const busy = ref(false);
      const suggests = ref([]);
      const scroller = ref(null);
      const seal = sealLogo('粤', 88);
      const userAvatar = computed(() => state.user ? avatar(state.user) : ART.avatar('客', 4));

      onMounted(async () => {
        try { const r = await API.askSuggest(); suggests.value = r.suggestions || []; } catch (e) {}
      });

      function scrollDown() {
        nextTick(() => { const el = scroller.value; if (el) el.scrollTop = el.scrollHeight; });
      }
      function onKey(e) {
        // 回车发送，Shift+回车换行
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
      }
      async function send(preset) {
        const text = (preset != null ? preset : draft.value).trim();
        if (!text || busy.value) return;
        draft.value = '';
        busy.value = true;
        msgs.push({ role: 'user', content: text });
        const bot = reactive({ role: 'assistant', content: '', pending: true });
        msgs.push(bot);
        scrollDown();
        // 仅取已完成的对话作为上下文（排除当前 pending 占位）
        const history = msgs
          .filter(m => !m.pending && !m.error)
          .map(m => ({ role: m.role, content: m.content }));
        try {
          const r = await API.ask(history);
          bot.pending = false;
          // 兜底清除可能残留的 Markdown 记号，保证气泡为纯净文本
          bot.content = (r.answer || '（暂无回应）')
            .replace(/\*\*(.*?)\*\*/g, '$1').replace(/(^|\n)#{1,6}\s*/g, '$1').replace(/`{1,3}/g, '');
        } catch (e) {
          bot.pending = false;
          bot.error = true;
          bot.content = e.message || '智能助手暂时不可用，请稍后重试。';
        } finally {
          busy.value = false;
          scrollDown();
        }
      }
      function clearChat() {
        if (!msgs.length) return;
        showConfirmDialog({ title: '清空对话', message: '确定清空当前问戏记录吗？', confirmButtonColor: '#9e1b1b' })
          .then(() => { msgs.splice(0, msgs.length); }).catch(() => {});
      }
      return { msgs, draft, busy, suggests, scroller, seal, userAvatar, send, onKey, clearChat, back };
    },
  });

  /* ============================================================
   *  根组件
   * ========================================================== */
  const NEED_AUTH_FALSE = new Set(['login', 'register', 'about']);
  const VIEWS = {
    login: LoginView, register: LoginView, home: HomeView, operas: OperasView, opera: OperaDetail,
    media: MediaView, play: PlayView, artists: ArtistsView, artist: ArtistDetail,
    lyrics: LyricsPicker, learn: LearnView, me: MeView, favorites: FavoritesView,
    editprofile: EditProfileView, ask: AskView,
    mycomments: MyCommentsView, learnlist: LearnListView, history: HistoryView,
    shows: ShowsView, show: ShowDetail, apply: ApplyShowView,
    myapplications: MyApplicationsView, mysignups: MySignupsView, about: AboutView,
  };

  const AppRoot = defineComponent({
    template: `
      <div class="root-loading" v-if="!ready"><van-loading color="#9e1b1b" size="28">载入梨园…</van-loading></div>
      <component v-else :is="currentView" :key="viewKey"/>`,
    setup() {
      const ready = computed(() => state.ready);
      const currentView = computed(() => {
        if (!state.user && !NEED_AUTH_FALSE.has(route.name)) return LoginView;
        return VIEWS[route.name] || HomeView;
      });
      // 切换 id 时强制重建详情页
      const viewKey = computed(() => route.name + '/' + route.id);
      return { ready, currentView, viewKey };
    },
  });

  /* ---------------- 启动 ---------------- */
  async function bootstrap() {
    applyRoute();
    if (!location.hash) location.hash = '#/home';
    if (API.token()) { try { state.user = await API.me(); } catch (e) { API.setToken(null); } }
    state.ready = true;
  }

  const app = createApp(AppRoot);
  app.use(vant);
  app.component('AppTabbar', AppTabbar);
  app.component('ChipRow', ChipRow);
  app.component('SectionTitle', SectionTitle);
  app.component('OperaCard', OperaCard);
  app.component('MediaRow', MediaRow);
  app.component('CommentSection', CommentSection);
  bootstrap().then(() => app.mount('#app'));
})();
