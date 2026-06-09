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
