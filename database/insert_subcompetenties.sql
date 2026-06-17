USE stage_monitor;

-- 1. Beheersing planningsproces
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(1, 'GI.01', 'Maakt een realistische planning op basis van vereisten', 1),
(1, 'GI.02', 'Bewaakt de voortgang en stuurt bij waar nodig', 2),
(1, 'GI.03', 'Schat taken en doorlooptijd correct in', 3);

-- 2. Ontwerpen IT-oplossingen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(2, 'GI.04', 'Analyseert functionele en technische vereisten', 1),
(2, 'GI.05', 'Maakt onderbouwde technologiekeuzes', 2),
(2, 'GI.06', 'Ontwerpt schaalbare en onderhoudbare oplossingen', 3);

-- 3. Implementatie digitale producten
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(3, 'GI.07', 'Schrijft kwalitatieve en leesbare code', 1),
(3, 'GI.08', 'Test en debugt systematisch', 2),
(3, 'GI.09', 'Levert werkende software op binnen de afspraken', 3);

-- 4. Integratie technologie
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(4, 'GI.10', 'Integreert APIs en externe services', 1),
(4, 'GI.11', 'Werkt met databases en datastromen', 2),
(4, 'GI.12', 'Past beveiligingsprincipes toe', 3);

-- 5. Onderzoekende houding
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(5, 'GI.13', 'Onderzoekt nieuwe technologieen en tools', 1),
(5, 'GI.14', 'Onderbouwt keuzes met bronnen en argumenten', 2);

-- 6. Communicatie
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(6, 'GI.15', 'Communiceert helder mondeling en schriftelijk', 1),
(6, 'GI.16', 'Documenteert werk toegankelijk voor het team', 2),
(6, 'GI.17', 'Geeft en ontvangt constructieve feedback', 3);

-- 7. Probleemoplossend vermogen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(7, 'GI.18', 'Analyseert problemen gestructureerd', 1),
(7, 'GI.19', 'Zoekt creatieve en effectieve oplossingen', 2);

-- 8. Persoonlijke ontwikkeling
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(8, 'GI.20', 'Reflecteert op eigen functioneren', 1),
(8, 'GI.21', 'Neemt initiatief voor eigen groei', 2);

-- 9. Professionele attitude
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(9, 'GI.22', 'Is stipt, betrouwbaar en respectvol', 1),
(9, 'GI.23', 'Houdt zich aan afspraken en deadlines', 2);

-- 10. Ondernemend handelen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(10, 'GI.24', 'Neemt initiatief en denkt proactief mee', 1),
(10, 'GI.25', 'Signaleert kansen en verbeterpunten', 2);

-- 11. Ethisch handelen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(11, 'GI.26', 'Handelt integer en respecteert privacy', 1),
(11, 'GI.27', 'Houdt rekening met maatschappelijke impact', 2);

-- Niveaus per subcompetentie (5 niveaus elk)
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving)
SELECT s.id, n.niveau, n.label, n.sublabel, n.beschrijving
FROM subcompetentie s
CROSS JOIN (
  SELECT 1 AS niveau, 'Onvoldoende' AS label, 'Onder verwachting' AS sublabel, 'Voldoet niet aan de minimale verwachtingen voor dit criterium.' AS beschrijving
  UNION ALL SELECT 2, 'Zwak', 'Net onder verwachting', 'Voldoet gedeeltelijk maar vertoont duidelijke tekortkomingen.'
  UNION ALL SELECT 3, 'Voldoende', 'Naar verwachting', 'Voldoet aan de verwachtingen voor dit criterium.'
  UNION ALL SELECT 4, 'Goed', 'Boven verwachting', 'Presteert boven de verwachtingen met merkbare kwaliteit.'
  UNION ALL SELECT 5, 'Uitmuntend', 'Ver boven verwachting', 'Uitzonderlijke prestatie die als voorbeeld kan dienen.'
) n
ORDER BY s.id, n.niveau;
