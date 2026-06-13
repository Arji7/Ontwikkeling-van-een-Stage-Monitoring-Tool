var API_BASE_URL = "http://localhost:3000/api";
var DAGEN_NAMEN = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
var VERWACHTE_UREN = 38;

// State
var activeDag = 0;
var dagenData = [
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false },
  { uren: 0, taken: "", afwezig: false, reden: null, saved: false }
];
var geselecteerdeComps = []; // array van competentie-id's
var alleCompetenties = [];   // [{ id, naam, ... }]
var isReadonly = false;
var bestaandLogboekId = null;
var weekNummer = 1;
var datumVan = null;
var datumTot = null;
var aantalDagenDezeWeek = 5;   // standaard 5; minder bij laatste week van stage

document.addEventListener("DOMContentLoaded", function () {
  var token = sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "../../inloggen/inloggen.html";
    return;
  }

  var params = new URLSearchParams(window.location.search);
  isReadonly = params.get("readonly") === "1";
  bestaandLogboekId = params.get("id");
  weekNummer = parseInt(params.get("week")) || 1;

  laadCompetenties().then(async function () {
    if (bestaandLogboekId) {
      laadBestaandLogboek(bestaandLogboekId);
    } else {
      // Check of een concept voor deze week al bestaat
      var existingId = await zoekConceptVoorWeek(weekNummer);
      if (existingId) {
        bestaandLogboekId = existingId;
        laadBestaandLogboek(existingId);
      } else {
        initNieuwLogboek(weekNummer);
      }
    }
  });

  setupDayTabs();
  setupDagOpslaan();
  setupIndienen();
  setupBestandUpload();
  setupAfwezigToggle();
});

function setupAfwezigToggle() {
  var checkbox = document.getElementById("dagAfwezig");
  if (!checkbox) return;
  checkbox.addEventListener("change", pasAfwezigToe);
}

// ── Bestand upload ──
function setupBestandUpload() {
  var input = document.getElementById("bestandInput");
  if (!input) return;
  input.addEventListener("change", async function (e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;

    // Eerst zorgen dat we een logboek ID hebben
    if (!bestaandLogboekId) {
      await bewaarConcept();
    }
    if (!bestaandLogboekId) {
      alert("Kon logboek niet aanmaken. Probeer eerst een dag op te slaan.");
      input.value = "";
      return;
    }

    for (var i = 0; i < files.length; i++) {
      await uploadBestand(files[i]);
    }

    input.value = "";
    await laadBestanden();
  });
}

async function uploadBestand(file) {
  var formData = new FormData();
  formData.append("bestand", file);

  try {
    var res = await fetch(API_BASE_URL + "/logboeken/" + bestaandLogboekId + "/bestanden", {
      method: "POST",
      headers: { "Authorization": "Bearer " + sessionStorage.getItem("token") },
      body: formData
    });
    if (!res.ok) {
      var err = await res.json();
      alert("Upload fout: " + (err.error || "onbekend"));
    }
  } catch (err) {
    console.error("Bestand upload fout:", err);
    alert("Geen verbinding met server.");
  }
}

async function laadBestanden() {
  if (!bestaandLogboekId) return;
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/" + bestaandLogboekId, { headers: authHeaders() });
    if (!res.ok) return;
    var data = await res.json();
    renderBestanden(data.bestanden || []);
  } catch (err) {
    console.error("Bestanden ophalen fout:", err);
  }
}

function renderBestanden(bestanden) {
  var wrap = document.getElementById("bestandenLijst");
  if (!wrap) return;
  wrap.innerHTML = "";
  bestanden.forEach(function (b) {
    var row = document.createElement("div");
    row.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:6px; font-size:13px;";

    var link = document.createElement("a");
    link.href = "http://localhost:3000/uploads/logboeken/" + b.bestandsnaam;
    link.target = "_blank";
    link.textContent = "📎 " + (b.origineel_naam || b.bestandsnaam);
    link.style.cssText = "color:#2563eb; text-decoration:none; flex:1;";

    var size = document.createElement("span");
    size.textContent = formatBestandsgrootte(b.bestandsgrootte);
    size.style.cssText = "color:#9ca3af; margin-right:12px; font-size:12px;";

    row.appendChild(link);
    row.appendChild(size);

    if (!isReadonly) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "✕";
      btn.style.cssText = "background:none; border:none; color:#dc2626; cursor:pointer; font-size:16px;";
      btn.onclick = async function () {
        if (!confirm("Bestand verwijderen?")) return;
        await verwijderBestand(b.id);
        await laadBestanden();
      };
      row.appendChild(btn);
    }

    wrap.appendChild(row);
  });
}

