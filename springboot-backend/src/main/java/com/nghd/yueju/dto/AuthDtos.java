package com.nghd.yueju.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 账号相关入参 DTO（含 JSR-303 校验）。
 */
public class AuthDtos {

    public record Login(
            @NotBlank(message = "账号和密码不能为空") String username,
            @NotBlank(message = "账号和密码不能为空") String password) {}

    public record Register(
            @NotBlank(message = "账号和密码不能为空") String username,
            @NotBlank(message = "账号和密码不能为空")
            @Size(min = 6, message = "密码至少 6 位") String password,
            String nickname) {}

    public record Profile(String nickname, String signature, String region,
                          String gender, Integer avatarSeed) {}

    public record ChangePwd(
            @NotBlank(message = "原密码不能为空") String oldPwd,
            @NotBlank(message = "新密码不能为空")
            @Size(min = 6, message = "新密码至少 6 位") String newPwd) {}
}
