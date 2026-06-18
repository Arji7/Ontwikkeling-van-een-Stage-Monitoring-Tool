-- Verwijder oude generieke niveaus
DELETE FROM subcompetentie_niveau;

-- Update niveau labels
-- Per subcompetentie: 5 niveaus met beschrijvingen

-- GI 1.1: Stelt een realistische planning op en bewaakt de voortgang ervan.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(1, 1, 'Onvoldoende', 'Onder verwachting', '• Toont geen besef van sociale of financiële impact van ICT-keuzes\n• Beoordeelt projecten enkel op technische haalbaarheid'),
(1, 2, 'Zwak', 'Onvolledig', '• Erkent dat er impact is, maar kan die niet analyseren\n• Benoemt enkele effecten oppervlakkig na aansturing'),
(1, 3, 'Voldoende', 'Aan verwachting', '• Analyseert sociale en financiële effecten van een ICT-project\n• Maakt onderscheid tussen korte- en langetermijngevolgen'),
(1, 4, 'Goed', 'Boven verwachting', '• Beoordeelt projecten op meerdere dimensies (mens, milieu, financieel)\n• Formuleert duidelijke aanbevelingen op basis van die analyse'),
(1, 5, 'Uitmuntend', 'Voorbeeldig', '• Houdt rekening met duurzaamheid bij elke ontwerpkeuze, niet als afterthought\n• Brengt anderen mee in een breder ethisch perspectief');

-- GI 1.2: Schat de benodigde tijd en middelen correct in.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(2, 1, 'Onvoldoende', 'Onder verwachting', '• Kan geen realistische inschatting maken van tijd of middelen\n• Onderschat systematisch de complexiteit van taken'),
(2, 2, 'Zwak', 'Onvolledig', '• Maakt schattingen maar wijkt sterk af van de realiteit\n• Houdt geen rekening met onvoorziene omstandigheden'),
(2, 3, 'Voldoende', 'Aan verwachting', '• Schat tijd en middelen redelijk correct in voor bekende taken\n• Kan afwijkingen achteraf verklaren'),
(2, 4, 'Goed', 'Boven verwachting', '• Maakt nauwkeurige inschattingen, ook voor complexere taken\n• Bouwt bewust buffer in voor risico''s'),
(2, 5, 'Uitmuntend', 'Voorbeeldig', '• Levert consistent accurate inschattingen af\n• Helpt teamleden bij het verbeteren van hun eigen schattingen');

-- GI 1.3: Past de planning aan bij veranderende omstandigheden.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(3, 1, 'Onvoldoende', 'Onder verwachting', '• Reageert niet op veranderingen in de planning\n• Blijft vasthouden aan het oorspronkelijke plan ondanks problemen'),
(3, 2, 'Zwak', 'Onvolledig', '• Erkent dat aanpassingen nodig zijn maar voert ze niet door\n• Wacht op instructies om de planning te wijzigen'),
(3, 3, 'Voldoende', 'Aan verwachting', '• Past de planning aan wanneer omstandigheden wijzigen\n• Communiceert wijzigingen aan betrokken partijen'),
(3, 4, 'Goed', 'Boven verwachting', '• Anticipeert proactief op mogelijke vertragingen\n• Stelt alternatieve plannen voor bij knelpunten'),
(3, 5, 'Uitmuntend', 'Voorbeeldig', '• Beheert veranderingen vlot en houdt het team op koers\n• Gebruikt veranderingen als leermoment voor toekomstige planning');

-- GI 2.1: Analyseert de vereisten en vertaalt deze naar een technisch ontwerp.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(4, 1, 'Onvoldoende', 'Onder verwachting', '• Kan vereisten niet vertalen naar technische specificaties\n• Mist essentiële functionele of niet-functionele vereisten'),
(4, 2, 'Zwak', 'Onvolledig', '• Identificeert basale vereisten maar mist nuances\n• Technisch ontwerp sluit onvoldoende aan bij de noden'),
(4, 3, 'Voldoende', 'Aan verwachting', '• Vertaalt vereisten correct naar een werkbaar technisch ontwerp\n• Houdt rekening met de belangrijkste constraints'),
(4, 4, 'Goed', 'Boven verwachting', '• Stelt kritische vragen om vereisten te verduidelijken\n• Ontwerp houdt rekening met toekomstige uitbreidbaarheid'),
(4, 5, 'Uitmuntend', 'Voorbeeldig', '• Levert een grondig onderbouwd ontwerp dat alle stakeholders overtuigt\n• Identificeert conflicten tussen vereisten en stelt oplossingen voor');

