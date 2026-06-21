# Backend — Node.js + Express

REST API voor het Stage Monitoring Tool. Gebouwd met **Express 5**, **MySQL** (via mysql2) en **JWT**-authenticatie.

## Starten

```bash
npm install
npm run dev     # met nodemon (hot-reload)
npm start       # zonder hot-reload
```

Server draait op `http://localhost:3000`

## Vereisten

- **Node.js** v18+
- **XAMPP** met MySQL draaiend op poort `3307`
- `.env` bestand in deze map:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=stage_monitor
DB_PORT=3307
JWT_SECRET=<jouw-geheim>
```

## Technologieën

| Package | Doel |
|---------|------|
| express | HTTP framework & routing |
| mysql2 | MySQL connection pool (promises) |
| jsonwebtoken | JWT-tokens voor authenticatie |
| bcrypt | Wachtwoord hashing |
| multer | Bestandsuploads (logboeken, documenten) |
| cors | Cross-Origin Resource Sharing |
| dotenv | Omgevingsvariabelen uit `.env` |
| nodemailer | E-mail verzenden (accountgegevens) |

## Mappenstructuur

```
backend-node/
├── server.js              # Express app, middleware, route-mounting
├── db.js                  # MySQL connection pool
├── .env                   # Omgevingsvariabelen (niet in git)
├── middleware/
│   └── authMiddelware.js  # JWT-verificatie & rolcontrole
├── routes/
│   ├── auth.js            # Login (POST /api/auth/login)
│   ├── gebruikers.js      # Docenten & mentoren ophalen
│   ├── stages.js          # Stagevoorstellen, beoordeling, ondertekening
│   ├── logboeken.js       # Weeklogboeken CRUD + beoordeling
│   ├── evaluaties.js      # Tussentijdse & eindevaluaties + scores
│   ├── competenties.js    # Competenties & subcompetenties per opleiding
│   ├── documenten.js      # Document upload & feedback
│   ├── bedrijven.js       # Bedrijven CRUD
│   └── admin.js           # Admin dashboard, gebruikers-, stage- & competentiebeheer
└── uploads/               # Geüploade bestanden (multer)
```

## Authenticatie

1. Student/docent/mentor logt in via `POST /api/auth/login` met email + wachtwoord
2. Backend verifieert met **bcrypt** en geeft een **JWT-token** terug (geldig 8 uur)
3. Token bevat: `{ id, email, rollen[] }`
4. Elke beveiligde route gebruikt `authMiddleware` om het token te checken
5. Rolcontrole via `hasRole("docent", "admin")` — checkt of minstens één rol matcht

## API-routes

### Auth (`/api/auth`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| POST | `/login` | Inloggen, retourneert JWT-token |

### Stages (`/api/stages`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/mijn` | Stages van ingelogde student |
| GET | `/docent/mijn` | Stages gekoppeld aan docent |
| GET | `/mentor/mijn` | Stages gekoppeld aan mentor |
| GET | `/bedrijf/mijn` | Stages van bedrijfsaccount |
| GET | `/overeenkomst-document` | Overeenkomstgegevens met artikelteksten |
| GET | `/:id` | Stage detail met alle JOINs |
| GET | `/` | Alle stages (commissie/admin) |
| POST | `/` | Nieuw stagevoorstel indienen |
| PUT | `/:id` | Stagevoorstel opnieuw indienen |
| PUT | `/:id/bewerken` | Stage bewerken (commissie/admin) |
| PATCH | `/:id/koppelingen` | Bedrijf/mentor koppelen (admin) |
| POST | `/:id/beslissing` | Goedkeuren/afkeuren/aanpassingen vereist |
| POST | `/:id/onderteken` | Digitale handtekening (canvas PNG) |

### Logboeken (`/api/logboeken`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/mijn` | Logboeken van student |
| GET | `/mijn/overzicht` | Weekoverzicht met berekende weken |
| GET | `/docent/te-beoordelen` | Ingediende logboeken voor docent |
| GET | `/mentor/te-beoordelen` | Ingediende logboeken voor mentor |
| GET | `/stage/:stageId` | Alle logboeken van een stage |
| GET | `/:id` | Logboek detail (dagen, reacties, bestanden) |
| POST | `/` | Nieuw logboek aanmaken |
| PUT | `/:id` | Logboek bewerken (enkel bij status concept) |
| POST | `/:id/indienen` | Logboek indienen ter beoordeling |
| POST | `/:id/reactie` | Reactie/feedback toevoegen |
| POST | `/:id/goedkeuren` | Logboek goedkeuren |
| POST | `/:id/bestanden` | Bestanden uploaden bij logboek |
| DELETE | `/bestanden/:bestandId` | Bestand verwijderen |

