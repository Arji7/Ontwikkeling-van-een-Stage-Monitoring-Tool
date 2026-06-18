(function () {
  // Zelfde mockdata als gebruikers.js
  const mockGebruikers = [
    { id: 1,  naam: 'Sara Janssens',      email: 'sara.janssens@ehb.be',      actief: true,  rollen: ['student'] },
    { id: 2,  naam: 'Thomas Vermeulen',   email: 'thomas.vermeulen@ehb.be',   actief: true,  rollen: ['student'] },
    { id: 3,  naam: 'Prof. Tom Aertsens', email: 'tom.aertsens@ehb.be',       actief: true,  rollen: ['docent'] },
    { id: 4,  naam: 'Prof. Jonas Martens',email: 'jonas.martens@ehb.be',      actief: true,  rollen: ['docent'] },
    { id: 5,  naam: 'Karel Devos',        email: 'k.devos@techcorp.be',       actief: true,  rollen: ['stagementor'] },
    { id: 6,  naam: 'Laura Vos',          email: 'l.vos@dataworks.be',        actief: true,  rollen: ['stagementor'] },
    { id: 7,  naam: 'Marie Pieters',      email: 'm.pieters@ehb.be',          actief: true,  rollen: ['commissielid'] },
    { id: 8,  naam: 'Roos Baert',         email: 'roos.baert@ehb.be',         actief: false, rollen: ['student'] },
    { id: 9,  naam: 'Els Verheyen',       email: 'els.verheyen@ehb.be',       actief: true,  rollen: ['admin', 'commissielid'] },
  ];

  const params     = new URLSearchParams(window.location.search);
  const gebruikerId = parseInt(params.get('id'), 10);
  const gebruiker  = mockGebruikers.find(g => g.id === gebruikerId);

  const voornaamEl   = document.getElementById('voornaam');
  const achternaamEl = document.getElementById('achternaam');
  const emailEl      = document.getElementById('email');
  const feedbackMsg  = document.getElementById('feedbackMsg');
  const submitBtn    = document.getElementById('submitBtn');

  document.addEventListener('DOMContentLoaded', () => {
    if (!gebruiker) {
      toonFeedback('Gebruiker niet gevonden.', 'error');
      submitBtn.disabled = true;
      return;
    }

    // Naam splitsen in voornaam / achternaam
    const naamDelen = gebruiker.naam.trim().split(' ');
    voornaamEl.value   = naamDelen[0] || '';
    achternaamEl.value = naamDelen.slice(1).join(' ') || '';
    emailEl.value      = gebruiker.email;

    // Rol voorinvullen (eerste rol)
    const eersteRol = gebruiker.rollen[0] || 'student';
    const rolRadio  = document.querySelector(`input[name="rol"][value="${eersteRol}"]`);
    if (rolRadio) rolRadio.checked = true;

    // Status voorinvullen
    const statusVal   = gebruiker.actief ? 'actief' : 'inactief';
    const statusRadio = document.querySelector(`input[name="status"][value="${statusVal}"]`);
    if (statusRadio) statusRadio.checked = true;

    document.getElementById('breadcrumbNaam').textContent = gebruiker.naam;

    updatePreview();

    voornaamEl.addEventListener('input', updatePreview);
    achternaamEl.addEventListener('input', updatePreview);
    emailEl.addEventListener('input', updatePreview);
    document.querySelectorAll('input[name="rol"]').forEach(r => r.addEventListener('change', updatePreview));
    document.querySelectorAll('input[name="status"]').forEach(r => r.addEventListener('change', updatePreview));
  });

  function updatePreview() {
    const naam = (voornaamEl.value + ' ' + achternaamEl.value).trim();
    document.getElementById('prevNaam').textContent  = naam  || '—';
    document.getElementById('prevEmail').textContent = emailEl.value || '—';

    const gekozenRol    = document.querySelector('input[name="rol"]:checked');
    const gekozenStatus = document.querySelector('input[name="status"]:checked');

    const prevRolEl = document.getElementById('prevRol');
    if (gekozenRol) {
      const labelMap = { student: 'Student', docent: 'Docent', stagementor: 'Stagementor', commissielid: 'Commissie', admin: 'Admin' };
      const classMap = { student: 'badge badge-student', docent: 'badge badge-docent', stagementor: 'badge badge-stagementor', commissielid: 'badge badge-commissie', admin: 'badge badge-admin' };
      prevRolEl.textContent = labelMap[gekozenRol.value] || gekozenRol.value;
      prevRolEl.className   = classMap[gekozenRol.value] || 'badge';
    }

    const prevStatusEl = document.getElementById('prevStatus');
    if (gekozenStatus) {
      prevStatusEl.textContent = gekozenStatus.value === 'actief' ? 'Actief' : 'Inactief';
      prevStatusEl.className   = gekozenStatus.value === 'actief' ? 'badge badge-actief' : 'badge badge-inactief';
    }

    setCheck('chk-naam',  !!(voornaamEl.value.trim() && achternaamEl.value.trim()));
    setCheck('chk-email', !!emailEl.value.trim());
    setCheck('chk-rol',   !!gekozenRol);
  }

  function setCheck(id, ok) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('done', ok);
  }

  document.getElementById('bewerkenForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const gekozenRol = document.querySelector('input[name="rol"]:checked');
    if (!gekozenRol) {
      toonFeedback('Selecteer een rol voor de gebruiker.', 'error');
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Opslaan…';
    toonFeedback('Wijzigingen opgeslagen! Terug naar overzicht…', 'success');
    setTimeout(() => { window.location.href = 'gebruikers.html'; }, 1500);
  });

  function toonFeedback(msg, type) {
    feedbackMsg.textContent = msg;
    feedbackMsg.className   = 'feedback-msg ' + type;
  }
})();
