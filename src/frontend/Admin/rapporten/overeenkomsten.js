(function () {
  var alleRijen = [];
  var filterStatus = '';

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('zoekInput').addEventListener('input', render);
    document.getElementById('statusFilter').addEventListener('change', function () {
      filterStatus = this.value;
      render();
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
      var stages = await res.json();
      if (!Array.isArray(stages)) stages = [];

      alleRijen = stages.map(function (s) {
        return {
          student:     ((s.student_voornaam || '') + ' ' + (s.student_achternaam || '')).trim() || '—',
          bedrijf:     s.bedrijf_naam || '—',
          ovStatus:    ovStatus(s.status),
          ondertekend: s.status === 'actief' || s.status === 'afgerond',
          update:      s.aangemaakt_op || null,
        };
      });

      document.getElementById('laadStatus').textContent =
        'Bijgewerkt: ' + new Date().toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
      render();
    } catch (e) {
      console.error(e);
      document.getElementById('laadStatus').textContent = 'Kon gegevens niet laden.';
      document.getElementById('tabelBody').innerHTML =
        '<tr><td colspan="5" class="table-empty">Verbinding met server mislukt.</td></tr>';
    }
  }

  function ovStatus(stageStatus) {
    if (stageStatus === 'actief' || stageStatus === 'afgerond') return 'ondertekend';
    if (stageStatus === 'goedgekeurd')                          return 'geupload';
    if (stageStatus === 'afgekeurd')                            return 'verlopen';
    return 'ontbreekt';
  }

  function render() {
    var zoek = document.getElementById('zoekInput').value.toLowerCase();

    var gefilterd = alleRijen.filter(function (r) {
      var zoekMatch   = r.student.toLowerCase().includes(zoek) || r.bedrijf.toLowerCase().includes(zoek);
      var statusMatch = !filterStatus || r.ovStatus === filterStatus;
      return zoekMatch && statusMatch;
    });

    if (gefilterd.length === 0) {
      document.getElementById('tabelBody').innerHTML =
        '<tr><td colspan="5" class="table-empty">Geen overeenkomsten gevonden.</td></tr>';
      document.getElementById('tabelFooter').textContent = '';
      return;
    }

    var STATUS_LABELS = {
      ontbreekt:   'Ontbreekt',
      geupload:    'Geüpload',
      ondertekend: 'Ondertekend',
      verlopen:    'Verlopen',
    };

    document.getElementById('tabelBody').innerHTML = gefilterd.map(function (r) {
      var badge = '<span class="badge badge-' + r.ovStatus + '">' + (STATUS_LABELS[r.ovStatus] || r.ovStatus) + '</span>';
      var ot    = r.ondertekend
        ? '<span class="badge-ja">Ja</span>'
        : '<span class="badge-nee">Nee</span>';
      var datum = r.update
        ? new Date(r.update).toLocaleDateString('nl-BE', { year: 'numeric', month: '2-digit', day: '2-digit' })
        : '—';

      return '<tr>' +
        '<td><strong>' + esc(r.student) + '</strong></td>' +
        '<td>' + esc(r.bedrijf) + '</td>' +
        '<td>' + badge + '</td>' +
        '<td>' + ot + '</td>' +
        '<td style="color:var(--text-muted);font-size:12px">' + datum + '</td>' +
        '</tr>';
    }).join('');

    document.getElementById('tabelFooter').textContent =
      'Toont ' + gefilterd.length + ' van ' + alleRijen.length + ' overeenkomsten';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