-- GI 2.2: Ontwerpt schaalbare en onderhoudbare oplossingen.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(5, 1, 'Onvoldoende', 'Onder verwachting', '• Ontwerp is niet schaalbaar en moeilijk te onderhouden\n• Geen aandacht voor code-architectuur of patronen'),
(5, 2, 'Zwak', 'Onvolledig', '• Basisstructuur aanwezig maar niet consequent toegepast\n• Schaalbaarheid is een bijzaak in het ontwerp'),
(5, 3, 'Voldoende', 'Aan verwachting', '• Ontwerp volgt gangbare patronen en is redelijk onderhoudbaar\n• Houdt rekening met basale schaalbaarheid'),
(5, 4, 'Goed', 'Boven verwachting', '• Maakt bewuste keuzes voor schaalbaarheid en onderhoudbaarheid\n• Past design patterns effectief toe'),
(5, 5, 'Uitmuntend', 'Voorbeeldig', '• Ontwerpt systemen die moeiteloos meegroeien\n• Documenteert architectuurkeuzes en hun rationale helder');

-- GI 2.3: Houdt rekening met beveiliging en performantie in het ontwerp.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(6, 1, 'Onvoldoende', 'Onder verwachting', '• Geen aandacht voor beveiliging of performantie\n• Laat bekende kwetsbaarheden open in het ontwerp'),
(6, 2, 'Zwak', 'Onvolledig', '• Kent basisprincipes maar past ze inconsistent toe\n• Performantie wordt pas achteraf bekeken'),
(6, 3, 'Voldoende', 'Aan verwachting', '• Past standaard beveiligingsmaatregelen toe\n• Houdt rekening met performantie bij ontwerpkeuzes'),
(6, 4, 'Goed', 'Boven verwachting', '• Integreert security-by-design in het ontwikkelproces\n• Optimaliseert proactief voor performantie'),
(6, 5, 'Uitmuntend', 'Voorbeeldig', '• Voert threat modeling uit en onderbouwt beveiligingskeuzes\n• Stelt performantie-benchmarks op en monitort continu');

-- GI 3.1: Schrijft kwalitatieve en leesbare code.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(7, 1, 'Onvoldoende', 'Onder verwachting', '• Code is onleesbaar en volgt geen standaarden\n• Geen consistente naamgeving of structuur'),
(7, 2, 'Zwak', 'Onvolledig', '• Code werkt maar is moeilijk te begrijpen voor anderen\n• Volgt standaarden slechts gedeeltelijk'),
(7, 3, 'Voldoende', 'Aan verwachting', '• Schrijft leesbare code die teamstandaarden volgt\n• Gebruikt duidelijke naamgeving en structuur'),
(7, 4, 'Goed', 'Boven verwachting', '• Code is goed gestructureerd en eenvoudig te reviewen\n• Past SOLID-principes en clean code toe'),
(7, 5, 'Uitmuntend', 'Voorbeeldig', '• Schrijft code die als voorbeeld kan dienen voor het team\n• Draagt bij aan het verbeteren van teamstandaarden');

-- GI 3.2: Test de eigen code grondig.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(8, 1, 'Onvoldoende', 'Onder verwachting', '• Test niet of nauwelijks de eigen code\n• Levert code op met veel fouten'),
(8, 2, 'Zwak', 'Onvolledig', '• Test alleen het happy path, mist edge cases\n• Geen gestructureerde testaanpak'),
(8, 3, 'Voldoende', 'Aan verwachting', '• Test de belangrijkste scenario''s systematisch\n• Schrijft basale unit tests'),
(8, 4, 'Goed', 'Boven verwachting', '• Hoge testdekking inclusief edge cases en foutscenario''s\n• Gebruikt verschillende testniveaus effectief'),
(8, 5, 'Uitmuntend', 'Voorbeeldig', '• Schrijft tests als onderdeel van het ontwikkelproces (TDD)\n• Helpt teamleden met hun teststrategie');

