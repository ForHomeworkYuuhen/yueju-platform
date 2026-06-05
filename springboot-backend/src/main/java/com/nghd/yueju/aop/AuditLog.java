package com.nghd.yueju.aop;

import java.lang.annotation.*;

/**
 * 标注需记录操作审计日志的方法。
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    String value();   // 操作类型，如 login / register / review_event
}
