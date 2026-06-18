(function () {

  var opleidingen = [
    {
      id: 1, naam: 'Toegepaste Informatica', kleur: '#2563eb',
      competenties: [
        { id: 1,  code: 'D1', omschrijving: 'De lerende professional beheerst het volledige project- of operationeel planningsproces',             gewicht: 15, subs: ['Projectplanning opstellen', 'Voortgang bewaken'] },
        { id: 2,  code: 'D2', omschrijving: 'De lerende professional ontwerpt IT-oplossingen volgens de industriestandaarden',                       gewicht: 12, subs: ['Technisch ontwerp documenteren'] },
        { id: 3,  code: 'D3', omschrijving: 'De lerende professional implementeert digitale producten in een professionele omgeving',                gewicht: 12, subs: [] },
        { id: 4,  code: 'D4', omschrijving: 'De lerende professional integreert technologie en infrastructuur binnen een professionele omgeving',     gewicht: 10, subs: [] },
        { id: 5,  code: 'D5', omschrijving: 'De lerende professional hanteert een onderzoekende houding om tot innovatieve oplossingen te komen',    gewicht: 8,  subs: [] },
        { id: 6,  code: 'D6', omschrijving: 'De lerende professional communiceert helder en transparant in een professionele omgeving en/of in teamverband', gewicht: 8, subs: [] },
        { id: 7,  code: 'D7', omschrijving: 'De lerende professional denkt kritisch na om problemen efficiënt en effectief op te lossen',             gewicht: 8,  subs: [] },
        { id: 8,  code: 'D8', omschrijving: 'De lerende professional ziet persoonlijke ontwikkeling als de basis voor professionele groei',           gewicht: 8,  subs: [] },
        { id: 9,  code: 'D9', omschrijving: 'De lerende professional ontwikkelt een professionele attitude en handelt kwaliteitsvol',                 gewicht: 7,  subs: [] },
        { id: 10, code: 'D10', omschrijving: 'De lerende professional demonstreert ondernemend handelen in functie van waardecreatie',                gewicht: 6,  subs: [] },
        { id: 11, code: 'D11', omschrijving: 'De lerende professional werkt duurzaam en maatschappelijk verantwoord',                                gewicht: 6,  subs: [] },
      ]
    },
    {
      id: 2, naam: 'Elektromechanica', kleur: '#15803d',
      competenties: [
        { id: 1, code: 'E1', omschrijving: 'De lerende professional past mechanische principes toe in een industriële omgeving',              gewicht: 20, subs: [] },
        { id: 2, code: 'E2', omschrijving: 'De lerende professional werkt veilig en conform de geldende veiligheidsnormen',                  gewicht: 18, subs: ['ATEX-regelgeving', 'Persoonlijke beschermingsmiddelen'] },
        { id: 3, code: 'E3', omschrijving: 'De lerende professional voert elektrotechnische installaties uit en controleert ze',             gewicht: 15, subs: [] },
        { id: 4, code: 'E4', omschrijving: 'De lerende professional interpreteert technische tekeningen en schema\'s',                       gewicht: 12, subs: [] },
        { id: 5, code: 'E5', omschrijving: 'De lerende professional voert preventief en correctief onderhoud uit',                          gewicht: 12, subs: [] },
        { id: 6, code: 'E6', omschrijving: 'De lerende professional communiceert technisch correct met collega\'s en leidinggevenden',       gewicht: 10, subs: [] },
        { id: 7, code: 'E7', omschrijving: 'De lerende professional werkt nauwkeurig en kwaliteitsgericht',                                 gewicht: 8,  subs: [] },
        { id: 8, code: 'E8', omschrijving: 'De lerende professional toont initiatief en leervermogen in een professionele context',         gewicht: 5,  subs: [] },
      ]
    },
    {
      id: 3, naam: 'Marketing', kleur: '#b45309',
      competenties: [
        { id: 1, code: 'M1', omschrijving: 'De lerende professional analyseert markten en doelgroepen op basis van data',                    gewicht: 18, subs: ['Concurrentieanalyse', 'Klantonderzoek uitvoeren'] },
        { id: 2, code: 'M2', omschrijving: 'De lerende professional ontwikkelt en implementeert marketingcampagnes',                         gewicht: 15, subs: [] },
        { id: 3, code: 'M3', omschrijving: 'De lerende professional beheert sociale media en digitale kanalen professioneel',                gewicht: 13, subs: [] },
        { id: 4, code: 'M4', omschrijving: 'De lerende professional communiceert overtuigend naar interne en externe stakeholders',          gewicht: 12, subs: [] },
        { id: 5, code: 'M5', omschrijving: 'De lerende professional werkt samen in multidisciplinaire projectteams',                         gewicht: 10, subs: [] },
        { id: 6, code: 'M6', omschrijving: 'De lerende professional meet en rapporteert marketingresultaten via KPI\'s',                    gewicht: 10, subs: [] },
        { id: 7, code: 'M7', omschrijving: 'De lerende professional toont commercieel inzicht en ondernemerszin',                           gewicht: 12, subs: [] },
        { id: 8, code: 'M8', omschrijving: 'De lerende professional handelt ethisch en maatschappelijk verantwoord in de marketingpraktijk', gewicht: 10, subs: [] },
        { id: 9, code: 'M9', omschrijving: 'De lerende professional past creatief denken toe in het ontwerpen van merkidentiteit',          gewicht: 10, subs: [] },
      ]
    },
  ];

  var huidigOplId  = null;
  var uitgekklapt  = {};
  var bewerkId     = null;
  var zoekTekst    = '';
  var nextCompId   = 100;

  document.addEventListener('DOMContentLoaded', function () {
    renderOplLijst();
    selecteerOpl(opleidingen[0].id);
  });

  /* ── OPLEIDINGEN ─────────────────────────────── */

  function renderOplLijst() {
    var lijst = document.getElementById('oplLijst');
    document.getElementById('oplCount').textContent = opleidingen.length + ' opleidingen';

    lijst.innerHTML = opleidingen.map(function (opl) {
      var totGewicht = opl.competenties.reduce(function (s, c) { return s + c.gewicht; }, 0);
      var isActief   = opl.id === huidigOplId;
      var checkKleur = totGewicht === 100 ? '' : ' oranje';
      var checkTeken = totGewicht === 100 ? '✓' : '○';

      return '<div class="opl-item' + (isActief ? ' actief' : '') + '" onclick="kiesOpl(' + opl.id + ')">' +
        '<span class="opl-dot" style="background:' + opl.kleur + '"></span>' +
        '<div class="opl-info">' +
          '<div class="opl-naam">' + esc(opl.naam) + '</div>' +
          '<div class="opl-meta">' + opl.competenties.length + ' competenties · ' + totGewicht + '%</div>' +
        '</div>' +
        '<span class="opl-check' + checkKleur + '">' + checkTeken + '</span>' +
      '</div>';
    }).join('');
  }

  window.kiesOpl = function (id) {
    huidigOplId = id;
    uitgekklapt = {};
    zoekTekst = '';
    renderOplLijst();
    renderCompPanel();
  };

  function selecteerOpl(id) {
    huidigOplId = id;
    renderOplLijst();
    renderCompPanel();
  }

  window.openOplModal = function () {
    document.getElementById('oplModal').classList.add('open');
    document.getElementById('nieuwOplNaam').value = '';
  };

  window.voegOplToe = function () {
    var naam = document.getElementById('nieuwOplNaam').value.trim();
    if (!naam) { document.getElementById('nieuwOplNaam').focus(); return; }
    var nieuwId = Math.max.apply(null, opleidingen.map(function (o) { return o.id; })) + 1;
    opleidingen.push({ id: nieuwId, naam: naam, kleur: '#6d28d9', competenties: [] });
    document.getElementById('oplModal').classList.remove('open');
    renderOplLijst();
    selecteerOpl(nieuwId);
  };

  /* ── COMP PANEL ──────────────────────────────── */

  function huidigOpl() {
    return opleidingen.find(function (o) { return o.id === huidigOplId; });
  }

  function renderCompPanel() {
    var panel = document.getElementById('compPanel');
    var opl   = huidigOpl();
    if (!opl) { panel.innerHTML = '<div class="comp-panel-leeg">Selecteer een opleiding om de competenties te bekijken.</div>'; return; }

    var totaal    = opl.competenties.length;
    var totGewicht = opl.competenties.reduce(function (s, c) { return s + c.gewicht; }, 0);

    var gefilterd = opl.competenties.filter(function (c) {
      return !zoekTekst || c.omschrijving.toLowerCase().includes(zoekTekst) || c.code.toLowerCase().includes(zoekTekst);
    });

    var rijsHtml = gefilterd.length === 0
      ? '<div class="comp-leeg-rij">Geen competenties gevonden.</div>'
      : gefilterd.map(function (c) { return renderCompRij(c); }).join('');

    panel.innerHTML =
      '<div class="comp-panel-header">' +
        '<span class="comp-panel-dot" style="background:' + opl.kleur + '"></span>' +
        '<div class="comp-panel-info">' +
          '<div class="comp-panel-naam">' + esc(opl.naam) + '</div>' +
          '<div class="comp-panel-sub">Academiejaar 2025–26 · ' + totaal + ' competenties</div>' +
        '</div>' +
        '<div class="comp-panel-stats">' +
          '<div class="comp-stat-chip"><span class="comp-stat-val">' + totaal + '</span>Competenties</div>' +
          '<div class="comp-stat-chip"><span class="comp-stat-val' + (totGewicht === 100 ? ' groen' : '') + '">' + totGewicht + '%</span>Gewicht</div>' +
        '</div>' +
        '<button class="btn-primary" onclick="openToevoegModal()">+ Toevoegen</button>' +
      '</div>' +
      '<div class="comp-search-bar">' +
        '<input type="text" class="comp-search-input" placeholder="Zoek competentie…" value="' + esc(zoekTekst) + '" oninput="zoek(this.value)" />' +
      '</div>' +
      '<div class="comp-rijen" id="compRijen">' + rijsHtml + '</div>';
  }

  function renderCompRij(c) {
    var isUit  = uitgekklapt[c.id];
    var heeftSubs = c.subs && c.subs.length > 0;
    var subLabel  = heeftSubs ? c.subs.length + (c.subs.length === 1 ? ' subcompetentie' : ' subcompetenties') : 'Geen subcompetenties';
    var chevron   = isUit ? '▲' : '▼';

    var subRijen = '';
    if (isUit && heeftSubs) {
      subRijen = '<div class="sub-rijen">' +
        c.subs.map(function (s, i) {
          return '<div class="sub-rij">' +
            '<span class="sub-bullet"></span>' +
            '<span class="sub-tekst">' + esc(s) + '</span>' +
            '<div class="sub-acties">' +
              '<button class="btn-icon-sm danger" title="Verwijder" onclick="verwijderSub(' + c.id + ',' + i + ')">🗑</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    return '<div>' +
      '<div class="comp-rij">' +
        '<div class="comp-code">' + esc(c.code) + '</div>' +
        '<div class="comp-tekst">' +
          '<div class="comp-omschrijving">' + esc(c.omschrijving) + '</div>' +
          '<div class="comp-sub-label">' + subLabel + '</div>' +
        '</div>' +
        '<span class="gewicht-chip">' + c.gewicht + '%</span>' +
        '<div class="comp-acties">' +
          '<button class="btn-icon-sm" title="Bewerken" onclick="openBewerkModal(' + c.id + ')">✏️</button>' +
          '<button class="btn-icon-sm danger" title="Verwijderen" onclick="verwijderComp(' + c.id + ')">🗑</button>' +
          '<button class="btn-icon-sm uitklap" title="Uitklappen" onclick="toggleUitklap(' + c.id + ')">' + chevron + '</button>' +
        '</div>' +
      '</div>' +
      subRijen +
    '</div>';
  }

  /* ── ACTIES ──────────────────────────────────── */

  window.zoek = function (val) {
    zoekTekst = val.toLowerCase();
    renderCompPanel();
  };

  window.toggleUitklap = function (id) {
    uitgekklapt[id] = !uitgekklapt[id];
    renderCompPanel();
  };

  window.verwijderComp = function (id) {
    var opl = huidigOpl();
    if (!opl) return;
    opl.competenties = opl.competenties.filter(function (c) { return c.id !== id; });
    renderOplLijst();
    renderCompPanel();
  };

  window.verwijderSub = function (compId, subIdx) {
    var opl  = huidigOpl();
    var comp = opl && opl.competenties.find(function (c) { return c.id === compId; });
    if (!comp) return;
    comp.subs.splice(subIdx, 1);
    renderCompPanel();
  };

  /* ── MODAL TOEVOEGEN ─────────────────────────── */

  window.openToevoegModal = function () {
    bewerkId = null;
    document.getElementById('modalTitel').textContent = 'Competentie toevoegen';
    document.getElementById('modalCode').value        = '';
    document.getElementById('modalOmschrijving').value = '';
    document.getElementById('modalGewicht').value     = '10';
    document.getElementById('modalCompId').value      = '';
    document.getElementById('compModal').classList.add('open');
  };

  window.openBewerkModal = function (id) {
    var opl  = huidigOpl();
    var comp = opl && opl.competenties.find(function (c) { return c.id === id; });
    if (!comp) return;
    bewerkId = id;
    document.getElementById('modalTitel').textContent  = 'Competentie bewerken';
    document.getElementById('modalCode').value         = comp.code;
    document.getElementById('modalOmschrijving').value = comp.omschrijving;
    document.getElementById('modalGewicht').value      = comp.gewicht;
    document.getElementById('modalCompId').value       = id;
    document.getElementById('compModal').classList.add('open');
  };

  window.sluitModal = function () {
    document.getElementById('compModal').classList.remove('open');
  };

  window.slaanOp = function () {
    var code       = document.getElementById('modalCode').value.trim();
    var omschrijving = document.getElementById('modalOmschrijving').value.trim();
    var gewicht    = parseInt(document.getElementById('modalGewicht').value, 10) || 10;
    if (!code || !omschrijving) return;

    var opl = huidigOpl();
    if (!opl) return;

    if (bewerkId !== null) {
      var comp = opl.competenties.find(function (c) { return c.id === bewerkId; });
      if (comp) { comp.code = code; comp.omschrijving = omschrijving; comp.gewicht = gewicht; }
    } else {
      opl.competenties.push({ id: nextCompId++, code: code, omschrijving: omschrijving, gewicht: gewicht, subs: [] });
    }

    sluitModal();
    renderOplLijst();
    renderCompPanel();
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