async function verwijderBestand(bestandId) {
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/bestanden/" + bestandId, {
      method: "DELETE",
      headers: authHeaders()
    });
    if (!res.ok) {
      var err = await res.json();
      alert("Verwijderen mislukt: " + (err.error || "onbekend"));
    }
  } catch (err) {
    console.error("Bestand verwijderen fout:", err);
  }
}

function formatBestandsgrootte(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

async function laadCompetenties() {
  try {
    var res = await fetch(API_BASE_URL + "/competenties", { headers: authHeaders() });
    if (!res.ok) return;
    alleCompetenties = await res.json();
    renderCompetenties();
  } catch (err) {
    console.error("Competenties ophalen fout:", err);
  }
}

function renderCompetenties() {
  var wrap = document.getElementById("competentiesWrap");
  wrap.innerHTML = "";
  alleCompetenties.forEach(function (comp) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "comp-toggle";
    btn.setAttribute("data-id", comp.id);
    btn.textContent = comp.naam;
    btn.addEventListener("click", async function () {
      if (isReadonly) return;
      var idx = geselecteerdeComps.indexOf(comp.id);
      if (idx === -1) {
        geselecteerdeComps.push(comp.id);
        btn.classList.add("selected");
        btn.textContent = "✓ " + comp.naam;
      } else {
        geselecteerdeComps.splice(idx, 1);
        btn.classList.remove("selected");
        btn.textContent = comp.naam;
      }
      // Auto-save concept zodat selectie behouden blijft bij terugkeren
      await bewaarConcept();
    });
    wrap.appendChild(btn);
  });
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + sessionStorage.getItem("token")
  };
}

// Zoek of er al een logboek bestaat voor deze week
async function zoekConceptVoorWeek(week) {
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/mijn", { headers: authHeaders() });
    if (!res.ok) return null;
    var lijst = await res.json();
    var match = lijst.find(function (l) { return l.week_nummer === week; });
    return match ? match.id : null;
  } catch (err) {
    console.error("Concept zoeken fout:", err);
    return null;
  }
}

// Sla logboek op (of update) als concept in backend
async function bewaarConcept() {
  if (!datumVan || !datumTot) return;

  // Bouw dagen array
  var dagen = [];
  var startDate = new Date(datumVan);
  for (var i = 0; i < aantalDagenDezeWeek; i++) {
    var dagDate = new Date(startDate);
    dagDate.setDate(dagDate.getDate() + i);
    dagen.push({
      datum: formatISO(dagDate),
      uren_gewerkt: dagenData[i].uren,
      uitgevoerde_taken: dagenData[i].taken,
      is_afwezig: dagenData[i].afwezig,
      afwezig_reden: dagenData[i].afwezig ? "verlof" : null
    });
  }

  var body = {
    week_nummer: weekNummer,
    titel: "Week " + weekNummer,
    datum_van: datumVan,
    datum_tot: datumTot,
    uitgevoerde_taken: document.getElementById("weekTaken").value.trim() || "",
    leerpunten: document.getElementById("weekReflectie").value.trim() || "",
    dagen: dagen,
    competenties: geselecteerdeComps
  };

  try {
    var url, method;
    if (bestaandLogboekId) {
      url = API_BASE_URL + "/logboeken/" + bestaandLogboekId;
      method = "PUT";
    } else {
      url = API_BASE_URL + "/logboeken";
      method = "POST";
    }

    var res = await fetch(url, {
      method: method,
      headers: authHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      var err = await res.json();
      console.error("Concept opslaan fout:", err.error);
      return;
    }

    var data = await res.json();

    // Eerste save → onthoud ID en update URL
    if (!bestaandLogboekId && data.id) {
      bestaandLogboekId = data.id;
      var newUrl = window.location.pathname + "?id=" + bestaandLogboekId;
      window.history.replaceState({}, "", newUrl);
    }
  } catch (err) {
    console.error("Concept opslaan fout:", err);
  }
}

// ── Nieuw logboek setup ──
async function initNieuwLogboek(week) {
  weekNummer = week;
  document.getElementById("formTitle").textContent = "Logboek week " + week;
  document.getElementById("breadcrumbText").textContent = "Nieuw logboek";

  // Stage info ophalen om week-datums correct te berekenen
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/mijn/overzicht", { headers: authHeaders() });
    if (!res.ok) throw new Error("kon overzicht niet ophalen");
    var overzicht = await res.json();

    if (!overzicht.startdatum) {
      alert("Geen goedgekeurde stage gevonden.");
      window.location.href = "logboeken.html";
      return;
    }

    // Week N start op stage_startdatum + (week - 1) * 7 dagen
    var maandag = new Date(overzicht.startdatum);
    maandag.setDate(maandag.getDate() + (week - 1) * 7);
    var vrijdag = new Date(maandag);
    vrijdag.setDate(vrijdag.getDate() + 4);

    // Als de einddatum van de stage vóór vrijdag valt → laatste week, minder dagen
    var einddatum = new Date(overzicht.einddatum);
    if (vrijdag > einddatum) {
      vrijdag = new Date(einddatum);
    }

    datumVan = formatISO(maandag);
    datumTot = formatISO(vrijdag);

    // Aantal werkdagen deze week berekenen
    var verschilMs = vrijdag - maandag;
    aantalDagenDezeWeek = Math.floor(verschilMs / (1000 * 60 * 60 * 24)) + 1;
    if (aantalDagenDezeWeek < 1) aantalDagenDezeWeek = 1;
    if (aantalDagenDezeWeek > 5) aantalDagenDezeWeek = 5;

    document.getElementById("formSubtitle").textContent =
      "Week van " + formatDateLong(maandag) + " t.e.m. " + formatDateLong(vrijdag);

    // Verberg dag-tabs die buiten deze week vallen
    verbergExtraDagen();

  } catch (err) {
    console.error("Stage info ophalen fout:", err);
    document.getElementById("formSubtitle").textContent = "Kon stage info niet laden.";
  }

  updateUI();
}

