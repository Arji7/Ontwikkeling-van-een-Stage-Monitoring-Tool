(function () {
  var token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '../../inloggen/inloggen.html'; return; }

  var form         = document.getElementById('toevoegenForm');
  var submitBtn    = document.getElementById('submitBtn');
  var feedbackMsg  = document.getElementById('feedbackMsg');
  var voornaamEl   = document.getElementById('voornaam');
  var achternaamEl = document.getElementById('achternaam');
  var emailEl      = document.getElementById('email');
  var persoonlijkeEmailEl = document.getElementById('persoonlijkeEmail');
  var wachtwoordEl = document.getElementById('wachtwoord');

  var stapGegevens       = document.getElementById('stapGegevens');
  var accountSectie      = document.getElementById('accountSectie');
  var studentVelden      = document.getElementById('studentVelden');
  var docentVelden       = document.getElementById('docentVelden');
  var mentorVelden       = document.getElementById('mentorVelden');
  var bedrijfVelden = document.getElementById('bedrijfVelden');
  var mentorBedrijf = document.getElementById('mentorBedrijf');
  var bedrijfSelect = document.getElementById('bedrijfSelect');
  var nieuwBedrijfVelden = document.getElementById('nieuwBedrijfVelden');

  var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  laadBedrijven();
  laadOpleidingen();

  var commissieCheckWrap = document.getElementById('commissieCheckWrap');
  var ookCommissieEl = document.getElementById('ookCommissie');

  document.querySelectorAll('input[name="rol"]').forEach(function (r) {
    r.addEventListener('change', onRolChange);
  });
  ookCommissieEl.addEventListener('change', updatePreview);
  voornaamEl.addEventListener('input', updatePreview);
  achternaamEl.addEventListener('input', updatePreview);
  emailEl.addEventListener('input', updatePreview);
  persoonlijkeEmailEl.addEventListener('input', updateChecklist);
  wachtwoordEl.addEventListener('input', updateChecklist);

  document.getElementById('bedrijfEmail').addEventListener('input', updatePreview);
  document.getElementById('bedrijfPersoonlijkeEmail').addEventListener('input', updateChecklist);
  document.getElementById('bedrijfNaam').addEventListener('input', updateChecklist);
  document.getElementById('bedrijfEmail').addEventListener('input', updateChecklist);
  document.getElementById('bedrijfWachtwoord').addEventListener('input', updateChecklist);
  document.getElementById('bedrijfNaam').addEventListener('input', updatePreview);
  bedrijfSelect.addEventListener('change', onBedrijfSelectChange);

  async function laadBedrijven() {
    try {
      var res = await fetch(API_BASE + '/admin/bedrijven', { headers: headers });
      if (!res.ok) return;
      var bedrijven = await res.json();
      bedrijven.forEach(function (b) {
        var opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.naam + (b.stad ? ' — ' + b.stad : '');
        mentorBedrijf.appendChild(opt);

        var bedrijfOpt = document.createElement('option');
        bedrijfOpt.value = b.id;
        bedrijfOpt.textContent = b.naam + (b.stad ? ' — ' + b.stad : '');
        bedrijfSelect.appendChild(bedrijfOpt);
      });
    } catch (err) { console.error('Bedrijven laden fout:', err); }
  }

  async function laadOpleidingen() {
    try {
      var res = await fetch(API_BASE + '/admin/competenties/opleidingen', { headers: headers });
      if (!res.ok) return;
      var opleidingen = await res.json();
      var select = document.getElementById('studentOpleiding');
      opleidingen.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = o.naam;
        select.appendChild(opt);
      });
    } catch (err) { console.error('Opleidingen laden fout:', err); }

  }

  function onRolChange() {
    var gekozenRol = document.querySelector('input[name="rol"]:checked');
    if (!gekozenRol) return;
    var rol = gekozenRol.value;
    var isBedrijf = rol === 'bedrijf';

    stapGegevens.style.display = '';
    accountSectie.style.display = isBedrijf ? 'none' : '';

    voornaamEl.required   = !isBedrijf;
    achternaamEl.required = !isBedrijf;
    emailEl.required      = !isBedrijf;
    wachtwoordEl.required = !isBedrijf;
    persoonlijkeEmailEl.required = !isBedrijf;
    voornaamEl.disabled   = isBedrijf;
    achternaamEl.disabled = isBedrijf;
    emailEl.disabled      = isBedrijf;
    wachtwoordEl.disabled = isBedrijf;
    persoonlijkeEmailEl.disabled = isBedrijf;

    studentVelden.style.display = 'none';
    docentVelden.style.display  = 'none';
    mentorVelden.style.display  = 'none';
    bedrijfVelden.style.display = 'none';
    commissieCheckWrap.style.display = rol === 'docent' ? '' : 'none';
    if (rol !== 'docent') ookCommissieEl.checked = false;

    switch (rol) {
      case 'student': studentVelden.style.display = ''; break;
      case 'docent':  docentVelden.style.display  = ''; break;
      case 'mentor':  mentorVelden.style.display  = ''; break;
      case 'bedrijf': bedrijfVelden.style.display = ''; break;
    }

    onBedrijfSelectChange();
    updatePreview();
  }

  function onBedrijfSelectChange() {
    var bestaandBedrijfGekozen = !!bedrijfSelect.value;

    nieuwBedrijfVelden.style.display = bestaandBedrijfGekozen ? 'none' : '';
    document.getElementById('bedrijfNaam').disabled = bestaandBedrijfGekozen;
    document.getElementById('bedrijfSector').disabled = bestaandBedrijfGekozen;
    document.getElementById('bedrijfWebsite').disabled = bestaandBedrijfGekozen;
    document.getElementById('bedrijfAdres').disabled = bestaandBedrijfGekozen;
    document.getElementById('bedrijfPostcode').disabled = bestaandBedrijfGekozen;
    document.getElementById('bedrijfStad').disabled = bestaandBedrijfGekozen;
    document.getElementById('bedrijfBtw').disabled = bestaandBedrijfGekozen;

    updatePreview();
    updateChecklist();
  }

  function getGeselecteerdeBedrijfsnaam() {
    if (!bedrijfSelect.value) return '';
    var optie = bedrijfSelect.options[bedrijfSelect.selectedIndex];
    return optie ? optie.textContent.split(' — ')[0].trim() : '';
  }

  function updatePreview() {
    var gekozenRol = document.querySelector('input[name="rol"]:checked');
    var rol = gekozenRol ? gekozenRol.value : '';
    var isBedrijf = rol === 'bedrijf';

    if (isBedrijf) {
      var bNaam = (document.getElementById('bedrijfNaam').value || '').trim();
      var gekozenBedrijfsnaam = getGeselecteerdeBedrijfsnaam();
      document.getElementById('prevNaam').textContent  = gekozenBedrijfsnaam || bNaam || '—';
      document.getElementById('prevEmail').textContent = document.getElementById('bedrijfEmail').value || '—';
    } else {
      var naam = (voornaamEl.value + ' ' + achternaamEl.value).trim();
      document.getElementById('prevNaam').textContent  = naam || '—';
      document.getElementById('prevEmail').textContent = emailEl.value || '—';
    }

    var prevRolEl = document.getElementById('prevRol');
    if (gekozenRol) {
      var labelMap = { student: 'Student', docent: 'Docent', mentor: 'Stagementor', commissielid: 'Commissie', bedrijf: 'Bedrijf' };
      var classMap = { student: 'badge-student', docent: 'badge-docent', mentor: 'badge-stagementor', commissielid: 'badge-commissie', bedrijf: 'badge-bedrijf' };
      var rolLabel = labelMap[rol] || rol;
      if (rol === 'docent' && ookCommissieEl.checked) rolLabel += ' + Commissie';
      prevRolEl.textContent = rolLabel;
      prevRolEl.className   = 'badge ' + (classMap[rol] || '');
    } else {
      prevRolEl.textContent = '—';
      prevRolEl.className   = 'badge';
    }
    updateChecklist();
  }

  function updateChecklist() {
    var gekozenRol = document.querySelector('input[name="rol"]:checked');
    var rol = gekozenRol ? gekozenRol.value : '';
    var isBedrijf = rol === 'bedrijf';

    setCheck('chk-rol', !!gekozenRol);

    if (isBedrijf) {
      setCheck('chk-naam',  !!(bedrijfSelect.value || document.getElementById('bedrijfNaam').value.trim()));
      setCheck('chk-email', !!(document.getElementById('bedrijfEmail').value.trim() && document.getElementById('bedrijfPersoonlijkeEmail').value.trim()));
      setCheck('chk-ww',    (document.getElementById('bedrijfWachtwoord').value || '').length >= 8);
    } else {
      setCheck('chk-naam',  !!(voornaamEl.value.trim() && achternaamEl.value.trim()));
      setCheck('chk-email', !!(emailEl.value.trim() && persoonlijkeEmailEl.value.trim()));
      setCheck('chk-ww',    wachtwoordEl.value.length >= 8);
    }
  }

  function setCheck(id, ok) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('done', ok);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var gekozenRol = document.querySelector('input[name="rol"]:checked');
    if (!gekozenRol) {
      toonFeedback('Selecteer eerst een rol.', 'error');
      return;
    }

    var rol = gekozenRol.value;
    var isBedrijf = rol === 'bedrijf';

    if (isBedrijf) {
      var bEmail = document.getElementById('bedrijfEmail').value.trim();
      var bPersoonlijkeEmail = document.getElementById('bedrijfPersoonlijkeEmail').value.trim();
      var bWw    = document.getElementById('bedrijfWachtwoord').value;
      if (!bEmail) { toonFeedback('Vul een e-mailadres in voor het bedrijf.', 'error'); return; }
      if (!bPersoonlijkeEmail) { toonFeedback('Vul een persoonlijk/contact e-mailadres in voor het bedrijf.', 'error'); return; }
      if (!bWw || bWw.length < 8) { toonFeedback('Wachtwoord moet minimaal 8 tekens zijn.', 'error'); return; }
      if (!bedrijfSelect.value && !document.getElementById('bedrijfNaam').value.trim()) {
        toonFeedback('Vul een bedrijfsnaam in.', 'error');
        return;
      }
    } else if (!persoonlijkeEmailEl.value.trim()) {
      toonFeedback('Vul een persoonlijk e-mailadres in.', 'error');
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Aanmaken…';

    try {
      var bedrijf_id = null;

      if (rol === 'bedrijf') {
        if (bedrijfSelect.value) {
          bedrijf_id = parseInt(bedrijfSelect.value, 10);
        } else {
          var bRes = await fetch(API_BASE + '/admin/bedrijven', {
            method: 'POST', headers: headers,
            body: JSON.stringify({
              naam: document.getElementById('bedrijfNaam').value.trim(),
              sector: (document.getElementById('bedrijfSector').value || '').trim(),
              adres: (document.getElementById('bedrijfAdres').value || '').trim(),
              postcode: (document.getElementById('bedrijfPostcode').value || '').trim(),
              stad: (document.getElementById('bedrijfStad').value || '').trim(),
              website: (document.getElementById('bedrijfWebsite').value || '').trim(),
              btw_nummer: (document.getElementById('bedrijfBtw').value || '').trim()
            })
          });
          var bData = await bRes.json();
          if (!bRes.ok) throw new Error(bData.error || 'Bedrijf aanmaken mislukt.');
          bedrijf_id = bData.id;
        }
      } else if (rol === 'mentor' && mentorBedrijf.value) {
        bedrijf_id = parseInt(mentorBedrijf.value, 10);
      }

      var rollen = [rol];
      if (rol === 'docent' && ookCommissieEl.checked) rollen.push('commissielid');
      var body = { rollen: rollen, bedrijf_id: bedrijf_id };

      if (isBedrijf) {
        body.voornaam   = getGeselecteerdeBedrijfsnaam() || document.getElementById('bedrijfNaam').value.trim();
        body.achternaam = '';
        body.email      = document.getElementById('bedrijfEmail').value.trim();
        body.persoonlijke_email = document.getElementById('bedrijfPersoonlijkeEmail').value.trim();
        body.wachtwoord = document.getElementById('bedrijfWachtwoord').value;
      } else {
        body.voornaam   = voornaamEl.value.trim();
        body.achternaam = achternaamEl.value.trim();
        body.email      = emailEl.value.trim();
        body.persoonlijke_email = persoonlijkeEmailEl.value.trim();
        body.wachtwoord = wachtwoordEl.value;
      }

      if (rol === 'student') {
        body.studentnummer  = (document.getElementById('studentNummer').value || '').trim();
        body.opleiding_id   = document.getElementById('studentOpleiding').value || null;
        body.academiejaar   = document.getElementById('studentAcademiejaar').value || null;
      }
      if (rol === 'docent') {
        body.titel = (document.getElementById('docentTitel').value || '').trim();
      }
      if (rol === 'mentor') {
        body.functie = (document.getElementById('mentorFunctie').value || '').trim();
      }

      var res = await fetch(API_BASE + '/admin/gebruikers', {
        method: 'POST', headers: headers, body: JSON.stringify(body)
      });
      var data = await res.json();
      if (!res.ok) { throw new Error(data.error || 'Fout'); }

      var mailTekst = data.mail_verzonden
        ? ' Accountgegevens zijn verzonden naar de persoonlijke e-mail.'
        : ' Account aangemaakt, maar mail niet verzonden: ' + (data.mail_status || 'mail niet ingesteld') + '.';
      toonFeedback('Gebruiker succesvol aangemaakt!' + mailTekst + ' Doorsturen naar overzicht…', 'success');
      setTimeout(function () { window.location.href = 'gebruikers.html'; }, 1500);
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
