package com.nghd.yueju.web;

import com.nghd.yueju.dto.AuthDtos;
import com.nghd.yueju.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody AuthDtos.Register dto) {
        return authService.register(dto);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody AuthDtos.Login dto) {
        return authService.login(dto);
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return authService.me();
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(@RequestHeader(value = "Authorization", required = false) String auth) {
        authService.logout(token(auth));
        return Map.of("ok", true);
    }

    @PutMapping("/profile")
    public Map<String, Object> profile(@RequestBody AuthDtos.Profile dto) {
        return authService.updateProfile(dto);
    }

    @PutMapping("/password")
    public Map<String, Object> password(@Valid @RequestBody AuthDtos.ChangePwd dto,
                                        @RequestHeader(value = "Authorization", required = false) String auth) {
        authService.changePassword(dto, token(auth));
        return Map.of("ok", true);
    }

    private String token(String auth) {
        return auth != null && auth.startsWith("Bearer ") ? auth.substring(7) : null;
    }
}
