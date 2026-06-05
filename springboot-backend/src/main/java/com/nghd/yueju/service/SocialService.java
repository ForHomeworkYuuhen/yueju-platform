package com.nghd.yueju.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nghd.yueju.common.exception.BusinessException;
import com.nghd.yueju.common.util.Ids;
import com.nghd.yueju.entity.*;
import com.nghd.yueju.mapper.*;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.util.*;

/**
 * 用户互动：收藏 / 评论 / 学唱记录 / 浏览历史。
 */
@Service
public class SocialService {

    private final FavoriteMapper favoriteMapper;
    private final CommentMapper commentMapper;
    private final LearnRecordMapper learnMapper;
    private final HistoryMapper historyMapper;
    private final ContentService content;
    private final ObjectMapper json;

    public SocialService(FavoriteMapper favoriteMapper, CommentMapper commentMapper,
                         LearnRecordMapper learnMapper, HistoryMapper historyMapper,
                         ContentService content, ObjectMapper json) {
        this.favoriteMapper = favoriteMapper;
        this.commentMapper = commentMapper;
        this.learnMapper = learnMapper;
        this.historyMapper = historyMapper;
        this.content = content;
        this.json = json;
    }

    /* ---------------- 收藏 ---------------- */
    public List<Map<String, Object>> favorites(String userId) {
        List<Favorite> rows = favoriteMapper.selectList(new QueryWrapper<Favorite>()
                .eq("user_id", userId).orderByDesc("created"));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Favorite f : rows) {
            Map<String, Object> m = toMap(f);
            m.put("target", targetOf(f.getType(), f.getTargetId()));
            out.add(m);
        }
        return out;
    }

    public Map<String, Object> favoriteCheck(String userId, String type, String targetId) {
        Long c = favoriteMapper.selectCount(new QueryWrapper<Favorite>()
                .eq("user_id", userId).eq("type", type).eq("target_id", targetId));
        return Map.of("fav", c != null && c > 0);
    }

    public Map<String, Object> favoriteToggle(String userId, String type, String targetId) {
        if (type == null || targetId == null) throw BusinessException.badRequest("参数不完整");
        Favorite exist = favoriteMapper.selectOne(new QueryWrapper<Favorite>()
                .eq("user_id", userId).eq("type", type).eq("target_id", targetId));
        if (exist != null) {
            favoriteMapper.deleteById(exist.getId());
            return Map.of("fav", false);
        }
        Favorite f = new Favorite();
        f.setId(Ids.uid("f"));
        f.setUserId(userId);
        f.setType(type);
        f.setTargetId(targetId);
        f.setCreated(Ids.now());
        favoriteMapper.insert(f);
        return Map.of("fav", true);
    }

    private Object targetOf(String type, String id) {
        try {
            return switch (type) {
                case "opera" -> content.getOpera(id);
                case "artist" -> content.getArtist(id);
                case "media" -> content.getMedia(id);
                default -> null;
            };
        } catch (Exception e) {
            return null;
        }
    }

    /* ---------------- 评论 ---------------- */
    public List<Comment> comments(String type, String targetId) {
        return commentMapper.selectList(new QueryWrapper<Comment>()
                .eq("type", type).eq("target_id", targetId).orderByDesc("created"));
    }

    public List<Comment> commentsMine(String userId) {
        return commentMapper.selectList(new QueryWrapper<Comment>()
                .eq("user_id", userId).orderByDesc("created"));
    }

    public Comment addComment(com.nghd.yueju.security.AuthUser u, String type, String targetId,
                              String contentText, Integer rating) {
        if (contentText == null || contentText.isBlank()) {
            throw BusinessException.badRequest("评论内容不能为空");
        }
        Comment c = new Comment();
        c.setId(Ids.uid("c"));
        c.setUserId(u.id());
        c.setNickname(u.nickname());
        c.setAvatarSeed(u.avatarSeed());
        c.setType(type);
        c.setTargetId(targetId);
        c.setContent(HtmlUtils.htmlEscape(contentText.trim()));   // 存储型 XSS 转义
        c.setRating(rating != null ? rating : 5);
        c.setLikes(0);
        c.setCreated(Ids.now());
        commentMapper.insert(c);
        return c;
    }

    public Map<String, Object> likeComment(String id) {
        Comment c = commentMapper.selectById(id);
        if (c == null) throw BusinessException.notFound("评论不存在");
        c.setLikes(c.getLikes() + 1);
        commentMapper.updateById(c);
        return Map.of("likes", c.getLikes());
    }

    /* ---------------- 学唱记录 ---------------- */
    public List<Map<String, Object>> learnList(String userId) {
        List<LearnRecord> rows = learnMapper.selectList(new QueryWrapper<LearnRecord>()
                .eq("user_id", userId).orderByDesc("last"));
        List<Map<String, Object>> out = new ArrayList<>();
        for (LearnRecord r : rows) {
            Map<String, Object> m = toMap(r);
            try {
                m.put("lyrics", content.getLyrics(r.getLyricsId()));
            } catch (Exception e) {
                m.put("lyrics", null);
            }
            out.add(m);
        }
        return out;
    }

    public Map<String, Object> saveLearn(String userId, String lyricsId, Integer progress) {
        int p = Math.max(0, Math.min(100, progress == null ? 0 : progress));
        LearnRecord exist = learnMapper.selectOne(new QueryWrapper<LearnRecord>()
                .eq("user_id", userId).eq("lyrics_id", lyricsId));
        if (exist != null) {
            exist.setProgress(Math.max(exist.getProgress() == null ? 0 : exist.getProgress(), p));
            exist.setLast(Ids.now());
            learnMapper.updateById(exist);
        } else {
            LearnRecord r = new LearnRecord();
            r.setId(Ids.uid("l"));
            r.setUserId(userId);
            r.setLyricsId(lyricsId);
            r.setProgress(p);
            r.setLast(Ids.now());
            learnMapper.insert(r);
        }
        return Map.of("ok", true);
    }

    /* ---------------- 浏览历史 ---------------- */
    public List<History> historyList(String userId) {
        return historyMapper.selectList(new QueryWrapper<History>()
                .eq("user_id", userId).orderByDesc("time").last("LIMIT 60"));
    }

    public Map<String, Object> addHistory(String userId, String type, String targetId, String title) {
        if (type == null || targetId == null) throw BusinessException.badRequest("参数不完整");
        historyMapper.delete(new QueryWrapper<History>()
                .eq("user_id", userId).eq("type", type).eq("target_id", targetId));
        History h = new History();
        h.setId(Ids.uid("h"));
        h.setUserId(userId);
        h.setType(type);
        h.setTargetId(targetId);
        h.setTitle(title == null ? "" : title);
        h.setTime(Ids.now());
        historyMapper.insert(h);
        return Map.of("ok", true);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object entity) {
        return json.convertValue(entity, Map.class);
    }
}
