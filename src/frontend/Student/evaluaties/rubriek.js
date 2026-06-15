const API_BASE_URL = API_BASE;

// Fallback rubric data gebaseerd op de 11 competenties in de database
const FALLBACK_COMPETENTIES = [
  {
    id: 1, naam: "Beheersing planningsproces", subcomps: [
      { code: "C1.1", naam: "Project- en werkplanning opstellen", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Plant niet of nauwelijks. Deadlines worden regelmatig gemist." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Plant oppervlakkig. Prioriteiten zijn onduidelijk." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Stelt een basisplanning op en volgt die globaal op." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Plant gedetailleerd, bewaakt voortgang en stuurt bij waar nodig." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Proactief plannen met risicobeheer en heldere communicatie naar alle betrokkenen." }
      ]},
      { code: "C1.2", naam: "Voortgang bewaken en rapporteren", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Rapporteert niet over voortgang." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Rapporteert sporadisch en onvolledig." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Rapporteert regelmatig over de stand van zaken." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Bewaakt actief de voortgang en communiceert knelpunten tijdig." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Stelt heldere statusrapporten op en initieert bijsturing proactief." }
      ]}
    ]
  },
  {
    id: 2, naam: "Ontwerpen IT-oplossingen", subcomps: [
      { code: "C2.1", naam: "Requirements analyseren en documenteren", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Begrijpt requirements niet of werkt zonder analyse." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Haalt basisvereisten op maar mist details." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Analyseert requirements en legt ze vast in een begrijpelijk document." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Stelt volledige requirements op met functionele en niet-functionele eisen." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Begeleidt stakeholders bij het verhelderen van noden en vertaalt deze naar heldere specificaties." }
      ]},
      { code: "C2.2", naam: "Technische architectuur ontwerpen", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Ontwerpt niet of kiest ongeschikte oplossingen." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Basisontwerp aanwezig maar met grote lacunes." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Ontwerpt een werkende architectuur die voldoet aan de basisvereisten." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Ontwerpt een schaalbare en onderhoudbare architectuur met goede onderbouwing." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Evalueert meerdere architectuurpatronen en kiest de beste oplossing met uitgebreide documentatie." }
      ]}
    ]
  },
  {
    id: 3, naam: "Implementatie digitale producten", subcomps: [
      { code: "C3.1", naam: "Code schrijven en testen", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Schrijft nauwelijks werkende code. Testen ontbreken." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Code werkt deels maar bevat veel fouten of technische schuld." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Schrijft leesbare, werkende code en test basisfunctionaliteit." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Code is goed gestructureerd, gedocumenteerd en uitgebreid getest." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Hanteert best practices, schrijft herbruikbare componenten en levert productiekwaliteit code." }
      ]}
    ]
  },
  {
    id: 4, naam: "Integratie technologie", subcomps: [
      { code: "C4.1", naam: "Systemen en tools integreren", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Heeft moeite met het koppelen van systemen." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Basisintegraties lukken maar complexere koppellingen niet." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Integreert systemen correct met behulp van documentatie." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Integreert meerdere systemen vlot en lost integratieproblemen zelfstandig op." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Ontwerpt robuuste integraties met foutafhandeling en monitoring." }
      ]}
    ]
  },
  {
    id: 5, naam: "Onderzoekende houding", subcomps: [
      { code: "C5.1", naam: "Informatie verzamelen en kritisch beoordelen", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Zoekt nauwelijks informatie op of neemt alles kritiekloos over." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Zoekt informatie maar beoordeelt de betrouwbaarheid onvoldoende." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Verzamelt relevante informatie en vergelijkt bronnen." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Onderzoekt systematisch en trekt gefundeerde conclusies." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Hanteert een wetenschappelijke aanpak, vergelijkt alternatieven en onderbouwt keuzes helder." }
      ]}
    ]
  },
  {
    id: 6, naam: "Communicatie", subcomps: [
      { code: "C6.1", naam: "Mondeling communiceren", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Communiceert onduidelijk of nauwelijks." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Communiceert maar boodschap komt niet altijd over." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Communiceert duidelijk en begrijpelijk in gangbare situaties." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Past communicatiestijl aan het publiek aan en gaat constructief om met feedback." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Communiceert overtuigend, presenteert helder en faciliteert productieve gesprekken." }
      ]},
      { code: "C6.2", naam: "Schriftelijk rapporteren", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Rapporten zijn onvolledig of onbegrijpelijk." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Rapporten zijn aanwezig maar slecht gestructureerd." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Schrijft gestructureerde rapporten met de nodige informatie." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Rapporten zijn helder, volledig en professioneel opgemaakt." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Stelt uitstekende technische en functionele documenten op die direct bruikbaar zijn." }
      ]}
    ]
  },
  {
    id: 7, naam: "Probleemoplossend vermogen", subcomps: [
      { code: "C7.1", naam: "Problemen analyseren en oplossen", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Loopt vast bij problemen en vraagt steeds hulp." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Probeert problemen op te lossen maar zonder systematische aanpak." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Analyseert problemen en komt tot een werkende oplossing." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Lost problemen systematisch op en leert ervan voor de toekomst." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Anticipeert op problemen, kiest de beste oplossing en deelt kennis met het team." }
      ]}
    ]
  },
  {
    id: 8, naam: "Persoonlijke ontwikkeling", subcomps: [
      { code: "C8.1", naam: "Zelfreflectie en groei", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Reflecteert niet over eigen functioneren." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Reflecteert oppervlakkig zonder concrete verbeterpunten." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Reflecteert regelmatig en formuleert leerpunten." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Gebruikt feedback actief om zichzelf te verbeteren." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Toont aantoonbare groei en neemt initiatief voor eigen ontwikkeling." }
      ]}
    ]
  },
  {
    id: 9, naam: "Professionele attitude", subcomps: [
      { code: "C9.1", naam: "Betrouwbaarheid en verantwoordelijkheid", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Afspraken worden niet nagekomen. Verantwoordelijkheid wordt vermeden." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Komt afspraken gedeeltelijk na maar niet altijd betrouwbaar." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Komt afspraken na en neemt verantwoordelijkheid voor eigen werk." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Zeer betrouwbaar, transparant over knelpunten en neemt initiatief." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Rolmodel in betrouwbaarheid. Ondersteunt collega's en draagt bij aan een positieve werksfeer." }
      ]}
    ]
  },
  {
    id: 10, naam: "Ondernemend handelen", subcomps: [
      { code: "C10.1", naam: "Initiatief nemen en kansen benutten", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Wacht af en neemt geen initiatief." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Neemt soms initiatief maar blijft passief in nieuwe situaties." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Neemt initiatief bij bekende taken en stelt vragen wanneer nodig." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Grijpt kansen, denkt mee over verbeteringen en handelt proactief." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Genereer nieuwe ideeën, overtuigt anderen en realiseert verbeteringen zelfstandig." }
      ]}
    ]
  },
  {
    id: 11, naam: "Ethisch handelen", subcomps: [
      { code: "C11.1", naam: "Integriteit en privacy respecteren", niveaus: [
        { niveau: 1, label: "Onvoldoende", sublabel: "Onder verwachting", beschrijving: "Toont weinig besef van ethische aspecten in het werk." },
        { niveau: 2, label: "Zwak", sublabel: "Bijna voldoende", beschrijving: "Heeft basiskennis van ethiek maar past die niet consistent toe." },
        { niveau: 3, label: "Voldoende", sublabel: "Naar verwachting", beschrijving: "Handelt integer en respecteert privacy en afspraken." },
        { niveau: 4, label: "Goed", sublabel: "Boven verwachting", beschrijving: "Signaleert ethische kwesties en bespreekt ze constructief." },
        { niveau: 5, label: "Uitmuntend", sublabel: "Ver boven verwachting", beschrijving: "Toont voorbeeldgedrag op vlak van integriteit en ethisch bewustzijn in alle situaties." }
      ]}
    ]
  }
];

