package com.nghd.yueju.common.xss;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

/**
 * 注册 XSS 过滤器（参数级转义）。存储型 XSS（如评论内容）在 Service 层另行转义。
 */
@Configuration
public class XssFilter {

    @Bean
    public FilterRegistrationBean<Filter> xssFilterRegistration() {
        FilterRegistrationBean<Filter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new Filter() {
            @Override
            public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
                    throws IOException, ServletException {
                chain.doFilter(new XssRequestWrapper((HttpServletRequest) req), resp);
            }
        });
        bean.addUrlPatterns("/api/*");
        bean.setOrder(1);
        return bean;
    }
}
