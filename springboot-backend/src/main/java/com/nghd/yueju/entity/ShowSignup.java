package com.nghd.yueju.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("show_signup")
public class ShowSignup {
    @TableId(type = IdType.INPUT)
    private String id;
    private String eventId;
    private String userId;
    private String name;
    private String phone;
    private Integer num;
    private String note;
    private String created;
}
