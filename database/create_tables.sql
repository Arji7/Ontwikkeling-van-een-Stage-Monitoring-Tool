-- =============================================
-- STAGE MONITORING TOOL — CREATE TABLES
-- EhB Erasmushogeschool Brussel
-- =============================================

CREATE DATABASE IF NOT EXISTS stage_monitor
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE stage_monitor;

-- =============================================
-- GEBRUIKERS
-- =============================================

CREATE TABLE gebruiker (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  voornaam        VARCHAR(100) NOT NULL,
  achternaam      VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  wachtwoord_hash VARCHAR(255) NOT NULL,
  actief          BOOLEAN      NOT NULL DEFAULT TRUE,
  aangemaakt_op   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rol (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  naam VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO rol (naam) VALUES
  ('student'),
  ('docent'),
  ('mentor'),
  ('stagemonitor'),
  ('commissielid'),
  ('admin'),
  ('bedrijf');

CREATE TABLE gebruiker_rol (
  gebruiker_id INT NOT NULL,
  rol_id       INT NOT NULL,
  PRIMARY KEY (gebruiker_id, rol_id),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE,
  FOREIGN KEY (rol_id)       REFERENCES rol(id)       ON DELETE CASCADE
);

-- =============================================
-- OPLEIDING & ACADEMIEJAAR
-- =============================================

CREATE TABLE opleiding (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  naam      VARCHAR(150) NOT NULL,
  afkorting VARCHAR(20),
  actief    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE academiejaar (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  naam       VARCHAR(20) NOT NULL,
  startdatum DATE,
  einddatum  DATE,
  actief     BOOLEAN NOT NULL DEFAULT TRUE
);

-- =============================================
-- PROFIELEN
-- =============================================

CREATE TABLE student (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  gebruiker_id    INT NOT NULL UNIQUE,
  studentnummer   VARCHAR(20) UNIQUE,
  opleiding_id    INT,
  academiejaar_id INT,
  FOREIGN KEY (gebruiker_id)    REFERENCES gebruiker(id)    ON DELETE CASCADE,
  FOREIGN KEY (opleiding_id)    REFERENCES opleiding(id)    ON DELETE SET NULL,
  FOREIGN KEY (academiejaar_id) REFERENCES academiejaar(id) ON DELETE SET NULL
);

CREATE TABLE docent (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  gebruiker_id INT NOT NULL UNIQUE,
  titel        VARCHAR(50),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE
);

CREATE TABLE bedrijf (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  naam          VARCHAR(255) NOT NULL,
  sector        VARCHAR(100),
  adres         VARCHAR(255),
  postcode      VARCHAR(20),
  stad          VARCHAR(100),
  land          VARCHAR(100) NOT NULL DEFAULT 'Belgie',
  website       VARCHAR(255),
  btw_nummer    VARCHAR(50),
  aangemaakt_op DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mentor (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  gebruiker_id INT NOT NULL UNIQUE,
  bedrijf_id   INT,
  functie      VARCHAR(100),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE,
  FOREIGN KEY (bedrijf_id)   REFERENCES bedrijf(id)   ON DELETE SET NULL
);

-- =============================================
-- STAGE
-- =============================================

CREATE TABLE stage (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  bedrijf_id      INT,
  mentor_id       INT,
  docent_id       INT,
  academiejaar_id INT,
  titel           VARCHAR(255),
  omschrijving    TEXT,
  startdatum      DATE,
  einddatum       DATE,
  totaal_weken    INT     NOT NULL DEFAULT 14,
  uren_per_week   INT     NOT NULL DEFAULT 38,
  contact_naam    VARCHAR(200),
  contact_email   VARCHAR(150),
  contact_functie VARCHAR(100),
  contact_telefoon VARCHAR(50),
  status          ENUM(
                    'concept',
                    'ingediend',
                    'in_beoordeling',
                    'goedgekeurd',
                    'aanpassingen_vereist',
                    'wacht_op_overeenkomst',
                    'actief',
                    'afgerond',
                    'afgekeurd'
                  ) NOT NULL DEFAULT 'concept',
  aangemaakt_op   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bijgewerkt_op   DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)      REFERENCES student(id)      ON DELETE CASCADE,
  FOREIGN KEY (bedrijf_id)      REFERENCES bedrijf(id)      ON DELETE SET NULL,
  FOREIGN KEY (mentor_id)       REFERENCES mentor(id)       ON DELETE SET NULL,
  FOREIGN KEY (docent_id)       REFERENCES docent(id)       ON DELETE SET NULL,
  FOREIGN KEY (academiejaar_id) REFERENCES academiejaar(id) ON DELETE SET NULL
);

CREATE TABLE stage_geschiedenis (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  stage_id       INT NOT NULL,
  oude_status    VARCHAR(50),
  nieuwe_status  VARCHAR(50),
  opmerking      TEXT,
  gewijzigd_door INT,
  gewijzigd_op   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id)       REFERENCES stage(id)     ON DELETE CASCADE,
  FOREIGN KEY (gewijzigd_door) REFERENCES gebruiker(id) ON DELETE SET NULL
);

-- =============================================
-- STAGEOVEREENKOMST
-- =============================================

CREATE TABLE stageovereenkomst (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  stage_id              INT NOT NULL UNIQUE,
  status                ENUM('niet_opgeladen','wacht_op_ondertekening','ondertekend','goedgekeurd') NOT NULL DEFAULT 'niet_opgeladen',
  ondertekening_methode ENUM('itsme','handtekening'),
  bestandsnaam          VARCHAR(255),
  bestandspad           VARCHAR(500),
  bestandsgrootte       INT,
  ondertekend_op        DATETIME,
  goedgekeurd_op        DATETIME,
  geupload_op           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id) ON DELETE CASCADE
);

CREATE TABLE overeenkomst_handtekening (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  overeenkomst_id INT NOT NULL,
  gebruiker_id    INT NOT NULL,
  rol             ENUM('student','mentor','docent') NOT NULL,
  methode         ENUM('itsme','handtekening') NOT NULL,
  ondertekend_op  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_adres        VARCHAR(45),
  FOREIGN KEY (overeenkomst_id) REFERENCES stageovereenkomst(id) ON DELETE CASCADE,
  FOREIGN KEY (gebruiker_id)    REFERENCES gebruiker(id)         ON DELETE CASCADE
);

-- =============================================
-- DOCUMENTEN
-- =============================================

CREATE TABLE document (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  stage_id        INT NOT NULL,
  type            ENUM('stagevoorstel','bijlage','evaluatie','andere') NOT NULL,
  bestandsnaam    VARCHAR(255),
  bestandspad     VARCHAR(500),
  bestandsgrootte INT,
  status          ENUM('ingediend','goedgekeurd','afgekeurd') NOT NULL DEFAULT 'ingediend',
  geupload_door   INT,
  geupload_op     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id)      REFERENCES stage(id)     ON DELETE CASCADE,
  FOREIGN KEY (geupload_door) REFERENCES gebruiker(id) ON DELETE SET NULL
);

