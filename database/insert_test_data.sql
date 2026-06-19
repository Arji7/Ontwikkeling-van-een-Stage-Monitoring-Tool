-- =============================================
-- STAGE MONITORING TOOL — TEST DATA
-- Wachtwoord voor alle gebruikers: Test1234!
-- =============================================

USE stage_monitor;

-- =============================================
-- GEBRUIKERS
-- =============================================

INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES
  ('Farouk',  'Student',     'student@ehb.be',    '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Achraf',  'Docent',      'docent@ehb.be',     '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Ayoube',  'Commissie',   'commissie@ehb.be',  '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Lamine',  'Mentor',      'mentor@ehb.be',     '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('HR',      'Medewerker',  'bedrijf@ehb.be',    '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE);

-- =============================================
-- ROLLEN KOPPELEN
-- =============================================

-- Student
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'student@ehb.be' AND r.naam = 'student';

-- Docent
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'docent@ehb.be' AND r.naam = 'docent';

-- Commissielid
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'commissie@ehb.be' AND r.naam = 'commissielid';

-- Mentor
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'mentor@ehb.be' AND r.naam = 'mentor';

-- Bedrijf
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'bedrijf@ehb.be' AND r.naam = 'bedrijf';
