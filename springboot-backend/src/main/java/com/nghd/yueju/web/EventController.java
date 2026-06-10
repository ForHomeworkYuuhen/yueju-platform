package com.nghd.yueju.web;

import com.nghd.yueju.security.AuthUser;
import com.nghd.yueju.security.CurrentUser;
import com.nghd.yueju.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 演出活动接口：查看、申请、报名/取消报名。
 */
@RestController
@RequestMapping("/api/shows")
public class EventController {

    private static final Logger log = LoggerFactory.getLogger(EventController.class);

    private final EventService events;

    public EventController(EventService events) {
        this.events = events;
    }

    /**
     * 获取已审核通过的演出活动列表。
     */
    @GetMapping
    public List<Map<String, Object>> shows() {
        log.info("[Event] 查询已上线演出列表");
        return events.listShows("approved");
    }

    /**
     * 获取当前用户自己申请的演出活动列表。
     */
    @GetMapping("/mine")
    public List<Map<String, Object>> mine() {
        log.info("[Event] 查询当前用户的申请记录");
        return events.showsByApplicant(CurrentUser.require().id());
    }

    /**
     * 获取当前用户已报名的演出场次列表。
     */
    @GetMapping("/signups/mine")
    public List<Map<String, Object>> mySignups() {
        log.info("[Event] 查询当前用户的报名记录");
        return events.mySignups(CurrentUser.require().id());
    }

    /**
     * 获取指定演出的详情，登录用户返回是否已报名状态。
     */
    @GetMapping("/{id}")
    public Map<String, Object> show(@PathVariable String id) {
        log.info("[Event] 查询演出详情: id={}", id);
        AuthUser u = CurrentUser.get();
        return events.getShow(id, u == null ? null : u.id());
    }

    /**
     * 提交新的演出活动申请。
     */
    @PostMapping("/apply")
    public Map<String, Object> apply(@RequestBody Map<String, Object> b) {
        log.info("[Event] 用户提交演出申请: {}", b);
        return events.apply(CurrentUser.require(), b);
    }

    /**
     * 报名参加指定演出活动。
     */
    @PostMapping("/{id}/signup")
    public Map<String, Object> signup(@PathVariable String id, @RequestBody(required = false) Map<String, Object> b) {
        log.info("[Event] 用户报名演出: showId={}", id);
        return events.signup(id, CurrentUser.require(), b == null ? Map.of() : b);
    }

    /**
     * 取消已报名参加的演出活动。
     */
    @DeleteMapping("/{id}/signup")
    public Map<String, Object> cancel(@PathVariable String id) {
        log.info("[Event] 用户取消演出报名: showId={}", id);
        return events.cancelSignup(id, CurrentUser.require().id());
    }
}
