package com.nghd.yueju.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nghd.yueju.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
