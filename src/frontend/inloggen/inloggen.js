/* ============================================================
   StageMonitorage — Login (inloggen.js)
   ============================================================ */

/* ---------- INSTELLINGEN (pas hier aan) ---------- */
const CONFIG = {
  API_BASE_URL: API_BASE,
  DEMO_MODE: false,
  DASHBOARD_BY_ROLE: {
    student:      "../Student/empty-stage/empty-stage.html",
    docent:       "../Docent/dashboard/dashboard.html",
    admin:        "../Admin/Dashboard/dashboard.html",
    mentor:       "../Mentor/dashboard/dashboard.html",
    bedrijf:      "../Student/stageovereenkomst-document/stageovereenkomst-document.html",
    commissielid: "../Commisie/aanvragen.overzicht/aanvragen.overzicht.html",
  },
  // Prioriteit bij meerdere rollen (hoogste eerst)
  ROL_PRIORITEIT: ["admin", "commissielid", "docent", "bedrijf", "mentor", "student"],
};


document.addEventListener("DOMContentLoaded", function () {
  const form          = document.getElementById("loginForm");
  const emailInput    = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const rememberInput = document.getElementById("remember");
  const submitButton  = document.getElementById("loginButton");
  const formAlert     = document.getElementById("formAlert");

  const savedEmail = localStorage.getItem("rememberedEmail");
  if (savedEmail) { emailInput.value = savedEmail; rememberInput.checked = true; }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideAlert();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    let valid = true;
    if (!isValidEmail(email)) { showFieldError("email", "Vul een geldig e-mailadres in."); valid = false; }
    else clearFieldError("email");
    if (password.length === 0) { showFieldError("password", "Vul je wachtwoord in."); valid = false; }
    else clearFieldError("password");
    if (!valid) return;

    setLoading(true);
    try {
      const user = CONFIG.DEMO_MODE ? await demoLogin(email, password)
                                    : await apiLogin(email, password);

      if (rememberInput.checked) localStorage.setItem("rememberedEmail", email);
      else localStorage.removeItem("rememberedEmail");

      sessionStorage.setItem("currentUser", JSON.stringify(user));

      const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
      if (redirectAfterLogin && redirectAfterLogin.includes("/stageovereenkomst-document/")) {
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.href = redirectAfterLogin;
        return;
      }

      // Voor studenten: check de stage-status en stuur door naar juiste pagina
      if (user.role === "student") {
        try {
          const stagesRes = await fetch(CONFIG.API_BASE_URL + "/stages/mijn", {
            headers: { "Authorization": "Bearer " + user.token }
          });
          if (stagesRes.ok) {
            const stages = await stagesRes.json();
            if (Array.isArray(stages) && stages.length > 0) {
              const PRIORITEIT = ["aanpassingen_vereist", "afgekeurd", "goedgekeurd", "ingediend", "in_beoordeling", "concept"];
              const stage = stages.slice().sort(function (a, b) {
                const pa = PRIORITEIT.indexOf(a.status);
                const pb = PRIORITEIT.indexOf(b.status);
                if (pa !== pb) return pa - pb;
                return new Date(b.aangemaakt_op) - new Date(a.aangemaakt_op);
              })[0];
              const STATUS_REDIRECTS = {
                "goedgekeurd":          "../Student/stage-beoordeling/stage-goedgekeurd/stage-goedgekeurd.html",
                "afgekeurd":            "../Student/stage-beoordeling/stage-afgewezen/stage-afgewezen.html",
                "aanpassingen_vereist": "../Student/stage-beoordeling/stage-aanpassingen/stage-aanpassingen.html"
              };
              if (STATUS_REDIRECTS[stage.status]) {
                window.location.href = STATUS_REDIRECTS[stage.status];
                return;
              }
            }
          }
        } catch (e) { /* val terug op standaard dashboard */ }
      }

      const target = CONFIG.DASHBOARD_BY_ROLE[user.role];
      if (target) window.location.href = target;
      else showAlert("Onbekende rol: er is geen dashboard voor '" + user.role + "'.");
    } catch (error) {
      showAlert(error.message || "Inloggen is mislukt. Probeer opnieuw.");
    } finally {
      setLoading(false);
    }
  });

  async function apiLogin(email, password) {
    let response;
    try {
      response = await fetch(CONFIG.API_BASE_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, wachtwoord: password }),
      });
    } catch (e) { throw new Error("Geen verbinding met de server. Staat de backend aan?"); }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "E-mailadres of wachtwoord is onjuist.");

    sessionStorage.setItem("token", data.token);

    const rollen = data.gebruiker.rollen || [];
    // Kies hoogste rol uit de prioriteitslijst
    const rol = CONFIG.ROL_PRIORITEIT.find(function (r) { return rollen.includes(r); }) || "student";
    return { email: data.gebruiker.email, role: rol, rollen: rollen, name: data.gebruiker.voornaam + " " + data.gebruiker.achternaam, token: data.token };
  }

  async function demoLogin(email, password) {
    const match = CONFIG.DEMO_USERS.find(function (u) {
      return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
    });
    if (!match) throw new Error("E-mailadres of wachtwoord is onjuist.");
    return { email: match.email, role: match.role, name: match.name, token: null };
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function showFieldError(id, msg) {
    document.getElementById(id).classList.add("is-invalid");
    const e = document.getElementById(id + "Error");
    e.textContent = msg; e.classList.add("is-visible");
  }
  function clearFieldError(id) {
    document.getElementById(id).classList.remove("is-invalid");
    document.getElementById(id + "Error").classList.remove("is-visible");
  }
  function showAlert(msg) { formAlert.textContent = msg; formAlert.classList.add("is-visible"); }
  function hideAlert() { formAlert.classList.remove("is-visible"); }
  function setLoading(on) {
    submitButton.disabled = on;
    submitButton.textContent = on ? "Bezig met inloggen..." : "Inloggen";
  }
});