CREATE TABLE document_feedback (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  document_id   INT NOT NULL,
  gebruiker_id  INT,
  feedback      TEXT,
  aangemaakt_op DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id)  REFERENCES document(id)  ON DELETE CASCADE,
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE SET NULL
);

-- =============================================
-- COMPETENTIES
-- =============================================

CREATE TABLE competentie (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  naam         VARCHAR(255) NOT NULL,
  beschrijving TEXT,
  volgorde     INT
);

CREATE TABLE subcompetentie (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  competentie_id INT NOT NULL,
  code           VARCHAR(20),
  naam           VARCHAR(255) NOT NULL,
  beschrijving   TEXT,
  volgorde       INT,
  FOREIGN KEY (competentie_id) REFERENCES competentie(id) ON DELETE CASCADE
);

CREATE TABLE subcompetentie_niveau (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  subcompetentie_id INT NOT NULL,
  niveau            INT NOT NULL COMMENT '1=Onvoldoende 2=Zwak 3=Voldoende 4=Goed 5=Uitmuntend',
  label             VARCHAR(50)  COMMENT 'bv. Onvoldoende',
  sublabel          VARCHAR(100) COMMENT 'bv. Onder verwachting',
  beschrijving      TEXT         COMMENT 'bullet criteria tekst',
  FOREIGN KEY (subcompetentie_id) REFERENCES subcompetentie(id) ON DELETE CASCADE
);

