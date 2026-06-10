USE stage_monitor;

-- Test gebruikers (wachtwoord voor allemaal: Test1234!)
INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES
  ('Farouk',  'Student',   'student@ehb.be',   '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Achraf',  'Docent',    'docent@ehb.be',    '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Ayoube',  'Commissie', 'commissie@ehb.be', '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE);

-- Rollen koppelen
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'student@ehb.be' AND r.naam = 'student';

INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'docent@ehb.be' AND r.naam = 'docent';

INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'commissie@ehb.be' AND r.naam = 'commissielid';