-- GI 3.3: Levert werkende software op binnen termijnen.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(9, 1, 'Onvoldoende', 'Onder verwachting', '• Haalt deadlines structureel niet\n• Levert incomplete of niet-werkende software op'),
(9, 2, 'Zwak', 'Onvolledig', '• Haalt deadlines soms, maar kwaliteit schiet tekort\n• Heeft veel sturing nodig om op te leveren'),
(9, 3, 'Voldoende', 'Aan verwachting', '• Levert werkende software op binnen de afgesproken termijnen\n• Communiceert tijdig over vertragingen'),
(9, 4, 'Goed', 'Boven verwachting', '• Levert consistent op tijd met goede kwaliteit\n• Neemt verantwoordelijkheid voor de volledige oplevering'),
(9, 5, 'Uitmuntend', 'Voorbeeldig', '• Levert vaak eerder op dan gepland zonder in te boeten op kwaliteit\n• Helpt het team om gezamenlijke deadlines te halen');

-- GI 4.1: Integreert verschillende technologieën.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(10, 1, 'Onvoldoende', 'Onder verwachting', '• Kan systemen niet met elkaar laten communiceren\n• Begrijpt integratieconcepten niet'),
(10, 2, 'Zwak', 'Onvolledig', '• Integreert met hulp maar begrijpt de werking niet volledig\n• Maakt fouten bij datauitwisseling tussen systemen'),
(10, 3, 'Voldoende', 'Aan verwachting', '• Integreert systemen correct via standaard methoden (API, databases)\n• Lost integratiefouten zelfstandig op'),
(10, 4, 'Goed', 'Boven verwachting', '• Kiest de juiste integratiepatronen voor de context\n• Bouwt robuuste koppelingen met foutafhandeling'),
(10, 5, 'Uitmuntend', 'Voorbeeldig', '• Ontwerpt elegante integratiearchitecturen\n• Documenteert interfaces en helpt anderen bij integratie');

-- GI 4.2: Configureert en beheert omgevingen.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(11, 1, 'Onvoldoende', 'Onder verwachting', '• Kan geen ontwikkelomgeving opzetten of beheren\n• Begrijpt het verschil tussen dev/staging/prod niet'),
(11, 2, 'Zwak', 'Onvolledig', '• Zet omgevingen op met veel hulp\n• Configuratie is foutgevoelig en niet reproduceerbaar'),
(11, 3, 'Voldoende', 'Aan verwachting', '• Configureert omgevingen zelfstandig en correct\n• Begrijpt deployment-processen'),
(11, 4, 'Goed', 'Boven verwachting', '• Automatiseert configuratie en deployment\n• Past infrastructure-as-code principes toe'),
(11, 5, 'Uitmuntend', 'Voorbeeldig', '• Zet complete CI/CD pipelines op\n• Optimaliseert omgevingen voor performantie en betrouwbaarheid');

-- GI 5.1: Zoekt actief naar nieuwe technologieën.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(12, 1, 'Onvoldoende', 'Onder verwachting', '• Toont geen interesse in nieuwe technologieën\n• Gebruikt alleen wat expliciet wordt opgedragen'),
(12, 2, 'Zwak', 'Onvolledig', '• Toont enige interesse maar onderneemt geen actie\n• Leest af en toe over nieuwe tools'),
(12, 3, 'Voldoende', 'Aan verwachting', '• Zoekt actief naar nieuwe technologieën en methoden\n• Experimenteert met relevante tools'),
(12, 4, 'Goed', 'Boven verwachting', '• Evalueert nieuwe technologieën kritisch op meerwaarde\n• Deelt bevindingen met het team'),
(12, 5, 'Uitmuntend', 'Voorbeeldig', '• Introduceert waardevolle innovaties in het team\n• Bouwt proof-of-concepts om haalbaarheid aan te tonen');

