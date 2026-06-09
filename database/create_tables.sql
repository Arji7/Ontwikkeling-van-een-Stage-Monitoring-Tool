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
  ('admin');

  CREATE TABLE gebruiker_rol (
  gebruiker_id INT NOT NULL,
  rol_id       INT NOT NULL,
  PRIMARY KEY (gebruiker_id, rol_id),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id) ON DELETE CASCADE,
  FOREIGN KEY (rol_id)       REFERENCES rol(id)       ON DELETE CASCADE
);

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

