USE stage_monitor;

-- Nieuwe teststudent met een NOG NIET beoordeelde stageaanvraag
-- Wachtwoord: Test1234!
INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief)
VALUES ('Nieuwe', 'Aanvraag', 'nieuwe.student@ehb.be', '$2b$10$Kf/f8/TYJ63/z2cmDwR6Mu7u0GZM04GbVGsMG.lrc.WDQkBysEGRW', TRUE);

INSERT INTO gebruiker_rol (gebruiker_id, rol_id)
SELECT g.id, r.id FROM gebruiker g, rol r
WHERE g.email = 'nieuwe.student@ehb.be' AND r.naam = 'student';

INSERT INTO student (gebruiker_id, studentnummer)
SELECT id, '2024003' FROM gebruiker WHERE email = 'nieuwe.student@ehb.be';

INSERT INTO stage (student_id, titel, omschrijving, startdatum, einddatum, contact_naam, contact_email, contact_functie, status)
SELECT st.id, 'Stage Webontwikkeling', 'Testaanvraag voor review.', '2026-09-01', '2026-12-12',
       'Jan Janssens', 'jan.janssens@bedrijf.be', 'IT Manager', 'ingediend'
FROM student st
JOIN gebruiker g ON g.id = st.gebruiker_id
WHERE g.email = 'nieuwe.student@ehb.be';
