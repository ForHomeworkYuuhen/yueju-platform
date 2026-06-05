package com.nghd.yueju.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT 认证过滤器：解析 Bearer Token → 设置 SecurityContext；校验 Redis 注销黑名单。
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, Object> redis;

    public JwtAuthFilter(JwtUtil jwtUtil, RedisTemplate<String, Object> redis) {
        this.jwtUtil = jwtUtil;
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse resp, FilterChain chain)
            throws ServletException, IOException {
        String token = resolveToken(req);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                boolean revoked = Boolean.TRUE.equals(redis.hasKey(BLACKLIST_PREFIX + token));
                if (!revoked) {
                    AuthUser u = jwtUtil.parse(token);
                    String authority = u.isAdmin() ? "ROLE_ADMIN" : "ROLE_MEMBER";
                    var auth = new UsernamePasswordAuthenticationToken(
                            u, token, List.of(new SimpleGrantedAuthority(authority)));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                // 令牌无效/过期：保持未认证，由后续授权规则处理
            }
        }
        chain.doFilter(req, resp);
    }

    private String resolveToken(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) return h.substring(7);
        return req.getHeader("x-token");
    }
}
