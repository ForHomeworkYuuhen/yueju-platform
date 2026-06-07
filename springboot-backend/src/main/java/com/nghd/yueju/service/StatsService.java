package com.nghd.yueju.service;

import com.nghd.yueju.mapper.StatsMapper;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * 热度分析服务：基于演出样本聚合复合热度指数（年份权重 0.55→1.0）。
 * 聚合涉及数万条样本，结果以 Redis 缓存（按筛选条件为 key，TTL 10 分钟），
 * 显著降低重复查询时延、提升并发吞吐。
 */
@Service
public class StatsService {

    private static final long TTL_SEC = 600;

    private final StatsMapper mapper;
    private final RedisTemplate<String, Object> redis;

    public StatsService(StatsMapper mapper, RedisTemplate<String, Object> redis) {
        this.mapper = mapper;
        this.redis = redis;
    }

    @SuppressWarnings("unchecked")
    private <T> T cached(String key, Supplier<T> sup) {
        try {
            Object v = redis.opsForValue().get(key);
            if (v != null) return (T) v;
        } catch (Exception ignored) {
        }
        T r = sup.get();
        try {
            redis.opsForValue().set(key, r, TTL_SEC, TimeUnit.SECONDS);
        } catch (Exception ignored) {
        }
        return r;
    }

    private String key(String name, Object... parts) {
        StringBuilder sb = new StringBuilder("stats:").append(name);
        for (Object p : parts) sb.append(':').append(p);
        return sb.toString();
    }

    private int[] yr() {
        Map<String, Object> r = mapper.yearRange();
        int a = r != null && r.get("a") != null ? ((Number) r.get("a")).intValue() : 2005;
        int b = r != null && r.get("b") != null ? ((Number) r.get("b")).intValue() : 2024;
        return new int[]{a, Math.max(1, b - a)};
    }

    private Integer toInt(String s) {
        try { return s == null || s.isBlank() ? null : Integer.valueOf(s); }
        catch (NumberFormatException e) { return null; }
    }

    public List<Map<String, Object>> heatByCity(String from, String to, String channel) {
        return cached(key("city", from, to, channel), () -> {
            int[] s = yr();
            return mapper.heatByCity(toInt(from), toInt(to), blank(channel), s[0], s[1]);
        });
    }

    public List<Map<String, Object>> heatByProvince(String from, String to, String channel) {
        return cached(key("prov", from, to, channel), () -> {
            int[] s = yr();
            return mapper.heatByProvince(toInt(from), toInt(to), blank(channel), s[0], s[1]);
        });
    }

    public List<Map<String, Object>> heatPoints(String from, String to, String channel) {
        return cached(key("points", from, to, channel), () -> {
            int[] s = yr();
            return mapper.heatPoints(toInt(from), toInt(to), blank(channel), s[0], s[1]);
        });
    }

    public List<Map<String, Object>> perfByYear(String channel) {
        return cached(key("year", channel), () -> mapper.perfByYear(blank(channel)));
    }

    public List<Map<String, Object>> perfByChannel(String from, String to) {
        return cached(key("channel", from, to), () -> mapper.perfByChannel(toInt(from), toInt(to)));
    }

    public List<Map<String, Object>> topOperas(String from, String to, String channel, Integer limit) {
        return cached(key("top", from, to, channel, limit), () -> {
            int[] s = yr();
            return mapper.topOperasByHeat(toInt(from), toInt(to), blank(channel), s[0], s[1],
                    limit == null ? 10 : limit);
        });
    }

    public Map<String, Object> overview(String from, String to, String channel) {
        return cached(key("overview", from, to, channel), () -> {
            int[] s = yr();
            return mapper.heatOverview(toInt(from), toInt(to), blank(channel), s[0], s[1]);
        });
    }

    private String blank(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
