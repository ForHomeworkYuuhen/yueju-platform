package com.nghd.yueju.web;

import com.nghd.yueju.service.StatsService;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService stats;

    public StatsController(StatsService stats) {
        this.stats = stats;
    }

    @GetMapping("/overview")
    public Map<String, Object> overview(@RequestParam(required = false) String from,
                                        @RequestParam(required = false) String to,
                                        @RequestParam(required = false) String channel) {
        Map<String, Object> r = new LinkedHashMap<>(stats.overview(from, to, channel));
        r.put("byChannel", stats.perfByChannel(from, to));
        r.put("topOperas", stats.topOperas(from, to, channel, 8));
        return r;
    }

    @GetMapping("/heat")
    public Map<String, Object> heat(@RequestParam(required = false) String from,
                                    @RequestParam(required = false) String to,
                                    @RequestParam(required = false) String channel) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("cities", stats.heatByCity(from, to, channel));
        r.put("provinces", stats.heatByProvince(from, to, channel));
        r.put("points", stats.heatPoints(from, to, channel));
        r.put("byYear", stats.perfByYear(channel));
        r.put("byChannel", stats.perfByChannel(from, to));
        r.put("topOperas", stats.topOperas(from, to, channel, 10));
        r.put("overview", stats.overview(from, to, channel));
        return r;
    }
}