CREATE TABLE opleiding_competentie (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  opleiding_id   INT NOT NULL,
  competentie_id INT NOT NULL,
  verplicht      BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (opleiding_id)   REFERENCES opleiding(id)   ON DELETE CASCADE,
  FOREIGN KEY (competentie_id) REFERENCES competentie(id) ON DELETE CASCADE
);

INSERT INTO competentie (naam, volgorde) VALUES
  ('Beheersing planningsproces',       1),
  ('Ontwerpen IT-oplossingen',         2),
  ('Implementatie digitale producten', 3),
  ('Integratie technologie',           4),
  ('Onderzoekende houding',            5),
  ('Communicatie',                     6),
  ('Probleemoplossend vermogen',       7),
  ('Persoonlijke ontwikkeling',        8),
  ('Professionele attitude',           9),
  ('Ondernemend handelen',            10),
  ('Ethisch handelen',                11);

-- =============================================
-- LOGBOEK
-- =============================================

CREATE TABLE logboek (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  stage_id          INT NOT NULL,
  week_nummer       INT NOT NULL,
  titel             VARCHAR(255),
  datum_van         DATE,
  datum_tot         DATE,
  uitgevoerde_taken TEXT,
  leerpunten        TEXT,
  mentor_feedback   TEXT,
  totaal_uren       INT,
  status            ENUM('concept','ingediend','wacht_op_mentor','goedgekeurd') NOT NULL DEFAULT 'concept',
  ingediend_op      DATETIME,
  aangemaakt_op     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id) ON DELETE CASCADE
);

CREATE TABLE logboek_dag (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  logboek_id        INT NOT NULL,
  datum             DATE NOT NULL,
  uren_gewerkt      DECIMAL(4,1),
  uitgevoerde_taken TEXT,
  is_afwezig        BOOLEAN NOT NULL DEFAULT FALSE,
  afwezig_reden     ENUM('ziek','verlof'),
  FOREIGN KEY (logboek_id) REFERENCES logboek(id) ON DELETE CASCADE
);

CREATE TABLE logboek_competentie (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  logboek_id     INT NOT NULL,
  competentie_id INT NOT NULL,
  FOREIGN KEY (logboek_id)     REFERENCES logboek(id)     ON DELETE CASCADE,
  FOREIGN KEY (competentie_id) REFERENCES competentie(id) ON DELETE CASCADE
);

CREATE TABLE logboek_reactie (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  logboek_id    INT NOT NULL,
  gebruiker_id  INT NOT NULL,
  reactie       TEXT NOT NULL,
  aangemaakt_op DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (logboek_id)   REFERENCES logboek(id)   ON DELETE CASCADE,
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE
);

CREATE TABLE logboek_bestand (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  logboek_id      INT NOT NULL,
  bestandsnaam    VARCHAR(255) NOT NULL,
  origineel_naam  VARCHAR(255),
  mimetype        VARCHAR(100),
  bestandsgrootte INT,
  geupload_op     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (logboek_id) REFERENCES logboek(id) ON DELETE CASCADE
);

-- =============================================
-- EVALUATIES
-- =============================================

