package com.nghd.yueju.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nghd.yueju.entity.ShowSignup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

@Mapper
public interface ShowSignupMapper extends BaseMapper<ShowSignup> {

    @Select("SELECT COUNT(*) AS records, COALESCE(SUM(num),0) AS people FROM show_signup WHERE event_id = #{eventId}")
    Map<String, Object> statByEvent(@Param("eventId") String eventId);

    @Select("""
            SELECT s.*, e.title AS event_title, e.date AS event_date, e.time AS event_time,
                   e.venue AS event_venue, e.city AS event_city, e.status AS event_status
            FROM show_signup s JOIN show_event e ON e.id = s.event_id
            WHERE s.user_id = #{userId} ORDER BY s.created DESC
            """)
    List<Map<String, Object>> mySignups(@Param("userId") String userId);
}
