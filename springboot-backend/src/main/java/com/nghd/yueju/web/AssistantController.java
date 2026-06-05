package com.nghd.yueju.web;

import com.nghd.yueju.service.AssistantService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistant;

    public AssistantController(AssistantService assistant) {
        this.assistant = assistant;
    }

    @GetMapping("/suggest")
    public Map<String, Object> suggest() {
        return assistant.suggest();
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/ask")
    public Map<String, Object> ask(@RequestBody Map<String, Object> b) {
        List<Map<String, Object>> messages = (List<Map<String, Object>>) b.get("messages");
        String question = b.get("question") == null ? null : String.valueOf(b.get("question"));
        return assistant.ask(messages, question);
    }
}
