function heeftMailConfig() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function laadNodemailer() {
  try {
    return require('nodemailer');
  } catch (err) {
    return null;
  }
}

async function stuurAccountgegevensMail({ naar, naam, accountEmail, tijdelijkWachtwoord, rollen }) {
  if (!naar) {
    return { verzonden: false, reden: 'Geen persoonlijk e-mailadres opgegeven.' };
  }

  if (!heeftMailConfig()) {
    return { verzonden: false, reden: 'SMTP is niet ingesteld.' };
  }

  const nodemailer = laadNodemailer();
  if (!nodemailer) {
    return { verzonden: false, reden: 'Nodemailer is niet geinstalleerd.' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const rolTekst = Array.isArray(rollen) ? rollen.join(', ') : rollen || 'gebruiker';
  const loginUrl = process.env.FRONTEND_LOGIN_URL || 'http://localhost:3000/inloggen/inloggen.html';

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: naar,
    subject: 'Je accountgegevens voor StageMonitor',
    text:
      `Beste ${naam || 'gebruiker'},\n\n` +
      `Er is een StageMonitor-account voor jou aangemaakt.\n\n` +
      `Rol: ${rolTekst}\n` +
      `Login e-mailadres: ${accountEmail}\n` +
      `Tijdelijk wachtwoord: ${tijdelijkWachtwoord}\n\n` +
      `Inloggen kan via: ${loginUrl}\n\n` +
      `Wijzig je wachtwoord na de eerste keer inloggen.\n`
  });

  return { verzonden: true };
}

module.exports = { stuurAccountgegevensMail };
