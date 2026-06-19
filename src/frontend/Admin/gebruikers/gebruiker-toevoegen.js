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

  var stapGegevens  = document.getElementById('stapGegevens');
  var studentVelden = document.getElementById('studentVelden');
  var docentVelden  = document.getElementById('docentVelden');
  var mentorVelden  = document.getElementById('mentorVelden');
  var mentorBedrijf = document.getElementById('mentorBedrijf');

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

    stapGegevens.style.display = '';

    studentVelden.style.display = 'none';
    docentVelden.style.display  = 'none';
    mentorVelden.style.display  = 'none';

    switch (rol) {
      case 'student': studentVelden.style.display = ''; break;
      case 'docent':  docentVelden.style.display  = ''; break;
      case 'mentor':  mentorVelden.style.display  = ''; break;
    }

    updatePreview();
  }

  function updatePreview() {
    var gekozenRol = document.querySelector('input[name="rol"]:checked');
    var rol = gekozenRol ? gekozenRol.value : '';

    var naam = (voornaamEl.value + ' ' + achternaamEl.value).trim();
    document.getElementById('prevNaam').textContent  = naam || '—';
    document.getElementById('prevEmail').textContent = emailEl.value || '—';

    var prevRolEl = document.getElementById('prevRol');
    if (gekozenRol) {
      var labelMap = { student: 'Student', docent: 'Docent', mentor: 'Stagementor', commissielid: 'Commissie' };
      var classMap = { student: 'badge-student', docent: 'badge-docent', mentor: 'badge-stagementor', commissielid: 'badge-commissie' };
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
    setCheck('chk-rol',   !!gekozenRol);
    setCheck('chk-naam',  !!(voornaamEl.value.trim() && achternaamEl.value.trim()));
    setCheck('chk-email', !!emailEl.value.trim());
    setCheck('chk-ww',    wachtwoordEl.value.length >= 8);
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

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Aanmaken…';

    try {
      var bedrijf_id = null;

      if (rol === 'mentor' && mentorBedrijf.value) {
        bedrijf_id = parseInt(mentorBedrijf.value);
      }

      var body = {
        rollen:     [rol],
        voornaam:   voornaamEl.value.trim(),
        achternaam: achternaamEl.value.trim(),
        email:      emailEl.value.trim(),
        wachtwoord: wachtwoordEl.value,
        bedrijf_id: bedrijf_id
      };

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
