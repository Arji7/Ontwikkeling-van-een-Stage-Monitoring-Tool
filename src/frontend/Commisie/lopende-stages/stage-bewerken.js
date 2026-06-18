(function () {
  var token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '../../inloggen/inloggen.html'; return; }

  var stageId = new URLSearchParams(window.location.search).get('id');
  var stageData = null;

  document.addEventListener('DOMContentLoaded', laad);

  async function laad() {
    if (!stageId) {
      document.getElementById('paginaSub').textContent = 'Geen stage-ID opgegeven.';
      return;
    }

    try {
      var res = await fetch(API_BASE + '/stages', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var stages = res.ok ? await res.json() : [];
      if (!Array.isArray(stages)) stages = [];

      stageData = stages.find(function (s) { return String(s.id) === String(stageId); });

      if (!stageData) {
        document.getElementById('paginaSub').textContent = 'Stage niet gevonden.';
        return;
      }

      vulFormulierIn(stageData);
      updatePreview();
    } catch (e) {
      document.getElementById('paginaSub').textContent = 'Verbinding met server mislukt.';
    }
  }

  function vulFormulierIn(s) {
    var student = ((s.student_voornaam || '') + ' ' + (s.student_achternaam || '')).trim() || '—';
    var docent  = s.docent_voornaam ? (s.docent_voornaam + ' ' + (s.docent_achternaam || '')).trim() : '';

    document.getElementById('paginaSub').textContent = 'Stage van ' + student + ' bij ' + (s.bedrijf_naam || '—');

    // Lees-alleen info
    setEl('infoStudent',  student);
    setEl('infoBedrijf',  s.bedrijf_naam || '—');
    setEl('infoStatus',   s.status || '—');
    setEl('infoIngediend', fmtDatum(s.aangemaakt_op));

    // Bewerkbare velden
    document.getElementById('veldDocent').value      = docent;
    document.getElementById('veldMentor').value      = s.mentor_naam   || '';
    document.getElementById('veldMentorEmail').value = s.mentor_email  || '';
    document.getElementById('veldStart').value       = datumInput(s.startdatum);
    document.getElementById('veldEinde').value       = datumInput(s.einddatum);
    document.getElementById('veldStatus').value      = s.status || 'actief';
    document.getElementById('veldNotities').value    = s.notities || '';

    // Preview avatar
    var initialen = student.split(' ').map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('prevAvatar').textContent  = initialen || '??';
    document.getElementById('prevNaam').textContent    = student;
    document.getElementById('prevBedrijf').textContent = s.bedrijf_naam || '—';

    // Live preview bij typen
    ['veldDocent','veldMentor','veldStart','veldEinde','veldStatus'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', updatePreview);
      document.getElementById(id).addEventListener('change', updatePreview);
    });
  }

  function updatePreview() {
    document.getElementById('prevDocent').textContent = document.getElementById('veldDocent').value || '—';
    document.getElementById('prevMentor').textContent = document.getElementById('veldMentor').value || '—';
    document.getElementById('prevStart').textContent  = fmtDatumInput(document.getElementById('veldStart').value);
    document.getElementById('prevEinde').textContent  = fmtDatumInput(document.getElementById('veldEinde').value);
    document.getElementById('prevStatus').textContent = document.getElementById('veldStatus').value || '—';
  }

  window.slaanOp = function () {
    var feedback = document.getElementById('feedbackMsg');
    feedback.className = 'feedback-msg';
    feedback.textContent = '';

    var docent = document.getElementById('veldDocent').value.trim();
    var start  = document.getElementById('veldStart').value;
    var einde  = document.getElementById('veldEinde').value;

    if (!docent) {
      feedback.textContent = 'Vul de begeleider (docent) in.';
      feedback.className   = 'feedback-msg fout';
      document.getElementById('veldDocent').focus();
      return;
    }
    if (start && einde && start > einde) {
      feedback.textContent = 'Einddatum mag niet vóór startdatum liggen.';
      feedback.className   = 'feedback-msg fout';
      return;
    }

    feedback.textContent = 'Wijzigingen opgeslagen.';
    feedback.className   = 'feedback-msg succes';

    setTimeout(function () {
      window.location.href = 'lopende-stages.html';
    }, 1500);
  };

  function setEl(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function fmtDatum(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('nl-BE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function datumInput(d) {
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt)) return '';
    return dt.toISOString().slice(0, 10);
  }

  function fmtDatumInput(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('nl-BE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
})();
