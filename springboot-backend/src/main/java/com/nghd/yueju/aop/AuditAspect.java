package com.nghd.yueju.aop;

import com.nghd.yueju.entity.AuditLog;
import com.nghd.yueju.mapper.AuditLogMapper;
import com.nghd.yueju.common.util.Ids;
import com.nghd.yueju.security.AuthUser;
import com.nghd.yueju.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 操作审计 AOP：对标注 @AuditLog 的方法在成功执行后落库（时间/用户/动作/IP）。
 */
@Aspect
@Component
public class AuditAspect {

    private final AuditLogMapper auditLogMapper;

    public AuditAspect(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    @Around("@annotation(auditLog)")
    public Object around(ProceedingJoinPoint pjp, com.nghd.yueju.aop.AuditLog auditLog) throws Throwable {
        Object result = pjp.proceed();
        try {
            AuthUser u = CurrentUser.get();
            AuditLog log = new AuditLog();
            log.setTime(Ids.now());
            log.setUserId(u != null ? u.id() : null);
            log.setUsername(u != null ? u.username() : null);
            log.setAction(auditLog.value());
            log.setIp(clientIp());
            auditLogMapper.insert(log);
        } catch (Exception ignored) {
            // 审计失败不影响主流程
        }
        return result;
    }

    private String clientIp() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes)
                    RequestContextHolder.currentRequestAttributes();
            HttpServletRequest req = attr.getRequest();
            String xf = req.getHeader("x-forwarded-for");
            if (xf != null && !xf.isBlank()) return xf.split(",")[0].trim();
            return req.getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }
}
