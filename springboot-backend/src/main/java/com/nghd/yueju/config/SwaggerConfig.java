package com.nghd.yueju.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger 文档配置，声明 JWT Bearer 鉴权。
 */
@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI yuejuOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("南国红豆 · 粤剧文化传承平台 API")
                        .version("2.0.0")
                        .description("Spring Boot + MyBatis-Plus 后端接口文档"))
                .components(new Components().addSecuritySchemes("bearer-jwt",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
