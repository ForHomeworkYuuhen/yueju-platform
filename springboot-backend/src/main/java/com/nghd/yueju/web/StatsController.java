package com.nghd.yueju.web;

import com.nghd.yueju.service.StatsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 数据统计接口：平台整体概况、演出热度、地区分布等。
 */
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private static final Logger log = LoggerFactory.getLogger(StatsController.class);

    private final StatsService stats;

    public StatsController(StatsService stats) {
        this.stats = stats;
    }

    /**
     * 获取平台整体统计概况，支持按时间范围和渠道筛选。
     */
    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam(required = false) String from,
                                        @RequestParam(required = false) String to,
                                        @RequestParam(required = false) String channel) {
        log.info("[Stats] 查询统计概况: from={}, to={}, channel={}", from, to, channel);
        Map<String, Object> r = new LinkedHashMap<>(stats.overview(from, to, channel));
        r.put("byChannel", stats.perfByChannel(from, to));
        r.put("topOperas", stats.topOperas(from, to, channel, 8));
        log.info("[Stats] 统计概况查询完成");
        return r;
    }

    /**
     * 获取演出热度分析数据，包括城市/省份分布、年度趋势等。
     */
    @GetMapping("/heat")
    public Map<String, Object> heat(@RequestParam(required = false) String from,
                                    @RequestParam(required = false) String to,
                                    @RequestParam(required = false) String channel) {
        log.info("[Stats] 查询热度分析: from={}, to={}, channel={}", from, to, channel);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("cities", stats.heatByCity(from, to, channel));
        r.put("provinces", stats.heatByProvince(from, to, channel));
        r.put("points", stats.heatPoints(from, to, channel));
        r.put("byYear", stats.perfByYear(channel));
        r.put("byChannel", stats.perfByChannel(from, to));
        r.put("topOperas", stats.topOperas(from, to, channel, 10));
        r.put("overview", stats.overview(from, to, channel));
        log.info("[Stats] 热度分析查询完成");
        return r;
    }
}
