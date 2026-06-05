package com.nghd.yueju.web;

import com.nghd.yueju.service.ContentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ContentController {

    private final ContentService content;

    public ContentController(ContentService content) {
        this.content = content;
    }

    @GetMapping("/categories")
    public Map<String, List<Map<String, Object>>> categories() {
        return content.categories();
    }

    @GetMapping("/operas")
    public List<Map<String, Object>> operas(@RequestParam(required = false) String genre,
                                            @RequestParam(required = false) String era,
                                            @RequestParam(required = false) String troupe,
                                            @RequestParam(required = false) String role,
                                            @RequestParam(required = false) String kw,
                                            @RequestParam(required = false) String sort,
                                            @RequestParam(required = false) String learn) {
        return content.listOperas(genre, era, troupe, role, kw, sort, learn);
    }

    @GetMapping("/operas/{id}")
    public Map<String, Object> opera(@PathVariable String id) {
        return content.getOpera(id);
    }

    @GetMapping("/artists")
    public List<Map<String, Object>> artists() {
        return content.listArtists();
    }

    @GetMapping("/artists/{id}")
    public Map<String, Object> artist(@PathVariable String id) {
        return content.getArtist(id);
    }

    @GetMapping("/media")
    public List<Map<String, Object>> media(@RequestParam(required = false) String type,
                                           @RequestParam(required = false) String opera,
                                           @RequestParam(required = false) String kw) {
        return content.listMedia(type, opera, kw);
    }

    @GetMapping("/media/{id}")
    public Map<String, Object> mediaOne(@PathVariable String id) {
        return content.getMedia(id);
    }

    @GetMapping("/lyrics")
    public List<Map<String, Object>> lyrics() {
        return content.listLyrics();
    }

    @GetMapping("/lyrics/{id}")
    public Map<String, Object> lyric(@PathVariable String id) {
        return content.getLyrics(id);
    }
}
