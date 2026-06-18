(function () {
  var PIE_KLEUREN = {
    ingediend:            '#3b82f6',
    goedgekeurd:          '#f59e0b',
    actief:               '#22c55e',
    afgerond:             '#8b5cf6',
    afgekeurd:            '#ef4444',
    aanpassingen_vereist: '#f97316',
  };

  var STATUS_LABELS = {
    ingediend:            'Ingediend',
    goedgekeurd:          'Wacht op ondertekening',
    actief:               'Actief',
    afgerond:             'Afgerond',
    afgekeurd:            'Afgekeurd',
    aanpassingen_vereist: 'Aanpassingen vereist',
  };

  var alleStages = [];
  var filterStatus = '';

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('filterStatus').addEventListener('change', function () {
      filterStatus = this.value;
      teken();
    });
    laad();
  });

  async function laad() {
    var token = sessionStorage.getItem('token');
    if (!token) {
      document.getElementById('laadStatus').textContent = 'Niet ingelogd.';
      return;
    }

    try {
      var res = await fetch(API_BASE + '/stages', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      alleStages = await res.json();
      if (!Array.isArray(alleStages)) alleStages = [];
      document.getElementById('laadStatus').textContent = 'Bijgewerkt: ' + nu();
      teken();
    } catch (e) {
      console.error(e);
      document.getElementById('laadStatus').textContent = 'Kon gegevens niet laden.';
    }
  }

  function gefilterd() {
    if (!filterStatus) return alleStages;
    return alleStages.filter(function (s) { return s.status === filterStatus; });
  }

  function teken() {
    var data = gefilterd();
    tekenStats(data);
    tekenStaaf(data);
    tekenTaart(data);
    tekenOndertekening(data);
    tekenTabel(data);
  }

  function tekenStats(data) {
    var totaal  = data.length;
    var actief  = data.filter(function (s) { return s.status === 'actief'; }).length;
    var afgerond = data.filter(function (s) { return s.status === 'afgerond'; }).length;
    var wacht   = data.filter(function (s) { return s.status === 'ingediend'; }).length;
    var slaag   = afgerond > 0 ? Math.round((afgerond / (afgerond + data.filter(function (s) { return s.status === 'afgekeurd'; }).length)) * 100) : 0;

    document.getElementById('statTotaal').textContent = totaal;
    document.getElementById('statActief').textContent = actief;
    document.getElementById('statSlaag').textContent  = afgerond + data.filter(function (s) { return s.status === 'afgekeurd'; }).length > 0 ? slaag + '%' : '—';
    document.getElementById('statWacht').textContent  = wacht;
  }

  function tekenStaaf(data) {
    var maanden = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    var telling = {};
    maanden.forEach(function (m) { telling[m] = 0; });

    data.forEach(function (s) {
      if (!s.aangemaakt_op) return;
      var d = new Date(s.aangemaakt_op);
      var m = maanden[d.getMonth()];
      telling[m] = (telling[m] || 0) + 1;
    });

    var max = Math.max.apply(null, maanden.map(function (m) { return telling[m] || 0; })) || 1;

    var html = maanden.map(function (m) {
      var v = telling[m] || 0;
      var h = Math.max(4, Math.round((v / max) * 110));
      return '<div class="bar-col">' +
        '<div class="bar-val">' + v + '</div>' +
        '<div class="bar" style="height:' + h + 'px"></div>' +
        '<div class="bar-lbl">' + m + '</div>' +
        '</div>';
    }).join('');

    document.getElementById('barChart').innerHTML = html || '<div class="chart-loading">Geen data beschikbaar.</div>';
  }

  function tekenTaart(data) {
    var telling = {};
    data.forEach(function (s) {
      telling[s.status] = (telling[s.status] || 0) + 1;
    });

    var totaal = data.length;
    if (totaal === 0) {
      document.getElementById('pieChart').innerHTML = '';
      document.getElementById('pieLegend').innerHTML = '<li style="color:var(--text-muted);font-size:12px">Geen data</li>';
      return;
    }

    var cx = 80, cy = 80, r = 60;
    var start = -Math.PI / 2;
    var paden = '';
    var legendHtml = '';

    Object.keys(telling).forEach(function (status) {
      var aantal = telling[status];
      var hoek   = (aantal / totaal) * 2 * Math.PI;
      var end    = start + hoek;
      var x1 = cx + r * Math.cos(start);
      var y1 = cy + r * Math.sin(start);
      var x2 = cx + r * Math.cos(end);
      var y2 = cy + r * Math.sin(end);
      var groot = hoek > Math.PI ? 1 : 0;
      var kleur = PIE_KLEUREN[status] || '#94a3b8';
      var label = STATUS_LABELS[status] || status;
      var pct   = Math.round((aantal / totaal) * 100);

      paden += '<path d="M' + cx + ',' + cy +
        ' L' + x1.toFixed(1) + ',' + y1.toFixed(1) +
        ' A' + r + ',' + r + ' 0 ' + groot + ',1 ' +
        x2.toFixed(1) + ',' + y2.toFixed(1) +
        ' Z" fill="' + kleur + '" />';

      legendHtml += '<li><span class="pie-dot" style="background:' + kleur + '"></span>' +
        label + ' — ' + pct + '% (' + aantal + ')</li>';

      start = end;
    });

    document.getElementById('pieChart').innerHTML = paden;
    document.getElementById('pieLegend').innerHTML = legendHtml;
  }

  function tekenOndertekening(data) {
    var ondertekend = data.filter(function (s) { return s.status === 'actief' || s.status === 'afgerond'; }).length;
    var wachtStudent = data.filter(function (s) { return s.status === 'goedgekeurd'; }).length;
    var nietOndertekend = data.filter(function (s) { return s.status === 'ingediend' || s.status === 'aanpassingen_vereist'; }).length;
    var totaal = data.length || 1;

    var items = [
      { naam: 'Ondertekend',           waarde: ondertekend,    kleur: '#22c55e' },
      { naam: 'Wacht op ondertekening',waarde: wachtStudent,   kleur: '#f59e0b' },
      { naam: 'Nog niet ondertekend',  waarde: nietOndertekend,kleur: '#ef4444' },
    ];

    document.getElementById('ondertekeningList').innerHTML = items.map(function (item) {
      var pct = Math.round((item.waarde / totaal) * 100);
      return '<div class="progress-item">' +
        '<div class="progress-naam">' + item.naam + '</div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%;background:' + item.kleur + '"></div></div>' +
        '<div class="progress-pct">' + pct + '%</div>' +
        '</div>';
    }).join('');
  }

  function tekenTabel(data) {
    var recent = data.slice().sort(function (a, b) {
      return new Date(b.aangemaakt_op) - new Date(a.aangemaakt_op);
    }).slice(0, 10);

    if (recent.length === 0) {
      document.getElementById('stagesBody').innerHTML =
        '<tr><td colspan="5" class="table-empty">Geen stages gevonden.</td></tr>';
      return;
    }

    document.getElementById('stagesBody').innerHTML = recent.map(function (s) {
      var student = esc((s.student_voornaam || '') + ' ' + (s.student_achternaam || ''));
      var bedrijf = esc(s.bedrijf_naam || '—');
      var docent  = s.docent_voornaam ? esc(s.docent_voornaam + ' ' + s.docent_achternaam) : '—';
      var periode = fmtDatum(s.startdatum) + ' – ' + fmtDatum(s.einddatum);
      var badge   = '<span class="badge badge-' + s.status + '">' + (STATUS_LABELS[s.status] || s.status) + '</span>';

      return '<tr>' +
        '<td><div class="student-naam">' + student + '</div></td>' +
        '<td>' + bedrijf + '</td>' +
        '<td>' + docent + '</td>' +
        '<td style="font-size:12px;color:var(--text-muted)">' + periode + '</td>' +
        '<td>' + badge + '</td>' +
        '</tr>';
    }).join('');
  }

  function fmtDatum(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function nu() {
    return new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
