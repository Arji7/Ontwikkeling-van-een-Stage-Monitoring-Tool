USE stage_monitor;

-- Test gebruikers (wachtwoord voor allemaal: Test1234!)
INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES
  ('Farouk',  'Student',   'student@ehb.be',   '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Achraf',  'Docent',    'docent@ehb.be',    '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE),
  ('Ayoube',  'Commissie', 'commissie@ehb.be', '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE);

--- Student profiel aanmaken voor Farouk
INSERT INTO student (gebruiker_id, studentnummer)
SELECT id, '2024001' FROM gebruiker WHERE email = 'student@ehb.be'
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

-- feedback_mentor kolom toevoegen als die nog niet bestaat
ALTER TABLE competentiescore ADD COLUMN IF NOT EXISTS feedback_mentor TEXT AFTER feedback_docent;

-- =============================================
-- SUBCOMPETENCIES (GI codes)
-- =============================================
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
  -- 1. Beheersing planningsproces
  ((SELECT id FROM competentie WHERE volgorde=1),  'GI 1.1',  'Stelt een realistische planning op en bewaakt de voortgang ervan.',         1),
  ((SELECT id FROM competentie WHERE volgorde=1),  'GI 1.2',  'Schat de benodigde tijd en middelen correct in.',                           2),
  -- 2. Ontwerpen IT-oplossingen
  ((SELECT id FROM competentie WHERE volgorde=2),  'GI 2.1',  'Analyseert en vertaalt functionele en niet-functionele vereisten.',          1),
  ((SELECT id FROM competentie WHERE volgorde=2),  'GI 2.2',  'Ontwerpt een passende en schaalbare IT-architectuur of oplossing.',          2),
  -- 3. Implementatie digitale producten
  ((SELECT id FROM competentie WHERE volgorde=3),  'GI 3.1',  'Implementeert een digitaal product op een professionele en correcte wijze.', 1),
  ((SELECT id FROM competentie WHERE volgorde=3),  'GI 3.2',  'Past kwaliteitsstandaarden en testprocessen toe.',                          2),
  -- 4. Integratie technologie
  ((SELECT id FROM competentie WHERE volgorde=4),  'GI 4.1',  'Integreert technologieën en systemen in een professionele context.',         1),
  ((SELECT id FROM competentie WHERE volgorde=4),  'GI 4.2',  'Documenteert en valideert de integratie van systemen.',                     2),
  -- 5. Onderzoekende houding
  ((SELECT id FROM competentie WHERE volgorde=5),  'GI 5.1',  'Zoekt proactief informatie op en past nieuwe kennis toe in de praktijk.',   1),
  ((SELECT id FROM competentie WHERE volgorde=5),  'GI 5.2',  'Evalueert bronnen kritisch en trekt gefundeerde conclusies.',               2),
  -- 6. Communicatie
  ((SELECT id FROM competentie WHERE volgorde=6),  'GI 6.1',  'Communiceert helder en professioneel met collega\'s en stakeholders.',       1),
  ((SELECT id FROM competentie WHERE volgorde=6),  'GI 6.2',  'Documenteert en rapporteert werkzaamheden op een correcte wijze.',          2),
  -- 7. Probleemoplossend vermogen
  ((SELECT id FROM competentie WHERE volgorde=7),  'GI 7.1',  'Analyseert problemen systematisch en stelt correcte diagnoses.',            1),
  ((SELECT id FROM competentie WHERE volgorde=7),  'GI 7.2',  'Bedenkt en implementeert doeltreffende en correcte oplossingen.',           2),
  -- 8. Persoonlijke ontwikkeling
  ((SELECT id FROM competentie WHERE volgorde=8),  'GI 8.1',  'Reflecteert op eigen functioneren en identificeert leerpunten.',            1),
  ((SELECT id FROM competentie WHERE volgorde=8),  'GI 8.2',  'Past zich flexibel aan aan nieuwe situaties en feedback.',                  2),
  -- 9. Professionele attitude
  ((SELECT id FROM competentie WHERE volgorde=9),  'GI 9.1',  'Handelt professioneel, respectvol en neemt verantwoordelijkheid.',          1),
  ((SELECT id FROM competentie WHERE volgorde=9),  'GI 9.2',  'Respecteert afspraken, deadlines en bedrijfsregels consequent.',            2),
  -- 10. Ondernemend handelen
  ((SELECT id FROM competentie WHERE volgorde=10), 'GI 10.1', 'Neemt initiatief en draagt proactief bij aan de organisatiedoelen.',        1),
  ((SELECT id FROM competentie WHERE volgorde=10), 'GI 10.2', 'Denkt mee over verbeteringen en draagt innovatieve ideeën aan.',            2),
  -- 11. Ethisch handelen
  ((SELECT id FROM competentie WHERE volgorde=11), 'GI 11.1', 'Analyseert effecten op de sociale en financiële duurzaamheid van ICT-projecten.', 1),
  ((SELECT id FROM competentie WHERE volgorde=11), 'GI 11.2', 'Handelt in overeenstemming met de geldende wetgeving en regelgeving.',      2);

-- =============================================
-- TEST EVALUATIES voor Farouk (stage 3)
-- =============================================
-- Tussentijdse evaluatie aanmaken
INSERT INTO evaluatie (stage_id, type, week_nummer, status)
SELECT s.id, 'tussentijds', 7, 'open'
FROM stage s
JOIN student st ON st.id = s.student_id
JOIN gebruiker g ON g.id = st.gebruiker_id
WHERE g.email = 'student@ehb.be'
ORDER BY s.aangemaakt_op DESC LIMIT 1;

-- Competentiescores aanmaken voor tussentijdse evaluatie (alle subcompetencies)
INSERT INTO competentiescore (evaluatie_id, subcompetentie_id, score_mentor, feedback_mentor, score_docent, feedback_docent, student_reflectie)
SELECT
  (SELECT e.id FROM evaluatie e JOIN stage s ON s.id = e.stage_id
   JOIN student st ON st.id = s.student_id JOIN gebruiker g ON g.id = st.gebruiker_id
   WHERE g.email = 'student@ehb.be' AND e.type = 'tussentijds' ORDER BY e.aangemaakt_op DESC LIMIT 1),
  sc.id,
  NULL, NULL, NULL, NULL, NULL
FROM subcompetentie sc;

-- Eindevaluatie aanmaken (ook open, voor demo)
INSERT INTO evaluatie (stage_id, type, week_nummer, status)
SELECT s.id, 'eind', 14, 'open'
FROM stage s
JOIN student st ON st.id = s.student_id
JOIN gebruiker g ON g.id = st.gebruiker_id
WHERE g.email = 'student@ehb.be'
ORDER BY s.aangemaakt_op DESC LIMIT 1;

-- Competentiescores aanmaken voor eindevaluatie
INSERT INTO competentiescore (evaluatie_id, subcompetentie_id, score_mentor, feedback_mentor, score_docent, feedback_docent, student_reflectie)
SELECT
  (SELECT e.id FROM evaluatie e JOIN stage s ON s.id = e.stage_id
   JOIN student st ON st.id = s.student_id JOIN gebruiker g ON g.id = st.gebruiker_id
   WHERE g.email = 'student@ehb.be' AND e.type = 'eind' ORDER BY e.aangemaakt_op DESC LIMIT 1),
  sc.id,
  NULL, NULL, NULL, NULL, NULL
FROM subcompetentie sc;