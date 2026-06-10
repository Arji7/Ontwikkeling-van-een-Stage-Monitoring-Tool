/**
 * Haal de rol op uit de URL parameter.
 * Voorbeeld URL: wachtwoord-vergeten.html?rol=student
 * Mogelijke rollen: student, docent, mentor, commissie, admin
 */
function getRolFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('rol') || 'gebruiker';
}

/**
 * Pas de role badge aan op basis van de URL parameter.
 */
function setRoleBadge() {
  const rolMap = {
    student:   'Student',
    docent:    'EhB-docent',
    mentor:    'Stagementor',
    commissie: 'Stagecommissie',
    admin:     'Administratie',
  };
  const rol = getRolFromURL().toLowerCase();
  const badge = document.getElementById('roleBadge');
  if (badge) {
    badge.textContent = rolMap[rol] || 'Gebruiker';
  }
}

/**
 * Valideer e-mailadres.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Verwerk het formulier.
 * In productie: vervang de fetch() call met het echte API endpoint.
 */
async function handleSubmit() {
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('emailError');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('successMessage');
  const email      = emailInput.value.trim();

  // Reset vorige foutmeldingen
  emailError.textContent = '';
  emailInput.classList.remove('error');
  successMsg.style.display = 'none';

  // Validatie
  if (!email) {
    emailError.textContent = 'Vul je e-mailadres in.';
    emailInput.classList.add('error');
    emailInput.focus();
    return;
  }

  if (!isValidEmail(email)) {
    emailError.textContent = 'Voer een geldig e-mailadres in.';
    emailInput.classList.add('error');
    emailInput.focus();
    return;
  }

  // Knop uitschakelen tijdens verwerking
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verzenden...';

  try {
    // TODO: vervang de URL hieronder met jullie echte
    // backend endpoint zodra Ayoub / Farouk dit klaar
    // heeft. Verwachte payload: { email, rol }
    const response = await fetch('/api/auth/wachtwoord-vergeten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, rol: getRolFromURL() }),
    });

    if (response.ok) {
      successMsg.style.display = 'block';
      emailInput.value = '';
    } else {
      const data = await response.json().catch(() => ({}));
      emailError.textContent = data.message || 'Er is iets misgegaan. Probeer opnieuw.';
      emailInput.classList.add('error');
    }

  } catch (err) {
    // Netwerk- of serverfout
    // Tijdelijk: toon succes voor demo / frontend-only testen
    console.warn('API niet bereikbaar — demo modus actief:', err.message);
    successMsg.style.display = 'block';
    emailInput.value = '';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Resetlink versturen';
  }
}

/**
 * Sta versturen toe via Enter-toets.
 */
document.addEventListener('DOMContentLoaded', () => {
  setRoleBadge();

  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
  }
});