// Verberg dag-tabs voorbij `aantalDagenDezeWeek`
function verbergExtraDagen() {
  for (var i = 0; i < 5; i++) {
    var tab = document.querySelector('.day-tab[data-dag="' + i + '"]');
    if (!tab) continue;
    tab.style.display = i < aantalDagenDezeWeek ? "" : "none";
  }
  // Als active tab nu verborgen is → reset naar eerste dag
  if (activeDag >= aantalDagenDezeWeek) activeDag = 0;
}

// ── Bestaand logboek laden ──
async function laadBestaandLogboek(id) {
  try {
    var res = await fetch(API_BASE_URL + "/logboeken/" + id, {
      headers: authHeaders()
    });
    if (!res.ok) {
      alert("Logboek niet gevonden.");
      window.location.href = "logboeken.html";
      return;
    }
    var data = await res.json();

    weekNummer = data.week_nummer;
    datumVan = data.datum_van;
    datumTot = data.datum_tot;

    document.getElementById("formTitle").textContent = "Logboek week " + weekNummer;
    document.getElementById("breadcrumbText").textContent = "Logboek";
    document.getElementById("formSubtitle").textContent =
      "Week van " + formatDateLong(new Date(datumVan)) + " t.e.m. " + formatDateLong(new Date(datumTot));

    // Aantal werkdagen deze week berekenen uit datumVan/datumTot
    var startDate = new Date(datumVan);
    var eindDate = new Date(datumTot);
    aantalDagenDezeWeek = Math.floor((eindDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (aantalDagenDezeWeek < 1) aantalDagenDezeWeek = 1;
    if (aantalDagenDezeWeek > 5) aantalDagenDezeWeek = 5;
    verbergExtraDagen();

    // Dagen invullen — dagIndex op basis van datum-verschil met datumVan,
    // niet op getDay() (werkt anders niet als startdatum geen maandag is)
    if (data.dagen && data.dagen.length > 0) {
      data.dagen.forEach(function (dag) {
        var d = new Date(dag.datum);
        var dagIndex = Math.round((d - startDate) / (1000 * 60 * 60 * 24));
        if (dagIndex >= 0 && dagIndex < aantalDagenDezeWeek) {
          dagenData[dagIndex] = {
            uren: parseFloat(dag.uren_gewerkt) || 0,
            taken: dag.uitgevoerde_taken || "",
            afwezig: dag.is_afwezig || false,
            reden: dag.afwezig_reden || null,
            saved: true
          };
        }
      });
    }

    // Week velden invullen
    document.getElementById("weekTaken").value = data.uitgevoerde_taken || "";
    document.getElementById("weekReflectie").value = data.leerpunten || "";

    // Geselecteerde competenties markeren
    if (Array.isArray(data.competenties)) {
      data.competenties.forEach(function (comp) {
        geselecteerdeComps.push(comp.id);
        var btn = document.querySelector('.comp-toggle[data-id="' + comp.id + '"]');
        if (btn) {
          btn.classList.add("selected");
          btn.textContent = "✓ " + comp.naam;
        }
      });
    }

    // Bestanden tonen
    if (Array.isArray(data.bestanden)) {
      renderBestanden(data.bestanden);
    }

    // Readonly mode
    if (isReadonly) {
      document.getElementById("dayForm").querySelectorAll("input, textarea, button").forEach(function (el) {
        el.disabled = true;
      });
      document.getElementById("weekTaken").disabled = true;
      document.getElementById("weekReflectie").disabled = true;
      document.getElementById("btnDagOpslaan").style.display = "none";
      document.getElementById("btnIndienen").style.display = "none";
      document.getElementById("breadcrumbText").textContent = "Logboek";
      var label = document.querySelector(".section-label");
      if (label) label.textContent = "Dagelijkse overzicht";
    }

    updateUI();
  } catch (err) {
    console.error("Logboek laden fout:", err);
    alert("Fout bij laden van logboek.");
  }
}

// ── Day tabs ──
function setupDayTabs() {
  var tabs = document.querySelectorAll(".day-tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      // Sla huidige dag op in memory
      saveDagToMemory();
      activeDag = parseInt(tab.getAttribute("data-dag"));
      updateUI();
    });
  });
}