CREATE TABLE evaluatie (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  stage_id             INT NOT NULL,
  type                 ENUM('tussentijds','eind') NOT NULL,
  week_nummer          INT,
  datum_bespreking     DATE,
  type_bespreking      ENUM('fysiek','online'),
  sterke_punten        TEXT,
  verbeterpunten       TEXT,
  algemene_appreciatie TEXT,
  globale_feedback     TEXT,
  officieel_eindcijfer DECIMAL(4,1),
  status               ENUM('open','ingediend','afgerond') NOT NULL DEFAULT 'open',
  aangemaakt_op        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id) ON DELETE CASCADE
);

CREATE TABLE competentiescore (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  evaluatie_id      INT NOT NULL,
  subcompetentie_id INT NOT NULL,
  score_docent      INT CHECK (score_docent BETWEEN 1 AND 5),
  score_mentor      INT CHECK (score_mentor BETWEEN 1 AND 5),
  feedback_docent   TEXT,
  student_reflectie TEXT,
  eind_doelscore    INT CHECK (eind_doelscore BETWEEN 1 AND 5),
  trend             ENUM('stijgend','stabiel','dalend'),
  FOREIGN KEY (evaluatie_id)      REFERENCES evaluatie(id)      ON DELETE CASCADE,
  FOREIGN KEY (subcompetentie_id) REFERENCES subcompetentie(id) ON DELETE CASCADE
);

CREATE TABLE evaluatie_feedback (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  evaluatie_id  INT NOT NULL,
  gebruiker_id  INT NOT NULL,
  rol           ENUM('student','docent','mentor') NOT NULL,
  feedback      TEXT NOT NULL,
  aangemaakt_op DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluatie_id) REFERENCES evaluatie(id) ON DELETE CASCADE,
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE
);

-- =============================================
-- COMMISSIE BESLISSINGEN
-- =============================================

CREATE TABLE beslissing (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  stage_id        INT NOT NULL,
  commissielid_id INT,
  beslissing      ENUM('goedgekeurd','afgekeurd','aanpassingen_vereist') NOT NULL,
  opmerking       TEXT,
  datum           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id)        REFERENCES stage(id)     ON DELETE CASCADE,
  FOREIGN KEY (commissielid_id) REFERENCES gebruiker(id) ON DELETE SET NULL
);

-- =============================================
-- GESCHIL
-- =============================================

CREATE TABLE geschil (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  stage_id       INT NOT NULL,
  ingediend_door INT NOT NULL,
  onderwerp      VARCHAR(255) NOT NULL,
  beschrijving   TEXT NOT NULL,
  status         ENUM('open','in_behandeling','opgelost','afgesloten') NOT NULL DEFAULT 'open',
  oplossing      TEXT,
  behandeld_door INT,
  aangemaakt_op  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opgelost_op    DATETIME,
  FOREIGN KEY (stage_id)       REFERENCES stage(id)     ON DELETE CASCADE,
  FOREIGN KEY (ingediend_door) REFERENCES gebruiker(id) ON DELETE CASCADE,
  FOREIGN KEY (behandeld_door) REFERENCES gebruiker(id) ON DELETE SET NULL
);

-- =============================================
-- MELDINGEN
-- =============================================

CREATE TABLE melding (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  gebruiker_id  INT NOT NULL,
  titel         VARCHAR(255),
  bericht       TEXT,
  type          VARCHAR(50),
  link          VARCHAR(255),
  gelezen       BOOLEAN  NOT NULL DEFAULT FALSE,
  aangemaakt_op DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE
);

-- =============================================
-- AUTHENTICATIE
-- =============================================

CREATE TABLE wachtwoord_reset (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  gebruiker_id  INT NOT NULL,
  token         VARCHAR(255) NOT NULL,
  vervalt_op    DATETIME NOT NULL,
  gebruikt      BOOLEAN  NOT NULL DEFAULT FALSE,
  aangemaakt_op DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE
);

CREATE TABLE refresh_token (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  gebruiker_id  INT NOT NULL,
  token         VARCHAR(500) NOT NULL,
  vervalt_op    DATETIME NOT NULL,
  aangemaakt_op DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE
);