-- GI 5.2: Onderbouwt keuzes met bronnen.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(13, 1, 'Onvoldoende', 'Onder verwachting', '• Maakt keuzes zonder onderbouwing\n• Kan eigen beslissingen niet uitleggen'),
(13, 2, 'Zwak', 'Onvolledig', '• Geeft een beperkte uitleg maar zonder bronnen\n• Onderbouwing is oppervlakkig'),
(13, 3, 'Voldoende', 'Aan verwachting', '• Onderbouwt keuzes met relevante argumenten en bronnen\n• Vergelijkt alternatieven voor een beslissing'),
(13, 4, 'Goed', 'Boven verwachting', '• Voert gedegen vergelijkend onderzoek uit\n• Presenteert voor- en nadelen helder'),
(13, 5, 'Uitmuntend', 'Voorbeeldig', '• Combineert academische en praktijkbronnen overtuigend\n• Inspireert anderen om keuzes beter te onderbouwen');

-- GI 6.1: Communiceert helder en professioneel.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(14, 1, 'Onvoldoende', 'Onder verwachting', '• Communicatie is onduidelijk of onprofessioneel\n• Berichten missen structuur en context'),
(14, 2, 'Zwak', 'Onvolledig', '• Communicatie is begrijpbaar maar niet altijd professioneel\n• Mist soms belangrijke informatie'),
(14, 3, 'Voldoende', 'Aan verwachting', '• Communiceert helder, zowel mondeling als schriftelijk\n• Past taalgebruik aan aan de doelgroep'),
(14, 4, 'Goed', 'Boven verwachting', '• Communiceert overtuigend en gestructureerd\n• Stelt complexe zaken eenvoudig voor'),
(14, 5, 'Uitmuntend', 'Voorbeeldig', '• Is een voorbeeld in professionele communicatie\n• Faciliteert effectieve communicatie in het team');

-- GI 6.2: Rapporteert regelmatig over voortgang.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(15, 1, 'Onvoldoende', 'Onder verwachting', '• Rapporteert niet of pas na herhaaldelijk vragen\n• Voortgangsrapporten missen inhoud'),
(15, 2, 'Zwak', 'Onvolledig', '• Rapporteert onregelmatig en onvolledig\n• Mist belangrijke details in updates'),
(15, 3, 'Voldoende', 'Aan verwachting', '• Rapporteert regelmatig en gestructureerd\n• Geeft helder overzicht van status en blokkades'),
(15, 4, 'Goed', 'Boven verwachting', '• Rapportages zijn grondig en actiegericht\n• Anticipeert op vragen van stakeholders'),
(15, 5, 'Uitmuntend', 'Voorbeeldig', '• Rapportages zijn een voorbeeld voor het team\n• Gebruikt visuele hulpmiddelen om voortgang te verduidelijken');

-- GI 6.3: Stelt gerichte vragen en luistert actief.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(16, 1, 'Onvoldoende', 'Onder verwachting', '• Stelt geen vragen, ook niet bij onduidelijkheid\n• Luistert niet actief naar feedback'),
(16, 2, 'Zwak', 'Onvolledig', '• Stelt vragen maar niet altijd gericht\n• Luistert maar past feedback beperkt toe'),
(16, 3, 'Voldoende', 'Aan verwachting', '• Stelt gerichte vragen om onduidelijkheden weg te werken\n• Luistert actief en verwerkt feedback'),
(16, 4, 'Goed', 'Boven verwachting', '• Stelt doorvragende vragen die tot betere oplossingen leiden\n• Toont empathie in gesprekken'),
(16, 5, 'Uitmuntend', 'Voorbeeldig', '• Faciliteert constructieve dialogen in het team\n• Helpt anderen om hun vragen scherper te formuleren');

