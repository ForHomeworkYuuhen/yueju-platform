package com.nghd.yueju.common.xss;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.web.util.HtmlUtils;

/**
 * 对查询/表单参数做 HTML 转义，缓解反射型 XSS。
 */
public class XssRequestWrapper extends HttpServletRequestWrapper {
    public XssRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getParameter(String name) {
        return clean(super.getParameter(name));
    }

    @Override
    public String[] getParameterValues(String name) {
        String[] vs = super.getParameterValues(name);
        if (vs == null) return null;
        String[] out = new String[vs.length];
        for (int i = 0; i < vs.length; i++) out[i] = clean(vs[i]);
        return out;
    }

    private String clean(String v) {
        return v == null ? null : HtmlUtils.htmlEscape(v);
    }
}
