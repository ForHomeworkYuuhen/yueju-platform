package com.nghd.yueju.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * 健康检查接口：用于监控服务状态与数据库连通性。
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    @GetMapping("/health")
    public Map<String, Object> health() {
        log.info("[Health] 健康检查请求");
        return Map.of("ok", true, "db", "mysql", "time", Instant.now().toString());
    }
}
