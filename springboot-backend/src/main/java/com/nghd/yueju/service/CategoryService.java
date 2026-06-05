package com.nghd.yueju.service;

import com.nghd.yueju.mapper.ContentMapper;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 分类（行当/题材/年代/流派）缓存与分组。
 */
@Service
public class CategoryService {

    private final ContentMapper mapper;
    private volatile Map<String, String> nameCache;

    public CategoryService(ContentMapper mapper) {
        this.mapper = mapper;
    }

    private Map<String, String> cache() {
        if (nameCache == null) {
            synchronized (this) {
                if (nameCache == null) {
                    Map<String, String> m = new HashMap<>();
                    for (Map<String, Object> c : mapper.categories()) {
                        m.put(str(c.get("id")), str(c.get("name")));
                    }
                    nameCache = m;
                }
            }
        }
        return nameCache;
    }

    public String name(String id) {
        if (id == null) return null;
        return cache().getOrDefault(id, id);
    }

    /** 按 grp 分组：{ grp: [ {id,name,desc} ] } */
    public Map<String, List<Map<String, Object>>> grouped() {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        for (Map<String, Object> c : mapper.categories()) {
            String grp = str(c.get("grp"));
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.get("id"));
            item.put("name", c.get("name"));
            item.put("desc", c.get("descr"));
            result.computeIfAbsent(grp, k -> new ArrayList<>()).add(item);
        }
        return result;
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }
}
