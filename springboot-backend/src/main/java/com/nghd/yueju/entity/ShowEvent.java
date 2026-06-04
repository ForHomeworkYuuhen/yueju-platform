package com.nghd.yueju.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("show_event")
public class ShowEvent {
    @TableId(type = IdType.INPUT)
    private String id;
    private String title;
    private String operaId;
    private String operaTitle;
    private String troupe;
    private String city;
    private String venue;
    private String address;
    private String date;
    private String time;
    private String price;
    private Integer capacity;
    private Integer posterSeed;
    private String intro;
    private String contact;
    private String applicantId;
    private String applicantName;
    private String status;
    private String reviewNote;
    private String created;
    private String reviewedAt;
}
