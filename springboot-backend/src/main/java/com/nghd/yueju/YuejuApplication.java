package com.nghd.yueju;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 南国红豆 · 粤剧文化传承平台 后端入口
 * 架构：Spring Boot 3 + MyBatis-Plus + MySQL + Redis + Spring Security(JWT/RBAC)
 */
@SpringBootApplication
@MapperScan("com.nghd.yueju.**.mapper")
public class YuejuApplication {
    public static void main(String[] args) {
        SpringApplication.run(YuejuApplication.class, args);
    }
}
