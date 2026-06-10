package com.nghd.yueju.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nghd.yueju.common.exception.BusinessException;
import com.nghd.yueju.common.util.Ids;
import com.nghd.yueju.dto.AuthDtos;
import com.nghd.yueju.entity.AuditLog;
import com.nghd.yueju.entity.User;
import com.nghd.yueju.mapper.AuditLogMapper;
import com.nghd.yueju.mapper.UserMapper;
import com.nghd.yueju.security.AuthUser;
import com.nghd.yueju.security.CurrentUser;
import com.nghd.yueju.security.JwtAuthFilter;
import com.nghd.yueju.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 账号服务：注册 / 登录 / 资料 / 改密，含 BCrypt、JWT、登录限流、操作审计。
 */
@Service
public class AuthService {

    private static final int MAX_FAIL = 5;
    private static final long WINDOW_SEC = 600;

    private final UserMapper userMapper;
    private final AuditLogMapper auditLogMapper;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, Object> redis;
    private final ObjectMapper objectMapper;

    public AuthService(UserMapper userMapper, AuditLogMapper auditLogMapper, PasswordEncoder encoder,
                       JwtUtil jwtUtil, RedisTemplate<String, Object> redis, ObjectMapper objectMapper) {
        this.userMapper = userMapper;
        this.auditLogMapper = auditLogMapper;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    private User findByUsername(String username) {
        return userMapper.selectOne(new QueryWrapper<User>().eq("username", username));
    }

    public Map<String, Object> register(AuthDtos.Register dto) {
        if (findByUsername(dto.username()) != null) {
            throw BusinessException.conflict("该账号已被注册");
        }
        User u = new User();
        u.setId(Ids.uid("u"));
        u.setUsername(dto.username());
        u.setPassword(encoder.encode(dto.password()));
        u.setNickname(dto.nickname() != null && !dto.nickname().isBlank() ? dto.nickname() : dto.username());
        u.setSignature("初入梨园，愿与君共赏南国红豆。");
        u.setGender("保密");
        u.setRegion("岭南");
        u.setRole("会员");
        u.setAvatarSeed((int) (Math.random() * 6));
        u.setCreated(Ids.now());
        userMapper.insert(u);
        audit(u.getId(), u.getUsername(), "register");
        return tokenResult(u);
    }

    public Map<String, Object> login(AuthDtos.Login dto) {
        String key = "login:fail:" + dto.username().toLowerCase();
        Object cnt = redis.opsForValue().get(key);
        if (cnt != null && Integer.parseInt(cnt.toString()) >= MAX_FAIL) {
            throw BusinessException.of(429, "尝试过于频繁，请稍后再试");
        }
        User u = findByUsername(dto.username());
        if (u == null || !encoder.matches(dto.password(), u.getPassword())) {
            Long c = redis.opsForValue().increment(key);
            if (c != null && c == 1L) redis.expire(key, WINDOW_SEC, TimeUnit.SECONDS);
            throw BusinessException.unauthorized("账号或密码错误");
        }
        redis.delete(key);
        audit(u.getId(), u.getUsername(), "login");
        return tokenResult(u);
    }

    public Map<String, Object> me() {
        AuthUser au = CurrentUser.require();
        User u = userMapper.selectById(au.id());
        if (u == null) throw BusinessException.unauthorized("请先登录");
        return publicUser(u);
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            redis.opsForValue().set(JwtAuthFilter.BLACKLIST_PREFIX + token, "1",
                    jwtUtil.getExpireMs(), TimeUnit.MILLISECONDS);
        }
    }

    public Map<String, Object> updateProfile(AuthDtos.Profile dto) {
        AuthUser au = CurrentUser.require();
        User u = userMapper.selectById(au.id());
        if (u == null) throw BusinessException.unauthorized("请先登录");
        if (dto.nickname() != null) u.setNickname(dto.nickname());
        if (dto.signature() != null) u.setSignature(dto.signature());
        if (dto.region() != null) u.setRegion(dto.region());
        if (dto.gender() != null) u.setGender(dto.gender());
        if (dto.avatarSeed() != null && dto.avatarSeed() >= 0 && dto.avatarSeed() <= 5) {
            u.setAvatarSeed(dto.avatarSeed());
        }
        userMapper.updateById(u);
        return publicUser(u);
    }

    public void changePassword(AuthDtos.ChangePwd dto, String currentToken) {
        AuthUser au = CurrentUser.require();
        User u = userMapper.selectById(au.id());
        if (u == null || !encoder.matches(dto.oldPwd(), u.getPassword())) {
            throw BusinessException.badRequest("原密码不正确");
        }
        u.setPassword(encoder.encode(dto.newPwd()));
        userMapper.updateById(u);
        audit(u.getId(), u.getUsername(), "change_password");
        // 当前令牌仍有效，其余设备需重新登录（此处简化：仅记录，JWT 无状态）
    }

    private Map<String, Object> tokenResult(User u) {
        AuthUser au = new AuthUser(u.getId(), u.getUsername(), u.getNickname(), u.getRole(), u.getAvatarSeed());
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("token", jwtUtil.generate(au));
        r.put("user", publicUser(u));
        return r;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> publicUser(User u) {
        Map<String, Object> m = objectMapper.convertValue(u, Map.class);
        m.remove("password");
        return m;
    }

    private void audit(String userId, String username, String action) {
        try {
            AuditLog log = new AuditLog();
            log.setTime(Ids.now());
            log.setUserId(userId);
            log.setUsername(username);
            log.setAction(action);
            auditLogMapper.insert(log);
            System.out.println("=== 审计日志写入成功：action=" + action + ", username=" + username);
        } catch (Exception e) {
            System.err.println("=== 审计日志写入失败：action=" + action + ", error=" + e.getMessage());
            e.printStackTrace();
        }
    }
}
