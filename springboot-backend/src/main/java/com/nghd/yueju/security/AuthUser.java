package com.nghd.yueju.security;

/**
 * 安全上下文中的当前用户（来自 JWT 声明，避免每次请求查库）。
 */
public record AuthUser(String id, String username, String nickname, String role, Integer avatarSeed) {
    public boolean isAdmin() {
        return "管理员".equals(role);
    }
}
