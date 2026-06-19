(function () {
  var token = sessionStorage.getItem('token');
  const params      = new URLSearchParams(window.location.search);
  const gebruikerId = params.get('id');

  const voornaamEl   = document.getElementById('voornaam');
  const achternaamEl = document.getElementById('achternaam');
  const emailEl      = document.getElementById('email');
  const feedbackMsg  = document.getElementById('feedbackMsg');
  const submitBtn    = document.getElementById('submitBtn');

  document.addEventListener('DOMContentLoaded', async () => {
    if (!gebruikerId) {
      toonFeedback('Geen gebruiker-ID opgegeven.', 'error');
      submitBtn.disabled = true;
      return;
    }

    try {
      var res = await fetch(API_BASE + '/admin/gebruikers', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var alle = res.ok ? await res.json() : [];
      var gebruiker = alle.find(function (g) { return g.id === parseInt(gebruikerId, 10); });

      if (!gebruiker) {
        toonFeedback('Gebruiker niet gevonden.', 'error');
        submitBtn.disabled = true;
        return;
      }

      voornaamEl.value   = gebruiker.voornaam || '';
      achternaamEl.value = gebruiker.achternaam || '';
      emailEl.value      = gebruiker.email || '';

      var rollen = gebruiker.rollen ? gebruiker.rollen.split(', ') : [];
      var eersteRol = rollen[0] || 'student';
      var rolRadio  = document.querySelector('input[name="rol"][value="' + eersteRol + '"]');
      if (rolRadio) rolRadio.checked = true;

      var statusVal   = (gebruiker.actief === 1 || gebruiker.actief === true) ? 'actief' : 'inactief';
      var statusRadio = document.querySelector('input[name="status"][value="' + statusVal + '"]');
      if (statusRadio) statusRadio.checked = true;

      if (document.getElementById('breadcrumbNaam')) {
        document.getElementById('breadcrumbNaam').textContent = gebruiker.voornaam + ' ' + gebruiker.achternaam;
      }

      updatePreview();
    } catch (e) {
      toonFeedback('Fout bij laden.', 'error');
      submitBtn.disabled = true;
      return;
    }

    voornaamEl.addEventListener('input', updatePreview);
    achternaamEl.addEventListener('input', updatePreview);
    emailEl.addEventListener('input', updatePreview);
    document.querySelectorAll('input[name="rol"]').forEach(function (r) { r.addEventListener('change', updatePreview); });
    document.querySelectorAll('input[name="status"]').forEach(function (r) { r.addEventListener('change', updatePreview); });
  });

  function updatePreview() {
    var naam = (voornaamEl.value + ' ' + achternaamEl.value).trim();
    var el;
    el = document.getElementById('prevNaam');  if (el) el.textContent = naam || '—';
    el = document.getElementById('prevEmail'); if (el) el.textContent = emailEl.value || '—';

    var gekozenRol    = document.querySelector('input[name="rol"]:checked');
    var gekozenStatus = document.querySelector('input[name="status"]:checked');

    var prevRolEl = document.getElementById('prevRol');
    if (gekozenRol && prevRolEl) {
      var labelMap = { student: 'Student', docent: 'Docent', mentor: 'Stagementor', commissielid: 'Commissie', admin: 'Admin', bedrijf: 'Bedrijf' };
      var classMap = { student: 'badge badge-student', docent: 'badge badge-docent', mentor: 'badge badge-stagementor', commissielid: 'badge badge-commissie', admin: 'badge badge-admin', bedrijf: 'badge badge-bedrijf' };
      prevRolEl.textContent = labelMap[gekozenRol.value] || gekozenRol.value;
      prevRolEl.className   = classMap[gekozenRol.value] || 'badge';
    }

    var prevStatusEl = document.getElementById('prevStatus');
    if (gekozenStatus && prevStatusEl) {
      prevStatusEl.textContent = gekozenStatus.value === 'actief' ? 'Actief' : 'Inactief';
      prevStatusEl.className   = gekozenStatus.value === 'actief' ? 'badge badge-actief' : 'badge badge-inactief';
    }

    setCheck('chk-naam',  !!(voornaamEl.value.trim() && achternaamEl.value.trim()));
    setCheck('chk-email', !!emailEl.value.trim());
    setCheck('chk-rol',   !!gekozenRol);
  }

  function setCheck(id, ok) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('done', ok);
  }

  document.getElementById('bewerkenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    var gekozenRol = document.querySelector('input[name="rol"]:checked');
    if (!gekozenRol) {
      toonFeedback('Selecteer een rol voor de gebruiker.', 'error');
      return;
    }

    var gekozenStatus = document.querySelector('input[name="status"]:checked');
    var actief = gekozenStatus ? gekozenStatus.value === 'actief' : true;

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Opslaan…';

    try {
      var res = await fetch(API_BASE + '/admin/gebruikers/' + gebruikerId, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voornaam: voornaamEl.value,
          achternaam: achternaamEl.value,
          email: emailEl.value,
          actief: actief,
          rollen: [gekozenRol.value],
          wachtwoord: (document.getElementById('nieuwWachtwoord') || {}).value || undefined
        })
      });
      if (!res.ok) throw new Error();
      toonFeedback('Wijzigingen opgeslagen! Terug naar overzicht…', 'success');
      setTimeout(function () { window.location.href = 'gebruikers.html'; }, 1500);
    } catch (err) {
      toonFeedback('Fout bij opslaan.', 'error');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Wijzigingen opslaan';
    }
  });

  function toonFeedback(msg, type) {
    feedbackMsg.textContent = msg;
    feedbackMsg.className   = 'feedback-msg ' + type;
  }
})();
