package com.nghd.yueju.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.Map;

/**
 * 管理后台总览统计（KPI）。
 */
@Mapper
public interface AdminMapper {
    @Select("""
            SELECT
              (SELECT COUNT(*) FROM opera)        AS operas,
              (SELECT COUNT(*) FROM artist)       AS artists,
              (SELECT COUNT(*) FROM media)        AS media,
              (SELECT COUNT(*) FROM lyrics)       AS lyrics,
              (SELECT COUNT(*) FROM user)         AS users,
              (SELECT COUNT(*) FROM comment)      AS comments,
              (SELECT COUNT(*) FROM favorite)     AS favorites,
              (SELECT COUNT(*) FROM performance)  AS samples,
              (SELECT COUNT(*) FROM show_event)   AS events,
              (SELECT COUNT(*) FROM show_event WHERE status='pending')  AS pending,
              (SELECT COUNT(*) FROM show_event WHERE status='approved') AS approved,
              (SELECT COUNT(*) FROM show_event WHERE status='rejected') AS rejected,
              (SELECT COUNT(*) FROM show_signup)  AS signups
            """)
    Map<String, Object> overview();
}