### Evaluaties (`/api/evaluaties`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/student/mijn` | Evaluaties van student |
| GET | `/stage/:stageId` | Evaluaties van een stage met scores |
| GET | `/alle` | Alle evaluaties (commissie/admin) |
| GET | `/:id` | Evaluatie detail met scores per competentie |
| POST | `/` | Nieuwe evaluatie aanmaken |
| PUT | `/:id/scores` | Docentscores + eindcijfer invullen |
| PUT | `/:id/mentor-scores` | Mentorscores invullen |
| PUT | `/:id/reflectie` | Studentreflectie invullen |
| POST | `/:id/indienen` | Evaluatie indienen/afronden |

### Competenties (`/api/competenties`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/` | Alle competenties met subcompetenties & niveaus |
| GET | `/stage/:stageId` | Competenties gefilterd op opleiding van stage |

### Documenten (`/api/documenten`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/stage/:stageId` | Documenten van een stage |
| GET | `/:id/download` | Document downloaden |
| POST | `/` | Document uploaden |
| PUT | `/:id/feedback` | Feedback op document |
| DELETE | `/:id` | Document verwijderen |

### Bedrijven (`/api/bedrijven`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/` | Alle bedrijven |
| POST | `/` | Bedrijf toevoegen |
| PUT | `/:id` | Bedrijf bewerken |
| DELETE | `/:id` | Bedrijf verwijderen (enkel als niet in gebruik) |

### Admin (`/api/admin`)
| Methode | Route | Beschrijving |
|---------|-------|-------------|
| GET | `/stats` | Dashboard statistieken |
| GET | `/academiejaren` | Beschikbare academiejaren |
| GET | `/gebruikers` | Alle gebruikers met rollen |
| POST | `/gebruikers` | Gebruiker aanmaken (bcrypt hash + rol-tabel) |
| PUT | `/gebruikers/:id` | Gebruiker bewerken |
| DELETE | `/gebruikers/:id` | Gebruiker verwijderen |
| GET | `/stages` | Alle stages |
| PUT | `/stages/:id` | Stage bewerken |
| DELETE | `/stages/:id` | Stage verwijderen |
| GET | `/bedrijven` | Bedrijven beheren |
| GET | `/evaluaties` | Evaluaties beheren |
| GET | `/competenties/opleidingen` | Opleidingen ophalen |
| * | `/competenties/*` | Competentie/subcompetentie/niveau CRUD |

## Scoreberekening

Elke subcompetentie wordt gescoord op **1–5 punten**. Het totaalcijfer wordt berekend op **/20**:

```
eindcijfer = (som_van_scores / (aantal_ingevuld × 5)) × 20
```

## Database

MySQL database `stage_monitor` met o.a.:

- **gebruiker** + **gebruiker_rol** — gebruikers met meerdere rollen
- **student** / **docent** / **mentor** — rolspecifieke gegevens
- **bedrijf** — stagebedrijven
- **stage** — stagevoorstellen met status-flow
- **stage_beslissing** — goedkeur/afkeurhistoriek
- **stage_handtekening** — digitale ondertekeningen (PNG)
- **logboek** + **logboek_dag** — weeklogboeken met dagentries
- **logboek_reactie** — feedback op logboeken
- **logboek_bestand** — uploads bij logboeken
- **evaluatie** — tussentijdse & eindevaluaties
- **competentie** → **subcompetentie** → **subcompetentie_niveau** — rubrieken
- **competentiescore** — scores per subcompetentie per evaluatie
- **document** — geüploade documenten met feedback

## Status-flows

**Stage:** `concept` → `ingediend` → `in_beoordeling` → `goedgekeurd` / `afgekeurd` / `aanpassingen_vereist` → `wacht_op_overeenkomst` → `actief` → `afgerond`

**Logboek:** `concept` → `ingediend` → `goedgekeurd`

**Evaluatie:** `open` → `ingediend` → `afgerond`
