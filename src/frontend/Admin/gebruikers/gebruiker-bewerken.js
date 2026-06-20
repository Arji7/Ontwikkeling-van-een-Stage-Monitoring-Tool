(function () {
  var token = sessionStorage.getItem('token');
  const params      = new URLSearchParams(window.location.search);
  const gebruikerId = params.get('id');

  const voornaamEl   = document.getElementById('voornaam');
  const achternaamEl = document.getElementById('achternaam');
  const emailEl      = document.getElementById('email');
  const persoonlijkeEmailEl = document.getElementById('persoonlijkeEmail');
  const feedbackMsg  = document.getElementById('feedbackMsg');
  const submitBtn    = document.getElementById('submitBtn');
  const commissieCheckWrap = document.getElementById('commissieCheckWrap');
  const ookCommissieEl = document.getElementById('ookCommissie');

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
      persoonlijkeEmailEl.value = gebruiker.persoonlijke_email || '';

      var rollen = gebruiker.rollen ? gebruiker.rollen.split(', ') : [];
      var hoofdRol = rollen.includes('docent') ? 'docent' : (rollen[0] || 'student');
      var rolRadio  = document.querySelector('input[name="rol"][value="' + hoofdRol + '"]');
      if (rolRadio) rolRadio.checked = true;

      if (hoofdRol === 'docent') {
        commissieCheckWrap.style.display = '';
        if (rollen.includes('commissielid')) ookCommissieEl.checked = true;
      }

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
    persoonlijkeEmailEl.addEventListener('input', updatePreview);
    ookCommissieEl.addEventListener('change', updatePreview);
    document.querySelectorAll('input[name="rol"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var isDocent = r.value === 'docent' && r.checked;
        commissieCheckWrap.style.display = isDocent ? '' : 'none';
        if (!isDocent) ookCommissieEl.checked = false;
        updatePreview();
      });
    });
    document.querySelectorAll('input[name="status"]').forEach(function (r) { r.addEventListener('change', updatePreview); });
  });

  function updatePreview() {
    var gekozenRol    = document.querySelector('input[name="rol"]:checked');
    var gekozenStatus = document.querySelector('input[name="status"]:checked');
    var isBedrijf = gekozenRol && gekozenRol.value === 'bedrijf';

    achternaamEl.required = !isBedrijf;
    if (isBedrijf) {
      achternaamEl.value = '';
    }
    var reqEl = document.getElementById('achternaamReq');
    var hintEl = document.getElementById('achternaamHint');
    if (reqEl) reqEl.style.display = isBedrijf ? 'none' : '';
    if (hintEl) hintEl.style.display = isBedrijf ? '' : 'none';

    var naam = isBedrijf
      ? voornaamEl.value.trim()
      : (voornaamEl.value + ' ' + achternaamEl.value).trim();
    var el;
    el = document.getElementById('prevNaam');  if (el) el.textContent = naam || '—';
    el = document.getElementById('prevEmail'); if (el) el.textContent = emailEl.value || '—';
    el = document.getElementById('prevPersoonlijkeEmail'); if (el) el.textContent = persoonlijkeEmailEl.value || '—';

    var prevRolEl = document.getElementById('prevRol');
    if (gekozenRol && prevRolEl) {
      var labelMap = { student: 'Student', docent: 'Docent', mentor: 'Stagementor', commissielid: 'Commissie', admin: 'Admin', bedrijf: 'Bedrijf' };
      var classMap = { student: 'badge badge-student', docent: 'badge badge-docent', mentor: 'badge badge-stagementor', commissielid: 'badge badge-commissie', admin: 'badge badge-admin', bedrijf: 'badge badge-bedrijf' };
      var rolLabel = labelMap[gekozenRol.value] || gekozenRol.value;
      if (gekozenRol.value === 'docent' && ookCommissieEl.checked) rolLabel += ' + Commissie';
      prevRolEl.textContent = rolLabel;
      prevRolEl.className   = classMap[gekozenRol.value] || 'badge';
    }

    var prevStatusEl = document.getElementById('prevStatus');
    if (gekozenStatus && prevStatusEl) {
      prevStatusEl.textContent = gekozenStatus.value === 'actief' ? 'Actief' : 'Inactief';
      prevStatusEl.className   = gekozenStatus.value === 'actief' ? 'badge badge-actief' : 'badge badge-inactief';
    }

    setCheck('chk-naam',  !!(voornaamEl.value.trim() && (isBedrijf || achternaamEl.value.trim())));
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
    var isBedrijf = gekozenRol.value === 'bedrijf';

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Opslaan…';

    try {
      var res = await fetch(API_BASE + '/admin/gebruikers/' + gebruikerId, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voornaam: voornaamEl.value,
          achternaam: isBedrijf ? '' : achternaamEl.value,
          email: emailEl.value,
          persoonlijke_email: persoonlijkeEmailEl.value,
          actief: actief,
          rollen: gekozenRol.value === 'docent' && ookCommissieEl.checked
            ? ['docent', 'commissielid']
            : [gekozenRol.value],
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