function saveDagToMemory() {
  var afwezig = document.getElementById("dagAfwezig").checked;
  // Bij afwezig: uren en taken op 0/leeg zetten
  var uren = afwezig ? 0 : (parseFloat(document.getElementById("dagUren").value) || 0);
  var taken = afwezig ? "" : (document.getElementById("dagTaken").value || "");
  dagenData[activeDag].uren = uren;
  dagenData[activeDag].taken = taken;
  dagenData[activeDag].afwezig = afwezig;
}

// Uren en taken velden disablen/enablen op basis van afwezig
function pasAfwezigToe() {
  var afwezig = document.getElementById("dagAfwezig").checked;
  var urenInput = document.getElementById("dagUren");
  var takenInput = document.getElementById("dagTaken");
  urenInput.disabled = afwezig;
  takenInput.disabled = afwezig;
  if (afwezig) {
    urenInput.value = "";
    takenInput.value = "";
    urenInput.style.background = "#f3f4f6";
    takenInput.style.background = "#f3f4f6";
  } else {
    urenInput.style.background = "";
    takenInput.style.background = "";
  }
}

function setupDagOpslaan() {
  document.getElementById("btnDagOpslaan").addEventListener("click", async function () {
    saveDagToMemory();
    dagenData[activeDag].saved = true;
    updateUI();

    // Auto-save als concept naar backend (zodat data behouden blijft)
    await bewaarConcept();

    // Ga naar volgende dag als die er is
    if (activeDag < aantalDagenDezeWeek - 1) {
      activeDag++;
      updateUI();
    }
  });
}

// ── Indienen ──
function setupIndienen() {
  document.getElementById("btnIndienen").addEventListener("click", async function () {
    saveDagToMemory();

    // Mag pas indienen vanaf de laatste werkdag van deze week
    if (datumTot) {
      var vandaag = new Date();
      vandaag.setHours(0, 0, 0, 0);
      var laatsteWerkdag = new Date(datumTot);
      laatsteWerkdag.setHours(0, 0, 0, 0);
      if (vandaag < laatsteWerkdag) {
        alert("Je kan dit logboek pas indienen vanaf " + formatDateLong(laatsteWerkdag) + " (einde werkweek).");
        return;
      }
    }

    var weekTaken = document.getElementById("weekTaken").value.trim();
    if (!weekTaken) {
      alert("Vul de uitgevoerde taken (weekoverzicht) in.");
      return;
    }
    if (geselecteerdeComps.length === 0) {
      alert("Selecteer minstens 1 competentie.");
      return;
    }

    // Bouw dagen array — alleen de werkdagen van deze week
    var dagen = [];
    var startDate = datumVan ? new Date(datumVan) : new Date();
    for (var i = 0; i < aantalDagenDezeWeek; i++) {
      var dagDate = new Date(startDate);
      dagDate.setDate(dagDate.getDate() + i);
      dagen.push({
        datum: formatISO(dagDate),
        uren_gewerkt: dagenData[i].uren,
        uitgevoerde_taken: dagenData[i].taken,
        is_afwezig: dagenData[i].afwezig,
        afwezig_reden: dagenData[i].afwezig ? "verlof" : null
      });
    }

    var body = {
      week_nummer: weekNummer,
      titel: document.getElementById("weekTaken").value.trim().substring(0, 80),
      datum_van: datumVan,
      datum_tot: datumTot,
      uitgevoerde_taken: weekTaken,
      leerpunten: document.getElementById("weekReflectie").value.trim(),
      dagen: dagen,
      competenties: geselecteerdeComps
    };

    try {
      var url, method;
      if (bestaandLogboekId) {
        url = API_BASE_URL + "/logboeken/" + bestaandLogboekId;
        method = "PUT";
      } else {
        url = API_BASE_URL + "/logboeken";
        method = "POST";
      }

      var res = await fetch(url, {
        method: method,
        headers: authHeaders(),
        body: JSON.stringify(body)
      });

      var data = await res.json();
      if (!res.ok) {
        alert("Fout: " + (data.error || "Onbekende fout"));
        return;
      }

      var logboekId = bestaandLogboekId || data.id;

      // Nu indienen
      var res2 = await fetch(API_BASE_URL + "/logboeken/" + logboekId + "/indienen", {
        method: "POST",
        headers: authHeaders()
      });

      if (!res2.ok) {
        var err2 = await res2.json();
        alert("Fout bij indienen: " + (err2.error || "Onbekende fout"));
        return;
      }

      // Vertaal id's naar namen voor het bevestigingsscherm
      var compNamen = geselecteerdeComps.map(function (id) {
        var c = alleCompetenties.find(function (x) { return x.id === id; });
        return c ? c.naam : "";
      }).filter(function (n) { return n; }).join(", ");

      window.location.href = "logboek-bevestiging.html?week=" + weekNummer +
        "&uren=" + berekenTotaalUren() +
        "&comps=" + encodeURIComponent(compNamen);

    } catch (err) {
      console.error("Indienen fout:", err);
      alert("Geen verbinding met server. Staat de backend aan?");
    }
  });
}

