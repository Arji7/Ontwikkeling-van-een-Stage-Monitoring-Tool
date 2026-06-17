USE stage_monitor;

-- Test gebruikers (wachtwoord voor allemaal: Test1234!)
INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES
  ('Farouk',  'Student',   'student@ehb.be',   '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Achraf',  'Docent',    'docent@ehb.be',    '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Ayoube',  'Commissie', 'commissie@ehb.be', '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE);

--- Student profiel aanmaken voor Farouk
INSERT INTO student (gebruiker_id, studentnummer)
SELECT id, '2024001' FROM gebruiker WHERE email = 'student@ehb.be';
-- Docent profiel aanmaken
INSERT INTO docent (gebruiker_id)
SELECT id FROM gebruiker WHERE email = 'docent@ehb.be';
--docent profiel koppelen aan rol commissielid
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id
FROM gebruiker g, rol r
WHERE g.email = 'docent@ehb.be' AND r.naam = 'commissielid';

-- 1. Gebruiker aanmaken
INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief)
VALUES ('Lamine', 'Test', 'lamine@ehb.be', '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE);

-- 2. Rol student koppelen
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'lamine@ehb.be' AND r.naam = 'student';

-- 3. Student profiel aanmaken
INSERT INTO student (gebruiker_id, studentnummer)
SELECT id, '2024002' FROM gebruiker WHERE email = 'lamine@ehb.be';

-- 1. Gebruiker aanmaken
INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief)
VALUES ('Lionel', 'Messi', 'lionel.messi@ehb.be', '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE);

-- 2. Rol docent koppelen
INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'lionel.messi@ehb.be' AND r.naam = 'docent';

-- 3. Docent profiel zonder titel
INSERT INTO docent (gebruiker_id)
SELECT id FROM gebruiker WHERE email = 'lionel.messi@ehb.be';

-- Stageovereenkomst aanmaken (ondertekend)
INSERT INTO stageovereenkomst (stage_id, status, ondertekening_methode, ondertekend_op, geupload_op)
SELECT s.id, 'ondertekend', 'handtekening', NOW(), NOW()
FROM stage s
JOIN student st ON st.id = s.student_id
JOIN gebruiker g ON g.id = st.gebruiker_id
WHERE g.email = 'student@ehb.be'
ORDER BY s.aangemaakt_op DESC
LIMIT 1;

-- Stage op actief zetten zodat logboeken werken
UPDATE stage s
JOIN student st ON st.id = s.student_id
JOIN gebruiker g ON g.id = st.gebruiker_id
SET s.status = 'actief'
WHERE g.email = 'student@ehb.be'
  AND s.status IN ('goedgekeurd', 'wacht_op_overeenkomst');