-- Subcompetenties (GI-codes) voor alle 11 competenties
-- Competentie 1: Beheersing planningsproces
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(1, 'GI 1.1', 'Stelt een realistische planning op en bewaakt de voortgang ervan.', 1),
(1, 'GI 1.2', 'Schat de benodigde tijd en middelen correct in.', 2),
(1, 'GI 1.3', 'Past de planning aan bij veranderende omstandigheden.', 3);

-- Competentie 2: Ontwerpen IT-oplossingen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(2, 'GI 2.1', 'Analyseert de vereisten en vertaalt deze naar een technisch ontwerp.', 4),
(2, 'GI 2.2', 'Ontwerpt schaalbare en onderhoudbare oplossingen.', 5),
(2, 'GI 2.3', 'Houdt rekening met beveiliging en performantie in het ontwerp.', 6);

-- Competentie 3: Implementatie digitale producten
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(3, 'GI 3.1', 'Schrijft kwalitatieve en leesbare code volgens afgesproken standaarden.', 7),
(3, 'GI 3.2', 'Test de eigen code grondig en systematisch.', 8),
(3, 'GI 3.3', 'Levert werkende software op binnen de afgesproken termijnen.', 9);

-- Competentie 4: Integratie technologie
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(4, 'GI 4.1', 'Integreert verschillende technologieën en systemen op een correcte manier.', 10),
(4, 'GI 4.2', 'Configureert en beheert ontwikkel- en productieomgevingen.', 11);

-- Competentie 5: Onderzoekende houding
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(5, 'GI 5.1', 'Zoekt actief naar nieuwe technologieën en methoden.', 12),
(5, 'GI 5.2', 'Onderbouwt keuzes met relevante bronnen en argumenten.', 13);

-- Competentie 6: Communicatie
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(6, 'GI 6.1', 'Communiceert helder en professioneel, zowel mondeling als schriftelijk.', 14),
(6, 'GI 6.2', 'Rapporteert regelmatig en gestructureerd over de voortgang.', 15),
(6, 'GI 6.3', 'Stelt gerichte vragen en luistert actief.', 16);

-- Competentie 7: Probleemoplossend vermogen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(7, 'GI 7.1', 'Analyseert problemen systematisch en identificeert de kern.', 17),
(7, 'GI 7.2', 'Zoekt creatieve en efficiënte oplossingen.', 18);

-- Competentie 8: Persoonlijke ontwikkeling
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(8, 'GI 8.1', 'Reflecteert kritisch op het eigen functioneren.', 19),
(8, 'GI 8.2', 'Staat open voor feedback en past gedrag aan.', 20);

-- Competentie 9: Professionele attitude
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(9, 'GI 9.1', 'Toont verantwoordelijkheid en betrouwbaarheid.', 21),
(9, 'GI 9.2', 'Werkt constructief samen binnen het team.', 22),
(9, 'GI 9.3', 'Gaat respectvol om met collega\'s en stakeholders.', 23);

-- Competentie 10: Ondernemend handelen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(10, 'GI 10.1', 'Neemt initiatief en toont proactiviteit.', 24),
(10, 'GI 10.2', 'Signaleert kansen en draagt bij aan verbetering.', 25);

-- Competentie 11: Ethisch handelen
INSERT INTO subcompetentie (competentie_id, code, naam, volgorde) VALUES
(11, 'GI 11.1', 'Handelt integer en respecteert vertrouwelijkheid.', 26),
(11, 'GI 11.2', 'Houdt rekening met de maatschappelijke impact van ICT.', 27);

-- Subcompetentie niveaus (5 niveaus per subcompetentie)
-- We voegen voor elke subcompetentie 5 niveaus toe
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving)
SELECT s.id, n.niveau, n.label, n.sublabel, CONCAT('Niveau ', n.niveau, ' voor ', s.code)
FROM subcompetentie s
CROSS JOIN (
  SELECT 1 AS niveau, 'Onvoldoende' AS label, 'Beginner' AS sublabel UNION ALL
  SELECT 2, 'Ondermaats', 'Gevorderd beginner' UNION ALL
  SELECT 3, 'Voldoende', 'Competent' UNION ALL
  SELECT 4, 'Goed', 'Bekwaam' UNION ALL
  SELECT 5, 'Uitstekend', 'Expert'
) n
ORDER BY s.id, n.niveau;
