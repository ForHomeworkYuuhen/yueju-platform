package com.nghd.yueju.web;

import com.nghd.yueju.entity.Comment;
import com.nghd.yueju.entity.History;
import com.nghd.yueju.security.AuthUser;
import com.nghd.yueju.security.CurrentUser;
import com.nghd.yueju.service.SocialService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 社交互动接口：收藏、评论、学唱记录、浏览历史。
 */
@RestController
@RequestMapping("/api")
public class SocialController {

    private static final Logger log = LoggerFactory.getLogger(SocialController.class);

    private final SocialService social;

    public SocialController(SocialService social) {
        this.social = social;
    }

    /* ==================== 收藏 ==================== */

    /**
     * 获取当前用户的全部收藏记录。
     */
    @GetMapping("/favorites")
    public List<Map<String, Object>> favorites() {
        log.info("[Social] 获取用户收藏列表");
        return social.favorites(CurrentUser.require().id());
    }

    /**
     * 检查当前用户是否已收藏指定对象。
     */
    @GetMapping("/favorites/check")
    public Map<String, Object> favCheck(@RequestParam String type, @RequestParam String targetId) {
        log.info("[Social] 检查收藏状态: type={}, targetId={}", type, targetId);
        return social.favoriteCheck(CurrentUser.require().id(), type, targetId);
    }

    /**
     * 切换收藏状态（已收藏则取消，未收藏则添加）。
     */
    @PostMapping("/favorites/toggle")
    public Map<String, Object> favToggle(@RequestBody Map<String, Object> b) {
        String type = str(b.get("type"));
        String targetId = str(b.get("targetId"));
        log.info("[Social] 切换收藏状态: type={}, targetId={}", type, targetId);
        return social.favoriteToggle(CurrentUser.require().id(), type, targetId);
    }

    /* ==================== 评论 ==================== */

    /**
     * 获取指定对象的全部评论列表。
     */
    @GetMapping("/comments")
    public List<Comment> comments(@RequestParam String type, @RequestParam String targetId) {
        log.info("[Social] 查询评论列表: type={}, targetId={}", type, targetId);
        return social.comments(type, targetId);
    }

    /**
     * 获取当前用户发表的全部评论。
     */
    @GetMapping("/comments/mine")
    public List<Comment> myComments() {
        log.info("[Social] 获取当前用户的所有评论");
        return social.commentsMine(CurrentUser.require().id());
    }

    /**
     * 发表新评论，支持可选评分。
     */
    @PostMapping("/comments")
    public Comment addComment(@RequestBody Map<String, Object> b) {
        AuthUser u = CurrentUser.require();
        String type = str(b.get("type"));
        String targetId = str(b.get("targetId"));
        String content = str(b.get("content"));
        Integer rating = b.get("rating") == null ? null : ((Number) b.get("rating")).intValue();
        log.info("[Social] 发表评论: userId={}, type={}, targetId={}, rating={}", u.id(), type, targetId, rating);
        return social.addComment(u, type, targetId, content, rating);
    }

    /**
     * 为指定评论点赞。
     */
    @PostMapping("/comments/{id}/like")
    public Map<String, Object> like(@PathVariable String id) {
        log.info("[Social] 评论点赞: commentId={}", id);
        return social.likeComment(id);
    }

    /* ==================== 学唱 ==================== */

    /**
     * 获取当前用户的学唱进度列表。
     */
    @GetMapping("/learn")
    public List<Map<String, Object>> learn() {
        log.info("[Social] 获取用户学唱记录");
        return social.learnList(CurrentUser.require().id());
    }

    /**
     * 保存或更新学唱进度。
     */
    @PostMapping("/learn")
    public Map<String, Object> setLearn(@RequestBody Map<String, Object> b) {
        String lyricsId = str(b.get("lyricsId"));
        Integer progress = b.get("progress") == null ? 0 : ((Number) b.get("progress")).intValue();
        log.info("[Social] 保存学唱进度: lyricsId={}, progress={}", lyricsId, progress);
        return social.saveLearn(CurrentUser.require().id(), lyricsId, progress);
    }

    /* ==================== 历史 ==================== */

    /**
     * 获取当前用户的浏览历史记录。
     */
    @GetMapping("/history")
    public List<History> history() {
        log.info("[Social] 获取用户浏览历史");
        return social.historyList(CurrentUser.require().id());
    }

    /**
     * 新增一条浏览历史记录。
     */
    @PostMapping("/history")
    public Map<String, Object> addHistory(@RequestBody Map<String, Object> b) {
        String type = str(b.get("type"));
        String targetId = str(b.get("targetId"));
        String title = str(b.get("title"));
        log.info("[Social] 新增浏览历史: type={}, targetId={}, title={}", type, targetId, title);
        return social.addHistory(CurrentUser.require().id(), type, targetId, title);
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }
}
