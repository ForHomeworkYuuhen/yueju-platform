package com.nghd.yueju.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nghd.yueju.common.exception.BusinessException;
import com.nghd.yueju.mapper.ContentMapper;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 内容资料服务：剧目 / 名家 / 媒体 / 戏词，含分类名映射、JSON 展开、关联关系，
 * 复刻原 Node repo.js 的 JSON 输出契约。
 */
@Service
public class ContentService {

    private final ContentMapper mapper;
    private final CategoryService category;
    private final ObjectMapper json = new ObjectMapper();

    public ContentService(ContentMapper mapper, CategoryService category) {
        this.mapper = mapper;
        this.category = category;
    }

    /* ---------------- 剧目 ---------------- */
    @SuppressWarnings("unchecked")
    private List<String> parseArr(Object v) {
        if (v == null) return new ArrayList<>();
        try {
            return json.readValue(String.valueOf(v), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private Map<String, Object> mapOpera(Map<String, Object> o) {
        if (o == null) return null;
        List<String> roles = parseArr(o.get("roles"));
        List<String> famous = parseArr(o.get("famous"));
        o.put("roles", roles);
        o.put("famous", famous);
        o.put("genreName", category.name(str(o.get("genre"))));
        o.put("troupeName", category.name(str(o.get("troupe"))));
        o.put("eraName", category.name(str(o.get("era"))));
        o.put("rolesText", roles.stream().map(category::name).collect(Collectors.joining(" · ")));
        return o;
    }

    public List<Map<String, Object>> listOperas(String genre, String era, String troupe,
                                                String role, String kw, String sort, String learn) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map<String, Object> o : mapper.listOperas(genre, era, troupe)) rows.add(mapOpera(o));

        if (role != null && !role.isBlank()) {
            rows = rows.stream().filter(o -> ((List<?>) o.get("roles")).contains(role))
                    .collect(Collectors.toList());
        }
        if (kw != null && !kw.isBlank()) {
            String k = kw.toLowerCase();
            rows = rows.stream().filter(o -> {
                String hay = (str(o.get("title")) + str(o.get("alias")) + str(o.get("playwright"))
                        + str(o.get("summary")) + String.join("", (List<String>) o.get("famous"))).toLowerCase();
                return hay.contains(k);
            }).collect(Collectors.toList());
        }

        Map<String, Long> lc = new HashMap<>();
        for (Map<String, Object> r : mapper.lyricsCountByOpera()) {
            lc.put(str(r.get("operaId")), ((Number) r.get("n")).longValue());
        }
        for (Map<String, Object> o : rows) {
            long n = lc.getOrDefault(str(o.get("id")), 0L);
            o.put("lyricsCount", n);
            o.put("hasLyrics", n > 0);
        }
        if ("1".equals(learn) || "true".equals(learn)) {
            rows = rows.stream().filter(o -> (boolean) o.get("hasLyrics")).collect(Collectors.toList());
        }

        boolean byPremiere = "premiere".equals(sort);
        rows.sort((a, b) -> byPremiere
                ? num(a.get("premiere")) - num(b.get("premiere"))
                : num(b.get("popularity")) - num(a.get("popularity")));
        return rows;
    }

    public Map<String, Object> getOpera(String id) {
        Map<String, Object> o = mapOpera(mapper.getOpera(id));
        if (o == null) throw BusinessException.notFound("剧目不存在");
        o.put("cast", castOfOpera(id));
        o.put("media", listMedia(null, id, null));
        List<Map<String, Object>> lyrics = mapper.lyricsOfOpera(id);
        o.put("lyrics", lyrics);
        o.put("lyricsCount", lyrics.size());
        o.put("hasLyrics", !lyrics.isEmpty());
        return o;
    }

    public List<Map<String, Object>> castOfOpera(String operaId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : mapper.castOfOpera(operaId)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("role", r.remove("castRole"));
            item.put("artist", mapArtist(r));
            out.add(item);
        }
        return out;
    }

    /* ---------------- 名家 ---------------- */
    private Map<String, Object> mapArtist(Map<String, Object> a) {
        if (a == null) return null;
        a.put("roleName", category.name(str(a.get("role"))));
        a.put("schoolName", category.name(str(a.get("school"))));
        return a;
    }

    public List<Map<String, Object>> listArtists() {
        return mapper.listArtists().stream().map(this::mapArtist).collect(Collectors.toList());
    }

    public Map<String, Object> getArtist(String id) {
        Map<String, Object> a = mapArtist(mapper.getArtist(id));
        if (a == null) throw BusinessException.notFound("名家不存在");
        List<Map<String, Object>> works = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (Map<String, Object> x : mapper.operasOfArtist(id)) {
            String oid = str(x.get("operaId"));
            if (oid == null || !seen.add(oid)) continue;
            Map<String, Object> o = mapOpera(mapper.getOpera(oid));
            if (o != null) {
                o.put("playedRole", x.get("role"));
                works.add(o);
            }
        }
        a.put("works", works);
        return a;
    }

    /* ---------------- 媒体 ---------------- */
    private Map<String, Object> mapMedia(Map<String, Object> m) {
        if (m == null) return null;
        String operaId = str(m.get("opera_id"));
        m.put("opera", operaId);
        m.put("artist", m.get("artist_id"));
        m.put("operaTitle", operaId != null ? mapper.operaTitle(operaId) : "");
        return m;
    }

    public List<Map<String, Object>> listMedia(String type, String opera, String kw) {
        List<Map<String, Object>> rows = mapper.listMedia(type, opera).stream()
                .map(this::mapMedia).collect(Collectors.toList());
        if (kw != null && !kw.isBlank()) {
            String k = kw.toLowerCase();
            rows = rows.stream().filter(m -> (str(m.get("title")) + str(m.get("performer"))
                    + str(m.get("intro"))).toLowerCase().contains(k)).collect(Collectors.toList());
        }
        return rows;
    }

    public Map<String, Object> getMedia(String id) {
        Map<String, Object> m = mapMedia(mapper.getMedia(id));
        if (m == null) throw BusinessException.notFound("资源不存在");
        return m;
    }

    /* ---------------- 戏词 ---------------- */
    public List<Map<String, Object>> listLyrics() {
        List<Map<String, Object>> rows = mapper.listLyrics();
        for (Map<String, Object> l : rows) l.put("opera", l.get("opera_id"));
        return rows;
    }

    public Map<String, Object> getLyrics(String id) {
        Map<String, Object> l = mapper.getLyrics(id);
        if (l == null) throw BusinessException.notFound("戏词不存在");
        l.put("opera", l.get("opera_id"));
        l.put("lines", mapper.lyricLines(id));
        return l;
    }

    public Map<String, List<Map<String, Object>>> categories() {
        return category.grouped();
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static int num(Object o) {
        return o == null ? 0 : ((Number) o).intValue();
    }
}
