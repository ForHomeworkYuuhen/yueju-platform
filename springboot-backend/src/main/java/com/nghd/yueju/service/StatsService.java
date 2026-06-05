package com.nghd.yueju.service;

import com.nghd.yueju.mapper.StatsMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 热度分析服务：基于演出样本聚合复合热度指数（年份权重 0.55→1.0）。
 */
@Service
public class StatsService {

    private final StatsMapper mapper;

    public StatsService(StatsMapper mapper) {
        this.mapper = mapper;
    }

    /** 返回 [a=最小年, span=年份跨度] */
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
        int[] s = yr();
        return mapper.heatByCity(toInt(from), toInt(to), blank(channel), s[0], s[1]);
    }

    public List<Map<String, Object>> heatByProvince(String from, String to, String channel) {
        int[] s = yr();
        return mapper.heatByProvince(toInt(from), toInt(to), blank(channel), s[0], s[1]);
    }

    public List<Map<String, Object>> heatPoints(String from, String to, String channel) {
        int[] s = yr();
        return mapper.heatPoints(toInt(from), toInt(to), blank(channel), s[0], s[1]);
    }

    public List<Map<String, Object>> perfByYear(String channel) {
        return mapper.perfByYear(blank(channel));
    }

    public List<Map<String, Object>> perfByChannel(String from, String to) {
        return mapper.perfByChannel(toInt(from), toInt(to));
    }

    public List<Map<String, Object>> topOperas(String from, String to, String channel, Integer limit) {
        int[] s = yr();
        return mapper.topOperasByHeat(toInt(from), toInt(to), blank(channel), s[0], s[1],
                limit == null ? 10 : limit);
    }

    public Map<String, Object> overview(String from, String to, String channel) {
        int[] s = yr();
        return mapper.heatOverview(toInt(from), toInt(to), blank(channel), s[0], s[1]);
    }

    private String blank(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
