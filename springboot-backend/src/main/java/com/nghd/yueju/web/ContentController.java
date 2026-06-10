package com.nghd.yueju.web;

import com.nghd.yueju.service.ContentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 内容数据接口：剧种/剧目/演员/影音/唱词查询（全部公开，无需认证）。
 */
@RestController
@RequestMapping("/api")
public class ContentController {

    private static final Logger log = LoggerFactory.getLogger(ContentController.class);

    private final ContentService content;

    public ContentController(ContentService content) {
        this.content = content;
    }

    /**
     * 获取全部分类维度（行当/题材/年代/流派）的下拉选项。
     */
    @GetMapping("/categories")
    public Map<String, List<Map<String, Object>>> categories() {
        log.info("[Content] 查询全部分类维度");
        return content.categories();
    }

    /**
     * 条件查询剧目列表，支持按分类/关键词/排序/学唱状态过滤。
     */
    @GetMapping("/operas")
    public List<Map<String, Object>> operas(@RequestParam(required = false) String genre,
                                            @RequestParam(required = false) String era,
                                            @RequestParam(required = false) String troupe,
                                            @RequestParam(required = false) String role,
                                            @RequestParam(required = false) String kw,
                                            @RequestParam(required = false) String sort,
                                            @RequestParam(required = false) String learn) {
        log.info("[Content] 查询剧目列表: genre={}, era={}, troupe={}, role={}, kw={}, sort={}, learn={}",
                genre, era, troupe, role, kw, sort, learn);
        return content.listOperas(genre, era, troupe, role, kw, sort, learn);
    }

    /**
     * 根据 ID 获取单个剧目详情。
     */
    @GetMapping("/operas/{id}")
    public Map<String, Object> opera(@PathVariable String id) {
        log.info("[Content] 查询剧目详情: id={}", id);
        return content.getOpera(id);
    }

    /**
     * 获取全部演员列表。
     */
    @GetMapping("/artists")
    public List<Map<String, Object>> artists() {
        log.info("[Content] 查询全部演员列表");
        return content.listArtists();
    }

    /**
     * 根据 ID 获取单个演员详情。
     */
    @GetMapping("/artists/{id}")
    public Map<String, Object> artist(@PathVariable String id) {
        log.info("[Content] 查询演员详情: id={}", id);
        return content.getArtist(id);
    }

    /**
     * 查询影音资料，支持按类型/关联剧目/关键词过滤。
     */
    @GetMapping("/media")
    public List<Map<String, Object>> media(@RequestParam(required = false) String type,
                                           @RequestParam(required = false) String opera,
                                           @RequestParam(required = false) String kw) {
        log.info("[Content] 查询影音资料: type={}, opera={}, kw={}", type, opera, kw);
        return content.listMedia(type, opera, kw);
    }

    /**
     * 根据 ID 获取单个影音详情。
     */
    @GetMapping("/media/{id}")
    public Map<String, Object> mediaOne(@PathVariable String id) {
        log.info("[Content] 查询影音详情: id={}", id);
        return content.getMedia(id);
    }

    /**
     * 获取全部唱词列表。
     */
    @GetMapping("/lyrics")
    public List<Map<String, Object>> lyrics() {
        log.info("[Content] 查询全部唱词列表");
        return content.listLyrics();
    }

    /**
     * 根据 ID 获取单个唱词详情。
     */
    @GetMapping("/lyrics/{id}")
    public Map<String, Object> lyric(@PathVariable String id) {
        log.info("[Content] 查询唱词详情: id={}", id);
        return content.getLyrics(id);
    }
}
