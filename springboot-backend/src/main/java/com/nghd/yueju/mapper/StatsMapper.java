package com.nghd.yueju.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 热度分析聚合：复合热度指数 = SUM((现场观众 + 0.15×线上播放) × 年份权重)，
 * 年份权重 0.55→1.0 线性递增（a=最小年, span=年份跨度）。
 */
@Mapper
public interface StatsMapper {

    @Select("SELECT MIN(year) AS a, MAX(year) AS b FROM performance")
    Map<String, Object> yearRange();

    @Select("""
            <script>
            SELECT g.name AS name, g.lng AS lng, g.lat AS lat, g.is_core AS is_core,
                   COUNT(p.id) AS shows,
                   COALESCE(SUM(p.audience),0) AS audience,
                   COALESCE(SUM(p.online_play),0) AS online,
                   COALESCE(ROUND(SUM((p.audience + p.online_play*0.15) *
                     (0.55 + 0.45*(p.year - #{a})/#{span}))),0) AS heat
            FROM region_geo g
            LEFT JOIN performance p ON p.region = g.name
              <if test='from != null'> AND p.year &gt;= #{from} </if>
              <if test='to != null'>   AND p.year &lt;= #{to} </if>
              <if test='channel != null'> AND p.channel = #{channel} </if>
            WHERE g.province = '广东'
            GROUP BY g.name, g.lng, g.lat, g.is_core
            ORDER BY heat DESC
            </script>
            """)
    List<Map<String, Object>> heatByCity(@Param("from") Integer from, @Param("to") Integer to,
                                         @Param("channel") String channel,
                                         @Param("a") int a, @Param("span") int span);

    @Select("""
            <script>
            SELECT p.province AS name, COUNT(p.id) AS shows,
                   COALESCE(SUM(p.audience),0) AS audience,
                   COALESCE(SUM(p.online_play),0) AS online,
                   COALESCE(ROUND(SUM((p.audience + p.online_play*0.15) *
                     (0.55 + 0.45*(p.year - #{a})/#{span}))),0) AS heat
            FROM performance p
            WHERE p.province &lt;&gt; '海外'
              <if test='from != null'> AND p.year &gt;= #{from} </if>
              <if test='to != null'>   AND p.year &lt;= #{to} </if>
              <if test='channel != null'> AND p.channel = #{channel} </if>
            GROUP BY p.province ORDER BY heat DESC
            </script>
            """)
    List<Map<String, Object>> heatByProvince(@Param("from") Integer from, @Param("to") Integer to,
                                             @Param("channel") String channel,
                                             @Param("a") int a, @Param("span") int span);

    @Select("""
            <script>
            SELECT g.name AS name, g.lng AS lng, g.lat AS lat, g.province AS province,
                   CASE WHEN g.code IN ('sgp','kl','sf','van','syd') THEN 1 ELSE 0 END AS overseas,
                   COUNT(p.id) AS shows,
                   COALESCE(SUM(p.audience),0) AS audience,
                   COALESCE(SUM(p.online_play),0) AS online,
                   COALESCE(ROUND(SUM((p.audience + p.online_play*0.15) *
                     (0.55 + 0.45*(p.year - #{a})/#{span}))),0) AS heat
            FROM region_geo g
            LEFT JOIN performance p ON p.region = g.name
              <if test='from != null'> AND p.year &gt;= #{from} </if>
              <if test='to != null'>   AND p.year &lt;= #{to} </if>
              <if test='channel != null'> AND p.channel = #{channel} </if>
            GROUP BY g.name, g.lng, g.lat, g.province, g.code
            ORDER BY heat DESC
            </script>
            """)
    List<Map<String, Object>> heatPoints(@Param("from") Integer from, @Param("to") Integer to,
                                         @Param("channel") String channel,
                                         @Param("a") int a, @Param("span") int span);

    @Select("""
            <script>
            SELECT year, COUNT(id) AS shows,
                   COALESCE(SUM(audience),0) AS audience, COALESCE(SUM(online_play),0) AS online
            FROM performance
            <where> <if test='channel != null'> channel = #{channel} </if> </where>
            GROUP BY year ORDER BY year
            </script>
            """)
    List<Map<String, Object>> perfByYear(@Param("channel") String channel);

    @Select("""
            <script>
            SELECT channel, COUNT(id) AS shows,
                   COALESCE(SUM(audience),0) AS audience, COALESCE(SUM(online_play),0) AS online
            FROM performance
            <where>
              <if test='from != null'> AND year &gt;= #{from} </if>
              <if test='to != null'>   AND year &lt;= #{to} </if>
            </where>
            GROUP BY channel ORDER BY shows DESC
            </script>
            """)
    List<Map<String, Object>> perfByChannel(@Param("from") Integer from, @Param("to") Integer to);

    @Select("""
            <script>
            SELECT p.opera_title AS title, p.opera_id AS id, COUNT(p.id) AS shows,
                   COALESCE(ROUND(SUM((p.audience + p.online_play*0.15) *
                     (0.55 + 0.45*(p.year - #{a})/#{span}))),0) AS heat
            FROM performance p WHERE p.opera_id IS NOT NULL
              <if test='from != null'> AND p.year &gt;= #{from} </if>
              <if test='to != null'>   AND p.year &lt;= #{to} </if>
              <if test='channel != null'> AND p.channel = #{channel} </if>
            GROUP BY p.opera_id, p.opera_title ORDER BY heat DESC LIMIT #{limit}
            </script>
            """)
    List<Map<String, Object>> topOperasByHeat(@Param("from") Integer from, @Param("to") Integer to,
                                              @Param("channel") String channel,
                                              @Param("a") int a, @Param("span") int span,
                                              @Param("limit") int limit);

    @Select("""
            <script>
            SELECT COUNT(id) AS shows,
                   COALESCE(SUM(audience),0) AS audience, COALESCE(SUM(online_play),0) AS online,
                   COALESCE(ROUND(SUM((audience + online_play*0.15) *
                     (0.55 + 0.45*(year - #{a})/#{span}))),0) AS heat,
                   COUNT(DISTINCT region) AS regions, MIN(year) AS minY, MAX(year) AS maxY
            FROM performance
            <where>
              <if test='from != null'> AND year &gt;= #{from} </if>
              <if test='to != null'>   AND year &lt;= #{to} </if>
              <if test='channel != null'> AND channel = #{channel} </if>
            </where>
            </script>
            """)
    Map<String, Object> heatOverview(@Param("from") Integer from, @Param("to") Integer to,
                                     @Param("channel") String channel,
                                     @Param("a") int a, @Param("span") int span);
}
