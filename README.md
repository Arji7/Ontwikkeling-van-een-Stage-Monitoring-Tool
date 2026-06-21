# Stage Monitoring Tool

> Schoolproject — Toegepaste Informatica, Erasmushogeschool Brussel (EhB), academiejaar 2025–2026.

De opleiding wil het stageproces digitaliseren via één centrale tool voor studenten, docenten, mentoren en de stagecommissie. De applicatie ondersteunt het volledige stagetraject: van het indienen van een stagevoorstel tot de eindevaluatie.

## Functionaliteiten

### Student
- Stagevoorstel indienen en opvolgen
- Stageovereenkomst digitaal ondertekenen
- Wekelijks logboek bijhouden (met dagoverzicht, competenties en bestanden)
- Evaluatiescores en feedback raadplegen
- Documenten uploaden

### Docent (stagebegeleider)
- Overzicht van toegewezen stagiairs
- Logboeken beoordelen en feedback geven
- Tussentijdse en eindevaluaties invullen met scores per competentie
- Eindcijfer berekenen (automatisch op /20)

### Stagementor (bedrijf)
- Logboeken bekijken en reageren
- Mentorscores invullen bij evaluaties
- Stageovereenkomst ondertekenen

### Stagecommissie
- Stagevoorstellen beoordelen (goedkeuren / afkeuren / aanpassingen vereisen)
- Docent toewijzen aan stage
- Overzicht van alle lopende stages en evaluaties

### Admin
- Gebruikersbeheer (aanmaken, bewerken, verwijderen) met rolsysteem
- Stage-, bedrijven- en competentiebeheer
- Dashboard met statistieken
- Academiejaar- en opleidingsbeheer

## Tech Stack

| Laag | Technologie |
|------|-------------|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Backend | Node.js, Express 5 |
| Database | MySQL (via XAMPP) |
| Authenticatie | JWT (jsonwebtoken) + bcrypt |
| Bestandsuploads | Multer |
| Versiebeheer | Git + GitHub |

## Projectstructuur

```
Ontwikkeling-van-een-Stage-Monitoring-Tool/
├── README.md
├── .gitignore
├── src/
│   ├── backend-node/
│   │   ├── server.js              # Express app & route-mounting
│   │   ├── db.js                  # MySQL connection pool
│   │   ├── .env                   # Omgevingsvariabelen (niet in git)
│   │   ├── middleware/
│   │   │   └── authMiddelware.js  # JWT-verificatie & rolcontrole
│   │   ├── routes/
│   │   │   ├── auth.js            # Login
│   │   │   ├── stages.js          # Stagevoorstellen & ondertekening
│   │   │   ├── logboeken.js       # Weeklogboeken
│   │   │   ├── evaluaties.js      # Evaluaties & scores
│   │   │   ├── competenties.js    # Competentieraamwerk
│   │   │   ├── documenten.js      # Documentuploads
│   │   │   ├── gebruikers.js      # Docenten & mentoren
│   │   │   ├── bedrijven.js       # Bedrijvenbeheer
│   │   │   └── admin.js           # Admin dashboard & CRUD
│   │   └── uploads/               # Geüploade bestanden
│   └── frontend/
│       ├── inloggen/              # Loginpagina
│       ├── Student/               # Alle studentenpagina's
│       ├── Docent/                # Docentpagina's
│       ├── Mentor/                # Mentorpagina's
│       ├── Commisie/              # Commissiepagina's
│       ├── Admin/                 # Adminpagina's
│       └── Bedrijf/               # Bedrijfspagina's
```

## Installatie

### Vereisten
- [Node.js](https://nodejs.org/) v18+
- [XAMPP](https://www.apachefriends.org/) met MySQL op poort 3307

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

3. **Configureer de database**
   - Start XAMPP en zet MySQL aan
   - Importeer het databaseschema via phpMyAdmin (`stage_monitor`)

4. **Maak een `.env` bestand** in `src/backend-node/`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=stage_monitor
   DB_PORT=3307
   JWT_SECRET=mijn_geheime_sleutel
   ```

5. **Start de backend**
   ```bash
   npm run dev
   ```
   Server draait op `http://localhost:3000`

6. **Open de frontend**
   Open `src/frontend/inloggen/inloggen.html` in de browser (of via Live Server in VS Code).

## Hoe de app werkt

### Authenticatie-flow
1. Gebruiker logt in met e-mail en wachtwoord
2. Backend verifieert het wachtwoord met bcrypt en genereert een JWT-token (8 uur geldig)
3. Frontend slaat het token op in `sessionStorage`
4. Elk API-verzoek stuurt het token mee in de `Authorization: Bearer <token>` header
5. De `authMiddleware` verifieert het token en zet `req.user` (met id, email, rollen)
6. De `hasRole()` middleware controleert of de gebruiker de juiste rol heeft

### Stage-flow
```
Student dient voorstel in
        ↓
Commissie beoordeelt → Goedgekeurd / Afgekeurd / Aanpassingen vereist
        ↓
Goedgekeurd → Overeenkomst ondertekenen (student + mentor + commissielid)
        ↓
Alle handtekeningen → Stage wordt "actief"
        ↓
Student houdt logboeken bij + evaluaties worden ingevuld
        ↓
Eindevaluatie met eindcijfer → Stage "afgerond"
```

### Scoreberekening
Elke subcompetentie wordt gescoord op **1–5 punten**. Het eindcijfer wordt berekend op **/20**:

```
eindcijfer = (som_van_scores / (aantal_ingevuld × 5)) × 20
```

## Branching-strategie

| Branch | Doel |
|--------|------|
| `main` | Stabiele productieversie |
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
| `gebruiker` + `gebruiker_rol` | Gebruikers met meervoudig rolsysteem |
| `student` / `docent` / `mentor` | Rolspecifieke gegevens |
| `stage` | Stagevoorstellen met statusflow |
| `stage_beslissing` | Goedkeur-/afkeurhistoriek met motivatie |
| `stage_handtekening` | Digitale handtekeningen (canvas PNG) |
| `logboek` + `logboek_dag` | Weeklogboeken met dagentries |
| `evaluatie` | Tussentijdse & eindevaluaties |
| `competentie` → `subcompetentie` → `subcompetentie_niveau` | Competentieraamwerk met rubriekniveaus |
| `competentiescore` | Scores per subcompetentie per evaluatie |
| `document` | Geüploade documenten met feedback |

## Team

| Naam | Voornaam | E-mail | Rol |
|------|----------|--------|-----|
| Rajouai | Ayoub | ayoub.rajouai@student.ehb.be | Backend |
| Hamdaoui | Farouk | farouk.hamdaoui@student.ehb.be | Backend |
| Ramdani | Achraf | achraf.ramdani@student.ehb.be | Frontend |
| Rafaqat | Rafy | rafy.rafaqat@student.ehb.be | Frontend |