-- GI 7.1: Analyseert problemen systematisch.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(17, 1, 'Onvoldoende', 'Onder verwachting', '• Kan problemen niet analyseren of de kern identificeren\n• Reageert impulsief zonder na te denken'),
(17, 2, 'Zwak', 'Onvolledig', '• Herkent problemen maar analyseert oppervlakkig\n• Behandelt symptomen in plaats van oorzaken'),
(17, 3, 'Voldoende', 'Aan verwachting', '• Analyseert problemen systematisch en vindt de kern\n• Gebruikt logisch denken om tot oplossingen te komen'),
(17, 4, 'Goed', 'Boven verwachting', '• Ontleedt complexe problemen in beheersbare deelproblemen\n• Past debuggingtechnieken effectief toe'),
(17, 5, 'Uitmuntend', 'Voorbeeldig', '• Lost de meest complexe problemen zelfstandig op\n• Deelt probleemoplossingsstrategieën met het team');

-- GI 7.2: Zoekt creatieve en efficiënte oplossingen.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(18, 1, 'Onvoldoende', 'Onder verwachting', '• Komt niet tot oplossingen zonder directe hulp\n• Herhaalt dezelfde aanpak ondanks falen'),
(18, 2, 'Zwak', 'Onvolledig', '• Vindt oplossingen maar ze zijn niet efficiënt\n• Beperkt zich tot voor de hand liggende aanpakken'),
(18, 3, 'Voldoende', 'Aan verwachting', '• Vindt werkbare en efficiënte oplossingen\n• Overweegt meerdere aanpakken voor een keuze'),
(18, 4, 'Goed', 'Boven verwachting', '• Bedenkt creatieve oplossingen die tijd of middelen besparen\n• Combineert bestaande kennis op nieuwe manieren'),
(18, 5, 'Uitmuntend', 'Voorbeeldig', '• Levert innovatieve oplossingen die het team vooruithelpen\n• Inspireert anderen om buiten de kaders te denken');

-- GI 8.1: Reflecteert kritisch op eigen functioneren.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(19, 1, 'Onvoldoende', 'Onder verwachting', '• Reflecteert niet op eigen handelen\n• Ziet geen verbeterpunten bij zichzelf'),
(19, 2, 'Zwak', 'Onvolledig', '• Reflecteert oppervlakkig na aansturing\n• Benoemt verbeterpunten maar zonder plan'),
(19, 3, 'Voldoende', 'Aan verwachting', '• Reflecteert regelmatig en eerlijk op eigen functioneren\n• Stelt concrete verbeterdoelen'),
(19, 4, 'Goed', 'Boven verwachting', '• Gebruikt reflectie actief om te groeien\n• Koppelt leerdoelen aan acties'),
(19, 5, 'Uitmuntend', 'Voorbeeldig', '• Is een voorbeeld in zelfreflectie en persoonlijke groei\n• Helpt anderen bij hun reflectieproces');

-- GI 8.2: Staat open voor feedback.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(20, 1, 'Onvoldoende', 'Onder verwachting', '• Wijst feedback af of reageert defensief\n• Past gedrag niet aan na feedback'),
(20, 2, 'Zwak', 'Onvolledig', '• Accepteert feedback maar verandert weinig\n• Heeft meerdere herinneringen nodig'),
(20, 3, 'Voldoende', 'Aan verwachting', '• Staat open voor feedback en past gedrag aan\n• Vraagt zelf om feedback wanneer nodig'),
(20, 4, 'Goed', 'Boven verwachting', '• Zoekt actief feedback op en integreert deze snel\n• Bedankt anderen voor constructieve kritiek'),
(20, 5, 'Uitmuntend', 'Voorbeeldig', '• Gebruikt feedback als groeikans en geeft zelf constructieve feedback\n• Creëert een feedbackcultuur in het team');

-- GI 9.1: Toont verantwoordelijkheid en betrouwbaarheid.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(21, 1, 'Onvoldoende', 'Onder verwachting', '• Is onbetrouwbaar en neemt geen verantwoordelijkheid\n• Komt afspraken niet na'),
(21, 2, 'Zwak', 'Onvolledig', '• Toont wisselende betrouwbaarheid\n• Neemt verantwoordelijkheid alleen na aandringen'),
(21, 3, 'Voldoende', 'Aan verwachting', '• Is betrouwbaar en komt afspraken na\n• Neemt verantwoordelijkheid voor eigen werk'),
(21, 4, 'Goed', 'Boven verwachting', '• Is een betrouwbare teamspeler waarop anderen rekenen\n• Signaleert proactief wanneer iets fout dreigt te gaan'),
(21, 5, 'Uitmuntend', 'Voorbeeldig', '• Is het aanspreekpunt voor betrouwbaarheid in het team\n• Neemt verantwoordelijkheid voor het teamresultaat');

