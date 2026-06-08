-- =============================================
-- Stage Monitor Tool — Database
-- Voer dit uit in phpMyAdmin (XAMPP)
-- =============================================

CREATE DATABASE IF NOT EXISTS stage_monitor;
USE stage_monitor;

-- =============================================
-- GEBRUIKERS & ROLLEN
-- =============================================

CREATE TABLE gebruiker (
  id INT PRIMARY KEY AUTO_INCREMENT,
  naam VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  wachtwoord VARCHAR(255) NOT NULL,
  rol ENUM('student','commissie','docent','mentor','administratie') NOT NULL,
  actief BOOLEAN DEFAULT TRUE,
  aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student (
  gebruiker_id INT PRIMARY KEY,
  studentnummer VARCHAR(20) UNIQUE NOT NULL,
  opleiding VARCHAR(100),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id)
);

CREATE TABLE docent (
  gebruiker_id INT PRIMARY KEY,
  vakgroep VARCHAR(100),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id)
);

CREATE TABLE bedrijf (
  id INT PRIMARY KEY AUTO_INCREMENT,
  naam VARCHAR(150) NOT NULL,
  adres VARCHAR(255),
  contactpersoon VARCHAR(100),
  contact_email VARCHAR(150)
);

CREATE TABLE stagementor (
  gebruiker_id INT PRIMARY KEY,
  functie VARCHAR(100),
  bedrijf_id INT,
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id),
  FOREIGN KEY (bedrijf_id) REFERENCES bedrijf(id)
);

-- =============================================
-- STAGE
-- =============================================

CREATE TABLE stage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  docent_id INT,
  mentor_id INT,
  bedrijf_id INT,
  titel VARCHAR(200) NOT NULL,
  omschrijving TEXT,
  start_datum DATE,
  eind_datum DATE,
  status ENUM('ingediend','in_beoordeling','aanpassingen_vereist','goedgekeurd','afgekeurd','lopend','afgerond') DEFAULT 'ingediend',
  aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student(gebruiker_id),
  FOREIGN KEY (docent_id) REFERENCES docent(gebruiker_id),
  FOREIGN KEY (mentor_id) REFERENCES stagementor(gebruiker_id),
  FOREIGN KEY (bedrijf_id) REFERENCES bedrijf(id)
);

-- =============================================
-- ADVIES DOCENT
-- =============================================

CREATE TABLE advies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT NOT NULL,
  docent_id INT NOT NULL,
  advies VARCHAR(255),
  motivatie TEXT,
  datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id),
  FOREIGN KEY (docent_id) REFERENCES docent(gebruiker_id)
);

-- =============================================
-- BESLISSING STAGECOMMISSIE
-- =============================================

CREATE TABLE beslissing (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT NOT NULL,
  gebruiker_id INT NOT NULL,
  resultaat ENUM('goedgekeurd','afgekeurd','aanpassingen_vereist') NOT NULL,
  feedback TEXT,
  datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id)
);

-- =============================================
-- STAGEOVEREENKOMST
-- =============================================

CREATE TABLE stageovereenkomst (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT UNIQUE NOT NULL,
  document_url VARCHAR(500),
  ondertekend BOOLEAN DEFAULT FALSE,
  datum_ondertekening DATE,
  geregistreerd_door INT,
  FOREIGN KEY (stage_id) REFERENCES stage(id),
  FOREIGN KEY (geregistreerd_door) REFERENCES gebruiker(id)
);

-- =============================================
-- DOCUMENTEN
-- =============================================

CREATE TABLE document (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT NOT NULL,
  type ENUM('stageovereenkomst','verslag','bijlage','overig') NOT NULL,
  bestandsnaam VARCHAR(255),
  document_url VARCHAR(500),
  geupload_door INT,
  aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id),
  FOREIGN KEY (geupload_door) REFERENCES gebruiker(id)
);

-- =============================================
-- LOGBOEKEN
-- =============================================

CREATE TABLE logboek (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT NOT NULL,
  week_nummer INT NOT NULL,
  taken TEXT,
  reflectie TEXT,
  leerpunten TEXT,
  ingediend_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  afgecheckt_mentor BOOLEAN DEFAULT FALSE,
  afgecheckt_op TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id)
);

CREATE TABLE logboek_reactie (
  id INT PRIMARY KEY AUTO_INCREMENT,
  logboek_id INT NOT NULL,
  gebruiker_id INT NOT NULL,
  reactie TEXT,
  aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (logboek_id) REFERENCES logboek(id),
  FOREIGN KEY (gebruiker_id) REFERENCES gebruiker(id)
);

-- =============================================
-- COMPETENTIES
-- =============================================

