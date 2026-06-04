package com.nghd.yueju.common.exception;

import lombok.Getter;

/**
 * 业务异常：携带 HTTP 状态码与提示信息，由全局处理器统一转换为 { "error": msg }。
 */
@Getter
public class BusinessException extends RuntimeException {
    private final int status;

    public BusinessException(int status, String message) {
        super(message);
        this.status = status;
    }

    public static BusinessException of(int status, String message) {
        return new BusinessException(status, message);
    }

    public static BusinessException badRequest(String message) {
        return new BusinessException(400, message);
    }

    public static BusinessException unauthorized(String message) {
        return new BusinessException(401, message);
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(404, message);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(409, message);
    }
}
