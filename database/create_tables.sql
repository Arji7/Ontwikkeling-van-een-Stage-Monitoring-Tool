
/*!40101 SET NAMES utf8 */;
CREATE TABLE `academiejaar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `naam` varchar(20) NOT NULL,
  `startdatum` date DEFAULT NULL,
  `einddatum` date DEFAULT NULL,
  `actief` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `bedrijf` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `naam` varchar(255) NOT NULL,
  `sector` varchar(100) DEFAULT NULL,
  `adres` varchar(255) DEFAULT NULL,
  `postcode` varchar(20) DEFAULT NULL,
  `stad` varchar(100) DEFAULT NULL,
  `land` varchar(100) NOT NULL DEFAULT 'Belgie',
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `btw_nummer` varchar(50) DEFAULT NULL,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `beslissing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `commissielid_id` int(11) DEFAULT NULL,
  `beslissing` enum('goedgekeurd','afgekeurd','aanpassingen_vereist') NOT NULL,
  `opmerking` text DEFAULT NULL,
  `datum` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  KEY `commissielid_id` (`commissielid_id`),
  CONSTRAINT `beslissing_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `stage` (`id`) ON DELETE CASCADE,
  CONSTRAINT `beslissing_ibfk_2` FOREIGN KEY (`commissielid_id`) REFERENCES `gebruiker` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `competentie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `naam` varchar(255) NOT NULL,
  `beschrijving` text DEFAULT NULL,
  `volgorde` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `competentiescore` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluatie_id` int(11) NOT NULL,
  `subcompetentie_id` int(11) NOT NULL,
  `score_docent` int(11) DEFAULT NULL CHECK (`score_docent` between 1 and 5),
  `score_mentor` int(11) DEFAULT NULL CHECK (`score_mentor` between 1 and 5),
  `feedback_mentor` text DEFAULT NULL,
  `feedback_docent` text DEFAULT NULL,
  `student_reflectie` text DEFAULT NULL,
  `eind_doelscore` int(11) DEFAULT NULL CHECK (`eind_doelscore` between 1 and 5),
  `trend` enum('stijgend','stabiel','dalend') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `evaluatie_id` (`evaluatie_id`),
  KEY `subcompetentie_id` (`subcompetentie_id`),
  CONSTRAINT `competentiescore_ibfk_1` FOREIGN KEY (`evaluatie_id`) REFERENCES `evaluatie` (`id`) ON DELETE CASCADE,
  CONSTRAINT `competentiescore_ibfk_2` FOREIGN KEY (`subcompetentie_id`) REFERENCES `subcompetentie` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `docent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gebruiker_id` int(11) NOT NULL,
  `titel` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gebruiker_id` (`gebruiker_id`),
  CONSTRAINT `docent_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `document` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `type` enum('stagevoorstel','bijlage','evaluatie','andere') NOT NULL,
  `bestandsnaam` varchar(255) DEFAULT NULL,
  `bestandspad` varchar(500) DEFAULT NULL,
  `bestandsgrootte` int(11) DEFAULT NULL,
  `status` enum('ingediend','goedgekeurd','afgekeurd') NOT NULL DEFAULT 'ingediend',
  `geupload_door` int(11) DEFAULT NULL,
  `geupload_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  KEY `geupload_door` (`geupload_door`),
  CONSTRAINT `document_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `stage` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_ibfk_2` FOREIGN KEY (`geupload_door`) REFERENCES `gebruiker` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `document_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `gebruiker_id` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  KEY `gebruiker_id` (`gebruiker_id`),
  CONSTRAINT `document_feedback_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `document` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_feedback_ibfk_2` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `evaluatie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `type` enum('tussentijds','eind') NOT NULL,
  `week_nummer` int(11) DEFAULT NULL,
  `datum_bespreking` date DEFAULT NULL,
  `type_bespreking` enum('fysiek','online') DEFAULT NULL,
  `algemene_appreciatie` text DEFAULT NULL,
  `globale_feedback` text DEFAULT NULL,
  `officieel_eindcijfer` decimal(4,1) DEFAULT NULL,
  `status` enum('open','ingediend','afgerond') NOT NULL DEFAULT 'open',
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `evaluatie_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `stage` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `evaluatie_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `evaluatie_id` int(11) NOT NULL,
  `gebruiker_id` int(11) NOT NULL,
  `rol` enum('student','docent','mentor') NOT NULL,
  `feedback` text NOT NULL,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `evaluatie_id` (`evaluatie_id`),
  KEY `gebruiker_id` (`gebruiker_id`),
  CONSTRAINT `evaluatie_feedback_ibfk_1` FOREIGN KEY (`evaluatie_id`) REFERENCES `evaluatie` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluatie_feedback_ibfk_2` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `gebruiker` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `voornaam` varchar(100) NOT NULL,
  `achternaam` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `persoonlijke_email` varchar(255) DEFAULT NULL,
  `wachtwoord_hash` varchar(255) NOT NULL,
  `actief` tinyint(1) NOT NULL DEFAULT 1,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `gebruiker_rol` (
  `gebruiker_id` int(11) NOT NULL,
  `rol_id` int(11) NOT NULL,
  PRIMARY KEY (`gebruiker_id`,`rol_id`),
  KEY `rol_id` (`rol_id`),
  CONSTRAINT `gebruiker_rol_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gebruiker_rol_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `logboek` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `week_nummer` int(11) NOT NULL,
  `titel` varchar(255) DEFAULT NULL,
  `datum_van` date DEFAULT NULL,
  `datum_tot` date DEFAULT NULL,
  `uitgevoerde_taken` text DEFAULT NULL,
  `leerpunten` text DEFAULT NULL,
  `mentor_feedback` text DEFAULT NULL,
  `totaal_uren` int(11) DEFAULT NULL,
  `status` enum('concept','ingediend','wacht_op_mentor','goedgekeurd') NOT NULL DEFAULT 'concept',
  `ingediend_op` datetime DEFAULT NULL,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  CONSTRAINT `logboek_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `stage` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `logboek_bestand` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `logboek_id` int(11) NOT NULL,
  `bestandsnaam` varchar(255) NOT NULL,
  `origineel_naam` varchar(255) DEFAULT NULL,
  `mimetype` varchar(100) DEFAULT NULL,
  `bestandsgrootte` int(11) DEFAULT NULL,
  `geupload_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `logboek_id` (`logboek_id`),
  CONSTRAINT `logboek_bestand_ibfk_1` FOREIGN KEY (`logboek_id`) REFERENCES `logboek` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `logboek_competentie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `logboek_id` int(11) NOT NULL,
  `competentie_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `logboek_id` (`logboek_id`),
  KEY `competentie_id` (`competentie_id`),
  CONSTRAINT `logboek_competentie_ibfk_1` FOREIGN KEY (`logboek_id`) REFERENCES `logboek` (`id`) ON DELETE CASCADE,
  CONSTRAINT `logboek_competentie_ibfk_2` FOREIGN KEY (`competentie_id`) REFERENCES `competentie` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `logboek_dag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `logboek_id` int(11) NOT NULL,
  `datum` date NOT NULL,
  `uren_gewerkt` decimal(4,1) DEFAULT NULL,
  `uitgevoerde_taken` text DEFAULT NULL,
  `is_afwezig` tinyint(1) NOT NULL DEFAULT 0,
  `afwezig_reden` enum('ziek','verlof') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `logboek_id` (`logboek_id`),
  CONSTRAINT `logboek_dag_ibfk_1` FOREIGN KEY (`logboek_id`) REFERENCES `logboek` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `logboek_reactie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `logboek_id` int(11) NOT NULL,
  `gebruiker_id` int(11) NOT NULL,
  `reactie` text NOT NULL,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `logboek_id` (`logboek_id`),
  KEY `gebruiker_id` (`gebruiker_id`),
  CONSTRAINT `logboek_reactie_ibfk_1` FOREIGN KEY (`logboek_id`) REFERENCES `logboek` (`id`) ON DELETE CASCADE,
  CONSTRAINT `logboek_reactie_ibfk_2` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `mentor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gebruiker_id` int(11) NOT NULL,
  `bedrijf_id` int(11) DEFAULT NULL,
  `functie` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gebruiker_id` (`gebruiker_id`),
  KEY `bedrijf_id` (`bedrijf_id`),
  CONSTRAINT `mentor_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mentor_ibfk_2` FOREIGN KEY (`bedrijf_id`) REFERENCES `bedrijf` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `opleiding` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `naam` varchar(150) NOT NULL,
  `afkorting` varchar(20) DEFAULT NULL,
  `actief` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `opleiding_competentie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `opleiding_id` int(11) NOT NULL,
  `competentie_id` int(11) NOT NULL,
  `verplicht` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `opleiding_id` (`opleiding_id`),
  KEY `competentie_id` (`competentie_id`),
  CONSTRAINT `opleiding_competentie_ibfk_1` FOREIGN KEY (`opleiding_id`) REFERENCES `opleiding` (`id`) ON DELETE CASCADE,
  CONSTRAINT `opleiding_competentie_ibfk_2` FOREIGN KEY (`competentie_id`) REFERENCES `competentie` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `overeenkomst_handtekening` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `overeenkomst_id` int(11) NOT NULL,
  `gebruiker_id` int(11) NOT NULL,
  `rol` enum('student','bedrijf','commissielid','mentor') NOT NULL,
  `methode` enum('itsme','handtekening') NOT NULL,
  `ondertekend_op` datetime NOT NULL DEFAULT current_timestamp(),
  `ip_adres` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `overeenkomst_id` (`overeenkomst_id`),
  KEY `gebruiker_id` (`gebruiker_id`),
  CONSTRAINT `overeenkomst_handtekening_ibfk_1` FOREIGN KEY (`overeenkomst_id`) REFERENCES `stageovereenkomst` (`id`) ON DELETE CASCADE,
  CONSTRAINT `overeenkomst_handtekening_ibfk_2` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `refresh_token` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gebruiker_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `vervalt_op` datetime NOT NULL,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `gebruiker_id` (`gebruiker_id`),
  CONSTRAINT `refresh_token_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `rol` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `naam` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `naam` (`naam`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `stage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `bedrijf_id` int(11) DEFAULT NULL,
  `mentor_id` int(11) DEFAULT NULL,
  `docent_id` int(11) DEFAULT NULL,
  `academiejaar_id` int(11) DEFAULT NULL,
  `titel` varchar(255) DEFAULT NULL,
  `omschrijving` text DEFAULT NULL,
  `startdatum` date DEFAULT NULL,
  `einddatum` date DEFAULT NULL,
  `totaal_weken` int(11) NOT NULL DEFAULT 14,
  `status` enum('concept','ingediend','in_beoordeling','goedgekeurd','aanpassingen_vereist','wacht_op_overeenkomst','actief','afgerond','afgekeurd') NOT NULL DEFAULT 'concept',
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  `bijgewerkt_op` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `contact_naam` varchar(200) DEFAULT NULL,
  `contact_email` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `bedrijf_id` (`bedrijf_id`),
  KEY `mentor_id` (`mentor_id`),
  KEY `docent_id` (`docent_id`),
  KEY `academiejaar_id` (`academiejaar_id`),
  CONSTRAINT `stage_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stage_ibfk_2` FOREIGN KEY (`bedrijf_id`) REFERENCES `bedrijf` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stage_ibfk_3` FOREIGN KEY (`mentor_id`) REFERENCES `mentor` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stage_ibfk_4` FOREIGN KEY (`docent_id`) REFERENCES `docent` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stage_ibfk_5` FOREIGN KEY (`academiejaar_id`) REFERENCES `academiejaar` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `stage_geschiedenis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `oude_status` varchar(50) DEFAULT NULL,
  `nieuwe_status` varchar(50) DEFAULT NULL,
  `opmerking` text DEFAULT NULL,
  `gewijzigd_door` int(11) DEFAULT NULL,
  `gewijzigd_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `stage_id` (`stage_id`),
  KEY `gewijzigd_door` (`gewijzigd_door`),
  CONSTRAINT `stage_geschiedenis_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `stage` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stage_geschiedenis_ibfk_2` FOREIGN KEY (`gewijzigd_door`) REFERENCES `gebruiker` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `stageovereenkomst` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `status` enum('niet_opgeladen','wacht_op_ondertekening','ondertekend','goedgekeurd') NOT NULL DEFAULT 'niet_opgeladen',
  `ondertekening_methode` enum('itsme','handtekening') DEFAULT NULL,
  `bestandsnaam` varchar(255) DEFAULT NULL,
  `bestandspad` varchar(500) DEFAULT NULL,
  `bestandsgrootte` int(11) DEFAULT NULL,
  `ondertekend_op` datetime DEFAULT NULL,
  `geupload_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `stage_id` (`stage_id`),
  CONSTRAINT `stageovereenkomst_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `stage` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `student` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gebruiker_id` int(11) NOT NULL,
  `studentnummer` varchar(20) DEFAULT NULL,
  `opleiding_id` int(11) DEFAULT NULL,
  `academiejaar_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gebruiker_id` (`gebruiker_id`),
  UNIQUE KEY `studentnummer` (`studentnummer`),
  KEY `opleiding_id` (`opleiding_id`),
  KEY `academiejaar_id` (`academiejaar_id`),
  CONSTRAINT `student_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_ibfk_2` FOREIGN KEY (`opleiding_id`) REFERENCES `opleiding` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_ibfk_3` FOREIGN KEY (`academiejaar_id`) REFERENCES `academiejaar` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `subcompetentie` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `competentie_id` int(11) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `naam` varchar(255) NOT NULL,
  `beschrijving` text DEFAULT NULL,
  `volgorde` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `competentie_id` (`competentie_id`),
  CONSTRAINT `subcompetentie_ibfk_1` FOREIGN KEY (`competentie_id`) REFERENCES `competentie` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `subcompetentie_niveau` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subcompetentie_id` int(11) NOT NULL,
  `niveau` int(11) NOT NULL COMMENT '1=Onvoldoende 2=Zwak 3=Voldoende 4=Goed 5=Uitmuntend',
  `label` varchar(50) DEFAULT NULL COMMENT 'bv. Onvoldoende',
  `sublabel` varchar(100) DEFAULT NULL COMMENT 'bv. Onder verwachting',
  `beschrijving` text DEFAULT NULL COMMENT 'bullet criteria tekst',
  PRIMARY KEY (`id`),
  KEY `subcompetentie_id` (`subcompetentie_id`),
  CONSTRAINT `subcompetentie_niveau_ibfk_1` FOREIGN KEY (`subcompetentie_id`) REFERENCES `subcompetentie` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `wachtwoord_reset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gebruiker_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `vervalt_op` datetime NOT NULL,
  `gebruikt` tinyint(1) NOT NULL DEFAULT 0,
  `aangemaakt_op` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `gebruiker_id` (`gebruiker_id`),
  CONSTRAINT `wachtwoord_reset_ibfk_1` FOREIGN KEY (`gebruiker_id`) REFERENCES `gebruiker` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


