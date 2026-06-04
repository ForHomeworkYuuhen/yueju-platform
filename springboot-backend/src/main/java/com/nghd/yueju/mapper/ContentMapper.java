package com.nghd.yueju.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 内容资料读查询：返回原始行 Map，由 Service 做分类名映射 / JSON 展开等增强。
 */
@Mapper
public interface ContentMapper {

    @Select("SELECT * FROM category ORDER BY grp, sort")
    List<Map<String, Object>> categories();

    @Select("""
            <script>
            SELECT * FROM opera
            <where>
              <if test='genre != null'> AND genre = #{genre} </if>
              <if test='era != null'>   AND era = #{era} </if>
              <if test='troupe != null'>AND troupe = #{troupe} </if>
            </where>
            </script>
            """)
    List<Map<String, Object>> listOperas(@Param("genre") String genre,
                                         @Param("era") String era,
                                         @Param("troupe") String troupe);

    @Select("SELECT * FROM opera WHERE id = #{id}")
    Map<String, Object> getOpera(@Param("id") String id);

    @Select("SELECT opera_id AS operaId, COUNT(*) AS n FROM lyrics WHERE opera_id IS NOT NULL GROUP BY opera_id")
    List<Map<String, Object>> lyricsCountByOpera();

    @Select("""
            SELECT oa.role AS castRole, a.* FROM opera_artist oa
            JOIN artist a ON a.id = oa.artist_id WHERE oa.opera_id = #{operaId}
            """)
    List<Map<String, Object>> castOfOpera(@Param("operaId") String operaId);

    @Select("SELECT * FROM artist ORDER BY popularity DESC")
    List<Map<String, Object>> listArtists();

    @Select("SELECT * FROM artist WHERE id = #{id}")
    Map<String, Object> getArtist(@Param("id") String id);

    @Select("SELECT opera_id AS operaId, role FROM opera_artist WHERE artist_id = #{artistId}")
    List<Map<String, Object>> operasOfArtist(@Param("artistId") String artistId);

    @Select("""
            <script>
            SELECT * FROM media
            <where>
              <if test='type != null'> AND type = #{type} </if>
              <if test='opera != null'>AND opera_id = #{opera} </if>
            </where>
            </script>
            """)
    List<Map<String, Object>> listMedia(@Param("type") String type, @Param("opera") String opera);

    @Select("SELECT * FROM media WHERE id = #{id}")
    Map<String, Object> getMedia(@Param("id") String id);

    @Select("SELECT title FROM opera WHERE id = #{id}")
    String operaTitle(@Param("id") String id);

    @Select("SELECT id, opera_id, title, source, note FROM lyrics")
    List<Map<String, Object>> listLyrics();

    @Select("SELECT id, opera_id, title, source, note FROM lyrics WHERE id = #{id}")
    Map<String, Object> getLyrics(@Param("id") String id);

    @Select("SELECT id, title, note FROM lyrics WHERE opera_id = #{operaId}")
    List<Map<String, Object>> lyricsOfOpera(@Param("operaId") String operaId);

    @Select("SELECT text, yin, exp FROM lyric_line WHERE lyrics_id = #{lyricsId} ORDER BY idx")
    List<Map<String, Object>> lyricLines(@Param("lyricsId") String lyricsId);
}
