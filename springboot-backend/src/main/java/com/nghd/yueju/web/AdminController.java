package com.nghd.yueju.web;

import com.nghd.yueju.security.CurrentUser;
import com.nghd.yueju.service.AdminService;
import com.nghd.yueju.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;
    private final AuthService authService;

    public AdminController(AdminService admin, AuthService authService) {
        this.admin = admin;
        this.authService = authService;
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return authService.me();
    }

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        return admin.overview();
    }

    @GetMapping("/events")
    public List<Map<String, Object>> events(@RequestParam(required = false) String status) {
        return admin.events(status);
    }

    @PostMapping("/events/{id}/review")
    public Map<String, Object> review(@PathVariable String id, @RequestBody Map<String, Object> b) {
        return admin.review(id, str(b.get("action")), str(b.get("note")), CurrentUser.require());
    }

    @GetMapping("/events/{id}/signups")
    public Map<String, Object> signups(@PathVariable String id) {
        return admin.signupsOfEvent(id);
    }

    @GetMapping("/tables")
    public List<Map<String, Object>> tables() {
        return admin.tables();
    }

    @GetMapping("/table/{name}")
    public Map<String, Object> table(@PathVariable String name,
                                     @RequestParam(required = false) String q,
                                     HttpServletRequest req) {
        java.util.Map<String, String> query = new java.util.HashMap<>();
        req.getParameterMap().forEach((k, v) -> query.put(k, v.length > 0 ? v[0] : null));
        return admin.table(name, q, query);
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }
}
