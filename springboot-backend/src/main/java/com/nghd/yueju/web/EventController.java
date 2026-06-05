package com.nghd.yueju.web;

import com.nghd.yueju.security.AuthUser;
import com.nghd.yueju.security.CurrentUser;
import com.nghd.yueju.service.EventService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shows")
public class EventController {

    private final EventService events;

    public EventController(EventService events) {
        this.events = events;
    }

    @GetMapping
    public List<Map<String, Object>> shows() {
        return events.listShows("approved");
    }

    @GetMapping("/mine")
    public List<Map<String, Object>> mine() {
        return events.showsByApplicant(CurrentUser.require().id());
    }

    @GetMapping("/signups/mine")
    public List<Map<String, Object>> mySignups() {
        return events.mySignups(CurrentUser.require().id());
    }

    @GetMapping("/{id}")
    public Map<String, Object> show(@PathVariable String id) {
        AuthUser u = CurrentUser.get();
        return events.getShow(id, u == null ? null : u.id());
    }

    @PostMapping("/apply")
    public Map<String, Object> apply(@RequestBody Map<String, Object> b) {
        return events.apply(CurrentUser.require(), b);
    }

    @PostMapping("/{id}/signup")
    public Map<String, Object> signup(@PathVariable String id, @RequestBody(required = false) Map<String, Object> b) {
        return events.signup(id, CurrentUser.require(), b == null ? Map.of() : b);
    }

    @DeleteMapping("/{id}/signup")
    public Map<String, Object> cancel(@PathVariable String id) {
        return events.cancelSignup(id, CurrentUser.require().id());
    }
}
