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
