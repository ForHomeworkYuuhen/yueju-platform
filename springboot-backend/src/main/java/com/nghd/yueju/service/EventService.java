package com.nghd.yueju.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nghd.yueju.common.exception.BusinessException;
import com.nghd.yueju.common.util.Ids;
import com.nghd.yueju.entity.ShowEvent;
import com.nghd.yueju.entity.ShowSignup;
import com.nghd.yueju.mapper.ShowEventMapper;
import com.nghd.yueju.mapper.ShowSignupMapper;
import com.nghd.yueju.security.AuthUser;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * 公开演出：申请 → 审核 → 报名。
 */
@Service
public class EventService {

    private final ShowEventMapper eventMapper;
    private final ShowSignupMapper signupMapper;
    private final ObjectMapper json;
    private final RedisTemplate<String, Object> redisTemplate;

    public EventService(ShowEventMapper eventMapper, ShowSignupMapper signupMapper,
                        ObjectMapper json, RedisTemplate<String, Object> redisTemplate) {
        this.eventMapper = eventMapper;
        this.signupMapper = signupMapper;
        this.json = json;
        this.redisTemplate = redisTemplate;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> mapEvent(ShowEvent e) {
        if (e == null) return null;
        Map<String, Object> m = json.convertValue(e, Map.class);
        m.put("opera", e.getOperaId());
        Map<String, Object> stat = signupMapper.statByEvent(e.getId());
        long records = num(stat.get("records"));
        long people = num(stat.get("people"));
        m.put("signupRecords", records);
        m.put("signupPeople", people);
        Integer cap = e.getCapacity();
        m.put("remaining", cap != null && cap > 0 ? Math.max(0, cap - people) : null);
        return m;
    }

    public List<Map<String, Object>> listShows(String status) {
        String st = status == null ? "approved" : status;
        String cacheKey = "cache:shows:" + st;

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<Map<String, Object>> result = eventMapper.selectList(new QueryWrapper<ShowEvent>()
                .eq("status", st).orderByAsc("date").orderByAsc("time"))
                .stream().map(this::mapEvent).toList();

        redisTemplate.opsForValue().set(cacheKey, result, 30, TimeUnit.MINUTES);
        return result;
    }

    public List<Map<String, Object>> allShows() {
        return eventMapper.selectList(new QueryWrapper<ShowEvent>().orderByDesc("created"))
                .stream().map(this::mapEvent).toList();
    }

    public Map<String, Object> getShow(String id, String userId) {
        ShowEvent e = eventMapper.selectById(id);
        if (e == null) throw BusinessException.notFound("演出不存在");
        Map<String, Object> m = mapEvent(e);
        Object mine = null;
        if (userId != null) {
            mine = signupMapper.selectOne(new QueryWrapper<ShowSignup>()
                    .eq("event_id", id).eq("user_id", userId));
        }
        m.put("mySignup", mine);
        return m;
    }

    public List<Map<String, Object>> showsByApplicant(String userId) {
        return eventMapper.selectList(new QueryWrapper<ShowEvent>()
                .eq("applicant_id", userId).orderByDesc("created"))
                .stream().map(this::mapEvent).toList();
    }

    public List<Map<String, Object>> mySignups(String userId) {
        return signupMapper.mySignups(userId);
    }

    public Map<String, Object> apply(AuthUser u, Map<String, Object> b) {
        String title = str(b.get("title"));
        if (title == null || title.isBlank()) throw BusinessException.badRequest("请填写演出名称");
        if (str(b.get("date")) == null) throw BusinessException.badRequest("请选择演出日期");
        if (str(b.get("city")) == null || str(b.get("venue")) == null)
            throw BusinessException.badRequest("请填写城市与场馆");
        ShowEvent e = new ShowEvent();
        e.setId(Ids.uid("ev"));
        e.setTitle(title.trim());
        e.setOperaId(str(b.get("opera_id")));
        e.setOperaTitle(str(b.getOrDefault("opera_title", title.trim())));
        e.setTroupe(strOr(b.get("troupe"), ""));
        e.setCity(str(b.get("city")));
        e.setVenue(str(b.get("venue")));
        e.setAddress(strOr(b.get("address"), ""));
        e.setDate(str(b.get("date")));
        e.setTime(strOr(b.get("time"), "19:30"));
        e.setPrice(strOr(b.get("price"), "待定"));
        e.setCapacity(b.get("capacity") != null ? (int) num(b.get("capacity")) : 0);
        e.setPosterSeed((int) (Math.random() * 6));
        e.setIntro(strOr(b.get("intro"), ""));
        e.setContact(strOr(b.get("contact"), ""));
        e.setApplicantId(u.id());
        e.setApplicantName(u.nickname());
        e.setStatus("pending");
        e.setReviewNote("");
        e.setCreated(Ids.now());
        eventMapper.insert(e);

        // 清除演出列表缓存
        redisTemplate.delete("cache:shows:approved");

        return Map.of("ok", true, "event", mapEvent(e));
    }

    public Map<String, Object> signup(String id, AuthUser u, Map<String, Object> b) {
        ShowEvent e = eventMapper.selectById(id);
        if (e == null) throw BusinessException.notFound("演出不存在");
        if (!"approved".equals(e.getStatus())) throw BusinessException.badRequest("该演出尚未开放报名");
        int n = Math.max(1, b.get("num") != null ? (int) num(b.get("num")) : 1);
        Map<String, Object> m = mapEvent(e);
        Object remaining = m.get("remaining");
        if (remaining != null && n > ((Number) remaining).longValue())
            throw BusinessException.badRequest("剩余名额不足");
        ShowSignup exist = signupMapper.selectOne(new QueryWrapper<ShowSignup>()
                .eq("event_id", id).eq("user_id", u.id()));
        if (exist != null) throw BusinessException.conflict("您已报名该演出");
        ShowSignup s = new ShowSignup();
        s.setId(Ids.uid("sg"));
        s.setEventId(id);
        s.setUserId(u.id());
        s.setName(strOr(b.get("name"), u.nickname()));
        s.setPhone(strOr(b.get("phone"), ""));
        s.setNum(n);
        s.setNote(strOr(b.get("note"), ""));
        s.setCreated(Ids.now());
        signupMapper.insert(s);
        return Map.of("ok", true, "event", mapEvent(eventMapper.selectById(id)));
    }

    public Map<String, Object> cancelSignup(String id, String userId) {
        int r = signupMapper.delete(new QueryWrapper<ShowSignup>()
                .eq("event_id", id).eq("user_id", userId));
        return Map.of("ok", true, "removed", r);
    }

    private static String str(Object o) { return o == null ? null : String.valueOf(o); }
    private static String strOr(Object o, String d) { return o == null ? d : String.valueOf(o); }
    private static long num(Object o) { return o == null ? 0 : ((Number) o).longValue(); }
}
