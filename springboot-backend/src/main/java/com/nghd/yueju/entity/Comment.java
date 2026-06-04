package com.nghd.yueju.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("comment")
public class Comment {
    @TableId(type = IdType.INPUT)
    private String id;
    private String userId;
    private String nickname;
    private Integer avatarSeed;
    private String type;
    private String targetId;
    private String content;
    private Integer rating;
    private Integer likes;
    private String created;
}