-- GI 9.2: Werkt constructief samen.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(22, 1, 'Onvoldoende', 'Onder verwachting', '• Werkt niet samen of hindert het team\n• Deelt geen informatie met collega''s'),
(22, 2, 'Zwak', 'Onvolledig', '• Werkt samen wanneer het moet maar neemt weinig initiatief\n• Samenwerking is functioneel maar niet constructief'),
(22, 3, 'Voldoende', 'Aan verwachting', '• Werkt constructief samen en draagt bij aan teamdoelen\n• Deelt kennis en informatie met collega''s'),
(22, 4, 'Goed', 'Boven verwachting', '• Stimuleert samenwerking en helpt collega''s actief\n• Brengt verschillende perspectieven samen'),
(22, 5, 'Uitmuntend', 'Voorbeeldig', '• Is de verbindende factor in het team\n• Tilt de samenwerking naar een hoger niveau');

-- GI 9.3: Gaat respectvol om met collega's en stakeholders.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(23, 1, 'Onvoldoende', 'Onder verwachting', '• Gaat onrespect vol om met anderen\n• Houdt geen rekening met gevoelens of standpunten'),
(23, 2, 'Zwak', 'Onvolledig', '• Is meestal respectvol maar kan ongepast reageren onder druk\n• Mist tact in delicate situaties'),
(23, 3, 'Voldoende', 'Aan verwachting', '• Gaat respectvol om met collega''s en stakeholders\n• Toont begrip voor verschillende standpunten'),
(23, 4, 'Goed', 'Boven verwachting', '• Bouwt positieve relaties op met alle betrokkenen\n• Bemiddelt bij conflicten'),
(23, 5, 'Uitmuntend', 'Voorbeeldig', '• Is een voorbeeld in professioneel en respectvol gedrag\n• Creëert een inclusieve en veilige werkomgeving');

-- GI 10.1: Neemt initiatief en toont proactiviteit.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(24, 1, 'Onvoldoende', 'Onder verwachting', '• Wacht altijd op instructies en neemt geen initiatief\n• Toont geen eigenaarschap over taken'),
(24, 2, 'Zwak', 'Onvolledig', '• Neemt af en toe initiatief maar alleen bij eenvoudige taken\n• Heeft regelmatig aansturing nodig'),
(24, 3, 'Voldoende', 'Aan verwachting', '• Neemt initiatief bij taken binnen het eigen werkgebied\n• Pakt problemen aan zonder dat het gevraagd wordt'),
(24, 4, 'Goed', 'Boven verwachting', '• Is proactief en ziet werk dat gedaan moet worden\n• Stelt verbeteringen voor en voert ze uit'),
(24, 5, 'Uitmuntend', 'Voorbeeldig', '• Drijft innovatie en verbetering binnen het team\n• Inspireert anderen om ook initiatief te nemen');

-- GI 10.2: Signaleert kansen en draagt bij aan verbetering.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(25, 1, 'Onvoldoende', 'Onder verwachting', '• Ziet geen verbetermogelijkheden\n• Accepteert de status quo zonder vragen'),
(25, 2, 'Zwak', 'Onvolledig', '• Ziet af en toe kansen maar brengt ze niet in\n• Wacht tot anderen verbeteringen voorstellen'),
(25, 3, 'Voldoende', 'Aan verwachting', '• Signaleert kansen voor verbetering en deelt ze\n• Draagt actief bij aan procesverbetering'),
(25, 4, 'Goed', 'Boven verwachting', '• Identificeert structurele verbetermogelijkheden\n• Werkt verbeteringen uit tot concrete voorstellen'),
(25, 5, 'Uitmuntend', 'Voorbeeldig', '• Is de drijvende kracht achter continue verbetering\n• Implementeert verbeteringen die breed gedragen worden');

