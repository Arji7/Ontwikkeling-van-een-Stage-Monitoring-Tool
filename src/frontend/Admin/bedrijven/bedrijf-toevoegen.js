(function () {
  const naamEl      = document.getElementById('naam');
  const sectorEl    = document.getElementById('sector');
  const gemeenteEl  = document.getElementById('gemeente');
  const straatEl    = document.getElementById('straat');
  const postcodeEl  = document.getElementById('postcode');
  const contactEl   = document.getElementById('contactNaam');
  const emailEl     = document.getElementById('contactEmail');
  const feedbackMsg = document.getElementById('feedbackMsg');
  const submitBtn   = document.getElementById('submitBtn');

  [naamEl, sectorEl, gemeenteEl, contactEl].forEach(el => el.addEventListener('input', updatePreview));

  function updatePreview() {
    document.getElementById('prevNaam').textContent    = naamEl.value    || '—';
    document.getElementById('prevSector').textContent  = sectorEl.value  || '—';
    document.getElementById('prevGemeente').textContent = gemeenteEl.value || '—';
    document.getElementById('prevContact').textContent = contactEl.value  || '—';
    updateChecklist();
  }

  function updateChecklist() {
    setCheck('chk-naam',    !!naamEl.value.trim());
    setCheck('chk-sector',  !!sectorEl.value.trim());
    setCheck('chk-adres',   !!(straatEl.value.trim() && postcodeEl.value.trim() && gemeenteEl.value.trim()));
    setCheck('chk-contact', !!(contactEl.value.trim() && emailEl.value.trim()));
  }

  [straatEl, postcodeEl, emailEl].forEach(el => el.addEventListener('input', updateChecklist));

  function setCheck(id, ok) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('done', ok);
  }

  document.getElementById('toevoegenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Toevoegen…';

    try {
      var token = sessionStorage.getItem('token');
      var res = await fetch(API_BASE + '/admin/bedrijven', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: naamEl.value.trim(),
          sector: sectorEl.value.trim(),
          adres: straatEl.value.trim(),
          postcode: postcodeEl.value.trim(),
          stad: gemeenteEl.value.trim(),
          website: (document.getElementById('website') || {}).value || '',
          btw_nummer: (document.getElementById('btw') || {}).value || ''
        })
      });
      if (!res.ok) {
        var data = await res.json();
        throw new Error(data.error || 'Fout bij aanmaken.');
      }
      toonFeedback('Bedrijf succesvol toegevoegd! Terug naar overzicht…', 'success');
      setTimeout(() => { window.location.href = 'bedrijven.html'; }, 1500);
    } catch (err) {
      toonFeedback(err.message, 'error');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Bedrijf toevoegen';
    }
  });

  function toonFeedback(msg, type) {
    feedbackMsg.textContent = msg;
    feedbackMsg.className   = 'feedback-msg ' + type;
  }
})();
