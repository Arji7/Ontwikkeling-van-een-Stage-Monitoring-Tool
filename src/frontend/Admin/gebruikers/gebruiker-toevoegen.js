(function () {
  const form         = document.getElementById('toevoegenForm');
  const submitBtn    = document.getElementById('submitBtn');
  const feedbackMsg  = document.getElementById('feedbackMsg');
  const voornaamEl   = document.getElementById('voornaam');
  const achternaamEl = document.getElementById('achternaam');
  const emailEl      = document.getElementById('email');
  const wachtwoordEl = document.getElementById('wachtwoord');

  voornaamEl.addEventListener('input', updatePreview);
  achternaamEl.addEventListener('input', updatePreview);
  emailEl.addEventListener('input', updatePreview);
  wachtwoordEl.addEventListener('input', updateChecklist);
  document.querySelectorAll('input[name="rol"]').forEach(r => r.addEventListener('change', updatePreview));

  function updatePreview() {
    const naam = (voornaamEl.value + ' ' + achternaamEl.value).trim();
    document.getElementById('prevNaam').textContent  = naam  || '—';
    document.getElementById('prevEmail').textContent = emailEl.value || '—';

    const gekozenRol = document.querySelector('input[name="rol"]:checked');
    const prevRolEl  = document.getElementById('prevRol');
    if (gekozenRol) {
      const labelMap = { student: 'Student', docent: 'Docent', stagementor: 'Stagementor', commissielid: 'Commissie' };
      const classMap = { student: 'badge-student', docent: 'badge-docent', stagementor: 'badge-stagementor', commissielid: 'badge-commissie' };
      prevRolEl.textContent = labelMap[gekozenRol.value] || gekozenRol.value;
      prevRolEl.className   = 'badge ' + (classMap[gekozenRol.value] || '');
    } else {
      prevRolEl.textContent = '—';
      prevRolEl.className   = '';
    }
    updateChecklist();
  }

  function updateChecklist() {
    const gekozenRol = document.querySelector('input[name="rol"]:checked');
    setCheck('chk-rol',   !!gekozenRol);
    setCheck('chk-naam',  !!(voornaamEl.value.trim() && achternaamEl.value.trim()));
    setCheck('chk-email', !!emailEl.value.trim());
    setCheck('chk-ww',    wachtwoordEl.value.length >= 8);
  }

  function setCheck(id, ok) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('done', ok);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const gekozenRol = document.querySelector('input[name="rol"]:checked');
    if (!gekozenRol) {
      toonFeedback('Selecteer een rol voor de gebruiker.', 'error');
      return;
    }

    submitBtn.disabled     = true;
    submitBtn.textContent  = 'Aanmaken…';

    try {
      var token = sessionStorage.getItem('token');
      var res = await fetch(API_BASE + '/admin/gebruikers', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voornaam: voornaamEl.value,
          achternaam: achternaamEl.value,
          email: emailEl.value,
          wachtwoord: wachtwoordEl.value,
          rollen: [gekozenRol.value]
        })
      });
      if (!res.ok) {
        var data = await res.json();
        throw new Error(data.error || 'Fout');
      }
      toonFeedback('Gebruiker succesvol aangemaakt! Doorsturen naar overzicht…', 'success');
      setTimeout(() => { window.location.href = 'gebruikers.html'; }, 1500);
    } catch (err) {
      toonFeedback(err.message || 'Fout bij aanmaken.', 'error');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Gebruiker aanmaken';
    }
  });

  function toonFeedback(msg, type) {
    feedbackMsg.textContent = msg;
    feedbackMsg.className   = 'feedback-msg ' + type;
  }
})();
