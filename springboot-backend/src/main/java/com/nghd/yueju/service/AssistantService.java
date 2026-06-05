package com.nghd.yueju.service;

import com.nghd.yueju.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;

/**
 * AI 问戏：后端代理大模型（OpenAI 兼容接口），密钥仅服务端环境变量，前端不接触。
 */
@Service
public class AssistantService {

    private static final String SYSTEM_PROMPT = String.join("\n",
            "你是「南国红豆·粤剧文化传承平台」的智能戏曲助手，名叫\"红豆\"。",
            "专长：粤剧的剧目剧情、行当流派、名家生平、唱腔特色、戏词典故、历史源流、欣赏入门。",
            "规则：1. 回答控制在 320 字以内，条理清晰，不使用任何 Markdown 标记；",
            "2. 与戏曲/粤剧/岭南文化相关的问题热情解答，无关问题礼貌引回戏曲；",
            "3. 不确定的史实不杜撰；4. 使用简体中文、纯文本输出。");

    private final ContentService content;
    private final String baseUrl;
    private final String apiKey;
    private final String model;

    public AssistantService(ContentService content,
                            @Value("${app.llm.base-url}") String baseUrl,
                            @Value("${app.llm.api-key:}") String apiKey,
                            @Value("${app.llm.model}") String model) {
        this.content = content;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.model = model;
    }

    public Map<String, Object> suggest() {
        List<Map<String, Object>> operas = content.listOperas(null, null, null, null, null, "popularity", null);
        List<Map<String, Object>> artists = content.listArtists();
        String op = operas.isEmpty() ? "帝女花" : String.valueOf(operas.get(0).get("title"));
        String ar = artists.isEmpty() ? "红线女" : String.valueOf(artists.get(0).get("name"));
        return Map.of("suggestions", List.of(
                "粤剧和京剧有什么区别？",
                "《" + op + "》讲的是什么故事？",
                "介绍一下粤剧名家" + ar,
                "粤剧的行当是怎么划分的？",
                "什么是粤剧的\"梆黄\"？",
                "初学者怎么入门欣赏粤剧？"));
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> ask(List<Map<String, Object>> messages, String question) {
        List<Map<String, Object>> convo = new ArrayList<>();
        if (messages != null && !messages.isEmpty()) {
            int start = Math.max(0, messages.size() - 8);
            for (Map<String, Object> m : messages.subList(start, messages.size())) {
                Object role = m.get("role"), c = m.get("content");
                if (("user".equals(role) || "assistant".equals(role)) && c instanceof String s) {
                    convo.add(Map.of("role", role, "content", cut(s)));
                }
            }
        } else if (question != null && !question.isBlank()) {
            convo.add(Map.of("role", "user", "content", cut(question)));
        }
        if (convo.isEmpty()) throw BusinessException.badRequest("问题不能为空");
        if (apiKey == null || apiKey.isBlank()) {
            throw BusinessException.of(503, "智能助手未配置：请在服务端设置环境变量 LLM_API_KEY 后重试");
        }

        List<Map<String, Object>> msgs = new ArrayList<>();
        msgs.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        msgs.addAll(convo);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("messages", msgs);
        payload.put("temperature", 0.7);
        payload.put("max_tokens", 700);
        payload.put("stream", false);

        try {
            Map<String, Object> data = WebClient.create(baseUrl).post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(45));
            if (data == null) throw BusinessException.of(502, "智能助手暂时不可用");
            List<Map<String, Object>> choices = (List<Map<String, Object>>) data.get("choices");
            String answer = "";
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
                if (msg != null && msg.get("content") != null) answer = msg.get("content").toString().trim();
            }
            if (answer.isEmpty()) throw BusinessException.of(502, "智能助手没有返回内容，请重试");
            return Map.of("answer", answer, "model",
                    data.getOrDefault("model", model), "usage", data.getOrDefault("usage", Map.of()));
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            throw BusinessException.of(502, "智能助手调用失败：" + e.getMessage());
        }
    }

    private String cut(String s) {
        return s.length() > 2000 ? s.substring(0, 2000) : s;
    }
}
