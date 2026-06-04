package com.nghd.yueju.common;

import lombok.Data;

/**
 * 统一响应封装。
 * 兼容前端既有契约：成功直接返回业务数据，失败返回 { "error": "..." } + 对应 HTTP 状态。
 */
@Data
public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public static <T> Result<T> ok(T data) {
        Result<T> r = new Result<>();
        r.code = 0;
        r.message = "ok";
        r.data = data;
        return r;
    }

    public static <T> Result<T> ok() {
        return ok(null);
    }
}
