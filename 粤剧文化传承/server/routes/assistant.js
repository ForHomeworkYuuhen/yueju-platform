/* =============================================================
 * assistant.js —— 「问戏」AI 助手代理接口（仅客户端使用）
 * 后端代理大模型，API Key 留在服务端，前端永不接触密钥。
 * 上游：OpenAI 兼容接口（中转站），默认 DeepSeek 模型。
 * 端点：
 *   POST /api/assistant/ask    一次性问答（返回完整文本）
 *   GET  /api/assistant/suggest 推荐问题（基于库内剧目/名家）
 * ============================================================= */
const express = require('express');
const repo = require('../repo');
const router = express.Router();

// 凭证与上游配置（密钥仅从环境变量读取，严禁硬编码进源码）
//   设置示例（PowerShell）： $env:LLM_API_KEY = '你的密钥'
//                （bash）：    export LLM_API_KEY=你的密钥
const LLM = {
  baseURL: process.env.LLM_BASE_URL || 'https://tbnx.plus7.plus/v1',
  apiKey: process.env.LLM_API_KEY || '',
  model: process.env.LLM_MODEL || 'deepseek-v3.2',
  timeout: 45000,
};

// 系统提示：把模型限定为「粤剧文化讲解员」，贴合本平台主题
const SYSTEM_PROMPT = [
  '你是「南国红豆·粤剧文化传承平台」的智能戏曲助手，名叫"红豆"。',
  '专长：粤剧（广东大戏）的剧目剧情、行当流派、名家生平、唱腔特色、戏词典故、历史源流、欣赏入门，以及与京剧、昆曲等其他戏曲剧种的对比。',
  '风格：亲切、专业、有文化底蕴，多用通俗的语言把传统戏曲讲得生动易懂。可适当引用经典唱词。',
  '规则：',
  '1. 回答控制在 320 字以内，条理清晰，必要时用简短分点（用"1. 2. 3."编号，不要使用任何 Markdown 标记如 **、##、- ）。',
  '2. 与戏曲、粤剧、岭南文化相关的问题都热情解答；若问题明显与戏曲/传统文化无关，礼貌说明你专注于粤剧戏曲领域，并把话题引回戏曲。',
  '3. 不确定的史实不要杜撰，可坦诚说明并给出大致方向。',
  '4. 使用简体中文回答，纯文本输出，不使用 Markdown 语法。',
].join('\n');

/* 推荐问题：结合库内真实剧目/名家，给用户引导 */
router.get('/suggest', (req, res) => {
  let ops = [], ars = [];
  try { ops = repo.listOperas({ sort: 'popularity' }).slice(0, 6); } catch (e) {}
  try { ars = repo.listArtists().slice(0, 6); } catch (e) {}
  const pick = (arr) => arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
  const o = pick(ops), a = pick(ars);
  const suggestions = [
    '粤剧和京剧有什么区别？',
    o ? `《${o.title}》讲的是什么故事？` : '《帝女花》讲的是什么故事？',
    a ? `介绍一下粤剧名家${a.name}` : '介绍一下粤剧名家红线女',
    '粤剧的行当是怎么划分的？',
    '什么是粤剧的"梆黄"？',
    '初学者怎么入门欣赏粤剧？',
  ];
  res.json({ suggestions });
});

/* 一次性问答 */
router.post('/ask', async (req, res) => {
  const { messages, question } = req.body || {};
  // 组装对话：系统提示 + 历史（最多保留最近若干轮）+ 本次问题
  let convo = [];
  if (Array.isArray(messages) && messages.length) {
    convo = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-8)
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
  } else if (question) {
    convo = [{ role: 'user', content: String(question).slice(0, 2000) }];
  }
  if (!convo.length) return res.status(400).json({ error: '问题不能为空' });
  if (!LLM.apiKey) return res.status(503).json({ error: '智能助手未配置：请在服务端设置环境变量 LLM_API_KEY 后重试' });

  const payload = {
    model: LLM.model,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...convo],
    temperature: 0.7,
    max_tokens: 700,
    stream: false,
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM.timeout);
  try {
    const r = await fetch(LLM.baseURL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + LLM.apiKey },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const data = await r.json().catch(() => null);
    if (!r.ok || !data) {
      const msg = (data && data.error && (data.error.message || data.error)) || ('上游返回 ' + r.status);
      return res.status(502).json({ error: '智能助手暂时不可用：' + msg });
    }
    const choice = data.choices && data.choices[0];
    const answer = choice && choice.message && choice.message.content ? choice.message.content.trim() : '';
    if (!answer) return res.status(502).json({ error: '智能助手没有返回内容，请重试' });
    res.json({ answer, model: data.model || LLM.model, usage: data.usage || null });
  } catch (e) {
    clearTimeout(timer);
    const aborted = e.name === 'AbortError';
    res.status(aborted ? 504 : 502).json({ error: aborted ? '智能助手响应超时，请稍后重试' : ('智能助手调用失败：' + e.message) });
  }
});

module.exports = router;