-- GI 11.1: Handelt integer en respecteert vertrouwelijkheid.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(26, 1, 'Onvoldoende', 'Onder verwachting', '• Gaat onzorgvuldig om met vertrouwelijke informatie\n• Handelt niet integer in professionele situaties'),
(26, 2, 'Zwak', 'Onvolledig', '• Kent de regels maar past ze niet consequent toe\n• Deelt soms informatie die vertrouwelijk is'),
(26, 3, 'Voldoende', 'Aan verwachting', '• Handelt integer en respecteert vertrouwelijkheid\n• Volgt de geldende gedragscodes en afspraken'),
(26, 4, 'Goed', 'Boven verwachting', '• Is een voorbeeld in integer handelen\n• Signaleert ethische dilemma''s proactief'),
(26, 5, 'Uitmuntend', 'Voorbeeldig', '• Creëert bewustzijn rond integriteit in het team\n• Helpt anderen bij het navigeren van ethische kwesties');

-- GI 11.2: Houdt rekening met de maatschappelijke impact van ICT.
INSERT INTO subcompetentie_niveau (subcompetentie_id, niveau, label, sublabel, beschrijving) VALUES
(27, 1, 'Onvoldoende', 'Onder verwachting', '• Toont geen besef van de maatschappelijke impact van ICT\n• Beoordeelt oplossingen enkel op technische haalbaarheid'),
(27, 2, 'Zwak', 'Onvolledig', '• Erkent dat er impact is maar kan die niet analyseren\n• Benoemt effecten oppervlakkig na aansturing'),
(27, 3, 'Voldoende', 'Aan verwachting', '• Analyseert sociale en maatschappelijke effecten van ICT-keuzes\n• Maakt onderscheid tussen korte- en langetermijngevolgen'),
(27, 4, 'Goed', 'Boven verwachting', '• Beoordeelt projecten op meerdere dimensies (mens, milieu, financieel)\n• Formuleert aanbevelingen op basis van die analyse'),
(27, 5, 'Uitmuntend', 'Voorbeeldig', '• Houdt rekening met duurzaamheid bij elke ontwerpkeuze\n• Brengt anderen mee in een breder ethisch perspectief');

-- Update competentie beschrijvingen
UPDATE competentie SET beschrijving = 'De lerende professional stelt een realistische planning op, bewaakt de voortgang en past aan bij veranderende omstandigheden.' WHERE id = 1;
UPDATE competentie SET beschrijving = 'De lerende professional analyseert vereisten en ontwerpt schaalbare, veilige en onderhoudbare IT-oplossingen.' WHERE id = 2;
UPDATE competentie SET beschrijving = 'De lerende professional schrijft kwalitatieve code, test grondig en levert werkende software op binnen de afgesproken termijnen.' WHERE id = 3;
UPDATE competentie SET beschrijving = 'De lerende professional integreert verschillende technologieën en beheert ontwikkel- en productieomgevingen.' WHERE id = 4;
UPDATE competentie SET beschrijving = 'De lerende professional zoekt actief naar nieuwe technologieën en onderbouwt keuzes met relevante bronnen.' WHERE id = 5;
UPDATE competentie SET beschrijving = 'De lerende professional communiceert helder, rapporteert gestructureerd en luistert actief.' WHERE id = 6;
UPDATE competentie SET beschrijving = 'De lerende professional analyseert problemen systematisch en zoekt creatieve, efficiënte oplossingen.' WHERE id = 7;
UPDATE competentie SET beschrijving = 'De lerende professional reflecteert kritisch op het eigen functioneren en staat open voor feedback.' WHERE id = 8;
UPDATE competentie SET beschrijving = 'De lerende professional toont verantwoordelijkheid, werkt constructief samen en gaat respectvol om met anderen.' WHERE id = 9;
UPDATE competentie SET beschrijving = 'De lerende professional neemt initiatief, signaleert kansen en draagt bij aan verbetering.' WHERE id = 10;
UPDATE competentie SET beschrijving = 'De lerende professional handelt ethisch en duurzaam binnen ICT-projecten, met oog voor wetgeving, sociale impact en verantwoordelijkheid.' WHERE id = 11;
