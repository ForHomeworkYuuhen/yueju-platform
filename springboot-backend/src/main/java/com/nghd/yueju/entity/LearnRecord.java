package com.nghd.yueju.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("learn_record")
public class LearnRecord {
    @TableId(type = IdType.INPUT)
    private String id;
    private String userId;
    private String lyricsId;
    private Integer progress;
    private String last;
}
