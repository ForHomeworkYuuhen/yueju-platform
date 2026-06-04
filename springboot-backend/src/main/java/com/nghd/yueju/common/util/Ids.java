package com.nghd.yueju.common.util;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * ID 与时间工具。
 */
public final class Ids {
    private Ids() {}

    private static final SecureRandom RND = new SecureRandom();
    private static final char[] HEX = "0123456789abcdef".toCharArray();
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** 形如 prefix_lq3k2a + 4 位十六进制，兼容原 Node 端 id 风格 */
    public static String uid(String prefix) {
        long t = System.currentTimeMillis();
        StringBuilder sb = new StringBuilder(prefix).append('_')
                .append(Long.toString(t, 36));
        for (int i = 0; i < 4; i++) sb.append(HEX[RND.nextInt(16)]);
        return sb.toString();
    }

    public static String now() {
        return LocalDateTime.now().format(FMT);
    }
}
