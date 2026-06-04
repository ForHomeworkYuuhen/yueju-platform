package com.nghd.yueju.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.INPUT)
    private String id;
    private String username;
    private String password;
    private String nickname;
    private String signature;
    private String gender;
    private String region;
    private String role;
    private Integer avatarSeed;
    private String created;
}
