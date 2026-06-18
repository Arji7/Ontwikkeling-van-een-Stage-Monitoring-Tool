(function () {
  const mockBedrijven = [
    { id: 1, naam: 'TechCorp BV',       website: 'techcorp.be',    sector: 'IT & Software',  contact: 'Karel Devos',   contactEmail: 'k.devos@techcorp.be',    stad: 'Brussel',   straat: 'Wetstraat 12',         status: 'erkend' },
    { id: 2, naam: 'DataWorks NV',      website: 'dataworks.be',   sector: 'Data & Analyse', contact: 'Laura Vos',     contactEmail: 'l.vos@dataworks.be',     stad: 'Gent',      straat: 'Korenmarkt 5',         status: 'erkend' },
    { id: 3, naam: 'CloudSoft BVBA',    website: 'cloudsoft.be',   sector: 'Cloud & DevOps', contact: 'Mark Peters',   contactEmail: 'm.peters@cloudsoft.be',   stad: 'Antwerpen', straat: 'Meir 30',              status: 'in_beoordeling' },
    { id: 4, naam: 'DigitalInc',        website: 'digitalinc.be',  sector: 'IT Consulting',  contact: 'Sophie Leys',   contactEmail: 's.leys@digitalinc.be',   stad: 'Leuven',    straat: 'Bondgenotenlaan 1',    status: 'erkend' },
    { id: 5, naam: 'NetSec Solutions',  website: 'netsec.be',      sector: 'Cybersecurity',  contact: 'Jan Claes',     contactEmail: 'j.claes@netsec.be',      stad: 'Brussel',   straat: 'Kanaalstraat 8',       status: 'in_beoordeling' },
    { id: 6, naam: 'SoftBase',          website: 'softbase.be',    sector: 'IT & Software',  contact: 'Anne Willems',  contactEmail: 'a.willems@softbase.be',  stad: 'Hasselt',   straat: 'Genkersteenweg 4',     status: 'erkend' },
  ];

  let allBedrijven = mockBedrijven;

  const tableBody    = document.getElementById('tableBody');
  const table        = document.getElementById('bedrijvenTable');
  const emptyMsg     = document.getElementById('emptyMsg');
  const footer       = document.getElementById('tableFooter');
  const searchInput  = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const sectorFilter = document.getElementById('sectorFilter');

  document.addEventListener('DOMContentLoaded', () => {
    vulStats();
    render();
    searchInput.addEventListener('input', render);
    statusFilter.addEventListener('change', render);
    sectorFilter.addEventListener('change', render);
  });

  function vulStats() {
    document.getElementById('statTotaal').textContent     = allBedrijven.length;
    document.getElementById('statErkend').textContent     = allBedrijven.filter(b => b.status === 'erkend').length;
    document.getElementById('statBeoordeling').textContent = allBedrijven.filter(b => b.status === 'in_beoordeling').length;
    document.getElementById('statActief').textContent     = allBedrijven.filter(b => b.status === 'erkend').length;
  }

  function render() {
    const q      = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const sector = sectorFilter.value;

    const filtered = allBedrijven.filter(b => {
      const zoek   = b.naam.toLowerCase().includes(q) || b.sector.toLowerCase().includes(q);
      const stMatch = !status || b.status === status;
      const seMatch = !sector || b.sector === sector;
      return zoek && stMatch && seMatch;
    });

    if (filtered.length === 0) {
      table.querySelector('tbody').innerHTML = '';
      emptyMsg.style.display = 'block';
      footer.textContent = '';
      return;
    }

    emptyMsg.style.display = 'none';
    tableBody.innerHTML = filtered.map(rijHtml).join('');
    footer.textContent = `Toont 1–${filtered.length} van ${allBedrijven.length} bedrijven`;
  }

  function rijHtml(b) {
    const initialen = b.naam.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const badge = b.status === 'erkend'
      ? '<span class="badge badge-erkend">Erkend</span>'
      : '<span class="badge badge-beoordeling">In beoordeling</span>';
    const acties = b.status === 'erkend'
      ? `<a href="bedrijf-bewerken.html?id=${b.id}" class="btn-action btn-edit">Bewerken</a>
         <button class="btn-action btn-delete" onclick="verwijder(${b.id})">Verwijderen</button>`
      : `<a href="bedrijf-bewerken.html?id=${b.id}" class="btn-action btn-edit">Bewerken</a>
         <button class="btn-action btn-erkennen" onclick="erken(${b.id})">Erkennen</button>`;

    return `
      <tr>
        <td><input type="checkbox" /></td>
        <td>
          <div class="bedrijf-cell">
            <div class="row-avatar">${esc(initialen)}</div>
            <div>
              <div class="row-naam">${esc(b.naam)}</div>
              <div class="row-sub">${esc(b.website)}</div>
            </div>
          </div>
        </td>
        <td>${esc(b.sector)}</td>
        <td>
          <div class="row-naam">${esc(b.contact)}</div>
          <div class="row-sub">${esc(b.contactEmail)}</div>
        </td>
        <td>
          <div class="row-naam">${esc(b.stad)}</div>
          <div class="row-sub">${esc(b.straat)}</div>
        </td>
        <td>${badge}</td>
        <td><div class="actions">${acties}</div></td>
      </tr>`;
  }

  window.verwijder = function (id) {
    if (!confirm('Bedrijf verwijderen?')) return;
    allBedrijven = allBedrijven.filter(b => b.id !== id);
    vulStats();
    render();
  };

  window.erken = function (id) {
    const b = allBedrijven.find(b => b.id === id);
    if (b) { b.status = 'erkend'; vulStats(); render(); }
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
