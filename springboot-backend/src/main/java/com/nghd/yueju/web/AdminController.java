package com.nghd.yueju.web;

import com.nghd.yueju.security.CurrentUser;
import com.nghd.yueju.service.AdminService;
import com.nghd.yueju.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 后台管理接口：管理员信息、演出审核、数据总览、任意表查询。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final AdminService admin;
    private final AuthService authService;

    public AdminController(AdminService admin, AuthService authService) {
        this.admin = admin;
        this.authService = authService;
    }

    /**
     * 获取当前登录管理员的个人信息。
     */
    @GetMapping("/me")
    public Map<String, Object> me() {
        log.info("[Admin] 获取管理员个人信息");
        return authService.me();
    }

    /**
     * 获取平台整体数据总览（用户数、演出数等）。
     */
    @GetMapping("/overview")
    public Map<String, Object> overview() {
        log.info("[Admin] 查询平台数据总览");
        return admin.overview();
    }

    /**
     * 查询演出活动列表，支持按状态筛选（pending/approved/rejected）。
     */
    @GetMapping("/events")
    public List<Map<String, Object>> events(@RequestParam(required = false) String status) {
        log.info("[Admin] 查询演出列表: status={}", status);
        return admin.events(status);
    }

    /**
     * 审核指定演出申请（通过/拒绝）。
     */
    @PostMapping("/events/{id}/review")
    public Map<String, Object> review(@PathVariable String id, @RequestBody Map<String, Object> b) {
        String action = str(b.get("action"));
        String note = str(b.get("note"));
        log.info("[Admin] 审核演出申请: id={}, action={}, note={}", id, action, note);
        return admin.review(id, action, note, CurrentUser.require());
    }

    /**
     * 查看指定演出的全部报名人员列表。
     */
    @GetMapping("/events/{id}/signups")
    public Map<String, Object> signups(@PathVariable String id) {
        log.info("[Admin] 查询演出报名列表: eventId={}", id);
        return admin.signupsOfEvent(id);
    }

    /**
     * 获取系统支持管理的全部数据表列表。
     */
    @GetMapping("/tables")
    public List<Map<String, Object>> tables() {
        log.info("[Admin] 获取可管理数据表列表");
        return admin.tables();
    }

    /**
     * 分页查询指定数据表的记录，支持关键词搜索和全参数过滤。
     */
    @GetMapping("/table/{name}")
    public Map<String, Object> table(@PathVariable String name,
                                     @RequestParam(required = false) String q,
                                     HttpServletRequest req) {
        java.util.Map<String, String> query = new java.util.HashMap<>();
        req.getParameterMap().forEach((k, v) -> query.put(k, v.length > 0 ? v[0] : null));
        log.info("[Admin] 查询数据表: name={}, q={}, params={}", name, q, query);
        return admin.table(name, q, query);
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }
}
