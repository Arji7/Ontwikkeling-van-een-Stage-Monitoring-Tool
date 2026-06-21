document.addEventListener('DOMContentLoaded', function () {
  var user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  var token = sessionStorage.getItem('token') || user.token;

  var loadingState = document.getElementById('loadingState');
  var emptyState = document.getElementById('emptyState');
  var stagesList = document.getElementById('stagesList');

  if (!token) {
    window.location.href = '../../inloggen/inloggen.html';
    return;
  }

  laadStages();

  async function laadStages() {
    try {
      var response = await fetch(API_BASE + '/stages/bedrijf/mijn', {
        headers: { Authorization: 'Bearer ' + token }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        window.location.href = '../../inloggen/inloggen.html';
        return;
      }

      if (response.status === 403) {
        toonLeeg('Dit bedrijfaccount is nog niet gekoppeld aan een bedrijf.');
        return;
      }

      if (!response.ok) {
        toonLeeg('De stages konden niet geladen worden.');
        return;
      }

      var stages = await response.json();
      if (!Array.isArray(stages) || stages.length === 0) {
        toonLeeg('Er zijn momenteel geen goedgekeurde of actieve stages gekoppeld aan dit bedrijfaccount.');
        return;
      }

      loadingState.style.display = 'none';
      emptyState.style.display = 'none';
      stagesList.innerHTML = stages.map(stageCard).join('');
    } catch (error) {
      toonLeeg('Geen verbinding met de server. Staat de backend aan?');
    }
  }

  function stageCard(stage) {
    var studentNaam = [stage.student_voornaam, stage.student_achternaam]
      .filter(Boolean)
      .join(' ') || 'Onbekende student';
    var bedrijfNaam = stage.bedrijf_naam || 'Onbekend bedrijf';
    var periode = formatDatum(stage.startdatum) + ' - ' + formatDatum(stage.einddatum);
    var status = stage.status || 'onbekend';

    return [
      '<article class="stage-card">',
      '  <div class="stage-main">',
      '    <h2>' + escapeHtml(studentNaam) + '</h2>',
      '    <div class="stage-meta">',
      '      <span><strong>Bedrijf:</strong> ' + escapeHtml(bedrijfNaam) + '</span>',
      '      <span><strong>Periode:</strong> ' + escapeHtml(periode) + '</span>',
      '      <span><strong>Opdracht:</strong> ' + escapeHtml(stage.omschrijving || 'Geen omschrijving') + '</span>',
      '    </div>',
      '  </div>',
      '  <div class="stage-actions">',
      '    <span class="status-badge ' + statusClass(status) + '">' + statusLabel(status) + '</span>',
      '    <a class="btn-primary" href="../../Student/stageovereenkomst-document/stageovereenkomst-document.html?stage_id=' + encodeURIComponent(stage.id) + '">Overeenkomst bekijken</a>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function toonLeeg(tekst) {
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    var emptyText = emptyState.querySelector('p');
    if (emptyText) emptyText.textContent = tekst;
    stagesList.innerHTML = '';
  }

  function formatDatum(value) {
    if (!value) return 'Onbekend';
    return new Date(value).toLocaleDateString('nl-BE');
  }

  function statusLabel(status) {
    var labels = {
      goedgekeurd: 'Goedgekeurd',
      wacht_op_overeenkomst: 'Wacht op overeenkomst',
      actief: 'Actief'
    };
    return labels[status] || status;
  }

  function statusClass(status) {
    if (['goedgekeurd', 'wacht_op_overeenkomst', 'actief'].indexOf(status) !== -1) {
      return 'status-' + status;
    }
    return 'status-default';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