// ── UI updaten ──
function updateUI() {
  // Tabs updaten
  var tabs = document.querySelectorAll(".day-tab");
  tabs.forEach(function (tab, i) {
    tab.classList.remove("active");
    if (i === activeDag) tab.classList.add("active");

    var hoursSpan = tab.querySelector(".day-tab-hours");
    if (dagenData[i].saved && dagenData[i].uren > 0) {
      hoursSpan.textContent = dagenData[i].uren + "u";
      tab.classList.add("filled");
    } else if (dagenData[i].saved && dagenData[i].afwezig) {
      hoursSpan.textContent = "Afwezig";
      tab.classList.add("filled");
    } else {
      hoursSpan.textContent = "—";
      tab.classList.remove("filled");
    }
  });

  // Dag formulier vullen — expliciet resetten
  document.getElementById("dayFormTitle").textContent = DAGEN_NAMEN[activeDag];
  var urenInput = document.getElementById("dagUren");
  var takenInput = document.getElementById("dagTaken");
  var afwezigInput = document.getElementById("dagAfwezig");
  if (dagenData[activeDag].saved) {
    urenInput.value = dagenData[activeDag].uren;
    takenInput.value = dagenData[activeDag].taken;
    afwezigInput.checked = dagenData[activeDag].afwezig;
  } else {
    urenInput.value = "";
    takenInput.value = "";
    afwezigInput.checked = false;
  }
  // Uren/taken (de)activeren op basis van afwezig
  pasAfwezigToe();

  // Datum bij dag titel
  if (datumVan) {
    var dagDatum = new Date(datumVan);
    dagDatum.setDate(dagDatum.getDate() + activeDag);
    document.getElementById("dayFormTitle").textContent =
      DAGEN_NAMEN[activeDag] + " " + dagDatum.getDate() + " " +
      ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"][dagDatum.getMonth()];
  }

  // Week uren
  var totaal = berekenTotaalUren();
  document.getElementById("weekUren").value = totaal + " uur";

  // Indienen knop tonen ENKEL als je op de laatste dag van de werkweek staat
  // en niet in readonly mode bent
  var isLaatsteDag = activeDag === (aantalDagenDezeWeek - 1);
  var indienenBtn = document.getElementById("btnIndienen");
  if (isLaatsteDag && !isReadonly) {
    indienenBtn.style.display = "inline-flex";
  } else {
    indienenBtn.style.display = "none";
  }
}

function berekenTotaalUren() {
  var totaal = 0;
  // Alleen opgeslagen dagen tellen mee in het totaal.
  // Tab-click slaat tijdelijk op in memory, maar `saved` wordt pas true
  // na klikken op "Opslaan dag".
  dagenData.forEach(function (d) {
    if (d.saved) totaal += d.uren || 0;
  });
  return totaal;
}

// ── Formatters ──
function formatISO(date) {
  var d = new Date(date);
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function formatDateLong(date) {
  var d = new Date(date);
  var dag = d.getDate();
  var maanden = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];
  return dag + " " + maanden[d.getMonth()] + " " + d.getFullYear();
}
