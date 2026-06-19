(function () {
  var token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '../../inloggen/inloggen.html'; return; }

  var form         = document.getElementById('toevoegenForm');
  var submitBtn    = document.getElementById('submitBtn');
  var feedbackMsg  = document.getElementById('feedbackMsg');
  var voornaamEl   = document.getElementById('voornaam');
  var achternaamEl = document.getElementById('achternaam');
  var emailEl      = document.getElementById('email');
  var wachtwoordEl = document.getElementById('wachtwoord');

  var stapGegevens       = document.getElementById('stapGegevens');
  var accountSectie      = document.getElementById('accountSectie');
  var studentVelden      = document.getElementById('studentVelden');
  var docentVelden       = document.getElementById('docentVelden');
  var mentorVelden       = document.getElementById('mentorVelden');
  var bedrijfVelden      = document.getElementById('bedrijfVelden');
  var nieuwBedrijfVelden = document.getElementById('nieuwBedrijfVelden');
  var bedrijfSelect      = document.getElementById('bedrijfSelect');
  var mentorBedrijf      = document.getElementById('mentorBedrijf');

  var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  laadBedrijven();
  laadOpleidingen();

  document.querySelectorAll('input[name="rol"]').forEach(function (r) {
    r.addEventListener('change', onRolChange);
  });
  voornaamEl.addEventListener('input', updatePreview);
  achternaamEl.addEventListener('input', updatePreview);
  emailEl.addEventListener('input', updatePreview);
  wachtwoordEl.addEventListener('input', updateChecklist);

  bedrijfSelect.addEventListener('change', function () {
    nieuwBedrijfVelden.style.display = bedrijfSelect.value === '' ? '' : 'none';
  });

  // Bedrijf email/wachtwoord ook luisteren voor preview
  document.getElementById('bedrijfEmail').addEventListener('input', updatePreview);

  async function laadBedrijven() {
    try {
      var res = await fetch(API_BASE + '/admin/bedrijven', { headers: headers });
      if (!res.ok) return;
      var bedrijven = await res.json();
      bedrijven.forEach(function (b) {
        var opt1 = document.createElement('option');
        opt1.value = b.id;
        opt1.textContent = b.naam + (b.stad ? ' — ' + b.stad : '');
        bedrijfSelect.appendChild(opt1);
        mentorBedrijf.appendChild(opt1.cloneNode(true));
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

    // Account sectie (voornaam, achternaam, email, ww) verbergen bij bedrijf
    accountSectie.style.display = isBedrijf ? 'none' : '';

    // Required aanpassen
    voornaamEl.required   = !isBedrijf;
    achternaamEl.required = !isBedrijf;
    emailEl.required      = !isBedrijf;
    wachtwoordEl.required = !isBedrijf;

    studentVelden.style.display = 'none';
    docentVelden.style.display  = 'none';
    mentorVelden.style.display  = 'none';
    bedrijfVelden.style.display = 'none';

    switch (rol) {
      case 'student': studentVelden.style.display = ''; break;
      case 'docent':  docentVelden.style.display  = ''; break;
      case 'mentor':  mentorVelden.style.display  = ''; break;
      case 'bedrijf': bedrijfVelden.style.display = ''; break;
    }

    updatePreview();
  }

  function updatePreview() {
    var gekozenRol = document.querySelector('input[name="rol"]:checked');
    var rol = gekozenRol ? gekozenRol.value : '';
    var isBedrijf = rol === 'bedrijf';

    if (isBedrijf) {
      var bNaam = (document.getElementById('bedrijfNaam').value || '').trim();
      document.getElementById('prevNaam').textContent  = bNaam || '—';
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
      prevRolEl.textContent = labelMap[rol] || rol;
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
      setCheck('chk-naam',  !!(document.getElementById('bedrijfNaam').value.trim()));
      setCheck('chk-email', !!document.getElementById('bedrijfEmail').value.trim());
      setCheck('chk-ww',    (document.getElementById('bedrijfWachtwoord').value || '').length >= 8);
    } else {
      setCheck('chk-naam',  !!(voornaamEl.value.trim() && achternaamEl.value.trim()));
      setCheck('chk-email', !!emailEl.value.trim());
      setCheck('chk-ww',    wachtwoordEl.value.length >= 8);
    }
  }

  // Luister ook op bedrijf velden voor checklist
  document.getElementById('bedrijfNaam').addEventListener('input', updateChecklist);
  document.getElementById('bedrijfEmail').addEventListener('input', updateChecklist);
  document.getElementById('bedrijfWachtwoord').addEventListener('input', updateChecklist);
  document.getElementById('bedrijfNaam').addEventListener('input', updatePreview);

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

    // Validatie
    if (isBedrijf) {
      var bEmail = document.getElementById('bedrijfEmail').value.trim();
      var bWw    = document.getElementById('bedrijfWachtwoord').value;
      if (!bEmail) { toonFeedback('Vul een e-mailadres in voor het bedrijf.', 'error'); return; }
      if (!bWw || bWw.length < 8) { toonFeedback('Wachtwoord moet minimaal 8 tekens zijn.', 'error'); return; }
      if (bedrijfSelect.value === '' && !document.getElementById('bedrijfNaam').value.trim()) {
        toonFeedback('Vul een bedrijfsnaam in of selecteer een bestaand bedrijf.', 'error');
        return;
      }
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Aanmaken…';

    try {
      var bedrijf_id = null;

      // Bedrijf aanmaken of selecteren
      if (rol === 'bedrijf' || rol === 'mentor') {
        var selectEl = rol === 'bedrijf' ? bedrijfSelect : mentorBedrijf;
        if (rol === 'bedrijf') {
          if (selectEl.value !== '') {
            bedrijf_id = parseInt(selectEl.value);
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
            if (!bRes.ok) { var bErr = await bRes.json(); throw new Error(bErr.error || 'Bedrijf aanmaken mislukt.'); }
            bedrijf_id = (await bRes.json()).id;
          }
        } else if (selectEl.value) {
          bedrijf_id = parseInt(selectEl.value);
        }
      }

      // Gebruiker body
      var body = { rollen: [rol], bedrijf_id: bedrijf_id };

      if (isBedrijf) {
        // Bij bedrijf: bedrijfsnaam als voor+achternaam, bedrijf email/ww
        var bNaamVal = document.getElementById('bedrijfNaam').value.trim();
        if (bedrijfSelect.value !== '') {
          var geselecteerd = bedrijfSelect.options[bedrijfSelect.selectedIndex].textContent.split(' — ')[0];
          bNaamVal = geselecteerd;
        }
        body.voornaam   = bNaamVal;
        body.achternaam = '';
        body.email      = document.getElementById('bedrijfEmail').value.trim();
        body.wachtwoord = document.getElementById('bedrijfWachtwoord').value;
      } else {
        body.voornaam   = voornaamEl.value.trim();
        body.achternaam = achternaamEl.value.trim();
        body.email      = emailEl.value.trim();
        body.wachtwoord = wachtwoordEl.value;
      }

      if (rol === 'student') {
        body.studentnummer = (document.getElementById('studentNummer').value || '').trim();
        body.opleiding_id  = document.getElementById('studentOpleiding').value || null;
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
      if (!res.ok) { var data = await res.json(); throw new Error(data.error || 'Fout'); }

      toonFeedback('Gebruiker succesvol aangemaakt! Doorsturen naar overzicht…', 'success');
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
