# Stage Monitoring Tool

> Schoolproject — Toegepaste Informatica, Erasmushogeschool Brussel (EhB), academiejaar 2025–2026.

De opleiding wil het stageproces digitaliseren via één centrale tool voor studenten, docenten, mentoren en de stagecommissie. De applicatie ondersteunt het volledige stagetraject: van het indienen van een stagevoorstel tot de eindevaluatie.

## 🚀 Live applicatie

De applicatie draait op de school-VM:

**http://10.2.160.240:3000/inloggen/inloggen.html**

> Bereikbaar binnen het EhB-netwerk (op school of via school-VPN).

## Functionaliteiten

### Student
- Stagevoorstel indienen en opvolgen (incl. nieuw bedrijf toevoegen)
- Stageovereenkomst digitaal ondertekenen
- Wekelijks logboek bijhouden (met dagoverzicht, competenties en bestanden)
- Evaluatiescores en feedback raadplegen
- Bevestigingsscherm met eindcijfer na afronding
- Documenten uploaden

### Docent (stagebegeleider)
- Overzicht van toegewezen stagiairs
- Logboeken beoordelen en feedback geven
- Tussentijdse en eindevaluaties invullen met scores per competentie
- Eindcijfer berekenen (automatisch op /20)
- Rubriek per opleiding raadplegen

### Stagementor (bedrijf)
- Logboeken bekijken en reageren
- Mentorscores invullen bij evaluaties
- Stageovereenkomst ondertekenen
- Stageovereenkomst-document raadplegen

### Stagecommissie
- Stagevoorstellen beoordelen (goedkeuren / afkeuren / aanpassingen vereisen)
- Docent toewijzen aan stage
- Overzicht van alle lopende stages en evaluaties
- Afgewezen stages worden uit overzicht gefilterd

### Admin
- Gebruikersbeheer (aanmaken, bewerken, verwijderen) met rolsysteem
- Stage-, bedrijven- en competentiebeheer
- Dashboard met statistieken
- Academiejaar- en opleidingsbeheer
- Competenties koppelen aan opleidingen

## Tech Stack

| Laag | Technologie |
|------|-------------|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Backend | Node.js, Express 5 |
| Database | MySQL 8 / MariaDB (poort 3306) |
| Authenticatie | JWT (jsonwebtoken) + bcrypt |
| Bestandsuploads | Multer |
| Security | Helmet, express-rate-limit, CORS-whitelist |
| Process manager | PM2 (op de VM) |
| Versiebeheer | Git + GitHub |

## Projectstructuur

```
Ontwikkeling-van-een-Stage-Monitoring-Tool/
├── README.md
├── .gitignore
├── database/
│   ├── create_tables.sql           # Volledig schema (30 tabellen)
│   ├── insert_subcompetenties.sql  # Seed: subcompetenties per competentie
│   └── update_niveaus.sql          # Seed: rubriek-niveaus 1–5
├── src/
│   ├── backend-node/
│   │   ├── server.js               # Express app, helmet, CORS, rate-limit
│   │   ├── db.js                   # MySQL connection pool
│   │   ├── .env                    # Omgevingsvariabelen (niet in git)
│   │   ├── middleware/
│   │   │   └── authMiddelware.js   # JWT-verificatie & rolcontrole
│   │   ├── routes/
│   │   │   ├── auth.js             # Login / logout
│   │   │   ├── stages.js           # Stagevoorstellen, ondertekening, koppelingen
│   │   │   ├── logboeken.js        # Weeklogboeken
│   │   │   ├── evaluaties.js       # Evaluaties & scores
│   │   │   ├── competenties.js     # Competentieraamwerk per opleiding
│   │   │   ├── documenten.js       # Documentuploads
│   │   │   ├── gebruikers.js       # Docenten & mentoren
│   │   │   ├── bedrijven.js        # Bedrijvenbeheer
│   │   │   └── admin.js            # Admin dashboard & CRUD
│   │   └── uploads/                # Geüploade bestanden
│   └── frontend/
│       ├── config.js               # API_BASE wordt dynamisch afgeleid
│       ├── inloggen/               # Loginpagina
│       ├── Student/                # Alle studentenpagina's
│       ├── Docent/                 # Docentpagina's
│       ├── Mentor/                 # Mentorpagina's
│       ├── Commisie/               # Commissiepagina's
│       ├── Admin/                  # Adminpagina's
│       └── Bedrijf/                # Bedrijfspagina's
```

