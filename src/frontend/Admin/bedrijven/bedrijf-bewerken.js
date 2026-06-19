(function () {
  var token = sessionStorage.getItem('token');
  const params = new URLSearchParams(window.location.search);
  const bedrijfId = params.get('id');

  const naamEl        = document.getElementById('naam');
  const rechtsvormEl  = document.getElementById('rechtsvorm');
  const sectorEl      = document.getElementById('sector');
  const websiteEl     = document.getElementById('website');
  const btwEl         = document.getElementById('btw');
  const straatEl      = document.getElementById('straat');
  const postcodeEl    = document.getElementById('postcode');
  const gemeenteEl    = document.getElementById('gemeente');
  const contactNaamEl = document.getElementById('contactNaam');
  const contactFuncEl = document.getElementById('contactFunctie');
  const contactMailEl = document.getElementById('contactEmail');
  const contactTelEl  = document.getElementById('contactTel');
  const feedbackMsg   = document.getElementById('feedbackMsg');
  const submitBtn     = document.getElementById('submitBtn');

  document.addEventListener('DOMContentLoaded', async () => {
    if (!bedrijfId) {
      toonFeedback('Geen bedrijf-ID opgegeven.', 'error');
      submitBtn.disabled = true;
      return;
    }

    try {
      var res = await fetch(API_BASE + '/admin/bedrijven/' + bedrijfId, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error();
      var bedrijf = await res.json();

      naamEl.value        = bedrijf.naam || '';
      sectorEl.value      = bedrijf.sector || '';
      websiteEl.value     = bedrijf.website || '';
      btwEl.value         = bedrijf.btw_nummer || '';
      straatEl.value      = bedrijf.adres || '';
      postcodeEl.value    = bedrijf.postcode || '';
      gemeenteEl.value    = bedrijf.stad || '';

      if (document.getElementById('breadcrumbNaam')) {
        document.getElementById('breadcrumbNaam').textContent = bedrijf.naam;
      }

      updatePreview();
    } catch (e) {
      toonFeedback('Bedrijf niet gevonden.', 'error');
      submitBtn.disabled = true;
      return;
    }

    [naamEl, sectorEl, gemeenteEl].forEach(function (el) {
      if (el) el.addEventListener('input', updatePreview);
    });
    if (contactNaamEl) contactNaamEl.addEventListener('input', updatePreview);
    document.querySelectorAll('input[name="status"]').forEach(function (r) { r.addEventListener('change', updatePreview); });
    [straatEl, postcodeEl, contactMailEl].forEach(function (el) {
      if (el) el.addEventListener('input', updateChecklist);
    });
  });

  function updatePreview() {
    var el;
    el = document.getElementById('prevNaam');    if (el) el.textContent = naamEl.value || '—';
    el = document.getElementById('prevSector');  if (el) el.textContent = sectorEl.value || '—';
    el = document.getElementById('prevGemeente');if (el) el.textContent = gemeenteEl.value || '—';
    el = document.getElementById('prevContact'); if (el) el.textContent = (contactNaamEl ? contactNaamEl.value : '') || '—';

    var gekozenStatus = document.querySelector('input[name="status"]:checked');
    var prevStatusEl  = document.getElementById('prevStatus');
    if (gekozenStatus && prevStatusEl) {
      prevStatusEl.textContent = gekozenStatus.value === 'erkend' ? 'Erkend' : 'In beoordeling';
      prevStatusEl.className   = gekozenStatus.value === 'erkend' ? 'badge badge-erkend' : 'badge badge-beoordeling';
    }

    updateChecklist();
  }

  function updateChecklist() {
    setCheck('chk-naam',    !!naamEl.value.trim());
    setCheck('chk-sector',  !!(sectorEl && sectorEl.value.trim()));
    setCheck('chk-adres',   !!(straatEl.value.trim() && postcodeEl.value.trim() && gemeenteEl.value.trim()));
    setCheck('chk-contact', !!(contactNaamEl && contactNaamEl.value.trim() && contactMailEl && contactMailEl.value.trim()));
  }

  function setCheck(id, ok) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('done', ok);
  }

  document.getElementById('bewerkenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Opslaan…';

    try {
      var res = await fetch(API_BASE + '/admin/bedrijven/' + bedrijfId, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: naamEl.value,
          sector: sectorEl.value,
          adres: straatEl.value,
          postcode: postcodeEl.value,
          stad: gemeenteEl.value,
          website: websiteEl.value,
          btw_nummer: btwEl.value
        })
      });
      if (!res.ok) throw new Error();
      toonFeedback('Wijzigingen opgeslagen! Terug naar overzicht…', 'success');
      setTimeout(function () { window.location.href = 'bedrijven.html'; }, 1500);
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
