SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id` VARCHAR(64),
  `grp` VARCHAR(255),
  `name` VARCHAR(255),
  `descr` TEXT,
  `sort` INT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `opera`;
CREATE TABLE `opera` (
  `id` VARCHAR(64),
  `title` VARCHAR(255),
  `alias` VARCHAR(255),
  `era` VARCHAR(255),
  `genre` VARCHAR(255),
  `troupe` VARCHAR(255),
  `roles` TEXT,
  `premiere` INT,
  `playwright` VARCHAR(255),
  `region` VARCHAR(255),
  `duration` VARCHAR(255),
  `popularity` INT,
  `palette` INT,
  `famous` TEXT,
  `summary` TEXT,
  `highlight` TEXT,
  PRIMARY KEY (`id`),
  KEY `idx_opera_genre` (`genre`),
  KEY `idx_opera_troupe` (`troupe`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `artist`;
CREATE TABLE `artist` (
  `id` VARCHAR(64),
  `name` VARCHAR(255),
  `gender` VARCHAR(255),
  `birth` INT,
  `death` INT,
  `role` VARCHAR(255),
  `school` VARCHAR(255),
  `region` VARCHAR(255),
  `palette` INT,
  `popularity` INT,
  `title` VARCHAR(255),
  `bio` TEXT,
  `achievement` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `opera_artist`;
CREATE TABLE `opera_artist` (
  `opera_id` VARCHAR(64),
  `artist_id` VARCHAR(64),
  `role` VARCHAR(255),
  PRIMARY KEY (`opera_id`,`artist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `media`;
CREATE TABLE `media` (
  `id` VARCHAR(64),
  `opera_id` VARCHAR(64),
  `artist_id` VARCHAR(64),
  `type` VARCHAR(255),
  `title` VARCHAR(255),
  `performer` VARCHAR(255),
  `duration` VARCHAR(255),
  `year` INT,
  `plays` INT,
  `img` TEXT,
  `source` TEXT,
  `intro` TEXT,
  `audio_url` TEXT,
  `embed_url` TEXT,
  `src_note` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lyrics`;
CREATE TABLE `lyrics` (
  `id` VARCHAR(64),
  `opera_id` VARCHAR(64),
  `title` VARCHAR(255),
  `source` TEXT,
  `note` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lyric_line`;
CREATE TABLE `lyric_line` (
  `lyrics_id` VARCHAR(64),
  `idx` INT,
  `text` TEXT,
  `yin` TEXT,
  `exp` TEXT,
  PRIMARY KEY (`lyrics_id`,`idx`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` VARCHAR(64),
  `username` VARCHAR(255),
  `password` VARCHAR(255),
  `nickname` VARCHAR(255),
  `signature` TEXT,
  `gender` VARCHAR(255),
  `region` VARCHAR(255),
  `role` VARCHAR(255),
  `avatar_seed` INT,
  `created` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `favorite`;
CREATE TABLE `favorite` (
  `id` VARCHAR(64),
  `user_id` VARCHAR(64),
  `type` VARCHAR(255),
  `target_id` VARCHAR(64),
  `created` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fav` (`user_id`,`type`,`target_id`),
  KEY `idx_fav_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `comment`;
CREATE TABLE `comment` (
  `id` VARCHAR(64),
  `user_id` VARCHAR(64),
  `nickname` VARCHAR(255),
  `avatar_seed` INT,
  `type` VARCHAR(255),
  `target_id` VARCHAR(64),
  `content` TEXT,
  `rating` INT,
  `likes` INT,
  `created` VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `idx_cmt_target` (`type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `learn_record`;
CREATE TABLE `learn_record` (
  `id` VARCHAR(64),
  `user_id` VARCHAR(64),
  `lyrics_id` VARCHAR(64),
  `progress` INT,
  `last` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_learn` (`user_id`,`lyrics_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `history`;
CREATE TABLE `history` (
  `id` VARCHAR(64),
  `user_id` VARCHAR(64),
  `type` VARCHAR(255),
  `target_id` VARCHAR(64),
  `title` VARCHAR(255),
  `time` VARCHAR(255),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `region_geo`;
CREATE TABLE `region_geo` (
  `code` VARCHAR(64),
  `name` VARCHAR(255),
  `province` VARCHAR(255),
  `lng` DOUBLE,
  `lat` DOUBLE,
  `is_core` INT,
  PRIMARY KEY (`code`),
  UNIQUE KEY `uk_region_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `performance`;
CREATE TABLE `performance` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `region` VARCHAR(255),
  `province` VARCHAR(255),
  `venue` VARCHAR(255),
  `troupe` VARCHAR(255),
  `opera_id` VARCHAR(64),
  `opera_title` VARCHAR(255),
  `date` VARCHAR(255),
  `year` INT,
  `audience` INT,
  `online_play` INT,
  `channel` VARCHAR(255),
  `source` TEXT,
  PRIMARY KEY (`id`),
  KEY `idx_perf_region` (`region`),
  KEY `idx_perf_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `show_event`;
CREATE TABLE `show_event` (
  `id` VARCHAR(64),
  `title` VARCHAR(255),
  `opera_id` VARCHAR(64),
  `opera_title` VARCHAR(255),
  `troupe` VARCHAR(255),
  `city` VARCHAR(255),
  `venue` VARCHAR(255),
  `address` TEXT,
  `date` VARCHAR(255),
  `time` VARCHAR(255),
  `price` VARCHAR(255),
  `capacity` INT,
  `poster_seed` INT,
  `intro` TEXT,
  `contact` VARCHAR(255),
  `applicant_id` VARCHAR(64),
  `applicant_name` VARCHAR(255),
  `status` VARCHAR(255),
  `review_note` TEXT,
  `created` VARCHAR(255),
  `reviewed_at` VARCHAR(255),
  PRIMARY KEY (`id`),
  KEY `idx_evt_status` (`status`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `show_signup`;
CREATE TABLE `show_signup` (
  `id` VARCHAR(64),
  `event_id` VARCHAR(64),
  `user_id` VARCHAR(64),
  `name` VARCHAR(255),
  `phone` VARCHAR(255),
  `num` INT,
  `note` TEXT,
  `created` VARCHAR(255),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_signup` (`event_id`,`user_id`),
  KEY `idx_signup_evt` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `time` VARCHAR(32),
  `user_id` VARCHAR(64),
  `username` VARCHAR(64),
  `action` VARCHAR(64),
  `detail` VARCHAR(255),
  `ip` VARCHAR(64),
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS=1;