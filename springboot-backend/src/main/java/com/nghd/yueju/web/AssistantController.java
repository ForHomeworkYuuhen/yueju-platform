package com.nghd.yueju.web;

import com.nghd.yueju.service.AssistantService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 智能助手接口：学习推荐、智能问答。
 */
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private static final Logger log = LoggerFactory.getLogger(AssistantController.class);

    private final AssistantService assistant;

    public AssistantController(AssistantService assistant) {
        this.assistant = assistant;
    }

    /**
     * 获取个性化学习推荐内容。
     */
    @GetMapping("/suggest")
    public Map<String, Object> suggest() {
        log.info("[Assistant] 获取学习推荐");
        return assistant.suggest();
    }

    /**
     * 智能问答，支持传入对话历史上下文。
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/ask")
    public Map<String, Object> ask(@RequestBody Map<String, Object> b) {
        List<Map<String, Object>> messages = (List<Map<String, Object>>) b.get("messages");
        String question = b.get("question") == null ? null : String.valueOf(b.get("question"));
        log.info("[Assistant] 智能问答: question={}, historySize={}", question, messages == null ? 0 : messages.size());
        return assistant.ask(messages, question);
    }
}
