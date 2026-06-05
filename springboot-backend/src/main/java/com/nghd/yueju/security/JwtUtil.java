package com.nghd.yueju.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 签发与解析（HS256）。
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expireMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expire-minutes:10080}") long expireMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expireMs = expireMinutes * 60_000L;
    }

    public long getExpireMs() {
        return expireMs;
    }

    public String generate(AuthUser u) {
        Date now = new Date();
        return Jwts.builder()
                .subject(u.id())
                .claim("username", u.username())
                .claim("nickname", u.nickname())
                .claim("role", u.role())
                .claim("avatarSeed", u.avatarSeed())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expireMs))
                .signWith(key)
                .compact();
    }

    public AuthUser parse(String token) {
        Claims c = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        Integer seed = c.get("avatarSeed", Integer.class);
        return new AuthUser(c.getSubject(), c.get("username", String.class),
                c.get("nickname", String.class), c.get("role", String.class), seed);
    }
}
