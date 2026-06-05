package com.nghd.yueju.web;

import com.nghd.yueju.entity.Comment;
import com.nghd.yueju.entity.History;
import com.nghd.yueju.security.AuthUser;
import com.nghd.yueju.security.CurrentUser;
import com.nghd.yueju.service.SocialService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SocialController {

    private final SocialService social;

    public SocialController(SocialService social) {
        this.social = social;
    }

    /* 收藏 */
    @GetMapping("/favorites")
    public List<Map<String, Object>> favorites() {
        return social.favorites(CurrentUser.require().id());
    }

    @GetMapping("/favorites/check")
    public Map<String, Object> favCheck(@RequestParam String type, @RequestParam String targetId) {
        return social.favoriteCheck(CurrentUser.require().id(), type, targetId);
    }

    @PostMapping("/favorites/toggle")
    public Map<String, Object> favToggle(@RequestBody Map<String, Object> b) {
        return social.favoriteToggle(CurrentUser.require().id(), str(b.get("type")), str(b.get("targetId")));
    }

    /* 评论 */
    @GetMapping("/comments")
    public List<Comment> comments(@RequestParam String type, @RequestParam String targetId) {
        return social.comments(type, targetId);
    }

    @GetMapping("/comments/mine")
    public List<Comment> myComments() {
        return social.commentsMine(CurrentUser.require().id());
    }

    @PostMapping("/comments")
    public Comment addComment(@RequestBody Map<String, Object> b) {
        AuthUser u = CurrentUser.require();
        Integer rating = b.get("rating") == null ? null : ((Number) b.get("rating")).intValue();
        return social.addComment(u, str(b.get("type")), str(b.get("targetId")), str(b.get("content")), rating);
    }

    @PostMapping("/comments/{id}/like")
    public Map<String, Object> like(@PathVariable String id) {
        return social.likeComment(id);
    }

    /* 学唱 */
    @GetMapping("/learn")
    public List<Map<String, Object>> learn() {
        return social.learnList(CurrentUser.require().id());
    }

    @PostMapping("/learn")
    public Map<String, Object> setLearn(@RequestBody Map<String, Object> b) {
        Integer p = b.get("progress") == null ? 0 : ((Number) b.get("progress")).intValue();
        return social.saveLearn(CurrentUser.require().id(), str(b.get("lyricsId")), p);
    }

    /* 历史 */
    @GetMapping("/history")
    public List<History> history() {
        return social.historyList(CurrentUser.require().id());
    }

    @PostMapping("/history")
    public Map<String, Object> addHistory(@RequestBody Map<String, Object> b) {
        return social.addHistory(CurrentUser.require().id(), str(b.get("type")), str(b.get("targetId")), str(b.get("title")));
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }
}
