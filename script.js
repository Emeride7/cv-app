(() => {
  "use strict";

  /* =========================================================
   * Troptop CV v3.1 — Corrections :
   *  - PDF ATS : impression navigateur (texte sélectionnable)
   *  - Contact : sans labels redondants, séparateur propre
   *  - Emoji supprimés du contenu CV (incompatibles ATS)
   *  - monthNames : clé "jan" dupliquée corrigée
   *  - Suggestions pills : mise à jour après ajout
   *  - Score ATS : coloration dynamique (rouge/orange/vert)
   *  - Mode ATS : compétences en texte plat
   *  - font-weight standardisé
   * ========================================================= */

  /* ========================= Utils ========================= */
  const $ = (sel) => document.querySelector(sel);
  const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
  const deepClone = (x) => JSON.parse(JSON.stringify(x));

  const escapeHTML = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const safeFilePart = (s) =>
    String(s || "").trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40) || "X";

  const debounce = (fn, wait = 250) => {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  };

  const normalizeSpace = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

  const isMobile = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || window.innerWidth <= 768;

  const monthInputSupported = () => {
    const i = document.createElement("input");
    i.setAttribute("type", "month");
    i.value = "2020-01";
    return i.type === "month" && i.value === "2020-01";
  };

  const parseMonthValue = (ym) => {
    const s = String(ym || "").trim();
    if (!/^\d{4}-\d{2}$/.test(s)) return null;
    const [y, m] = s.split("-").map((n) => parseInt(n, 10));
    if (m < 1 || m > 12) return null;
    return { y, m };
  };

  const formatMonthFR = (ym) => {
    const p = parseMonthValue(ym);
    if (!p) return "";
    const d = new Date(p.y, p.m - 1, 1);
    return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(d);
  };

  const nowMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const monthDiff = (startYM, endYM) => {
    const a = parseMonthValue(startYM);
    const b = parseMonthValue(endYM);
    if (!a || !b) return null;
    const diff = (b.y * 12 + b.m - 1) - (a.y * 12 + a.m - 1);
    return diff >= 0 ? diff : null;
  };

  const formatDurationFR = (months) => {
    if (months == null) return "";
    const years = Math.floor(months / 12);
    const rem = months % 12;
    const y = years ? `${years} an${years > 1 ? "s" : ""}` : "";
    const m = rem ? `${rem} mois` : "";
    return [y, m].filter(Boolean).join(" ");
  };

  /** Téléchargement Blob — compatible mobile (Android/iOS) */
  const downloadBlob = (blob, filename) => {
    try {
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e) {
      console.error("downloadBlob error:", e);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  const vRequired = (msg) => (v) => (String(v || "").trim() ? "" : msg);
  const vEmail = (msg) => (v) => {
    const s = String(v || "").trim();
    if (!s) return msg;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s) ? "" : msg;
  };
  const vPhone = (msg) => (v) => {
    const s = String(v || "").trim();
    if (!s) return msg;
    const cleaned = s.replace(/[^\d+]/g, "");
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return msg;
    return /^[+\d]+$/.test(cleaned) ? "" : msg;
  };

  const splitCommaList = (text) =>
    String(text || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 80);

  /* ========================= DOM refs ========================= */
  const chatLog = $("#chat-log");
  const widgetArea = $("#widget-area");
  const inputArea = $("#input-area");
  const userInput = $("#user-input");
  const sendBtn = $("#send-btn");
  const inputHint = $("#input-hint");
  const backBtn = $("#back-btn");
  const atsToggle = $("#ats-toggle");
  const cvPreview = $("#cv-preview");
  const downloadPdfBtn = $("#download-pdf");
  const downloadDocxBtn = $("#download-docx");
  const printBtn = $("#print-btn");
  const templateSwitcher = $("#template-switcher");
  const atsBadge = $("#ats-badge");
  const atsScoreEl = $("#ats-score");
  const atsPanel = $("#ats-panel");
  const atsRecos = $("#ats-recos");
  const resumeBtn = $("#resume-btn");
  const importBtn = $("#import-btn");
  const resetBtn = $("#reset-btn");
  const importModal = $("#import-modal");
  const linkedinText = $("#linkedin-text");
  const parseLinkedinBtn = $("#parse-linkedin");
  const pdfFileInput = $("#pdf-file");
  const parsePdfBtn = $("#parse-pdf");
  const pdfStatus = $("#pdf-status");
  const applyImportBtn = $("#apply-import");
  const importPreview = $("#import-preview");
  const importPreviewPre = $("#import-preview-pre");

  /* ========================= Storage ========================= */
  const STORAGE_KEY = "troptopcv:v3";

  const saveToStorage = debounce((state) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, 300);

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 3) return null;
      return parsed;
    } catch { return null; }
  };

  const clearStorage = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.removeItem("troptopcv:v2"); } catch {}
  };

  /* ========================= State ========================= */
  const Steps = Object.freeze({
    WELCOME: "welcome",
    IDENTITY: "identity",
    PROFILE: "profile",
    EXP_START: "exp_start",
    EXP_FORM: "exp_form",
    EXP_MISSIONS: "exp_missions",
    FORMATIONS: "formations",
    CERTIFICATIONS: "certifications",
    SKILLS: "skills",
    SOFT: "soft",
    LANGUAGES: "languages",
    REVIEW: "review",
    FINISHED: "finished",
  });

  const initialState = () => ({
    version: 3,
    flow: { step: Steps.WELCOME, identityIndex: 0, currentExpId: null },
    ui: {
      selectedTemplate: "t1",
      atsMode: true,
      chat: [],
      lockedInput: false,
      lockReason: "",
      importDraft: null,
    },
    data: {
      identity: { prenom: "", nom: "", email: "", telephone: "", ville: "", titre: "" },
      profile: { summary: "" },
      experiences: [],  // {id, entreprise, poste, startYM, endYM, isCurrent, missions:[{id,text}]}
      formations: [],   // {id, diplome, etablissement, ville, startYM, endYM}
      certifications: [], // {id, nom, organisme, annee}
      skills: { hard: [], soft: [], passions: [] },
      languages: [], // {id, langue, niveau}
    },
  });

  let state = initialState();
  let history = [];

  const pushHistory = () => {
    history.push(deepClone(state));
    if (history.length > 60) history.shift();
    backBtn.disabled = history.length === 0;
  };

  const popHistory = () => {
    const prev = history.pop();
    backBtn.disabled = history.length === 0;
    return prev || null;
  };

  const setState = (next, { skipHistory = false } = {}) => {
    if (!skipHistory) pushHistory();
    state = next;
    saveToStorage(state);
    renderAll();
  };

  /* ========================= Chat UI ========================= */
  const addChat = (type, text, { isQuestion = false } = {}) => {
    const msg = { id: uid(), type, text, isQuestion, ts: Date.now() };
    state.ui.chat.push(msg);
    return msg;
  };

  const rebuildChatDOM = () => {
    chatLog.innerHTML = "";
    for (const m of state.ui.chat) {
      const div = document.createElement("div");
      div.className = `msg msg--${m.type}${m.isQuestion ? " msg--question" : ""}`;
      div.textContent = m.text;
      div.dataset.msgid = m.id;
      chatLog.appendChild(div);
    }
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  const setInputLock = (locked, reason = "") => {
    state.ui.lockedInput = !!locked;
    state.ui.lockReason = reason || "";
    userInput.disabled = !!locked;
    sendBtn.disabled = !!locked;
    inputHint.textContent = locked ? (reason || "Veuillez utiliser les boutons ci-dessus.") : "";
  };

  const setWidget = (node, { lockTextInput = false, lockReason = "" } = {}) => {
    widgetArea.innerHTML = "";
    if (!node) { widgetArea.hidden = true; setInputLock(false, ""); return; }
    widgetArea.hidden = false;
    widgetArea.appendChild(node);
    setInputLock(lockTextInput, lockReason);
  };

  const system = (text) => addChat("system", text, { isQuestion: false });
  const bot = (text, { isQuestion = false } = {}) => addChat("bot", text, { isQuestion });
  const user = (text) => addChat("user", text, { isQuestion: false });

  /* ========================= CV Render ========================= */
  const computeExpDisplay = (exp) => {
    const start = exp.startYM ? formatMonthFR(exp.startYM) : "";
    const end = exp.isCurrent ? "En cours" : (exp.endYM ? formatMonthFR(exp.endYM) : "");
    const endForDur = exp.isCurrent ? nowMonth() : exp.endYM;
    const md = exp.startYM && endForDur ? monthDiff(exp.startYM, endForDur) : null;
    const dur = md != null ? formatDurationFR(md + 1) : "";
    const range = [start, end].filter(Boolean).join(" – ");
    return (range || "") + (dur ? ` (${dur})` : "");
  };

  const computeEduDisplay = (edu) => {
    const start = edu.startYM ? formatMonthFR(edu.startYM) : "";
    const end = edu.endYM ? formatMonthFR(edu.endYM) : "";
    const md = edu.startYM && edu.endYM ? monthDiff(edu.startYM, edu.endYM) : null;
    const dur = md != null ? formatDurationFR(md + 1) : "";
    const range = [start, end].filter(Boolean).join(" – ");
    return (range || "") + (dur ? ` (${dur})` : "");
  };

  const renderCV = () => {
    const a = state.data;
    const id = a.identity;
    const fullName = normalizeSpace(`${id.prenom} ${id.nom}`) || "Votre Nom";
    const title = normalizeSpace(id.titre);
    const summary = normalizeSpace(a.profile.summary);
    const isATS = !!state.ui.atsMode;

    /* FIX : contact sans labels redondants (ATS lit directement les valeurs)
       Séparateur visuel « | » uniquement, pas "Email :" ou "Tél :" */
    const contactParts = [
      id.email || "",
      id.telephone || "",
      id.ville || "",
    ].filter(Boolean);

    const contactHTML = contactParts
      .map((c, i) =>
        `<span>${escapeHTML(c)}</span>${i < contactParts.length - 1 ? '<span class="cv-contact-sep">|</span>' : ""}`
      ).join("");

    // === Expériences ===
    const expHTML = (a.experiences || []).map((exp) => {
      const missions = (exp.missions || []).map((m) => `<li>${escapeHTML(m.text)}</li>`).join("");
      const dates = computeExpDisplay(exp);
      return `
        <div class="exp-item avoid-pagebreak">
          <div class="exp-top">
            <span class="exp-role">${escapeHTML(exp.poste || "")}</span>
            <span class="exp-company">&nbsp;— ${escapeHTML(exp.entreprise || "")}</span>
          </div>
          ${dates ? `<div class="exp-dates">${escapeHTML(dates)}</div>` : ""}
          ${missions ? `<ul class="exp-missions">${missions}</ul>` : ""}
        </div>`;
    }).join("");

    // === Formations ===
    const eduHTML = (a.formations || []).map((edu) => {
      const dates = computeEduDisplay(edu);
      /* FIX : ville sans emoji 📍 — les emojis sont ignorés ou mal parsés par les ATS */
      return `
        <div class="edu-item avoid-pagebreak">
          <div class="edu-top">
            <span class="edu-degree">${escapeHTML(edu.diplome || "")}</span>
            ${edu.etablissement ? `<span class="edu-school">&nbsp;— ${escapeHTML(edu.etablissement)}</span>` : ""}
          </div>
          ${dates ? `<div class="edu-dates">${escapeHTML(dates)}</div>` : ""}
          ${edu.ville ? `<div class="edu-ville">${escapeHTML(edu.ville)}</div>` : ""}
        </div>`;
    }).join("");

    // === Certifications ===
    const certHTML = (a.certifications || []).map((cert) => `
      <div class="cert-item avoid-pagebreak">
        <div class="cert-name">${escapeHTML(cert.nom || "")}</div>
        <div class="cert-meta">${escapeHTML(cert.organisme || "")}${cert.annee ? ` — ${escapeHTML(cert.annee)}` : ""}</div>
      </div>`).join("");

    // === Compétences : chips visuelles + texte plat ATS ===
    const hardArr = a.skills.hard || [];
    const softArr = a.skills.soft || [];
    const passionsArr = a.skills.passions || [];
    const langsArr = a.languages || [];

    const hardChips = hardArr.map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const softChips = softArr.map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const passionChips = passionsArr.map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const langsChips = langsArr.map((l) => `<span class="chip">${escapeHTML(l.langue)} — ${escapeHTML(l.niveau)}</span>`).join("");

    /* FIX : texte plat pour ATS (une compétence par virgule) */
    const hardText = hardArr.join(", ");
    const softText = softArr.join(", ");
    const passionText = passionsArr.join(", ");
    const langsText = langsArr.map(l => `${l.langue} (${l.niveau})`).join(", ");

    const atsClass = isATS ? "is-ats" : "";
    const tpl = isATS ? "t2" : state.ui.selectedTemplate;

    const skillSection = (title, chips, text, empty = "—") => `
      <section class="cv-section avoid-pagebreak">
        <h2 class="cv-section-title">${title}</h2>
        ${chips ? `<div class="chips">${chips}</div>` : ""}
        ${text ? `<p class="cv-skills-text">${escapeHTML(text)}</p>` : (!chips ? `<div class="muted">${empty}</div>` : "")}
        ${!chips && !text ? `<div class="muted">${empty}</div>` : ""}
      </section>`;

    cvPreview.innerHTML = `
      <div class="cv-paper" id="cv-paper">
        <div class="cv-root cv--${tpl} ${atsClass}" id="cv-root">
          <div class="cv-headline avoid-pagebreak">
            <h1 class="cv-name">${escapeHTML(fullName)}</h1>
            ${title ? `<div class="cv-title">${escapeHTML(title)}</div>` : ""}
            ${contactHTML ? `<div class="cv-contact">${contactHTML}</div>` : ""}
          </div>

          ${summary ? `
          <section class="cv-section avoid-pagebreak">
            <h2 class="cv-section-title">Profil professionnel</h2>
            <div class="cv-summary">${escapeHTML(summary)}</div>
          </section>` : ""}

          <div class="two-col">
            <!-- Colonne principale -->
            <div>
              <section class="cv-section">
                <h2 class="cv-section-title">Expériences professionnelles</h2>
                ${expHTML || `<div class="muted">Aucune expérience renseignée.</div>`}
              </section>

              ${(a.formations || []).length ? `
              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Formation</h2>
                ${eduHTML}
              </section>` : ""}

              ${(a.certifications || []).length ? `
              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Certifications</h2>
                ${certHTML}
              </section>` : ""}
            </div>

            <!-- Colonne secondaire -->
            <div>
              ${skillSection("Compétences techniques", hardChips, hardText)}
              ${skillSection("Soft skills", softChips, softText)}
              ${skillSection("Centres d'intérêt", passionChips, passionText)}
              ${skillSection("Langues", langsChips, langsText)}
            </div>
          </div>
        </div>
      </div>`;
  };

  /* ========================= ATS Scoring ========================= */
  const getATS = () => {
    const a = state.data;
    const id = a.identity;
    const recos = [];
    let score = 0;

    const hasName = normalizeSpace(`${id.prenom} ${id.nom}`).length >= 3;
    const hasEmail = !!id.email && !vEmail("bad")(id.email);
    const hasPhone = !!id.telephone && !vPhone("bad")(id.telephone);
    const hasTitle = normalizeSpace(id.titre).length >= 2;
    const expCount = (a.experiences || []).length;
    const missionCount = (a.experiences || []).reduce((n, e) => n + (e.missions?.length || 0), 0);
    const hardCount = (a.skills.hard || []).length;
    const langCount = (a.languages || []).length;
    const summaryLen = normalizeSpace(a.profile.summary).length;
    const formCount = (a.formations || []).length;
    const certCount = (a.certifications || []).length;

    if (hasName) score += 8; else recos.push("Ajoutez votre prénom et nom complet.");
    if (hasEmail) score += 8; else recos.push("Ajoutez un email valide (format nom@domaine.com).");
    if (hasPhone) score += 5; else recos.push("Ajoutez un numéro de téléphone avec indicatif.");
    if (hasTitle) score += 6; else recos.push("Ajoutez un titre métier précis (ex : Développeur Full-Stack).");

    if (summaryLen >= 260) score += 10;
    else if (summaryLen >= 120) score += 7;
    else if (summaryLen > 0) score += 4;
    else recos.push("Ajoutez un profil professionnel de 3–6 lignes résumant votre valeur.");

    if (expCount >= 2) score += 10;
    else if (expCount === 1) score += 6;
    else recos.push("Ajoutez au moins une expérience professionnelle.");

    if (missionCount >= 8) score += 10;
    else if (missionCount >= 3) score += 7;
    else if (missionCount > 0) score += 3;
    else recos.push("Ajoutez des missions détaillées (idéal : 3–6 par expérience).");

    const missionsText = (a.experiences || []).flatMap(e => (e.missions || []).map(m => m.text)).join(" ");
    if (/\b\d+([.,]\d+)?\s*(%|clients?|projets?|€|\$|K|M)\b/.test(missionsText)) score += 7;
    else if (/\b\d+([.,]\d+)?\b/.test(missionsText)) score += 4;
    else recos.push("Quantifiez vos résultats avec des chiffres (ex : +25%, 30 clients, 2M€…).");

    if (hardCount >= 10) score += 8;
    else if (hardCount >= 5) score += 5;
    else if (hardCount > 0) score += 3;
    else recos.push("Ajoutez vos compétences techniques (idéal : 8–12).");

    if (langCount >= 2) score += 5;
    else if (langCount === 1) score += 3;
    else recos.push("Ajoutez au moins une langue et son niveau (ex : Anglais — Courant).");

    if (formCount >= 1) score += 5;
    else recos.push("Ajoutez votre formation principale (diplôme, école, année).");

    if (certCount >= 1) score += 4;
    else recos.push("Des certifications (AWS, TOEIC, PMI…) améliorent votre score ATS.");

    if (state.ui.atsMode) score += 10;
    else recos.push("Activez le Mode ATS pour une mise en page compatible avec les robots de tri.");

    score = Math.max(0, Math.min(100, score));

    // Recommandations métier spécifiques
    const job = (id.titre || "").toLowerCase();
    if (job.includes("développ") || job.includes("dev") || job.includes("software") || job.includes("data")) {
      if (hardCount < 5) recos.push("Tech : ajoutez les mots-clés de votre stack (React, Python, Docker…).");
    } else if (job.includes("marketing") || job.includes("growth") || job.includes("digital")) {
      if (!missionsText.match(/\b(cpc|roas|ctr|cpm|seo|sea|kpi|taux)\b/i))
        recos.push("Marketing : ajoutez des KPI sectoriels (CPC, ROAS, CTR, taux de conversion…).");
    } else if (job.includes("finance") || job.includes("compta") || job.includes("audit")) {
      if (!missionsText.match(/\b(excel|erp|sap|ifrs|budget)\b/i))
        recos.push("Finance : mentionnez vos outils (Excel avancé, ERP, SAP) et normes (IFRS).");
    }

    return { score, recos: recos.slice(0, 10) };
  };

  const renderATS = () => {
    const { score, recos } = getATS();
    if (state.flow.step === Steps.FINISHED || state.flow.step === Steps.REVIEW) {
      atsBadge.hidden = false;
      atsPanel.hidden = false;
      atsScoreEl.textContent = String(score);

      /* FIX : couleur dynamique du badge selon score */
      atsBadge.classList.remove("score--low", "score--mid", "score--high");
      if (score < 50) atsBadge.classList.add("score--low");
      else if (score < 75) atsBadge.classList.add("score--mid");
      else atsBadge.classList.add("score--high");

      atsRecos.innerHTML = "";
      if (recos.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Excellent ! Votre CV est bien optimisé pour les ATS.";
        li.style.color = "#065f46";
        atsRecos.appendChild(li);
      } else {
        recos.forEach((r) => {
          const li = document.createElement("li");
          li.textContent = r;
          atsRecos.appendChild(li);
        });
      }
    } else {
      atsBadge.hidden = true;
      atsPanel.hidden = true;
    }
  };

  /* ========================= Template switcher ========================= */
  const setTemplate = (tpl) => {
    state.ui.selectedTemplate = tpl;
    renderAll();
  };

  const initTemplateSwitcher = () => {
    templateSwitcher.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-template]");
      if (!btn) return;
      if (state.ui.atsMode && btn.dataset.template === "t3") {
        system("Le modèle 3 (fond coloré) est désactivé en Mode ATS — il gêne la lecture des parsers.");
        rebuildChatDOM(); return;
      }
      templateSwitcher.querySelectorAll("button[data-template]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      setTemplate(btn.dataset.template);
    });
  };

  /* ========================= PDF Export ========================= */
  /**
   * FIX CRITIQUE ATS :
   * html2pdf + html2canvas rasterise le CV en JPEG → PDF image.
   * Un PDF image ne contient AUCUN texte sélectionnable : les robots ATS
   * ne peuvent pas lire votre CV ! Score ATS = 0 de facto.
   *
   * SOLUTION :
   * → Mode ATS ou mobile : on génère un HTML autonome propre et on ouvre
   *   la boîte d'impression du navigateur. "Enregistrer en PDF" via
   *   Chrome/Firefox crée un PDF avec texte sélectionnable et parseable.
   * → Mode non-ATS (visuel) sur desktop : html2pdf (mise en page fidèle
   *   mais image — acceptable pour CV envoyé directement à un humain).
   */
  const downloadPDF = async () => {
    const paper = document.getElementById("cv-paper");
    if (!paper || paper.textContent.trim().length < 20) {
      system("Le CV n'est pas prêt pour l'export. Renseignez au moins votre nom.");
      rebuildChatDOM(); return;
    }

    const prenom = safeFilePart(state.data.identity.prenom || "Prenom");
    const nom = safeFilePart(state.data.identity.nom || "Nom");
    const filename = `CV_${prenom}_${nom}.pdf`;

    // FIX : en mode ATS ou mobile → impression navigateur (PDF texte)
    if (state.ui.atsMode || isMobile() || !window.html2pdf) {
      bot(state.ui.atsMode
        ? "📄 Mode ATS actif : votre navigateur va ouvrir la fenêtre d'impression. Sélectionnez « Enregistrer en PDF » pour obtenir un PDF avec texte lisible par les ATS."
        : "📄 Votre navigateur va ouvrir la fenêtre d'impression. Sélectionnez « Enregistrer en PDF ».",
        { isQuestion: false }
      );
      rebuildChatDOM();
      try {
        await exportPDFPrint(filename);
      } catch (e) {
        console.error("PDF print error:", e);
        system("Impossible d'ouvrir la fenêtre d'impression. Essayez le bouton 🖨 Imprimer.");
        rebuildChatDOM();
      }
      return;
    }

    // Mode non-ATS + desktop : html2pdf (visuel, pour envoi direct à un recruteur humain)
    try { await document.fonts?.ready; } catch {}
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    downloadPdfBtn.disabled = true;
    downloadPdfBtn.innerHTML = '<span class="spinner"></span>Génération…';

    const opt = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    try {
      await html2pdf().set(opt).from(paper).save();
    } catch (e) {
      console.error("[PDF] Erreur:", e);
      system("Erreur export PDF : " + e.message + ". Essayez le bouton 🖨 Imprimer.");
      rebuildChatDOM();
    } finally {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.innerHTML = "⬇ PDF (A4)";
    }
  };

  /**
   * FIX : génère un HTML autonome self-contained et ouvre l'impression.
   * Le PDF produit par "Enregistrer en PDF" du navigateur contient du texte
   * réel → compatible ATS.
   */
  const exportPDFPrint = async (filename) => {
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";
    for (const sheet of styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        cssText += rules.map(r => r.cssText).join("\n");
      } catch {}
    }

    const printCSS = `
      @page { size: A4; margin: 12mm 12mm 12mm 12mm; }
      body { margin: 0; background: #fff; font-family: Arial, sans-serif; }
      .cv-paper { width: 100%; min-height: auto; box-shadow: none; border-radius: 0; padding: 0; }
      .two-col { display: block !important; }
      .chips { display: none !important; }
      .cv-skills-text { display: block !important; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `;

    const paperHTML = document.getElementById("cv-paper")?.outerHTML || "<p>CV non généré</p>";
    const titleSafe = (filename || "CV").replace(/\.pdf$/i, "").replace(/[<>]/g, "");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(titleSafe)}</title>
