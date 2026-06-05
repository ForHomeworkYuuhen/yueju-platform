package com.nghd.yueju.security;

import com.nghd.yueju.common.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 读取当前登录用户（来自 SecurityContext）。
 */
public final class CurrentUser {
    private CurrentUser() {}

    public static AuthUser get() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof AuthUser u) return u;
        return null;
    }

    public static AuthUser require() {
        AuthUser u = get();
        if (u == null) throw BusinessException.unauthorized("请先登录");
        return u;
    }
}
