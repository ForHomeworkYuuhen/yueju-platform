package com.nghd.yueju;

import com.nghd.yueju.security.AuthUser;
import com.nghd.yueju.security.JwtUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JWT 签发与解析单元测试（纯逻辑，无需外部依赖）。
 */
class JwtUtilTest {

    private final JwtUtil jwt = new JwtUtil(
            "nanguo-hongdou-unit-test-secret-key-0123456789abcdef", 60);

    @Test
    void generateAndParse_roundTrip() {
        AuthUser u = new AuthUser("u_1", "liyuan", "梨园票友", "会员", 2);
        String token = jwt.generate(u);
        assertNotNull(token);
        AuthUser parsed = jwt.parse(token);
        assertEquals("u_1", parsed.id());
        assertEquals("liyuan", parsed.username());
        assertEquals("会员", parsed.role());
        assertFalse(parsed.isAdmin());
    }

    @Test
    void adminRole_recognized() {
        AuthUser admin = new AuthUser("u_admin", "admin", "管理员", "管理员", 0);
        assertTrue(jwt.parse(jwt.generate(admin)).isAdmin());
    }

    @Test
    void tamperedToken_rejected() {
        String token = jwt.generate(new AuthUser("u_1", "x", "x", "会员", 0));
        assertThrows(Exception.class, () -> jwt.parse(token + "tampered"));
    }
}