document.addEventListener("DOMContentLoaded", async function () {
  const token = sessionStorage.getItem("token");

  let competenties = null;

  if (token) {
    try {
      const res = await fetch(API_BASE_URL + "/competenties", {
        headers: { "Authorization": "Bearer " + token }
      });
      if (res.ok) competenties = await res.json();
    } catch (e) {}
  }

  if (!competenties || !competenties.length) {
    competenties = FALLBACK_COMPETENTIES;
  }

  renderRubriek(competenties);

  document.getElementById("btnAllesOpen").addEventListener("click", function () {
    document.querySelectorAll(".rubriek-comp-body").forEach(function (b) { b.classList.add("open"); });
    document.querySelectorAll(".rubriek-comp-toggle").forEach(function (t) { t.classList.add("open"); });
  });
  document.getElementById("btnAllesDicht").addEventListener("click", function () {
    document.querySelectorAll(".rubriek-comp-body").forEach(function (b) { b.classList.remove("open"); });
    document.querySelectorAll(".rubriek-comp-toggle").forEach(function (t) { t.classList.remove("open"); });
  });
});

function renderRubriek(competenties) {
  const container = document.getElementById("rubriekContainer");
  let html = "";

  competenties.forEach(function (comp, idx) {
    const subCount = comp.subcomps ? comp.subcomps.length : 0;
    html += '<div class="rubriek-comp">';
    html += '<div class="rubriek-comp-header" onclick="toggleComp(this)">' +
      '<div class="rubriek-comp-num">' + (idx + 1) + '</div>' +
      '<div class="rubriek-comp-name">' + escHtml(comp.naam) + '</div>' +
      '<div class="rubriek-comp-count">' + subCount + ' subcompetentie' + (subCount !== 1 ? 's' : '') + '</div>' +
      '<span class="rubriek-comp-toggle">›</span>' +
    '</div>';

    html += '<div class="rubriek-comp-body">';
    if (comp.subcomps && comp.subcomps.length > 0) {
      comp.subcomps.forEach(function (sub) {
        html += '<div class="rubriek-subcomp">';
        html += '<div class="rubriek-subcomp-header">';
        if (sub.code) html += '<span class="rubriek-subcomp-code">' + escHtml(sub.code) + '</span>';
        html += '<span class="rubriek-subcomp-name">' + escHtml(sub.naam) + '</span>';
        html += '</div>';

        html += '<div class="niveau-grid">';
        const niveauMap = {};
        if (sub.niveaus) {
          sub.niveaus.forEach(function (n) { niveauMap[n.niveau] = n; });
        }
        for (let n = 1; n <= 5; n++) {
          const niv = niveauMap[n] || {};
          html += '<div class="niveau-cell niveau-' + n + '">';
          html += '<div class="niveau-cell-header">';
          html += '<div class="niveau-num">' + n + '</div>';
          html += '<div class="niveau-label">' + escHtml(niv.label || labelVoorNiveau(n)) + '</div>';
          if (niv.sublabel) html += '<div class="niveau-sublabel">' + escHtml(niv.sublabel) + '</div>';
          html += '</div>';
          if (niv.beschrijving) {
            html += '<div class="niveau-desc">' + escHtml(niv.beschrijving) + '</div>';
          }
          html += '</div>';
        }
        html += '</div></div>';
      });
    } else {
      html += '<div style="padding: 20px; color: #9ca3af; font-size: 14px;">Geen subcompetenties beschikbaar.</div>';
    }
    html += '</div></div>';
  });

  container.innerHTML = html;
}

function toggleComp(header) {
  const body = header.nextElementSibling;
  const toggle = header.querySelector(".rubriek-comp-toggle");
  body.classList.toggle("open");
  toggle.classList.toggle("open");
}

function labelVoorNiveau(n) {
  return ["", "Onvoldoende", "Zwak", "Voldoende", "Goed", "Uitmuntend"][n] || "";
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
