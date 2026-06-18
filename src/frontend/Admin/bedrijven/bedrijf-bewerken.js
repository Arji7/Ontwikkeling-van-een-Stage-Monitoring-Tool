(function () {
  const mockBedrijven = [
    { id: 1, naam: 'TechCorp BV',      rechtsvorm: 'BV',   sector: 'IT & Software',  website: 'techcorp.be',   btw: 'BE0123.456.789', straat: 'Wetstraat 12',      postcode: '1000', gemeente: 'Brussel',   contact: 'Karel Devos',  functie: 'Team Lead Backend', email: 'k.devos@techcorp.be',    tel: '+32 499 12 34 56', status: 'erkend' },
    { id: 2, naam: 'DataWorks NV',     rechtsvorm: 'NV',   sector: 'Data & Analyse', website: 'dataworks.be',  btw: '',               straat: 'Korenmarkt 5',      postcode: '9000', gemeente: 'Gent',      contact: 'Laura Vos',    functie: 'Data Manager',      email: 'l.vos@dataworks.be',    tel: '',                 status: 'erkend' },
    { id: 3, naam: 'CloudSoft BVBA',   rechtsvorm: 'BVBA', sector: 'Cloud & DevOps', website: 'cloudsoft.be',  btw: '',               straat: 'Meir 30',           postcode: '2000', gemeente: 'Antwerpen', contact: 'Mark Peters',  functie: 'CTO',               email: 'm.peters@cloudsoft.be', tel: '+32 476 55 66 77', status: 'in_beoordeling' },
    { id: 4, naam: 'DigitalInc',       rechtsvorm: 'BV',   sector: 'IT Consulting',  website: 'digitalinc.be', btw: '',               straat: 'Bondgenotenlaan 1', postcode: '3000', gemeente: 'Leuven',    contact: 'Sophie Leys',  functie: 'HR Manager',        email: 's.leys@digitalinc.be',  tel: '',                 status: 'erkend' },
    { id: 5, naam: 'NetSec Solutions', rechtsvorm: 'BV',   sector: 'Cybersecurity',  website: 'netsec.be',     btw: '',               straat: 'Kanaalstraat 8',    postcode: '1000', gemeente: 'Brussel',   contact: 'Jan Claes',    functie: 'Security Lead',     email: 'j.claes@netsec.be',     tel: '',                 status: 'in_beoordeling' },
    { id: 6, naam: 'SoftBase',         rechtsvorm: 'BV',   sector: 'IT & Software',  website: 'softbase.be',   btw: '',               straat: 'Genkersteenweg 4',  postcode: '3500', gemeente: 'Hasselt',   contact: 'Anne Willems', functie: 'Office Manager',    email: 'a.willems@softbase.be', tel: '',                 status: 'erkend' },
  ];

  const params = new URLSearchParams(window.location.search);
  const bedrijf = mockBedrijven.find(b => b.id === parseInt(params.get('id'), 10));

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

  document.addEventListener('DOMContentLoaded', () => {
    if (!bedrijf) {
      toonFeedback('Bedrijf niet gevonden.', 'error');
      submitBtn.disabled = true;
      return;
    }

    naamEl.value        = bedrijf.naam;
    rechtsvormEl.value  = bedrijf.rechtsvorm;
    sectorEl.value      = bedrijf.sector;
    websiteEl.value     = bedrijf.website;
    btwEl.value         = bedrijf.btw;
    straatEl.value      = bedrijf.straat;
    postcodeEl.value    = bedrijf.postcode;
    gemeenteEl.value    = bedrijf.gemeente;
    contactNaamEl.value = bedrijf.contact;
    contactFuncEl.value = bedrijf.functie;
    contactMailEl.value = bedrijf.email;
    contactTelEl.value  = bedrijf.tel;

    const statusRadio = document.querySelector(`input[name="status"][value="${bedrijf.status}"]`);
    if (statusRadio) statusRadio.checked = true;

    document.getElementById('breadcrumbNaam').textContent = bedrijf.naam;

    updatePreview();

    [naamEl, sectorEl, gemeenteEl, contactNaamEl].forEach(el => el.addEventListener('input', updatePreview));
    document.querySelectorAll('input[name="status"]').forEach(r => r.addEventListener('change', updatePreview));
    [straatEl, postcodeEl, contactMailEl].forEach(el => el.addEventListener('input', updateChecklist));
  });

  function updatePreview() {
    document.getElementById('prevNaam').textContent    = naamEl.value        || '—';
    document.getElementById('prevSector').textContent  = sectorEl.value      || '—';
    document.getElementById('prevGemeente').textContent = gemeenteEl.value   || '—';
    document.getElementById('prevContact').textContent = contactNaamEl.value  || '—';

    const gekozenStatus = document.querySelector('input[name="status"]:checked');
    const prevStatusEl  = document.getElementById('prevStatus');
    if (gekozenStatus) {
      prevStatusEl.textContent = gekozenStatus.value === 'erkend' ? 'Erkend' : 'In beoordeling';
      prevStatusEl.className   = gekozenStatus.value === 'erkend' ? 'badge badge-erkend' : 'badge badge-beoordeling';
    }

    updateChecklist();
  }

  function updateChecklist() {
    setCheck('chk-naam',    !!naamEl.value.trim());
    setCheck('chk-sector',  !!sectorEl.value.trim());
    setCheck('chk-adres',   !!(straatEl.value.trim() && postcodeEl.value.trim() && gemeenteEl.value.trim()));
    setCheck('chk-contact', !!(contactNaamEl.value.trim() && contactMailEl.value.trim()));
  }

  function setCheck(id, ok) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('done', ok);
  }

  document.getElementById('bewerkenForm').addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Opslaan…';
    toonFeedback('Wijzigingen opgeslagen! Terug naar overzicht…', 'success');
    setTimeout(() => { window.location.href = 'bedrijven.html'; }, 1500);
  });

  function toonFeedback(msg, type) {
    feedbackMsg.textContent = msg;
    feedbackMsg.className   = 'feedback-msg ' + type;
  }
})();
