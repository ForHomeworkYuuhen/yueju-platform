package com.nghd.yueju.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("history")
public class History {
    @TableId(type = IdType.INPUT)
    private String id;
    private String userId;
    private String type;
    private String targetId;
    private String title;
    private String time;
}