## Lokale installatie

### Vereisten
- [Node.js](https://nodejs.org/) v18+
- MySQL 8 of MariaDB (poort 3306)

### Stappen

1. **Clone de repository**
   ```bash
   git clone https://github.com/Arji7/Ontwikkeling-van-een-Stage-Monitoring-Tool.git
   cd Ontwikkeling-van-een-Stage-Monitoring-Tool
   ```

2. **Installeer dependencies**
   ```bash
   cd src/backend-node
   npm install
   ```

3. **Database aanmaken + schema laden**
   ```bash
   mysql -u root -p -e "CREATE DATABASE stage_monitor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p stage_monitor < ../../database/create_tables.sql
   mysql -u root -p stage_monitor < ../../database/insert_subcompetenties.sql
   mysql -u root -p stage_monitor < ../../database/update_niveaus.sql
   ```

4. **Maak een `.env` bestand** in `src/backend-node/`:
   ```env
   PORT=3000

   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=jouw_mysql_wachtwoord
   DB_NAME=stage_monitor

   JWT_SECRET=lange_random_string_van_minstens_32_tekens
   JWT_EXPIRES_IN=8h

   CORS_ORIGINS=http://localhost:3000,null
   ```

5. **Admin-account aanmaken** (zie `database/create_tables.sql` voor de roltabel-IDs):
   ```bash
   # Genereer hash
   node -e "console.log(require('bcrypt').hashSync('JouwWachtwoord!', 10))"
   # Insert in DB (vervang HASH_HIER)
   mysql -u root -p stage_monitor -e "INSERT INTO gebruiker (voornaam, achternaam, email, wachtwoord_hash, actief) VALUES ('Admin', 'Beheerder', 'admin@ehb.be', 'HASH_HIER', 1); INSERT INTO gebruiker_rol (gebruiker_id, rol_id) SELECT g.id, r.id FROM gebruiker g, rol r WHERE g.email='admin@ehb.be' AND r.naam='admin';"
   ```

6. **Start de backend**
   ```bash
   npm run dev
   ```
   Server draait op `http://localhost:3000`

7. **Open de applicatie**
   - In de browser: `http://localhost:3000/inloggen/inloggen.html`

## Deployment op de VM

De productie-VM draait Windows Server met:
- MySQL Server 8.0 als Windows service
- Node.js LTS
- PM2 als process manager (auto-restart bij crash en reboot)

### Onderhouds-commando's op de VM

```powershell
# Status van de backend bekijken
pm2 status

# Live logs zien
pm2 logs stagemonitor

# Backend herstarten na een wijziging
pm2 restart stagemonitor

# Code updaten en herstarten
cd C:\Ontwikkeling-van-een-Stage-Monitoring-Tool
git pull
cd src\backend-node
npm install                # alleen nodig als package.json wijzigde
pm2 restart stagemonitor
```

### Firewall

Poort **3000** moet openstaan in de Windows Firewall:
```powershell
New-NetFirewallRule -DisplayName "Stage Monitor Backend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## Hoe de app werkt

### Authenticatie-flow
1. Gebruiker logt in met e-mail en wachtwoord
2. Backend verifieert het wachtwoord met bcrypt en genereert een JWT-token (8 uur geldig)
3. Frontend slaat het token op in `sessionStorage`
4. Elk API-verzoek stuurt het token mee in de `Authorization: Bearer <token>` header
5. De `authMiddleware` verifieert het token en zet `req.user` (met id, email, rollen)
6. De `hasRole()` middleware controleert of de gebruiker de juiste rol heeft

### Security
- **Helmet** zet security-headers (X-Frame-Options, X-Content-Type-Options, …)
- **CORS** is gewhitelist via `CORS_ORIGINS` env-var
- **Rate-limiter** op `/api/auth/login`: max 10 mislukte pogingen per IP per 15 minuten
- **Wachtwoorden** worden gehasht met bcrypt (rounds 10)

### Stage-flow
```
Student dient voorstel in
        ↓
Commissie beoordeelt → Goedgekeurd / Afgekeurd / Aanpassingen vereist
        ↓
Goedgekeurd → Overeenkomst ondertekenen (student + mentor + commissielid)
        ↓
Alle handtekeningen + mentor toegewezen → Stage wordt "actief"
        ↓
Student houdt logboeken bij + evaluaties worden ingevuld
        ↓
Eindevaluatie met eindcijfer → Stage "afgerond" + student ziet bevestigingsscherm
```

### Scoreberekening
Elke subcompetentie wordt gescoord op **1–5 punten**. Het eindcijfer wordt berekend op **/20**:

```
eindcijfer = (som_van_scores / (aantal_ingevuld × 5)) × 20
```

## Branching-strategie

| Branch | Doel |
|--------|------|
| `main` | Stabiele productieversie (draait op de VM) |
| `Test/main` | Integratiebranch voor testen |
| `Test/student-` | Ontwikkeling studentfunctionaliteit & backend |
| Feature-branches | Korte-termijn branches per functionaliteit (bijv. `feature/bekijken-leerlingen-docent`) |

Workflow: feature-branch → `Test/main` (via merge) → `main` (na goedkeuring).

## Database

Het ERD-schema is beschikbaar via dbdiagram.io:
[Bekijk het ERD-schema](https://dbdiagram.io/d/69f0b34cc6a36f9c1ba734a9)

### Belangrijkste tabellen

| Tabel | Beschrijving |
|-------|-------------|
| `gebruiker` + `gebruiker_rol` + `rol` | Gebruikers met meervoudig rolsysteem |
| `student` / `docent` / `mentor` | Rolspecifieke gegevens |
| `opleiding` + `opleiding_competentie` | Opleidingen met gekoppelde competenties |
| `bedrijf` | Stagebedrijven met contactgegevens |
| `stage` | Stagevoorstellen met statusflow |
| `beslissing` | Goedkeur-/afkeurhistoriek met motivatie |
| `stage_geschiedenis` | Volledige status-historiek van een stage |
| `stageovereenkomst` + `overeenkomst_handtekening` | Digitale overeenkomst en handtekeningen |
| `logboek` + `logboek_dag` + `logboek_bestand` | Weeklogboeken met dagentries en bijlagen |
| `evaluatie` + `evaluatie_feedback` | Tussentijdse & eindevaluaties |
| `competentie` → `subcompetentie` → `subcompetentie_niveau` | Competentieraamwerk met rubriekniveaus |
| `competentiescore` | Scores per subcompetentie per evaluatie |
| `document` + `document_feedback` | Geüploade documenten met feedback |
| `wachtwoord_reset` | Reset-tokens voor het wachtwoord-vergeten proces |

## Team

| Naam | Voornaam | E-mail | Rol |
|------|----------|--------|-----|
| Rajouai | Ayoub | ayoub.rajouai@student.ehb.be | Backend |
| Hamdaoui | Farouk | farouk.hamdaoui@student.ehb.be | Backend |
| Ramdani | Achraf | achraf.ramdani@student.ehb.be | Frontend |
| Rafaqat | Rafy | rafy.rafaqat@student.ehb.be | Frontend |