CREATE TABLE competentie (
  id INT PRIMARY KEY AUTO_INCREMENT,
  naam VARCHAR(200) NOT NULL,
  omschrijving TEXT,
  gewicht DECIMAL(5,2),
  actief BOOLEAN DEFAULT TRUE,
  aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  gewijzigd_op TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE logboek_competentie (
  logboek_id INT NOT NULL,
  competentie_id INT NOT NULL,
  PRIMARY KEY (logboek_id, competentie_id),
  FOREIGN KEY (logboek_id) REFERENCES logboek(id),
  FOREIGN KEY (competentie_id) REFERENCES competentie(id)
);

-- =============================================
-- EVALUATIES
-- =============================================

CREATE TABLE evaluatie (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT NOT NULL,
  evaluator_id INT NOT NULL,
  type ENUM('tussentijds','finaal') NOT NULL,
  datum DATE,
  eindscore DECIMAL(5,2),
  presentatie_datum DATE,
  presentatie_feedback TEXT,
  FOREIGN KEY (stage_id) REFERENCES stage(id),
  FOREIGN KEY (evaluator_id) REFERENCES gebruiker(id)
);

CREATE TABLE competentiescore (
  id INT PRIMARY KEY AUTO_INCREMENT,
  evaluatie_id INT NOT NULL,
  competentie_id INT NOT NULL,
  score DECIMAL(5,2),
  student_beschrijving TEXT,
  feedback TEXT,
  FOREIGN KEY (evaluatie_id) REFERENCES evaluatie(id),
  FOREIGN KEY (competentie_id) REFERENCES competentie(id)
);

-- =============================================
-- GESCHILLEN
-- =============================================

CREATE TABLE geschil (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT NOT NULL,
  gemeld_door INT NOT NULL,
  omschrijving TEXT,
  status ENUM('open','in_behandeling','opgelost') DEFAULT 'open',
  behandeld_door INT,
  oplossing TEXT,
  aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stage(id),
  FOREIGN KEY (gemeld_door) REFERENCES gebruiker(id),
  FOREIGN KEY (behandeld_door) REFERENCES gebruiker(id)
);

-- =============================================
-- NOTIFICATIES
-- =============================================

CREATE TABLE notificatie (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ontvanger_id INT NOT NULL,
  afzender_id INT,
  stage_id INT,
  type ENUM('stage_status','logboek','evaluatie','beslissing','geschil','systeem') NOT NULL,
  bericht TEXT,
  gelezen BOOLEAN DEFAULT FALSE,
  aangemaakt_op TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ontvanger_id) REFERENCES gebruiker(id),
  FOREIGN KEY (afzender_id) REFERENCES gebruiker(id),
  FOREIGN KEY (stage_id) REFERENCES stage(id)
);

-- =============================================
-- VOORBEELDDATA
-- =============================================

INSERT INTO bedrijf (naam, adres, contactpersoon, contact_email) VALUES
('TechCorp BV', 'Technologiestraat 1, Brussel', 'Jan Pieters', 'jan@techcorp.be'),
('Innovate NV', 'Innovatielaan 42, Gent', 'Sarah Claes', 'sarah@innovate.be');

INSERT INTO gebruiker (naam, email, wachtwoord, rol) VALUES
('Admin Gebruiker',      'admin@ehb.be',         'wachtwoord123', 'administratie'),
('Prof. De Smet',        'docent@ehb.be',         'wachtwoord123', 'docent'),
('Commissielid Janssen', 'commissie@ehb.be',      'wachtwoord123', 'commissie'),
('Jan Student',          'jan@student.be',        'wachtwoord123', 'student'),
('Mentor Vermeersch',    'mentor@techcorp.be',    'wachtwoord123', 'mentor');

INSERT INTO student (gebruiker_id, studentnummer, opleiding) VALUES
(4, 'S12345', 'Toegepaste Informatica');

INSERT INTO docent (gebruiker_id, vakgroep) VALUES
(2, 'Informatica');

INSERT INTO stagementor (gebruiker_id, functie, bedrijf_id) VALUES
(5, 'Senior Developer', 1);

INSERT INTO competentie (naam, omschrijving, gewicht) VALUES
('Technische vaardigheden',    'Toepassing van technische kennis in de praktijk', 30.00),
('Communicatie',               'Mondeling en schriftelijk communiceren',           20.00),
('Probleemoplossend denken',   'Analyseren en oplossen van problemen',             25.00),
('Samenwerking',               'Functioneren in een team',                        15.00),
('Zelfsturing',                'Zelfstandig plannen en uitvoeren',                10.00);

INSERT INTO stage (student_id, docent_id, mentor_id, bedrijf_id, titel, omschrijving, start_datum, eind_datum, status)
VALUES (4, 2, 5, 1, 'Full-stack developer stage', 'Ontwikkeling van een interne tool voor TechCorp', '2026-02-01', '2026-05-31', 'ingediend');
