package com.nghd.yueju;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 接口集成测试（MockMvc，连真实 MySQL/Redis）。
 * 覆盖：登录鉴权、内容查询、RBAC 权限隔离、参数校验、防用户名枚举。
 */
@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired
    MockMvc mvc;
    private final ObjectMapper om = new ObjectMapper();

    private String login(String u, String p) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + u + "\",\"password\":\"" + p + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        JsonNode n = om.readTree(body);
        return n.get("token").asText();
    }

    @Test
    void login_success_returnsToken() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.role").value("管理员"));
    }

    @Test
    void login_wrongPassword_unified401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("账号或密码错误"));
    }

    @Test
    void login_nonexistentUser_sameMessage_antiEnumeration() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"no_such_user_zzz\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("账号或密码错误"));
    }

    @Test
    void register_shortPassword_rejected() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"t" + UUID.randomUUID() + "\",\"password\":\"12\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("密码至少 6 位"));
    }

    @Test
    void register_then_token() throws Exception {
        String uname = "u" + UUID.randomUUID().toString().substring(0, 8);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + uname + "\",\"password\":\"abc123\",\"nickname\":\"测试\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void operas_publicList_hasEnrichedFields() throws Exception {
        mvc.perform(get("/api/operas").param("sort", "popularity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").exists())
                .andExpect(jsonPath("$[0].genreName").exists())
                .andExpect(jsonPath("$[0].rolesText").exists());
    }

    @Test
    void adminApi_noToken_401() throws Exception {
        mvc.perform(get("/api/admin/overview"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminApi_memberToken_403() throws Exception {
        String token = login("liyuan", "123456");
        mvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminApi_adminToken_200() throws Exception {
        String token = login("admin", "123456");
        mvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.operas").exists())
                .andExpect(jsonPath("$.samples").exists());
    }

    @Test
    void heatStats_returnsAggregation() throws Exception {
        mvc.perform(get("/api/stats/heat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cities").isArray())
                .andExpect(jsonPath("$.overview.heat").exists());
    }
}