<style>${cssText}\n${printCSS}</style>
</head>
<body>
${paperHTML}
<script>
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 400);
  });
<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newWin = window.open(url, "_blank");
    if (!newWin) {
      // Popup bloqué : fallback anchor
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(/\.pdf$/i, ".html");
      a.click();
      system("Popup bloqué. Le fichier HTML a été téléchargé — ouvrez-le et imprimez → Enregistrer en PDF.");
      rebuildChatDOM();
    }
    setTimeout(() => URL.revokeObjectURL(url), 12000);
  };

  const printCV = () => window.print();

  /* ========================= DOCX Export ========================= */
  const exportDOCX = async () => {
    if (!window.docx) {
      system("La librairie DOCX n'est pas chargée."); rebuildChatDOM(); return;
    }

    const a = state.data;
    const id = a.identity;
    const fullName = normalizeSpace(`${id.prenom} ${id.nom}`) || "Votre Nom";
    const title = normalizeSpace(id.titre);
    const summary = normalizeSpace(a.profile.summary);
    const prenom = safeFilePart(id.prenom || "Prenom");
    const nom = safeFilePart(id.nom || "Nom");
    const filename = `CV_${prenom}_${nom}.docx`;

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;
    const children = [];

    // Entête
    children.push(new Paragraph({
      children: [new TextRun({ text: fullName, bold: true, size: 48 })],
      alignment: AlignmentType.LEFT,
    }));
    if (title) {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 28, color: "374151" })],
      }));
    }

    // Contact — sans labels, séparateur propre
    const contactParts = [id.email, id.telephone, id.ville].filter(Boolean);
    if (contactParts.length) {
      children.push(new Paragraph({
        children: [new TextRun({ text: contactParts.join("  |  "), color: "555555", size: 22 })],
      }));
    }
    children.push(new Paragraph({ text: "" }));

    // Profil
    if (summary) {
      children.push(new Paragraph({ text: "PROFIL PROFESSIONNEL", heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: summary }));
      children.push(new Paragraph({ text: "" }));
    }

    // Expériences
    children.push(new Paragraph({ text: "EXPÉRIENCES PROFESSIONNELLES", heading: HeadingLevel.HEADING_2 }));
    if (!(a.experiences || []).length) {
      children.push(new Paragraph({ text: "—" }));
    } else {
      for (const exp of a.experiences) {
        const dates = computeExpDisplay(exp);
        const headline = [normalizeSpace(exp.poste), normalizeSpace(exp.entreprise)].filter(Boolean).join(" — ");
        children.push(new Paragraph({
          children: [
            new TextRun({ text: headline || "Expérience", bold: true }),
            dates ? new TextRun({ text: `   ${dates}`, color: "666666" }) : new TextRun({ text: "" }),
          ],
        }));
        for (const m of (exp.missions || [])) {
          children.push(new Paragraph({ text: normalizeSpace(m.text), bullet: { level: 0 } }));
        }
        children.push(new Paragraph({ text: "" }));
      }
    }

    // Formations
    if ((a.formations || []).length) {
      children.push(new Paragraph({ text: "FORMATION", heading: HeadingLevel.HEADING_2 }));
      for (const edu of a.formations) {
        const dates = computeEduDisplay(edu);
        const headline = [edu.diplome, edu.etablissement].filter(Boolean).join(" — ");
        children.push(new Paragraph({
          children: [
            new TextRun({ text: headline || "Formation", bold: true }),
            dates ? new TextRun({ text: `   ${dates}`, color: "666666" }) : new TextRun({ text: "" }),
          ],
        }));
        if (edu.ville) {
          children.push(new Paragraph({ children: [new TextRun({ text: edu.ville, color: "888888" })] }));
        }
        children.push(new Paragraph({ text: "" }));
      }
    }

    // Certifications
    if ((a.certifications || []).length) {
      children.push(new Paragraph({ text: "CERTIFICATIONS", heading: HeadingLevel.HEADING_2 }));
      for (const cert of a.certifications) {
        const meta = [cert.organisme, cert.annee].filter(Boolean).join(" — ");
        children.push(new Paragraph({
          children: [
            new TextRun({ text: cert.nom || "", bold: true }),
            meta ? new TextRun({ text: `   ${meta}`, color: "666666" }) : new TextRun({ text: "" }),
          ],
        }));
      }
      children.push(new Paragraph({ text: "" }));
    }

    // Compétences — texte plat, ATS-friendly
    children.push(new Paragraph({ text: "COMPÉTENCES TECHNIQUES", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: (a.skills.hard || []).length ? a.skills.hard.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "SOFT SKILLS", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: (a.skills.soft || []).length ? a.skills.soft.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    if ((a.skills.passions || []).length) {
      children.push(new Paragraph({ text: "CENTRES D'INTÉRÊT", heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: a.skills.passions.join(", ") }));
      children.push(new Paragraph({ text: "" }));
    }

    // Langues
    children.push(new Paragraph({ text: "LANGUES", heading: HeadingLevel.HEADING_2 }));
    if ((a.languages || []).length) {
      for (const l of a.languages) {
        children.push(new Paragraph({ text: `${l.langue} — ${l.niveau}`, bullet: { level: 0 } }));
      }
    } else {
      children.push(new Paragraph({ text: "—" }));
    }

    const doc = new Document({ sections: [{ properties: {}, children }] });
    try {
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, filename);
    } catch (e) {
      console.error(e);
      system("Erreur export DOCX : " + e.message);
      rebuildChatDOM();
    }
  };

  /* ========================= Suggestions ========================= */
  const hardSkillSuggestions = (jobTitle) => {
    const t = (jobTitle || "").toLowerCase();
    const IT = ["JavaScript", "TypeScript", "HTML/CSS", "React", "Node.js", "Python", "SQL", "Docker", "Git", "CI/CD", "REST API", "PostgreSQL", "MongoDB"];
    const MKT = ["SEO", "SEA", "Google Ads", "Meta Ads", "GA4", "GTM", "CRM", "Emailing", "Content marketing", "Copywriting", "KPI", "Canva"];
    const FIN = ["Excel avancé", "Contrôle de gestion", "Reporting", "Budget", "Forecast", "ERP", "Power BI", "IFRS", "SAP", "Tableau"];
    const PM = ["Agile/Scrum", "Jira", "Confluence", "Gestion de projet", "MS Project", "Product backlog", "OKR", "Roadmap"];
    if (t.includes("développ") || t.includes("dev") || t.includes("software") || t.includes("data")) return IT;
    if (t.includes("marketing") || t.includes("growth") || t.includes("communication")) return MKT;
    if (t.includes("finance") || t.includes("compta") || t.includes("audit")) return FIN;
    if (t.includes("chef de projet") || t.includes("product") || t.includes("program")) return PM;
    return [...new Set([...IT.slice(0, 4), ...MKT.slice(0, 4), ...FIN.slice(0, 4), ...PM.slice(0, 3)])];
  };

  const SOFT_SUGGESTIONS = [
    "Communication", "Leadership", "Esprit d'équipe", "Autonomie", "Rigueur",
    "Organisation", "Curiosité", "Résolution de problèmes", "Adaptabilité",
    "Proactivité", "Gestion du temps", "Esprit d'analyse", "Sens du service",
    "Créativité", "Pédagogie", "Négociation",
  ];
  const PASSION_SUGGESTIONS = [
    "Sport", "Lecture", "Musique", "Voyages", "Photographie", "Bénévolat",
    "Tech / veille", "Jeux d'échecs", "Cuisine", "Randonnée", "Cinéma", "Langues",
  ];
  const LANGUAGE_SUGGESTIONS = [
    "Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais",
    "Arabe", "Chinois (mandarin)", "Japonais", "Russe", "Néerlandais", "Autre",
  ];
  const LANGUAGE_LEVELS = ["Maternelle", "Bilingue", "Courant", "Avancé", "Intermédiaire", "Débutant", "Technique"];

  /* ========================= Widgets helpers ========================= */
  const widgetTitle = (t) => {
    const div = document.createElement("div");
    div.className = "widget-title";
    div.textContent = t;
    return div;
  };

  const field = (labelText, inputEl) => {
    const w = document.createElement("div");
    w.className = "field";
    const l = document.createElement("label");
    l.textContent = labelText;
    w.appendChild(l);
    w.appendChild(inputEl);
    return w;
  };

  const toastSystem = (text) => { system(text); rebuildChatDOM(); };

  const showChoices = ({ title, choices, lockReason = "Veuillez choisir une option." }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(title));
    const actions = document.createElement("div");
    actions.className = "widget-actions";
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = c.variant ? `btn ${c.variant}` : "btn btn--primary";
      b.textContent = c.label;
      b.addEventListener("click", () => c.onClick?.());
      actions.appendChild(b);
    });
    wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason });
  };

  const showTextAreaWidget = ({ title, placeholder, value = "", onSave }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(title));
    const ta = document.createElement("textarea");
    ta.className = "textarea";
    ta.rows = 6;
    ta.placeholder = placeholder || "";
    ta.value = value;
    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn btn--success";
    save.textContent = "Valider";
    save.addEventListener("click", () => onSave?.(ta.value));
    actions.appendChild(save);
    wrap.appendChild(ta);
    wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Saisissez votre texte ci-dessus." });
    setTimeout(() => ta.focus(), 50);
  };

  /* ========================= Formation Widget ========================= */
  const showFormationFormWidget = ({ edu, onSave, onCancel }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(edu ? "Modifier une formation" : "Ajouter une formation"));

    const fDiplome = document.createElement("input");
    fDiplome.className = "input";
    fDiplome.placeholder = "Ex : Master Informatique, BTS Commerce, Licence Droit…";
    fDiplome.value = edu?.diplome || "";

    const fEtab = document.createElement("input");
    fEtab.className = "input";
    fEtab.placeholder = "Nom de l'établissement";
    fEtab.value = edu?.etablissement || "";

    const fVille = document.createElement("input");
    fVille.className = "input";
    fVille.placeholder = "Ville (optionnel)";
    fVille.value = edu?.ville || "";

    const fStart = document.createElement("input");
    fStart.className = "input";
    fStart.type = monthInputSupported() ? "month" : "text";
    fStart.placeholder = monthInputSupported() ? "" : "AAAA-MM (ex: 2018-09)";
    fStart.value = edu?.startYM || "";

    const fEnd = document.createElement("input");
    fEnd.className = "input";
    fEnd.type = monthInputSupported() ? "month" : "text";
    fEnd.placeholder = monthInputSupported() ? "" : "AAAA-MM (ex: 2021-06)";
    fEnd.value = edu?.endYM || "";

    const durSpan = document.createElement("div");
    durSpan.className = "muted small";
    durSpan.style.marginTop = "4px";
    const updateDur = () => {
      const md = monthDiff(fStart.value, fEnd.value);
      durSpan.textContent = md != null ? `Durée : ${formatDurationFR(md + 1)}` : "";
    };
    fStart.addEventListener("input", updateDur);
    fEnd.addEventListener("input", updateDur);
    fStart.addEventListener("change", updateDur);
    fEnd.addEventListener("change", updateDur);

    const row1 = document.createElement("div");
    row1.className = "row row--2";
    row1.appendChild(field("Diplôme / Intitulé *", fDiplome));
    row1.appendChild(field("Établissement *", fEtab));

    const row2 = document.createElement("div");
    row2.className = "row row--3";
    row2.appendChild(field("Date début", fStart));
    row2.appendChild(field("Date fin", fEnd));
    row2.appendChild(field("Ville (optionnel)", fVille));

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn--success";
    saveBtn.textContent = "Enregistrer la formation";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn--ghost";
    cancelBtn.textContent = "Annuler";

    saveBtn.addEventListener("click", () => {
      const diplome = normalizeSpace(fDiplome.value);
      const etablissement = normalizeSpace(fEtab.value);
      if (!diplome) return toastSystem("Veuillez saisir le diplôme / intitulé.");
      if (!etablissement) return toastSystem("Veuillez saisir le nom de l'établissement.");
      const startYM = normalizeSpace(fStart.value);
      const endYM = normalizeSpace(fEnd.value);
      if (startYM && !parseMonthValue(startYM)) return toastSystem("Date de début invalide (format AAAA-MM).");
      if (endYM && !parseMonthValue(endYM)) return toastSystem("Date de fin invalide (format AAAA-MM).");
      if (startYM && endYM) {
        const md = monthDiff(startYM, endYM);
        if (md == null) return toastSystem("La date de fin doit être postérieure à la date de début.");
      }
      onSave?.({ diplome, etablissement, ville: normalizeSpace(fVille.value), startYM, endYM });
    });

    cancelBtn.addEventListener("click", () => onCancel?.());
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    wrap.appendChild(row1);
    wrap.appendChild(row2);
    wrap.appendChild(durSpan);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Complétez le formulaire de formation." });
    setTimeout(() => fDiplome.focus(), 50);
  };

  const showFormationManagerWidget = ({ onClose }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Formations & Diplômes"));

    const list = document.createElement("div");
    list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(state.data.formations || []).length) {
        const p = document.createElement("div");
        p.className = "muted";
        p.textContent = "Aucune formation enregistrée.";
        list.appendChild(p);
      } else {
        (state.data.formations || []).forEach((edu) => {
          const box = document.createElement("div");
          box.style.cssText = "border:1px solid var(--border);border-radius:12px;padding:10px;margin-top:10px;background:#fff;";
          const t = document.createElement("div"); t.style.fontWeight = "700";
          t.textContent = `${edu.diplome} — ${edu.etablissement}`;
          const meta = document.createElement("div"); meta.className = "muted small";
          meta.textContent = computeEduDisplay(edu) + (edu.ville ? ` • ${edu.ville}` : "");
          const btns = document.createElement("div"); btns.className = "widget-actions";
          const edit = document.createElement("button"); edit.type = "button"; edit.className = "btn btn--ghost"; edit.textContent = "Modifier";
          const del = document.createElement("button"); del.type = "button"; del.className = "btn btn--danger"; del.textContent = "Supprimer";
          edit.addEventListener("click", () => {
            showFormationFormWidget({
              edu,
              onSave: (patch) => {
                Object.assign(edu, patch);
                saveToStorage(state); renderCV();
                showFormationManagerWidget({ onClose });
              },
              onCancel: () => showFormationManagerWidget({ onClose }),
            });
          });
          del.addEventListener("click", () => {
            if (!confirm("Supprimer cette formation ?")) return;
            state.data.formations = state.data.formations.filter(f => f.id !== edu.id);
            saveToStorage(state); renderCV(); renderList();
          });
          btns.appendChild(edit); btns.appendChild(del);
          box.appendChild(t); box.appendChild(meta); box.appendChild(btns);
          list.appendChild(box);
        });
      }
    };
    renderList();

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const add = document.createElement("button"); add.type = "button"; add.className = "btn btn--success"; add.textContent = "+ Ajouter une formation";
    const next = document.createElement("button"); next.type = "button"; next.className = "btn btn--primary"; next.textContent = "Continuer →";

    add.addEventListener("click", () => {
      showFormationFormWidget({
        edu: null,
        onSave: (data) => {
          if (!state.data.formations) state.data.formations = [];
          state.data.formations.push({ id: uid(), ...data });
          saveToStorage(state); renderCV();
          showFormationManagerWidget({ onClose });
        },
        onCancel: () => showFormationManagerWidget({ onClose }),
      });
    });
    next.addEventListener("click", () => onClose?.());
    actions.appendChild(add); actions.appendChild(next);
    wrap.appendChild(list); wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos formations ci-dessus." });
  };

  /* ========================= Certification Widget ========================= */
  const showCertificationFormWidget = ({ cert, onSave, onCancel }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(cert ? "Modifier une certification" : "Ajouter une certification"));

    const fNom = document.createElement("input"); fNom.className = "input";
    fNom.placeholder = "Ex : AWS Solutions Architect, TOEIC, PMP, CFA…";
    fNom.value = cert?.nom || "";

    const fOrga = document.createElement("input"); fOrga.className = "input";
    fOrga.placeholder = "Organisme (ex : Amazon, ETS, PMI…)";
    fOrga.value = cert?.organisme || "";

    const fAnnee = document.createElement("input"); fAnnee.className = "input";
    fAnnee.placeholder = "Année (ex : 2023)"; fAnnee.type = "text";
    fAnnee.inputMode = "numeric"; fAnnee.maxLength = 4;
    fAnnee.value = cert?.annee || "";

    const row = document.createElement("div"); row.className = "row row--3";
    row.appendChild(field("Nom de la certification *", fNom));
    row.appendChild(field("Organisme", fOrga));
    row.appendChild(field("Année", fAnnee));

    const actions = document.createElement("div"); actions.className = "widget-actions";
    const saveBtn = document.createElement("button"); saveBtn.type = "button"; saveBtn.className = "btn btn--success"; saveBtn.textContent = "Enregistrer";
    const cancelBtn = document.createElement("button"); cancelBtn.type = "button"; cancelBtn.className = "btn btn--ghost"; cancelBtn.textContent = "Annuler";

    saveBtn.addEventListener("click", () => {
      const nom = normalizeSpace(fNom.value);
      if (!nom) return toastSystem("Veuillez saisir le nom de la certification.");
      const annee = normalizeSpace(fAnnee.value);
      if (annee && !/^\d{4}$/.test(annee)) return toastSystem("L'année doit être sur 4 chiffres.");
      onSave?.({ nom, organisme: normalizeSpace(fOrga.value), annee });
    });
    cancelBtn.addEventListener("click", () => onCancel?.());
    actions.appendChild(saveBtn); actions.appendChild(cancelBtn);
    wrap.appendChild(row); wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Complétez le formulaire ci-dessus." });
    setTimeout(() => fNom.focus(), 50);
  };

  const showCertificationManagerWidget = ({ onClose }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Certifications professionnelles"));
    const list = document.createElement("div"); list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(state.data.certifications || []).length) {
        const p = document.createElement("div"); p.className = "muted";
        p.textContent = "Aucune certification."; list.appendChild(p);
      } else {
        (state.data.certifications || []).forEach((cert) => {
          const box = document.createElement("div");
          box.style.cssText = "border:1px solid var(--border);border-radius:12px;padding:10px;margin-top:10px;background:#fff;";
          const t = document.createElement("div"); t.style.fontWeight = "700"; t.textContent = cert.nom;
          const meta = document.createElement("div"); meta.className = "muted small";
          meta.textContent = [cert.organisme, cert.annee].filter(Boolean).join(" — ");
          const btns = document.createElement("div"); btns.className = "widget-actions";
          const edit = document.createElement("button"); edit.type = "button"; edit.className = "btn btn--ghost"; edit.textContent = "Modifier";
          const del = document.createElement("button"); del.type = "button"; del.className = "btn btn--danger"; del.textContent = "Supprimer";
          edit.addEventListener("click", () => {
            showCertificationFormWidget({
              cert, onSave: (patch) => { Object.assign(cert, patch); saveToStorage(state); renderCV(); showCertificationManagerWidget({ onClose }); },
              onCancel: () => showCertificationManagerWidget({ onClose }),
            });
          });
          del.addEventListener("click", () => {
            if (!confirm("Supprimer cette certification ?")) return;
            state.data.certifications = state.data.certifications.filter(c => c.id !== cert.id);
            saveToStorage(state); renderCV(); renderList();
          });
          btns.appendChild(edit); btns.appendChild(del);
          box.appendChild(t); box.appendChild(meta); box.appendChild(btns);
          list.appendChild(box);
        });
      }
    };
    renderList();

    const actions = document.createElement("div"); actions.className = "widget-actions";
    const add = document.createElement("button"); add.type = "button"; add.className = "btn btn--success"; add.textContent = "+ Ajouter une certification";
    const next = document.createElement("button"); next.type = "button"; next.className = "btn btn--primary"; next.textContent = "Continuer →";
    const skip = document.createElement("button"); skip.type = "button"; skip.className = "btn btn--ghost"; skip.textContent = "Passer cette étape";

    add.addEventListener("click", () => {
      showCertificationFormWidget({
        cert: null,
        onSave: (data) => {
          if (!state.data.certifications) state.data.certifications = [];
          state.data.certifications.push({ id: uid(), ...data });
          saveToStorage(state); renderCV(); showCertificationManagerWidget({ onClose });
        },
        onCancel: () => showCertificationManagerWidget({ onClose }),
      });
    });
    next.addEventListener("click", () => onClose?.());
    skip.addEventListener("click", () => onClose?.());
    actions.appendChild(add); actions.appendChild(next); actions.appendChild(skip);
    wrap.appendChild(list); wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos certifications ci-dessus." });
  };

  /* ========================= Experience Widgets ========================= */
  const showExperienceFormWidget = ({ exp, onSave, onCancel }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(exp ? "Modifier l'expérience" : "Ajouter une expérience"));

    const fEntreprise = document.createElement("input"); fEntreprise.className = "input";
    fEntreprise.placeholder = "Nom de l'entreprise"; fEntreprise.value = exp?.entreprise || "";

    const fPoste = document.createElement("input"); fPoste.className = "input";
    fPoste.placeholder = "Intitulé du poste"; fPoste.value = exp?.poste || "";

    const start = document.createElement("input"); start.className = "input";
    start.type = monthInputSupported() ? "month" : "text";
    start.placeholder = monthInputSupported() ? "" : "AAAA-MM (ex: 2022-01)";
    start.value = exp?.startYM || "";

    const end = document.createElement("input"); end.className = "input";
    end.type = monthInputSupported() ? "month" : "text";
    end.placeholder = monthInputSupported() ? "" : "AAAA-MM (ex: 2024-06)";
    end.value = exp?.endYM || "";

    const currentWrap = document.createElement("div");
    currentWrap.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:8px;";
    const current = document.createElement("input"); current.type = "checkbox"; current.id = "exp-current-cb";
    current.checked = !!exp?.isCurrent;
    const currentTxt = document.createElement("label"); currentTxt.htmlFor = "exp-current-cb";
    currentTxt.textContent = "Poste actuel (en cours)";
    currentTxt.style.fontSize = "13px";
    currentWrap.appendChild(current); currentWrap.appendChild(currentTxt);

    // Durée calculée
    const durSpan = document.createElement("div"); durSpan.className = "muted small"; durSpan.style.marginTop = "4px";
    const updateDur = () => {
      const endYM = current.checked ? nowMonth() : end.value;
      const md = monthDiff(start.value, endYM);
      durSpan.textContent = md != null ? `Durée : ${formatDurationFR(md + 1)}` : "";
    };
    start.addEventListener("input", updateDur); end.addEventListener("input", updateDur);
    start.addEventListener("change", updateDur); end.addEventListener("change", updateDur);
    current.addEventListener("change", updateDur);

    const row1 = document.createElement("div"); row1.className = "row row--2";
    row1.appendChild(field("Entreprise *", fEntreprise));
    row1.appendChild(field("Poste *", fPoste));

    const row2 = document.createElement("div"); row2.className = "row row--2";
    row2.appendChild(field("Date de début *", start));
    row2.appendChild(field("Date de fin", end));

    current.addEventListener("change", () => {
      end.disabled = current.checked;
      if (current.checked) end.value = "";
      updateDur();
    });
    end.disabled = current.checked;

    const actions = document.createElement("div"); actions.className = "widget-actions";
    const saveBtn = document.createElement("button"); saveBtn.type = "button"; saveBtn.className = "btn btn--success"; saveBtn.textContent = "Enregistrer";
    const cancelBtn = document.createElement("button"); cancelBtn.type = "button"; cancelBtn.className = "btn btn--ghost"; cancelBtn.textContent = "Annuler";

    saveBtn.addEventListener("click", () => {
      const entreprise = normalizeSpace(fEntreprise.value);
      const poste = normalizeSpace(fPoste.value);
      const startYM = normalizeSpace(start.value);
      const isCurrent = !!current.checked;
      const endYM = isCurrent ? "" : normalizeSpace(end.value);
      if (!entreprise) return toastSystem("Veuillez saisir le nom de l'entreprise.");
      if (!poste) return toastSystem("Veuillez saisir l'intitulé du poste.");
      if (!parseMonthValue(startYM)) return toastSystem("Date de début invalide (format AAAA-MM).");
      if (!isCurrent && !parseMonthValue(endYM)) return toastSystem("Date de fin invalide ou cochez 'En cours'.");
      if (!isCurrent) {
        const d = monthDiff(startYM, endYM);
        if (d == null) return toastSystem("La date de fin doit être postérieure à la date de début.");
      }
      onSave?.({ entreprise, poste, startYM, endYM: isCurrent ? "" : endYM, isCurrent });
    });
    cancelBtn.addEventListener("click", () => onCancel?.());
    actions.appendChild(saveBtn); actions.appendChild(cancelBtn);
    wrap.appendChild(row1); wrap.appendChild(row2); wrap.appendChild(currentWrap);
    wrap.appendChild(durSpan); wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Complétez le formulaire ci-dessus." });
    setTimeout(() => fEntreprise.focus(), 50);
  };

  const showMissionEditorWidget = ({ expId, onDone }) => {
    const exp = (state.data.experiences || []).find(e => e.id === expId);
    if (!exp) return;

    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(`Missions — ${exp.poste || ""}`));

    const info = document.createElement("div");
    info.className = "muted small";
    info.textContent = "Astuce ATS : verbe d'action + résultat chiffré (ex : « Développé une API REST → +30% de performance »).";
    wrap.appendChild(info);

    const list = document.createElement("div"); list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(exp.missions || []).length) {
        const p = document.createElement("div"); p.className = "muted small";
        p.textContent = "Aucune mission. Ajoutez en bas.";
        list.appendChild(p);
      }
      (exp.missions || []).forEach((m) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:8px;";
        const inp = document.createElement("input"); inp.className = "input"; inp.value = m.text; inp.style.flex = "1";
        const save = document.createElement("button"); save.type = "button"; save.className = "btn btn--ghost"; save.textContent = "✓"; save.title = "Enregistrer";
        const del = document.createElement("button"); del.type = "button"; del.className = "btn btn--danger"; del.textContent = "✕"; del.title = "Supprimer";
        save.addEventListener("click", () => {
          const v = normalizeSpace(inp.value);
          if (!v) return;
          m.text = v; saveToStorage(state); renderCV();
        });
        del.addEventListener("click", () => {
          exp.missions = exp.missions.filter(x => x.id !== m.id);
          saveToStorage(state); renderCV(); renderList();
        });
        row.appendChild(inp); row.appendChild(save); row.appendChild(del);
        list.appendChild(row);
      });
    };
    renderList();

    const addRow = document.createElement("div");
    addRow.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:12px;";
    const addInput = document.createElement("input");
    addInput.className = "input"; addInput.placeholder = "Ajouter une mission…"; addInput.style.flex = "1";
    const addBtnEl = document.createElement("button");
    addBtnEl.type = "button"; addBtnEl.className = "btn btn--primary"; addBtnEl.textContent = "+ Ajouter";

    addBtnEl.addEventListener("click", () => {
      const v = normalizeSpace(addInput.value);
      if (!v) return;
      exp.missions.push({ id: uid(), text: v });
      addInput.value = "";
      saveToStorage(state); renderCV(); renderList();
      addInput.focus();
    });
    addInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addBtnEl.click(); });
    addRow.appendChild(addInput); addRow.appendChild(addBtnEl);

    const actions = document.createElement("div"); actions.className = "widget-actions";
    const done = document.createElement("button"); done.type = "button"; done.className = "btn btn--success"; done.textContent = "Terminer";
    done.addEventListener("click", () => onDone?.());
    actions.appendChild(done);

    wrap.appendChild(list); wrap.appendChild(addRow); wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos missions ci-dessus." });
    setTimeout(() => addInput.focus(), 50);
  };

  const showExperienceManagerWidget = ({ onClose }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Expériences professionnelles"));
    const list = document.createElement("div"); list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(state.data.experiences || []).length) {
        const p = document.createElement("div"); p.className = "muted"; p.textContent = "Aucune expérience.";
        list.appendChild(p); return;
      }
      (state.data.experiences || []).forEach((exp) => {
        const box = document.createElement("div");
        box.style.cssText = "border:1px solid var(--border);border-radius:12px;padding:10px;margin-top:10px;background:#fff;";
        const t = document.createElement("div"); t.style.fontWeight = "700";
        t.textContent = `${exp.poste} — ${exp.entreprise}`;
        const meta = document.createElement("div"); meta.className = "muted small";
        meta.textContent = computeExpDisplay(exp) + ` • ${(exp.missions || []).length} mission(s)`;
        const btns = document.createElement("div"); btns.className = "widget-actions";
        const edit = document.createElement("button"); edit.type = "button"; edit.className = "btn btn--ghost"; edit.textContent = "Modifier";
        const mBtn = document.createElement("button"); mBtn.type = "button"; mBtn.className = "btn btn--primary"; mBtn.textContent = "Missions";
        const del = document.createElement("button"); del.type = "button"; del.className = "btn btn--danger"; del.textContent = "Supprimer";
        edit.addEventListener("click", () => {
          showExperienceFormWidget({
            exp, onSave: (patch) => { Object.assign(exp, patch); saveToStorage(state); renderCV(); showExperienceManagerWidget({ onClose }); },
            onCancel: () => showExperienceManagerWidget({ onClose }),
          });
        });
        mBtn.addEventListener("click", () => {
          showMissionEditorWidget({ expId: exp.id, onDone: () => showExperienceManagerWidget({ onClose }) });
        });
        del.addEventListener("click", () => {
          if (!confirm("Supprimer cette expérience ?")) return;
          state.data.experiences = state.data.experiences.filter(e => e.id !== exp.id);
          saveToStorage(state); renderCV(); renderList();
        });
        btns.appendChild(edit); btns.appendChild(mBtn); btns.appendChild(del);
        box.appendChild(t); box.appendChild(meta); box.appendChild(btns);
        list.appendChild(box);
      });
    };
    renderList();

    const actions = document.createElement("div"); actions.className = "widget-actions";
    const add = document.createElement("button"); add.type = "button"; add.className = "btn btn--success"; add.textContent = "+ Ajouter une expérience";
    const next = document.createElement("button"); next.type = "button"; next.className = "btn btn--primary"; next.textContent = "Continuer →";

    add.addEventListener("click", () => {
      showExperienceFormWidget({
        exp: null,
        onSave: (data) => {
          state.data.experiences.push({ id: uid(), missions: [], ...data });
          saveToStorage(state); renderCV(); showExperienceManagerWidget({ onClose });
        },
        onCancel: () => showExperienceManagerWidget({ onClose }),
      });
    });
    next.addEventListener("click", () => onClose?.());
    actions.appendChild(add); actions.appendChild(next);
    wrap.appendChild(list); wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos expériences ci-dessus." });
  };

  /* ========================= Pill / Tag Widget ========================= */
  const showPillWidget = ({ title, current, suggestions, onSave, placeholder }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(title));

    let items = [...(current || [])];

    const pillRow = document.createElement("div");
    pillRow.className = "pillrow";
    pillRow.style.marginTop = "10px";

    const suggWrap = document.createElement("div");
    suggWrap.className = "pillrow";
    suggWrap.style.cssText = "margin-top:8px;";

    /* FIX : les suggestions se mettent à jour après chaque ajout de pill */
    const renderSuggestions = () => {
      suggWrap.innerHTML = "";
      suggestions.filter(s => !items.includes(s)).slice(0, 14).forEach((s) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "btn btn--ghost"; b.textContent = "+ " + s;
        b.style.cssText = "font-size:12px;padding:6px 10px;";
        b.addEventListener("click", () => {
          if (!items.includes(s)) {
            items.push(s);
            renderPills();
            renderSuggestions(); // FIX : retire la suggestion après ajout
          }
        });
        suggWrap.appendChild(b);
      });
    };

    const renderPills = () => {
      pillRow.innerHTML = "";
      items.forEach((item, i) => {
        const pill = document.createElement("span");
        pill.className = "pill";
        const txt = document.createTextNode(item);
        pill.appendChild(txt);
        const del = document.createElement("button");
        del.type = "button"; del.textContent = "✕";
        del.setAttribute("aria-label", `Supprimer ${item}`);
        del.addEventListener("click", () => {
          items.splice(i, 1);
          renderPills();
          renderSuggestions(); // FIX : remet la suggestion dans la liste
        });
        pill.appendChild(del);
        pillRow.appendChild(pill);
      });
    };
    renderPills();
    if (suggestions.length) renderSuggestions();

    const addRow = document.createElement("div");
    addRow.style.cssText = "display:flex;gap:8px;margin-top:10px;";
    const addInp = document.createElement("input");
    addInp.className = "input"; addInp.placeholder = placeholder || "Ajouter…"; addInp.style.flex = "1";
    const addBtnEl = document.createElement("button");
    addBtnEl.type = "button"; addBtnEl.className = "btn btn--primary"; addBtnEl.textContent = "+ Ajouter";

    addBtnEl.addEventListener("click", () => {
      splitCommaList(addInp.value).forEach(v => {
        if (!items.includes(v)) items.push(v);
      });
      addInp.value = "";
      renderPills();
      renderSuggestions();
    });
    addInp.addEventListener("keydown", (e) => { if (e.key === "Enter") addBtnEl.click(); });
    addRow.appendChild(addInp); addRow.appendChild(addBtnEl);

    const actions = document.createElement("div"); actions.className = "widget-actions";
    const save = document.createElement("button");
    save.type = "button"; save.className = "btn btn--success"; save.textContent = "Valider";
    save.addEventListener("click", () => onSave?.(items));
    actions.appendChild(save);

    wrap.appendChild(pillRow);
    if (suggestions.length) wrap.appendChild(suggWrap);
    wrap.appendChild(addRow);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos éléments ci-dessus." });
  };

  /* ========================= Language Widget ========================= */
  const showLanguageWidget = ({ onClose }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Langues maîtrisées"));

    const list = document.createElement("div"); list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(state.data.languages || []).length) {
        const p = document.createElement("div"); p.className = "muted"; p.textContent = "Aucune langue.";
        list.appendChild(p); return;
      }
      (state.data.languages || []).forEach((l, i) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;";
        const sel = document.createElement("select"); sel.className = "select"; sel.style.flex = "1";
        LANGUAGE_SUGGESTIONS.forEach(lg => {
          const o = document.createElement("option"); o.value = lg; o.textContent = lg;
          if (lg === l.langue) o.selected = true;
          sel.appendChild(o);
        });
        const lvl = document.createElement("select"); lvl.className = "select"; lvl.style.flex = "1";
        LANGUAGE_LEVELS.forEach(lv => {
          const o = document.createElement("option"); o.value = lv; o.textContent = lv;
          if (lv === l.niveau) o.selected = true;
          lvl.appendChild(o);
        });
        sel.addEventListener("change", () => { l.langue = sel.value; saveToStorage(state); renderCV(); });
        lvl.addEventListener("change", () => { l.niveau = lvl.value; saveToStorage(state); renderCV(); });
        const del = document.createElement("button"); del.type = "button"; del.className = "btn btn--danger"; del.textContent = "✕";
        del.addEventListener("click", () => {
          state.data.languages.splice(i, 1);
          saveToStorage(state); renderCV(); renderList();
        });
        row.appendChild(sel); row.appendChild(lvl); row.appendChild(del);
        list.appendChild(row);
      });
    };
    renderList();

    const addRow = document.createElement("div");
    addRow.style.cssText = "display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;";
    const selL = document.createElement("select"); selL.className = "select"; selL.style.flex = "1";
    LANGUAGE_SUGGESTIONS.forEach(lg => { const o = document.createElement("option"); o.value = lg; o.textContent = lg; selL.appendChild(o); });
    const selLv = document.createElement("select"); selLv.className = "select"; selLv.style.flex = "1";
    LANGUAGE_LEVELS.forEach(lv => { const o = document.createElement("option"); o.value = lv; o.textContent = lv; selLv.appendChild(o); });
    const addBtn = document.createElement("button"); addBtn.type = "button"; addBtn.className = "btn btn--success"; addBtn.textContent = "+ Ajouter";
    addBtn.addEventListener("click", () => {
      const langue = selL.value; const niveau = selLv.value;
      if (!(state.data.languages || []).some(l => l.langue === langue)) {
        if (!state.data.languages) state.data.languages = [];
        state.data.languages.push({ id: uid(), langue, niveau });
        saveToStorage(state); renderCV(); renderList();
      } else {
        toastSystem(`La langue "${langue}" est déjà dans la liste.`);
      }
    });
    addRow.appendChild(selL); addRow.appendChild(selLv); addRow.appendChild(addBtn);

    const actions = document.createElement("div"); actions.className = "widget-actions";
    const done = document.createElement("button"); done.type = "button"; done.className = "btn btn--primary"; done.textContent = "Terminer →";
    done.addEventListener("click", () => onClose?.());
    actions.appendChild(done);

    wrap.appendChild(list); wrap.appendChild(addRow); wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos langues ci-dessus." });
  };

  /* ========================= Smart Parsing ========================= */
  const SECTION_PATTERNS = {
    profil: /^(profil|résumé|résumé\s+professionnel|resume|about\s+me|à\s+propos|summary|objectif|présentation)/i,
    experience: /^(expérience|experience|expériences\s+pro|parcours\s+pro|emploi|poste\s+occup|historique\s+profes)/i,
    formation: /^(formation|éducation|education|études|diplôme|diplome|scolarité|parcours\s+académique|academic)/i,
    competences: /^(compétence|competence|skill|savoir|expertise|technologie|stack\s+tech|outils?)/i,
    langues: /^(langue|language|lingue)/i,
    certifications: /^(certification|certificat|award|récompense|accréditation|badge|licence|habilitation)/i,
  };

  const detectSection = (line) => {
    const clean = line.trim().toLowerCase().replace(/[:\-–—]+$/, "").trim();
    for (const [key, re] of Object.entries(SECTION_PATTERNS)) {
      if (re.test(clean)) return key;
    }
    return null;
  };

  /* FIX : correction de la clé dupliquée "jan" dans l'objet monthNames */
  const parseYearMonth = (str) => {
    const m = str.match(/\b(20\d{2}|19\d{2})\b/);
    if (!m) return "";
    const year = m[1];
    const monthNames = {
      // Français
      "jan": "01", "fév": "02", "mars": "03", "avr": "04",
      "mai": "05", "juin": "06", "juil": "07", "août": "08",
      "sep": "09", "oct": "10", "nov": "11", "déc": "12",
      // Anglais (FIX : "jan" était dupliqué avant)
      "feb": "02", "mar": "03", "apr": "04", "may": "05",
      "jun": "06", "jul": "07", "aug": "08",
      // Même clé de base : jan/sep/oct/nov déjà couverts
    };
    const mMatch = str.toLowerCase().match(/\b(jan|fév|mars|avr|mai|juin|juil|août|sep|oct|nov|déc|feb|mar|apr|may|jun|jul|aug)\b/i);
    if (mMatch) {
      const key = mMatch[1].toLowerCase();
      const monthNum = monthNames[key] || monthNames[key.slice(0, 3)] || "01";
      return `${year}-${monthNum}`;
    }
    return `${year}-01`;
  };

  const parseLinkedIn = (text) => {
    const raw = String(text || "").trim();
    if (!raw) return null;

    const out = {
      identity: {},
      profile: {},
      experiences: [],
      formations: [],
      certifications: [],
      skills: { hard: [], soft: [], passions: [] },
      languages: [],
      _sections: {},
      _rawPreview: raw.slice(0, 3000),
    };

    const emailMatch = raw.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/i);
    if (emailMatch) out.identity.email = emailMatch[0];
    const phoneMatch = raw.match(/(\+?\d[\d\s().\-]{7,}\d)/);
    if (phoneMatch) out.identity.telephone = normalizeSpace(phoneMatch[0]);

    const lines = raw.split("\n").map(l => l.trim());

    for (const l of lines.slice(0, 6)) {
      if (l.length >= 3 && l.length <= 50 && !/[@\d]/.test(l) && !detectSection(l)) {
        const parts = l.split(/\s+/);
        if (parts.length >= 1 && parts.length <= 5) {
          out.identity.prenom = parts[0];
          out.identity.nom = parts.slice(1).join(" ");
          break;
        }
      }
    }

    for (const l of lines.slice(1, 8)) {
      if (l.length >= 5 && l.length <= 80 && !detectSection(l) && !/\bbonjour\b/i.test(l)) {
        if (/développeur|engineer|manager|directeur|consultant|analyst|designer|chef|respon|commercial|comptable|architecte|ingénieur/i.test(l)) {
          out.identity.titre = l;
          break;
        }
      }
    }

    let currentSection = null;
    const sectionLines = {};

    for (const l of lines) {
      if (!l) continue;
      const detected = detectSection(l);
      if (detected) {
        currentSection = detected;
        if (!sectionLines[currentSection]) sectionLines[currentSection] = [];
        continue;
      }
      if (currentSection) {
        if (!sectionLines[currentSection]) sectionLines[currentSection] = [];
        sectionLines[currentSection].push(l);
      }
    }

    out._sections = sectionLines;

    // Profil
    if (sectionLines.profil?.length) {
      out.profile.summary = sectionLines.profil.slice(0, 8).join(" ");
    } else {
      const firstBig = raw.split(/\n{2,}/).find(s => s.trim().length > 80);
      if (firstBig) out.profile.summary = firstBig.trim().slice(0, 800);
    }

    // Expériences
    if (sectionLines.experience?.length) {
      const expLines = sectionLines.experience;
      let i = 0;
      while (i < expLines.length) {
        const L = expLines[i];
        if (!L || L.length < 2) { i++; continue; }
        const hasDate = expLines.slice(i, i + 6).some(x => /\b(19|20)\d{2}\b/.test(x));
        if (hasDate) {
          const poste = L;
          const entreprise = expLines[i + 1] && expLines[i + 1].length <= 80 && !/\b(19|20)\d{2}\b/.test(expLines[i + 1]) ? expLines[i + 1] : "";
          const dateStr = expLines.slice(i, i + 5).find(x => /\b(19|20)\d{2}\b/.test(x)) || "";
          const years = dateStr.match(/\b(19|20)\d{2}\b/g) || [];
          const startYM = years.length ? parseYearMonth(dateStr.split(/[-–—à]/)[0] || "") : "";
          const endYM = years.length > 1 ? parseYearMonth(dateStr.split(/[-–—à]/)[1] || "") : "";
          const isCurrent = /\b(en cours|présent|current|aujourd|aujourd'hui|maintenant)\b/i.test(dateStr);
          const missions = [];
          let j = entreprise ? i + 2 : i + 1;
          while (j < expLines.length && j < i + 15) {
            const ml = expLines[j];
            if (ml && /^[-•·▪▸→]/.test(ml)) {
              missions.push({ id: uid(), text: ml.replace(/^[-•·▪▸→]\s*/, "").trim() });
            } else if (ml && ml.length > 10 && !detectSection(ml) && !/\b(19|20)\d{2}\b/.test(ml)) {
              // Ligne longue sans date → possible mission
            }
            j++;
            if (missions.length >= 8) break;
          }
          out.experiences.push({ id: uid(), poste: poste.slice(0, 80), entreprise: entreprise.slice(0, 80), startYM, endYM, isCurrent, missions });
          i = entreprise ? i + 2 : i + 1;
          if (out.experiences.length >= 8) break;
        } else { i++; }
      }
    }

    if (!out.experiences.length) {
      const allLines = lines.filter(Boolean);
      for (let i = 0; i < allLines.length; i++) {
        const L = allLines[i];
        if (L.length >= 3 && L.length <= 80 && i + 1 < allLines.length) {
          const hasDateNearby = allLines.slice(i, i + 5).some(x => /\b(19|20)\d{2}\b/.test(x));
          if (hasDateNearby && allLines[i + 1].length <= 80) {
            out.experiences.push({ id: uid(), poste: L, entreprise: allLines[i + 1], startYM: "", endYM: "", isCurrent: false, missions: [] });
          }
        }
        if (out.experiences.length >= 5) break;
      }
    }

    // Formations
    if (sectionLines.formation?.length) {
      const fLines = sectionLines.formation;
      let i = 0;
      while (i < fLines.length) {
        const L = fLines[i];
        if (!L || L.length < 2) { i++; continue; }
        const etablissement = fLines[i + 1] && fLines[i + 1].length <= 80 ? fLines[i + 1] : "";
        const dateStr = fLines.slice(i, i + 5).find(x => /\b(19|20)\d{2}\b/.test(x)) || "";
        const years = dateStr.match(/\b(19|20)\d{2}\b/g) || [];
        const startYM = years.length ? `${years[0]}-09` : "";
        const endYM = years.length > 1 ? `${years[1]}-06` : (years.length ? `${parseInt(years[0]) + 3}-06` : "");
        out.formations.push({ id: uid(), diplome: L.slice(0, 80), etablissement: etablissement.slice(0, 80), ville: "", startYM, endYM });
        i = etablissement ? i + 2 : i + 1;
        if (out.formations.length >= 5) break;
      }
    }

    // Certifications
    if (sectionLines.certifications?.length) {
      sectionLines.certifications.forEach((l, i) => {
        if (!l || l.length < 2) return;
        const yearMatch = l.match(/\b(20\d{2}|19\d{2})\b/);
        const annee = yearMatch ? yearMatch[0] : "";
        const nom = l.replace(/\b(20\d{2}|19\d{2})\b/, "").replace(/[-–—]/, "").trim();
        out.certifications.push({ id: uid(), nom: nom.slice(0, 80), organisme: "", annee });
        if (i >= 7) return;
      });
    }

    // Compétences
    if (sectionLines.competences?.length) {
      const skills = sectionLines.competences.flatMap(l =>
        l.split(/[,;|•·▪▸→]/).map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 40)
      );
      out.skills.hard = [...new Set(skills)].slice(0, 20);
    }

    // Langues
    if (sectionLines.langues?.length) {
      sectionLines.langues.forEach((l) => {
        const parts = l.split(/[-–—:|·]/);
        if (parts.length >= 1) {
          const langue = parts[0].trim();
          const niveau = parts[1]?.trim() || "Non précisé";
          if (langue.length >= 2 && langue.length <= 30) {
            out.languages.push({ id: uid(), langue, niveau });
          }
        }
      });
    }

    return out;
  };

  /* ========================= Apply Import ========================= */
  const applyImport = () => {
    const draft = state.ui.importDraft;
    if (!draft) return;

    const s = deepClone(state);

    if (draft.identity) {
      Object.keys(draft.identity).forEach(k => {
        if (!s.data.identity[k] && draft.identity[k]) s.data.identity[k] = draft.identity[k];
      });
    }

    if (draft.profile?.summary && !s.data.profile.summary) {
      s.data.profile.summary = draft.profile.summary;
    }

    if (draft.experiences?.length) {
      const existing = s.data.experiences.map(e => (e.poste + e.entreprise).toLowerCase());
      draft.experiences.forEach(e => {
        if (!existing.includes((e.poste + e.entreprise).toLowerCase())) {
          s.data.experiences.push(e);
        }
      });
    }

    if (draft.formations?.length) {
      if (!s.data.formations) s.data.formations = [];
      const existing = s.data.formations.map(f => (f.diplome + f.etablissement).toLowerCase());
      draft.formations.forEach(f => {
        if (!existing.includes((f.diplome + f.etablissement).toLowerCase())) {
          s.data.formations.push(f);
        }
      });
    }

    if (draft.certifications?.length) {
      if (!s.data.certifications) s.data.certifications = [];
      const existing = s.data.certifications.map(c => c.nom.toLowerCase());
      draft.certifications.forEach(c => {
        if (!existing.includes(c.nom.toLowerCase())) s.data.certifications.push(c);
      });
    }

    if (draft.skills?.hard?.length) {
      const merged = [...new Set([...s.data.skills.hard, ...draft.skills.hard])];
      s.data.skills.hard = merged.slice(0, 20);
    }

    if (draft.languages?.length) {
      if (!s.data.languages) s.data.languages = [];
      const existing = s.data.languages.map(l => l.langue.toLowerCase());
      draft.languages.forEach(l => {
        if (!existing.includes(l.langue.toLowerCase())) s.data.languages.push(l);
      });
    }

    const hasData = s.data.identity.prenom || s.data.identity.nom;
    if (hasData) {
      downloadPdfBtn.disabled = false;
      downloadDocxBtn.disabled = false;
      printBtn.disabled = false;
    }

    setState(s, { skipHistory: false });
    closeModal();

    system("✅ Import appliqué ! Expériences, formations, compétences et langues ont été répartis dans les bons champs.");
    rebuildChatDOM();
  };

  const buildImportPreview = (draft) => {
    if (!draft) return "Aucune donnée.";
    const lines = [];
    if (draft.identity && Object.keys(draft.identity).length) {
      lines.push("── IDENTITÉ ──");
      Object.entries(draft.identity).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
    }
    if (draft.profile?.summary) {
      lines.push("── PROFIL ──");
      lines.push("  " + draft.profile.summary.slice(0, 200) + (draft.profile.summary.length > 200 ? "…" : ""));
    }
    if (draft.experiences?.length) {
      lines.push(`── EXPÉRIENCES (${draft.experiences.length}) ──`);
      draft.experiences.forEach(e => lines.push(`  • ${e.poste} — ${e.entreprise}${e.startYM ? ` (${e.startYM})` : ""}`));
    }
    if (draft.formations?.length) {
      lines.push(`── FORMATIONS (${draft.formations.length}) ──`);
      draft.formations.forEach(f => lines.push(`  • ${f.diplome} — ${f.etablissement}${f.startYM ? ` (${f.startYM})` : ""}`));
    }
    if (draft.certifications?.length) {
      lines.push(`── CERTIFICATIONS (${draft.certifications.length}) ──`);
      draft.certifications.forEach(c => lines.push(`  • ${c.nom} (${c.organisme || "—"}${c.annee ? ", " + c.annee : ""})`));
    }
    if (draft.skills?.hard?.length) {
      lines.push(`── COMPÉTENCES (${draft.skills.hard.length}) ──`);
      lines.push("  " + draft.skills.hard.join(", "));
    }
    if (draft.languages?.length) {
      lines.push(`── LANGUES (${draft.languages.length}) ──`);
      draft.languages.forEach(l => lines.push(`  • ${l.langue} — ${l.niveau}`));
    }
    return lines.join("\n") || "Aucune donnée structurée détectée.";
  };

  /* ========================= Identity questions ========================= */
  const identityQuestions = [
    { key: "prenom",    text: "Quel est votre prénom ?",                                                         type: "text",  validate: vRequired("Prénom requis.") },
    { key: "nom",       text: "Quel est votre nom de famille ?",                                                 type: "text",  validate: vRequired("Nom requis.") },
    { key: "email",     text: "Quelle est votre adresse email professionnelle ?",                                type: "email", validate: vEmail("Email invalide (format nom@domaine.com).") },
    { key: "telephone", text: "Quel est votre numéro de téléphone ? (avec indicatif, ex : +33 6 12 34 56 78)", type: "tel",   validate: vPhone("Téléphone invalide (min. 8 chiffres).") },
    { key: "ville",     text: "Dans quelle ville habitez-vous / postulez-vous ?",                                type: "text",  validate: vRequired("Ville requise.") },
    { key: "titre",     text: "Quel est votre titre professionnel actuel ou visé ? (ex : Développeur Full-Stack, Chef de projet…)", type: "text", validate: vRequired("Titre professionnel requis.") },
  ];

  /* ========================= Flow / Step Logic ========================= */
  const proceed = () => {
    renderCV();
    renderATS();
    const hasEnough = normalizeSpace(state.data.identity.prenom).length && normalizeSpace(state.data.identity.nom).length;
    templateSwitcher.hidden = !hasEnough;
    const needsText = state.flow.step === Steps.IDENTITY;
    if (needsText) {
      setWidget(null);
      setInputLock(false, "");
      userInput.placeholder = "Votre réponse…";
      userInput.focus();
    }
    askCurrentQuestion();
  };

  const askCurrentQuestion = () => {
    const s = state.flow.step;

    if (s === Steps.WELCOME) {
      bot("👋 Bonjour ! Je suis Troptop CV, votre assistant de création de CV optimisé ATS.\n\nJe vais vous guider étape par étape. À la fin, votre CV sera téléchargeable en PDF (compatible ATS) et en DOCX.", { isQuestion: true });
      rebuildChatDOM();
      showChoices({
        title: "Comment souhaitez-vous commencer ?",
        choices: [
          { label: "🚀 Créer mon CV étape par étape", variant: "btn btn--primary", onClick: () => {
            user("Créer mon CV");
            const s2 = deepClone(state);
            s2.flow.step = Steps.IDENTITY;
            s2.flow.identityIndex = 0;
            setState(s2);
          }},
          { label: "📂 Importer mon CV / LinkedIn", variant: "btn btn--ghost", onClick: () => {
            user("Importer un CV");
            openModal();
          }},
        ],
      });
      return;
    }

    if (s === Steps.IDENTITY) {
      const qi = state.flow.identityIndex;
      if (qi >= identityQuestions.length) {
        const s2 = deepClone(state);
        s2.flow.step = Steps.PROFILE;
        setState(s2); return;
      }
      const q = identityQuestions[qi];
      bot(q.text, { isQuestion: true });
      rebuildChatDOM();
      userInput.type = q.type || "text";
      userInput.placeholder = "Votre réponse…";
      return;
    }

    if (s === Steps.PROFILE) {
      bot("Rédigez votre Profil professionnel (3–6 lignes) : qui vous êtes, votre valeur ajoutée, votre objectif.\n\n💡 Tip ATS : intégrez les mots-clés du poste visé.", { isQuestion: true });
      rebuildChatDOM();
      showTextAreaWidget({
        title: "Profil professionnel",
        placeholder: "Ex : Développeur Full-Stack avec 5 ans d'expérience, spécialisé en React et Node.js. Passionné par les architectures scalables, j'ai contribué à des projets à fort impact…",
        value: state.data.profile.summary,
        onSave: (text) => {
          const v = normalizeSpace(text);
          if (!v) return toastSystem("Veuillez rédiger votre profil (minimum une phrase).");
          user(v.slice(0, 80) + (v.length > 80 ? "…" : ""));
          const s2 = deepClone(state);
          s2.data.profile.summary = v;
          s2.flow.step = Steps.EXP_START;
          setState(s2);
        },
      });
      return;
    }

    if (s === Steps.EXP_START) {
      const count = (state.data.experiences || []).length;
      bot(count
        ? `Vous avez ${count} expérience(s). Souhaitez-vous en ajouter d'autres ou continuer ?`
        : "Parlons de vos expériences professionnelles. Ajoutez-en autant que vous souhaitez.",
        { isQuestion: true }
      );
      rebuildChatDOM();
      showExperienceManagerWidget({
        onClose: () => {
          const s2 = deepClone(state);
          s2.flow.step = Steps.FORMATIONS;
          setState(s2);
        },
      });
      return;
    }

    if (s === Steps.FORMATIONS) {
      const count = (state.data.formations || []).length;
      bot(count
        ? `Vous avez ${count} formation(s). Continuez ou ajoutez d'autres.`
        : "Renseignez vos formations et diplômes. La formation est très importante pour les ATS.",
        { isQuestion: true }
      );
      rebuildChatDOM();
      showFormationManagerWidget({
        onClose: () => {
          const s2 = deepClone(state);
          s2.flow.step = Steps.CERTIFICATIONS;
          setState(s2);
        },
      });
      return;
    }

    if (s === Steps.CERTIFICATIONS) {
      const count = (state.data.certifications || []).length;
      bot(count
        ? `Vous avez ${count} certification(s). Continuez ou ajoutez d'autres.`
        : "Avez-vous des certifications professionnelles ? (AWS, TOEIC, PMI, Google, Microsoft…)\nElles boostent votre score ATS.",
        { isQuestion: true }
      );
      rebuildChatDOM();
      showCertificationManagerWidget({
        onClose: () => {
          const s2 = deepClone(state);
          s2.flow.step = Steps.SKILLS;
          setState(s2);
        },
      });
      return;
    }

    if (s === Steps.SKILLS) {
      const jobTitle = state.data.identity.titre;
      bot("Quelles sont vos compétences techniques ? Choisissez dans la liste ou saisissez les vôtres.\n\n💡 Tip ATS : utilisez les mots-clés exacts de la fiche de poste.", { isQuestion: true });
      rebuildChatDOM();
      showPillWidget({
        title: "Compétences techniques",
        current: state.data.skills.hard,
        suggestions: hardSkillSuggestions(jobTitle),
        placeholder: "Ajouter (séparées par des virgules)…",
        onSave: (items) => {
          user(items.slice(0, 5).join(", ") + (items.length > 5 ? "…" : ""));
          const s2 = deepClone(state);
          s2.data.skills.hard = items;
          s2.flow.step = Steps.SOFT;
          setState(s2);
        },
      });
      return;
    }

    if (s === Steps.SOFT) {
      bot("Et vos soft skills ? (qualités humaines et relationnelles)", { isQuestion: true });
      rebuildChatDOM();
      showPillWidget({
        title: "Soft skills",
        current: state.data.skills.soft,
        suggestions: SOFT_SUGGESTIONS,
        placeholder: "Ajouter…",
        onSave: (items) => {
          user(items.slice(0, 5).join(", ") + (items.length > 5 ? "…" : ""));
          const s2 = deepClone(state);
          s2.data.skills.soft = items;

          bot("Vos centres d'intérêt / hobbies ? (optionnel — humanise votre CV)", { isQuestion: true });
          showPillWidget({
            title: "Centres d'intérêt",
            current: s2.data.skills.passions,
            suggestions: PASSION_SUGGESTIONS,
            placeholder: "Ajouter…",
            onSave: (passions) => {
              const s3 = deepClone(state);
              s3.data.skills.soft = items;
              s3.data.skills.passions = passions;
              s3.flow.step = Steps.LANGUAGES;
              setState(s3);
            },
          });
        },
      });
      return;
    }

    if (s === Steps.LANGUAGES) {
      bot("Quelles langues parlez-vous et à quel niveau ?\n\nL'anglais est quasi-obligatoire sur un CV aujourd'hui.", { isQuestion: true });
      rebuildChatDOM();
      showLanguageWidget({
        onClose: () => {
          const s2 = deepClone(state);
          s2.flow.step = Steps.REVIEW;
          setState(s2);
        },
      });
      return;
    }

    if (s === Steps.REVIEW) {
      bot("🎉 Votre CV est prêt ! Vérifiez l'aperçu à droite.\n\nVous pouvez télécharger en PDF (compatible ATS) ou DOCX, modifier n'importe quelle section, ou changer de modèle.", { isQuestion: false });
      rebuildChatDOM();

      downloadPdfBtn.disabled = false;
      downloadDocxBtn.disabled = false;
      printBtn.disabled = false;
      templateSwitcher.hidden = false;

      showChoices({
        title: "Que souhaitez-vous faire ?",
        choices: [
          { label: "✏️ Modifier les expériences", variant: "btn btn--ghost", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.EXP_START; setState(s2);
          }},
          { label: "🎓 Modifier formations", variant: "btn btn--ghost", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.FORMATIONS; setState(s2);
          }},
          { label: "🏆 Modifier certifications", variant: "btn btn--ghost", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.CERTIFICATIONS; setState(s2);
          }},
          { label: "✅ Finaliser", variant: "btn btn--primary", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.FINISHED; setState(s2);
          }},
        ],
      });
      renderATS();
      return;
    }

    if (s === Steps.FINISHED) {
      bot("✅ CV finalisé ! Téléchargez votre CV via les boutons ci-dessous.\n\n📄 PDF ATS = impression navigateur → texte sélectionnable\n📝 DOCX = éditable dans Word/LibreOffice", { isQuestion: false });
      rebuildChatDOM();

      downloadPdfBtn.disabled = false;
      downloadDocxBtn.disabled = false;
      printBtn.disabled = false;

      showChoices({
        title: "Actions",
        choices: [
          { label: "🔄 Retourner à l'aperçu", variant: "btn btn--ghost", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.REVIEW; setState(s2);
          }},
          { label: "📂 Importer un autre CV", variant: "btn btn--ghost", onClick: () => openModal() },
        ],
      });
      renderATS();
      return;
    }
  };

  /* ========================= Handle user text input ========================= */
  const handleUserInput = () => {
    if (state.ui.lockedInput) return;
    const val = normalizeSpace(userInput.value);
    if (!val) return;

    if (state.flow.step === Steps.IDENTITY) {
      const qi = state.flow.identityIndex;
      const q = identityQuestions[qi];
      const error = q.validate(val);
      if (error) { inputHint.textContent = "⚠ " + error; return; }
      inputHint.textContent = "";

      user(val);
      userInput.value = "";

      const s2 = deepClone(state);
      s2.data.identity[q.key] = val;
      s2.flow.identityIndex = qi + 1;
      if (s2.flow.identityIndex >= identityQuestions.length) {
        s2.flow.step = Steps.PROFILE;
      }
      setState(s2);
    }
  };

  userInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleUserInput(); });
  sendBtn.addEventListener("click", handleUserInput);

  /* ========================= Back button ========================= */
  backBtn.addEventListener("click", () => {
    const prev = popHistory();
    if (prev) { state = prev; saveToStorage(state); renderAll(); }
  });

  /* ========================= ATS toggle ========================= */
  atsToggle.addEventListener("change", () => {
    const s2 = deepClone(state);
    s2.ui.atsMode = atsToggle.checked;
    if (s2.ui.atsMode && s2.ui.selectedTemplate === "t3") s2.ui.selectedTemplate = "t2";
    setState(s2, { skipHistory: true });
  });

  /* ========================= renderAll ========================= */
  const renderAll = () => {
    atsToggle.checked = !!state.ui.atsMode;
    templateSwitcher.querySelectorAll("button[data-template]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.template === state.ui.selectedTemplate);
      b.disabled = state.ui.atsMode && b.dataset.template === "t3";
    });
    rebuildChatDOM();
    renderCV();
    renderATS();
    backBtn.disabled = history.length === 0;
    proceed();
  };

  /* ========================= Modal ========================= */
  const openModal = () => { importModal.hidden = false; document.body.style.overflow = "hidden"; };
  const closeModal = () => { importModal.hidden = true; document.body.style.overflow = ""; };

  const initModal = () => {
    importModal.addEventListener("click", (e) => {
      if (e.target?.dataset?.close === "true") closeModal();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    importModal.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        importModal.querySelectorAll(".tab").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const tab = btn.dataset.tab;
        importModal.querySelectorAll("[data-tabpane]").forEach(p => { p.hidden = p.dataset.tabpane !== tab; });
      });
    });

    parseLinkedinBtn.addEventListener("click", () => {
      const text = linkedinText.value.trim();
      if (!text) { alert("Collez du texte d'abord."); return; }
      const draft = parseLinkedIn(text);
      if (!draft) { alert("Impossible de parser ce texte."); return; }
      state.ui.importDraft = draft;
      importPreviewPre.textContent = buildImportPreview(draft);
      importPreview.hidden = false;
      applyImportBtn.disabled = false;
    });

    parsePdfBtn.addEventListener("click", async () => {
      const file = pdfFileInput.files?.[0];
      if (!file) { alert("Sélectionnez un fichier PDF."); return; }
      pdfStatus.textContent = "Extraction en cours…";
      try {
        const arrayBuffer = await file.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(" ") + "\n";
        }
        pdfStatus.textContent = `${pdf.numPages} page(s) extraites.`;
        const draft = parseLinkedIn(fullText);
        if (!draft) { pdfStatus.textContent = "Aucune donnée détectée."; return; }
        state.ui.importDraft = draft;
        importPreviewPre.textContent = buildImportPreview(draft);
        importPreview.hidden = false;
        applyImportBtn.disabled = false;
      } catch (e) {
        console.error(e);
        pdfStatus.textContent = "Erreur PDF : " + e.message;
      }
    });

    applyImportBtn.addEventListener("click", applyImport);
  };

  /* ========================= Top bar buttons ========================= */
  importBtn.addEventListener("click", openModal);

  resetBtn.addEventListener("click", () => {
    if (!confirm("Réinitialiser et effacer toutes vos données ? Cette action est irréversible.")) return;
    clearStorage();
    history = [];
    state = initialState();
    renderAll();
  });

  resumeBtn.addEventListener("click", () => {
    const saved = loadFromStorage();
    if (!saved) { system("Aucune sauvegarde trouvée."); rebuildChatDOM(); return; }
    history = [];
    state = saved;
    renderAll();
    system("✅ Session reprise depuis la sauvegarde !");
    rebuildChatDOM();
  });

  downloadPdfBtn.addEventListener("click", downloadPDF);
  downloadDocxBtn.addEventListener("click", exportDOCX);
  printBtn.addEventListener("click", printCV);

  /* ========================= Template switcher ========================= */
  initTemplateSwitcher();

  /* ========================= Init ========================= */
  const init = () => {
    initModal();
    renderCV();
    renderATS();
    templateSwitcher.hidden = true;

    const saved = loadFromStorage();
    if (saved) {
      state = initialState();
      bot("Bienvenue sur Troptop CV !", { isQuestion: true });
      rebuildChatDOM();
      showChoices({
        title: "Une sauvegarde a été trouvée. Que faire ?",
        choices: [
          { label: "▶ Reprendre ma session", variant: "btn btn--success", onClick: () => {
            state = saved;
            history = [];
            renderAll();
            system("✅ Session reprise !");
            rebuildChatDOM();
          }},
          { label: "🆕 Nouveau CV", variant: "btn btn--ghost", onClick: () => {
            clearStorage();
            state = initialState();
            const s2 = deepClone(state);
            s2.flow.step = Steps.WELCOME;
            setState(s2, { skipHistory: true });
          }},
        ],
      });
    } else {
      const s2 = deepClone(state);
      s2.flow.step = Steps.WELCOME;
      setState(s2, { skipHistory: true });
    }
  };

  init();
})();
