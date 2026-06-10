package com.nghd.yueju.web;

import com.nghd.yueju.dto.AuthDtos;
import com.nghd.yueju.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证相关接口：注册、登录、登出、获取/修改个人信息。
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 用户注册，自动签发 JWT。
     */
    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody AuthDtos.Register dto) {
        log.info("[Auth] 用户注册: username={}", dto.username());
        Map<String, Object> result = authService.register(dto);
        log.info("[Auth] 注册成功: username={}", dto.username());
        return result;
    }

    /**
     * 用户登录，成功后签发 JWT；失败超过 5 次触发 10 分钟限流。
     */
    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody AuthDtos.Login dto) {
        log.info("[Auth] 用户登录尝试: username={}", dto.username());
        try {
            Map<String, Object> result = authService.login(dto);
            log.info("[Auth] 登录成功: username={}", dto.username());
            return result;
        } catch (Exception e) {
            log.warn("[Auth] 登录失败: username={}, reason={}", dto.username(), e.getMessage());
            throw e;
        }
    }

    /**
     * 获取当前登录用户的个人信息。
     */
    @GetMapping("/me")
    public Map<String, Object> me() {
        log.info("[Auth] 获取当前用户信息");
        return authService.me();
    }

    /**
     * 用户登出，将 JWT 加入 Redis 黑名单。
     */
    @PostMapping("/logout")
    public Map<String, Object> logout(@RequestHeader(value = "Authorization", required = false) String auth) {
        String token = token(auth);
        log.info("[Auth] 用户登出: token={}", token == null ? "null" : token.substring(0, Math.min(16, token.length())) + "...");
        authService.logout(token);
        log.info("[Auth] 登出完成");
        return Map.of("ok", true);
    }

    /**
     * 修改当前用户的个人资料（昵称、签名、地区、性别、头像）。
     */
    @PutMapping("/profile")
    public Map<String, Object> profile(@RequestBody AuthDtos.Profile dto) {
        log.info("[Auth] 更新个人资料: dto={}", dto);
        Map<String, Object> result = authService.updateProfile(dto);
        log.info("[Auth] 个人资料更新成功");
        return result;
    }

    /**
     * 修改当前用户的登录密码。
     */
    @PutMapping("/password")
    public Map<String, Object> password(@Valid @RequestBody AuthDtos.ChangePwd dto,
                                        @RequestHeader(value = "Authorization", required = false) String auth) {
        log.info("[Auth] 修改密码");
        authService.changePassword(dto, token(auth));
        log.info("[Auth] 密码修改成功");
        return Map.of("ok", true);
    }

    /**
     * 从 Authorization 头中获取 JWT。
     */
    private String token(String auth) {
        return auth != null && auth.startsWith("Bearer ") ? auth.substring(7) : null;
    }
}
