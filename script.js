(() => {
  "use strict";

  /* =========================================================
   * Troptop CV v3 — Formations, Certifications, PDF fix,
   *   Mobile download, Smart parsing, Responsive
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

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
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
        // IE / old Edge
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
      // Fallback: ouvrir dans nouvel onglet
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
    // Also clear old version
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
      experiences: [], // {id, entreprise, poste, startYM, endYM, isCurrent, missions:[{id,text}]}
      formations: [],  // {id, diplome, etablissement, ville, startYM, endYM}
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

    const contacts = [
      id.email ? `Email : ${id.email}` : "",
      id.telephone ? `Tél : ${id.telephone}` : "",
      id.ville ? `Ville : ${id.ville}` : "",
    ].filter(Boolean);

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
      return `
        <div class="edu-item avoid-pagebreak">
          <div class="edu-top">
            <span class="edu-degree">${escapeHTML(edu.diplome || "")}</span>
            ${edu.etablissement ? `<span class="edu-school">&nbsp;— ${escapeHTML(edu.etablissement)}</span>` : ""}
          </div>
          ${dates ? `<div class="edu-dates">${escapeHTML(dates)}</div>` : ""}
          ${edu.ville ? `<div class="edu-ville">📍 ${escapeHTML(edu.ville)}</div>` : ""}
        </div>`;
    }).join("");

    // === Certifications ===
    const certHTML = (a.certifications || []).map((cert) => `
      <div class="cert-item avoid-pagebreak">
        <div class="cert-name">${escapeHTML(cert.nom || "")}</div>
        <div class="cert-meta">${escapeHTML(cert.organisme || "")}${cert.annee ? ` — ${escapeHTML(cert.annee)}` : ""}</div>
      </div>`).join("");

    const hardSkills = (a.skills.hard || []).map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const softSkills = (a.skills.soft || []).map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const passions = (a.skills.passions || []).map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const langs = (a.languages || []).map((l) => `<span class="chip">${escapeHTML(l.langue)} — ${escapeHTML(l.niveau)}</span>`).join("");

    const atsClass = state.ui.atsMode ? "is-ats" : "";
    const tpl = state.ui.atsMode ? "t2" : state.ui.selectedTemplate;

    cvPreview.innerHTML = `
      <div class="cv-paper" id="cv-paper">
        <div class="cv-root cv--${tpl} ${atsClass}" id="cv-root">
          <div class="cv-headline avoid-pagebreak">
            <h1 class="cv-name">${escapeHTML(fullName)}</h1>
            ${title ? `<div class="cv-title">${escapeHTML(title)}</div>` : ""}
            ${contacts.length ? `<div class="cv-contact">${contacts.map(c => `<span>${escapeHTML(c)}</span>`).join("")}</div>` : ""}
          </div>

          ${summary ? `
          <section class="cv-section avoid-pagebreak">
            <h2 class="cv-section-title">Profil professionnel</h2>
            <div class="cv-summary">${escapeHTML(summary)}</div>
          </section>` : ""}

          <div class="two-col">
            <!-- Colonne gauche -->
            <div>
              <section class="cv-section">
                <h2 class="cv-section-title">Expériences</h2>
                ${expHTML || `<div class="muted">Aucune expérience renseignée.</div>`}
              </section>

              ${(a.formations || []).length ? `
              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Formations</h2>
                ${eduHTML}
              </section>` : ""}

              ${(a.certifications || []).length ? `
              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Certifications</h2>
                ${certHTML}
              </section>` : ""}
            </div>

            <!-- Colonne droite -->
            <div>
              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Compétences techniques</h2>
                ${hardSkills ? `<div class="chips">${hardSkills}</div>` : `<div class="muted">—</div>`}
              </section>

              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Soft skills</h2>
                ${softSkills ? `<div class="chips">${softSkills}</div>` : `<div class="muted">—</div>`}
              </section>

              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Centres d'intérêt</h2>
                ${passions ? `<div class="chips">${passions}</div>` : `<div class="muted">—</div>`}
              </section>

              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Langues</h2>
                ${langs ? `<div class="chips">${langs}</div>` : `<div class="muted">—</div>`}
              </section>
            </div>
          </div>
        </div>
      </div>`;
  };

  /* ========================= ATS ========================= */
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

    if (hasName) score += 8; else recos.push("Ajoutez votre prénom et nom.");
    if (hasEmail) score += 8; else recos.push("Ajoutez un email valide.");
    if (hasPhone) score += 5; else recos.push("Ajoutez un téléphone.");
    if (hasTitle) score += 6; else recos.push("Ajoutez un titre métier clair.");

    if (summaryLen >= 260) score += 10;
    else if (summaryLen >= 120) score += 7;
    else if (summaryLen > 0) score += 4;
    else recos.push("Ajoutez un profil professionnel de 3–6 lignes.");

    if (expCount >= 2) score += 10;
    else if (expCount === 1) score += 6;
    else recos.push("Ajoutez au moins une expérience professionnelle.");

    if (missionCount >= 8) score += 10;
    else if (missionCount >= 3) score += 7;
    else if (missionCount > 0) score += 3;
    else recos.push("Ajoutez des missions (idéal : 3–6 par expérience).");

    const missionsText = (a.experiences || []).flatMap(e => (e.missions || []).map(m => m.text)).join(" ");
    if (/\b\d+([.,]\d+)?\b/.test(missionsText)) score += 7;
    else recos.push("Quantifiez vos résultats (ex : +25%, 30 clients…).");

    if (hardCount >= 10) score += 8;
    else if (hardCount >= 5) score += 5;
    else if (hardCount > 0) score += 3;
    else recos.push("Ajoutez des compétences techniques (5–12).");

    if (langCount >= 2) score += 5; else if (langCount === 1) score += 3;
    else recos.push("Ajoutez au moins une langue + niveau.");

    // Bonus formations et certifications
    if (formCount >= 1) score += 5;
    else recos.push("Ajoutez votre formation principale (diplôme, école).");

    if (certCount >= 1) score += 4;

    if (state.ui.atsMode) score += 10;
    else recos.push("Activez le Mode ATS pour une mise en page compatible.");

    score = Math.max(0, Math.min(100, score));

    const job = (id.titre || "").toLowerCase();
    if (job.includes("dévelop") || job.includes("dev") || job.includes("software")) {
      recos.push("Tech : ajoutez des mots-clés stack alignés au poste visé.");
    } else if (job.includes("marketing")) {
      recos.push("Marketing : ajoutez des KPI (CPC, ROAS, CTR…).");
    } else if (job.includes("finance") || job.includes("compta")) {
      recos.push("Finance : ajoutez outils (Excel, ERP), normes (IFRS).");
    }

    return { score, recos: recos.slice(0, 10) };
  };

  const renderATS = () => {
    const { score, recos } = getATS();
    if (state.flow.step === Steps.FINISHED || state.flow.step === Steps.REVIEW) {
      atsBadge.hidden = false;
      atsPanel.hidden = false;
      atsScoreEl.textContent = String(score);
      atsRecos.innerHTML = "";
      recos.forEach((r) => {
        const li = document.createElement("li");
        li.textContent = r;
        atsRecos.appendChild(li);
      });
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
        system("Le modèle 3 (2 colonnes) est désactivé en Mode ATS.");
        rebuildChatDOM(); return;
      }
      templateSwitcher.querySelectorAll("button[data-template]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      setTemplate(btn.dataset.template);
    });
  };

  /* ========================= PDF Export (FIXED) ========================= */
  /**
   * BUG PDF BLANC — Causes identifiées et corrections :
   * 1. L'élément cloné dans un div à left:-99999px peut être hors viewport réel → html2canvas ne le voit pas
   * 2. Mauvais timing : html2canvas capture avant le repaint du DOM
   * 3. Sur mobile : html2pdf ne fonctionne pas bien sur iOS Safari
   *
   * SOLUTION :
   * - Desktop : capturer directement l'élément #cv-paper IN-DOM avec requestAnimationFrame
   * - Mobile : générer un HTML complet self-contained → Blob → window.open (impression native)
   */
  const downloadPDF = async () => {
    const paper = document.getElementById("cv-paper");
    if (!paper || paper.textContent.trim().length < 20) {
      system("Le CV n'est pas prêt pour l'export."); rebuildChatDOM(); return;
    }

    const prenom = safeFilePart(state.data.identity.prenom || "Prenom");
    const nom = safeFilePart(state.data.identity.nom || "Nom");
    const filename = `CV_${prenom}_${nom}.pdf`;

    // === MOBILE : fallback HTML → Blob → window.open ===
    if (isMobile() || !window.html2pdf) {
      try {
        await exportPDFMobile(filename);
      } catch (e) {
        console.error("Mobile PDF error:", e);
        system("Export PDF mobile : impossible. Utilisez le bouton Imprimer / Partager de votre navigateur.");
        rebuildChatDOM();
      }
      return;
    }

    // === DESKTOP : html2pdf avec l'élément IN-DOM ===
    // Attendre que les polices et le layout soient prêts
    try { await document.fonts?.ready; } catch {}
    // 2 frames pour s'assurer que le DOM est peint
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Rendre le bouton en loading
    downloadPdfBtn.disabled = true;
    downloadPdfBtn.innerHTML = '<span class="spinner"></span>Génération…';

    const opt = {
      margin: [8, 10, 8, 10],
      filename,
      image: { type: "jpeg", quality: 0.97 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        // Clé : capturer depuis la position réelle de l'élément
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    try {
      console.log("[PDF] Début export, élément:", paper.id, "taille:", paper.offsetWidth, "x", paper.offsetHeight);
      // IMPORTANT: passer l'élément directement (pas un clone hors-DOM)
      await html2pdf().set(opt).from(paper).save();
      console.log("[PDF] Export terminé");
    } catch (e) {
      console.error("[PDF] Erreur:", e);
      system("Erreur export PDF : " + e.message + ". Essayez le bouton Imprimer.");
    } finally {
      downloadPdfBtn.disabled = false;
      downloadPdfBtn.innerHTML = "⬇ PDF (A4)";
      rebuildChatDOM();
    }
  };

  /** Export PDF mobile : génère un HTML autonome et l'ouvre dans un nouvel onglet */
  const exportPDFMobile = async (filename) => {
    // Récupérer les styles inlinés
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";
    for (const sheet of styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        cssText += rules.map(r => r.cssText).join("\n");
      } catch {}
    }

    // Ajouter styles supplémentaires pour print mobile
    const extraCSS = `
      body { margin: 0; background: #fff; font-family: -apple-system, sans-serif; }
      .cv-paper { width: 100%; min-height: auto; box-shadow: none; border-radius: 0; padding: 20px; }
      .two-col { grid-template-columns: 1fr !important; gap: 0 !important; }
      @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `;

    const paperHTML = document.getElementById("cv-paper")?.outerHTML || "<p>CV non généré</p>";

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${filename.replace(".pdf", "")}</title>
<style>${cssText}\n${extraCSS}</style>
</head>
<body>
${paperHTML}
<script>
  // Auto-print sur mobile pour sauvegarder en PDF
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (confirm('Appuyez sur OK pour ouvrir la boîte d\\'impression (Enregistrer en PDF)')) {
        window.print();
      }
    }, 800);
  });
<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newWin = window.open(url, "_blank");
    if (!newWin) {
      // Si popup bloqué, fallback anchor
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.replace(".pdf", ".html");
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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

    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;
    const children = [];

    // Entête
    children.push(new Paragraph({ text: fullName, heading: HeadingLevel.TITLE }));
    if (title) children.push(new Paragraph({ children: [new TextRun({ text: title, bold: true })] }));

    const contacts = [
      id.email ? `Email : ${id.email}` : "",
      id.telephone ? `Tél : ${id.telephone}` : "",
      id.ville ? `Ville : ${id.ville}` : "",
    ].filter(Boolean);
    if (contacts.length) {
      children.push(new Paragraph({ children: [new TextRun({ text: contacts.join(" | "), color: "555555" })] }));
    }
    children.push(new Paragraph({ text: "" }));

    // Profil
    if (summary) {
      children.push(new Paragraph({ text: "Profil professionnel", heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: summary }));
      children.push(new Paragraph({ text: "" }));
    }

    // Expériences
    children.push(new Paragraph({ text: "Expériences", heading: HeadingLevel.HEADING_2 }));
    if (!(a.experiences || []).length) {
      children.push(new Paragraph({ text: "—" }));
    } else {
      for (const exp of a.experiences) {
        const dates = computeExpDisplay(exp);
        const headline = `${normalizeSpace(exp.poste)} — ${normalizeSpace(exp.entreprise)}`.trim();
        children.push(new Paragraph({
          children: [
            new TextRun({ text: headline || "Expérience", bold: true }),
            dates ? new TextRun({ text: `   (${dates})`, color: "555555" }) : new TextRun({ text: "" }),
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
      children.push(new Paragraph({ text: "Formations", heading: HeadingLevel.HEADING_2 }));
      for (const edu of a.formations) {
        const dates = computeEduDisplay(edu);
        const headline = [edu.diplome, edu.etablissement].filter(Boolean).join(" — ");
        children.push(new Paragraph({
          children: [
            new TextRun({ text: headline || "Formation", bold: true }),
            dates ? new TextRun({ text: `   (${dates})`, color: "555555" }) : new TextRun({ text: "" }),
          ],
        }));
        if (edu.ville) {
          children.push(new Paragraph({ children: [new TextRun({ text: `📍 ${edu.ville}`, color: "888888" })] }));
        }
        children.push(new Paragraph({ text: "" }));
      }
    }

    // Certifications
    if ((a.certifications || []).length) {
      children.push(new Paragraph({ text: "Certifications", heading: HeadingLevel.HEADING_2 }));
      for (const cert of a.certifications) {
        const meta = [cert.organisme, cert.annee].filter(Boolean).join(" — ");
        children.push(new Paragraph({
          children: [
            new TextRun({ text: cert.nom || "", bold: true }),
            meta ? new TextRun({ text: `   ${meta}`, color: "555555" }) : new TextRun({ text: "" }),
          ],
        }));
      }
      children.push(new Paragraph({ text: "" }));
    }

    // Compétences
    children.push(new Paragraph({ text: "Compétences techniques", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: (a.skills.hard || []).length ? a.skills.hard.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "Soft skills", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: (a.skills.soft || []).length ? a.skills.soft.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "Centres d'intérêt", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: (a.skills.passions || []).length ? a.skills.passions.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    // Langues
    children.push(new Paragraph({ text: "Langues", heading: HeadingLevel.HEADING_2 }));
    for (const l of (a.languages || [])) {
      children.push(new Paragraph({ text: `${l.langue} — ${l.niveau}`, bullet: { level: 0 } }));
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
    const IT = ["JavaScript", "TypeScript", "HTML", "CSS", "React", "Node.js", "SQL", "Docker", "Git", "CI/CD", "REST API", "Python", "PostgreSQL"];
    const MKT = ["SEO", "SEA", "Google Ads", "Meta Ads", "GA4", "GTM", "CRM", "Emailing", "Content marketing", "Copywriting", "KPI"];
    const FIN = ["Excel avancé", "Contrôle de gestion", "Reporting", "Budget", "Forecast", "ERP", "Power BI", "IFRS"];
    if (t.includes("dévelop") || t.includes("dev") || t.includes("software") || t.includes("data")) return IT;
    if (t.includes("marketing") || t.includes("growth") || t.includes("communication")) return MKT;
    if (t.includes("finance") || t.includes("compta")) return FIN;
    return [...new Set([...IT.slice(0, 5), ...MKT.slice(0, 5), ...FIN.slice(0, 5)])];
  };

  const SOFT_SUGGESTIONS = ["Communication", "Leadership", "Esprit d'équipe", "Autonomie", "Rigueur", "Organisation", "Curiosité", "Résolution de problèmes", "Adaptabilité", "Proactivité", "Gestion du temps", "Esprit d'analyse", "Sens du service", "Créativité"];
  const PASSION_SUGGESTIONS = ["Sport", "Lecture", "Musique", "Voyages", "Photographie", "Bénévolat", "Tech / veille", "Jeux d'échecs", "Cuisine", "Randonnée"];
  const LANGUAGE_SUGGESTIONS = ["Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais", "Arabe", "Chinois", "Japonais", "Russe", "Autre"];
  const LANGUAGE_LEVELS = ["Maternelle", "Débutant", "Intermédiaire", "Avancé", "Courant", "Bilingue", "Technique"];

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
    ta.rows = 5;
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
    fDiplome.placeholder = "Ex : Master Informatique, BTS Commerce…";
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
      durSpan.textContent = md != null ? `Durée calculée : ${formatDurationFR(md + 1)}` : "";
    };
    fStart.addEventListener("change", updateDur);
    fEnd.addEventListener("change", updateDur);

    const row1 = document.createElement("div");
    row1.className = "row row--2";
    row1.appendChild(field("Diplôme / Intitulé *", fDiplome));
    row1.appendChild(field("Établissement *", fEtab));

    const row2 = document.createElement("div");
    row2.className = "row row--3";
    row2.appendChild(field("Date début (Mois/Année)", fStart));
    row2.appendChild(field("Date fin (Mois/Année)", fEnd));
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
        p.textContent = "Aucune formation. Cliquez sur Ajouter.";
        list.appendChild(p);
        return;
      }
      (state.data.formations || []).forEach((edu) => {
        const box = document.createElement("div");
        box.style.cssText = "border:1px solid var(--border);border-radius:12px;padding:10px;margin-top:10px;background:#fff;";
        const t = document.createElement("div");
        t.style.fontWeight = "950";
        t.textContent = `${edu.diplome} — ${edu.etablissement}`;
        const meta = document.createElement("div");
        meta.className = "muted small";
        meta.textContent = [computeEduDisplay(edu), edu.ville].filter(Boolean).join(" · ");
        const btns = document.createElement("div");
        btns.className = "widget-actions";
        const edit = document.createElement("button");
        edit.type = "button"; edit.className = "btn btn--ghost"; edit.textContent = "Modifier";
        const del = document.createElement("button");
        del.type = "button"; del.className = "btn btn--danger"; del.textContent = "Supprimer";
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
          state.data.formations = state.data.formations.filter(e => e.id !== edu.id);
          saveToStorage(state); renderCV(); renderList();
        });
        btns.appendChild(edit); btns.appendChild(del);
        box.appendChild(t); box.appendChild(meta); box.appendChild(btns);
        list.appendChild(box);
      });
    };

    renderList();

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const add = document.createElement("button");
    add.type = "button"; add.className = "btn btn--success"; add.textContent = "+ Ajouter une formation";
    const next = document.createElement("button");
    next.type = "button"; next.className = "btn btn--primary"; next.textContent = "Continuer →";
    const close = document.createElement("button");
    close.type = "button"; close.className = "btn btn--ghost"; close.textContent = "Fermer";

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
    close.addEventListener("click", () => { setWidget(null); });

    actions.appendChild(add);
    actions.appendChild(next);
    actions.appendChild(close);
    wrap.appendChild(list);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos formations ci-dessus." });
  };

  /* ========================= Certification Widget ========================= */
  const showCertificationFormWidget = ({ cert, onSave, onCancel }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(cert ? "Modifier une certification" : "Ajouter une certification"));

    const fNom = document.createElement("input");
    fNom.className = "input";
    fNom.placeholder = "Ex : AWS Certified, TOEIC, Google Analytics…";
    fNom.value = cert?.nom || "";

    const fOrga = document.createElement("input");
    fOrga.className = "input";
    fOrga.placeholder = "Ex : Amazon, ETS, Google, PMI…";
    fOrga.value = cert?.organisme || "";

    const fAnnee = document.createElement("input");
    fAnnee.className = "input";
    fAnnee.type = "text";
    fAnnee.placeholder = "Année d'obtention (ex: 2023)";
    fAnnee.value = cert?.annee || "";
    fAnnee.maxLength = 4;
    fAnnee.pattern = "\\d{4}";

    const row = document.createElement("div");
    row.className = "row row--3";
    row.appendChild(field("Nom de la certification *", fNom));
    row.appendChild(field("Organisme *", fOrga));
    row.appendChild(field("Année d'obtention", fAnnee));

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button"; saveBtn.className = "btn btn--success"; saveBtn.textContent = "Enregistrer";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button"; cancelBtn.className = "btn btn--ghost"; cancelBtn.textContent = "Annuler";

    saveBtn.addEventListener("click", () => {
      const nom = normalizeSpace(fNom.value);
      const organisme = normalizeSpace(fOrga.value);
      if (!nom) return toastSystem("Veuillez saisir le nom de la certification.");
      if (!organisme) return toastSystem("Veuillez saisir l'organisme.");
      const annee = normalizeSpace(fAnnee.value);
      if (annee && !/^\d{4}$/.test(annee)) return toastSystem("Année invalide (format AAAA).");
      onSave?.({ nom, organisme, annee });
    });

    cancelBtn.addEventListener("click", () => onCancel?.());
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    wrap.appendChild(row);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Complétez le formulaire de certification." });
    setTimeout(() => fNom.focus(), 50);
  };

  const showCertificationManagerWidget = ({ onClose }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Certifications"));

    const list = document.createElement("div");
    list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(state.data.certifications || []).length) {
        const p = document.createElement("div");
        p.className = "muted";
        p.textContent = "Aucune certification. Cliquez sur Ajouter.";
        list.appendChild(p);
        return;
      }
      (state.data.certifications || []).forEach((cert) => {
        const box = document.createElement("div");
        box.style.cssText = "border:1px solid var(--border);border-radius:12px;padding:10px;margin-top:10px;background:#fff;";
        const t = document.createElement("div");
        t.style.fontWeight = "950";
        t.textContent = cert.nom;
        const meta = document.createElement("div");
        meta.className = "muted small";
        meta.textContent = [cert.organisme, cert.annee].filter(Boolean).join(" — ");
        const btns = document.createElement("div");
        btns.className = "widget-actions";
        const edit = document.createElement("button");
        edit.type = "button"; edit.className = "btn btn--ghost"; edit.textContent = "Modifier";
        const del = document.createElement("button");
        del.type = "button"; del.className = "btn btn--danger"; del.textContent = "Supprimer";
        edit.addEventListener("click", () => {
          showCertificationFormWidget({
            cert,
            onSave: (patch) => {
              Object.assign(cert, patch);
              saveToStorage(state); renderCV();
              showCertificationManagerWidget({ onClose });
            },
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
    };

    renderList();

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const add = document.createElement("button");
    add.type = "button"; add.className = "btn btn--success"; add.textContent = "+ Ajouter une certification";
    const next = document.createElement("button");
    next.type = "button"; next.className = "btn btn--primary"; next.textContent = "Continuer →";
    const close = document.createElement("button");
    close.type = "button"; close.className = "btn btn--ghost"; close.textContent = "Fermer";

    add.addEventListener("click", () => {
      showCertificationFormWidget({
        cert: null,
        onSave: (data) => {
          if (!state.data.certifications) state.data.certifications = [];
          state.data.certifications.push({ id: uid(), ...data });
          saveToStorage(state); renderCV();
          showCertificationManagerWidget({ onClose });
        },
        onCancel: () => showCertificationManagerWidget({ onClose }),
      });
    });
    next.addEventListener("click", () => onClose?.());
    close.addEventListener("click", () => { setWidget(null); });

    actions.appendChild(add);
    actions.appendChild(next);
    actions.appendChild(close);
    wrap.appendChild(list);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos certifications ci-dessus." });
  };

  /* ========================= Experience Form Widget ========================= */
  const showExperienceFormWidget = ({ exp, onSave, onCancel }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(exp ? "Modifier une expérience" : "Ajouter une expérience"));

    const fEntreprise = document.createElement("input");
    fEntreprise.className = "input";
    fEntreprise.placeholder = "Nom de l'entreprise";
    fEntreprise.value = exp?.entreprise || "";

    const fPoste = document.createElement("input");
    fPoste.className = "input";
    fPoste.placeholder = "Intitulé du poste";
    fPoste.value = exp?.poste || "";

    const start = document.createElement("input");
    start.className = "input";
    start.type = monthInputSupported() ? "month" : "text";
    start.placeholder = monthInputSupported() ? "" : "AAAA-MM (ex: 2020-01)";
    start.value = exp?.startYM || "";

    const end = document.createElement("input");
    end.className = "input";
    end.type = monthInputSupported() ? "month" : "text";
    end.placeholder = monthInputSupported() ? "" : "AAAA-MM (ex: 2023-03)";
    end.value = exp?.endYM || "";

    const currentWrap = document.createElement("label");
    currentWrap.style.cssText = "display:inline-flex;align-items:center;gap:8px;margin-top:8px;font-weight:900;color:var(--muted);font-size:13px;cursor:pointer;";
    const current = document.createElement("input");
    current.type = "checkbox";
    current.checked = !!exp?.isCurrent;
    const currentTxt = document.createElement("span");
    currentTxt.textContent = "En cours";
    currentWrap.appendChild(current);
    currentWrap.appendChild(currentTxt);

    const row1 = document.createElement("div");
    row1.className = "row row--2";
    row1.appendChild(field("Entreprise *", fEntreprise));
    row1.appendChild(field("Poste *", fPoste));

    const row2 = document.createElement("div");
    row2.className = "row row--2";
    row2.appendChild(field("Date de début (Mois/Année) *", start));
    row2.appendChild(field("Date de fin (Mois/Année)", end));

    current.addEventListener("change", () => {
      end.disabled = current.checked;
      if (current.checked) end.value = "";
    });
    end.disabled = current.checked;

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const saveBtn = document.createElement("button");
    saveBtn.type = "button"; saveBtn.className = "btn btn--success"; saveBtn.textContent = "Enregistrer";
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button"; cancelBtn.className = "btn btn--ghost"; cancelBtn.textContent = "Annuler";

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
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    wrap.appendChild(row1);
    wrap.appendChild(row2);
    wrap.appendChild(currentWrap);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Complétez le formulaire ci-dessus." });
    setTimeout(() => fEntreprise.focus(), 50);
  };

  const showMissionEditorWidget = ({ expId, onDone }) => {
    const exp = (state.data.experiences || []).find(e => e.id === expId);
    if (!exp) return;

    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Missions — " + (exp.poste || "")));

    const info = document.createElement("div");
    info.className = "muted small";
    info.textContent = "Astuce : verbes d'action + résultats chiffrés (ex : +25%).";
    wrap.appendChild(info);

    const list = document.createElement("div");
    list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      (exp.missions || []).forEach((m) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:8px;";
        const inp = document.createElement("input");
        inp.className = "input"; inp.value = m.text; inp.style.flex = "1";
        const save = document.createElement("button");
        save.type = "button"; save.className = "btn btn--ghost"; save.textContent = "✓";
        const del = document.createElement("button");
        del.type = "button"; del.className = "btn btn--danger"; del.textContent = "✕";
        save.addEventListener("click", () => { const v = normalizeSpace(inp.value); if (!v) return; m.text = v; saveToStorage(state); renderCV(); });
        del.addEventListener("click", () => { exp.missions = exp.missions.filter(x => x.id !== m.id); saveToStorage(state); renderCV(); renderList(); });
        row.appendChild(inp); row.appendChild(save); row.appendChild(del);
        list.appendChild(row);
      });
    };
    renderList();

    const addRow = document.createElement("div");
    addRow.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:12px;";
    const addInput = document.createElement("input");
    addInput.className = "input"; addInput.placeholder = "Ajouter une mission…"; addInput.style.flex = "1";
    const addBtn = document.createElement("button");
    addBtn.type = "button"; addBtn.className = "btn btn--primary"; addBtn.textContent = "+ Ajouter";

    addBtn.addEventListener("click", () => {
      const v = normalizeSpace(addInput.value);
      if (!v) return;
      exp.missions.push({ id: uid(), text: v });
      addInput.value = "";
      saveToStorage(state); renderCV(); renderList();
      addInput.focus();
    });
    addInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addBtn.click(); });
    addRow.appendChild(addInput); addRow.appendChild(addBtn);

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const done = document.createElement("button");
    done.type = "button"; done.className = "btn btn--success"; done.textContent = "Terminer";
    done.addEventListener("click", () => onDone?.());
    actions.appendChild(done);

    wrap.appendChild(list);
    wrap.appendChild(addRow);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos missions ci-dessus." });
    setTimeout(() => addInput.focus(), 50);
  };

  const showExperienceManagerWidget = ({ onClose }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Gestion des expériences"));
    const list = document.createElement("div");
    list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(state.data.experiences || []).length) {
        const p = document.createElement("div");
        p.className = "muted";
        p.textContent = "Aucune expérience.";
        list.appendChild(p); return;
      }
      (state.data.experiences || []).forEach((exp) => {
        const box = document.createElement("div");
        box.style.cssText = "border:1px solid var(--border);border-radius:12px;padding:10px;margin-top:10px;background:#fff;";
        const t = document.createElement("div"); t.style.fontWeight = "950";
        t.textContent = `${exp.poste} — ${exp.entreprise}`;
        const meta = document.createElement("div"); meta.className = "muted small";
        meta.textContent = computeExpDisplay(exp);
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
        mBtn.addEventListener("click", () => { showMissionEditorWidget({ expId: exp.id, onDone: () => showExperienceManagerWidget({ onClose }) }); });
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

    const actions = document.createElement("div");
    actions.className = "widget-actions";
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

  /* ========================= Pill / Tag widget ========================= */
  const showPillWidget = ({ title, current, suggestions, onSave, placeholder }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(title));

    let items = [...(current || [])];

    const pillRow = document.createElement("div");
    pillRow.className = "pillrow";
    pillRow.style.marginTop = "10px";

    const renderPills = () => {
      pillRow.innerHTML = "";
      items.forEach((item, i) => {
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = item;
        const del = document.createElement("button");
        del.type = "button"; del.textContent = "✕";
        del.setAttribute("aria-label", `Supprimer ${item}`);
        del.addEventListener("click", () => { items.splice(i, 1); renderPills(); });
        pill.appendChild(del);
        pillRow.appendChild(pill);
      });
    };
    renderPills();

    const suggWrap = document.createElement("div");
    suggWrap.className = "pillrow";
    suggWrap.style.cssText = "margin-top:8px;";
    suggestions.filter(s => !items.includes(s)).slice(0, 12).forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "btn btn--ghost"; b.textContent = "+ " + s;
      b.style.fontSize = "13px"; b.style.padding = "7px 10px";
      b.addEventListener("click", () => {
        if (!items.includes(s)) { items.push(s); renderPills(); }
      });
      suggWrap.appendChild(b);
    });

    const addRow = document.createElement("div");
    addRow.style.cssText = "display:flex;gap:8px;margin-top:10px;";
    const addInp = document.createElement("input");
    addInp.className = "input"; addInp.placeholder = placeholder || "Ajouter…"; addInp.style.flex = "1";
    const addBtn = document.createElement("button");
    addBtn.type = "button"; addBtn.className = "btn btn--primary"; addBtn.textContent = "+ Ajouter";

    addBtn.addEventListener("click", () => {
      splitCommaList(addInp.value).forEach(v => { if (!items.includes(v)) items.push(v); });
      addInp.value = "";
      renderPills();
    });
    addInp.addEventListener("keydown", (e) => { if (e.key === "Enter") addBtn.click(); });
    addRow.appendChild(addInp); addRow.appendChild(addBtn);

    const actions = document.createElement("div");
    actions.className = "widget-actions";
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

    const list = document.createElement("div");
    list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      if (!(state.data.languages || []).length) {
        const p = document.createElement("div"); p.className = "muted"; p.textContent = "Aucune langue.";
        list.appendChild(p); return;
      }
      (state.data.languages || []).forEach((l, i) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap;";
        const sel = document.createElement("select");
        sel.className = "select"; sel.style.flex = "1";
        LANGUAGE_SUGGESTIONS.forEach(lg => {
          const o = document.createElement("option");
          o.value = lg; o.textContent = lg;
          if (lg === l.langue) o.selected = true;
          sel.appendChild(o);
        });
        const lvl = document.createElement("select");
        lvl.className = "select"; lvl.style.flex = "1";
        LANGUAGE_LEVELS.forEach(lv => {
          const o = document.createElement("option");
          o.value = lv; o.textContent = lv;
          if (lv === l.niveau) o.selected = true;
          lvl.appendChild(o);
        });
        sel.addEventListener("change", () => { l.langue = sel.value; saveToStorage(state); renderCV(); });
        lvl.addEventListener("change", () => { l.niveau = lvl.value; saveToStorage(state); renderCV(); });
        const del = document.createElement("button");
        del.type = "button"; del.className = "btn btn--danger"; del.textContent = "✕";
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
    const addBtn = document.createElement("button");
    addBtn.type = "button"; addBtn.className = "btn btn--success"; addBtn.textContent = "+ Ajouter";
    addBtn.addEventListener("click", () => {
      const langue = selL.value; const niveau = selLv.value;
      if (!(state.data.languages || []).some(l => l.langue === langue)) {
        if (!state.data.languages) state.data.languages = [];
        state.data.languages.push({ id: uid(), langue, niveau });
        saveToStorage(state); renderCV(); renderList();
      }
    });
    addRow.appendChild(selL); addRow.appendChild(selLv); addRow.appendChild(addBtn);

    const actions = document.createElement("div");
    actions.className = "widget-actions";
    const done = document.createElement("button");
    done.type = "button"; done.className = "btn btn--primary"; done.textContent = "Terminer →";
    done.addEventListener("click", () => onClose?.());
    actions.appendChild(done);

    wrap.appendChild(list);
    wrap.appendChild(addRow);
    wrap.appendChild(actions);
    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos langues ci-dessus." });
  };

  /* ========================= Smart Parsing (FIXED) ========================= */
  /**
   * PROBLÈME : Tout allait dans le champ "Profil"
   * SOLUTION : Détection intelligente des sections par mots-clés
   * Sections détectées : Expériences, Formations, Compétences, Langues, Certifications, Profil
   */
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

  const parseYearMonth = (str) => {
    // Cherche AAAA-MM ou AAAA dans une chaîne
    const m = str.match(/\b(20\d{2}|19\d{2})\b/);
    if (!m) return "";
    const year = m[1];
    const monthNames = { "jan": "01","fév": "02","mars": "03","avr": "04","mai": "05","juin": "06","juil": "07","août": "08","sep": "09","oct": "10","nov": "11","déc": "12", "jan": "01","feb": "02","mar": "03","apr": "04","may": "05","jun": "06","jul": "07","aug": "08","sep": "09","oct": "10","nov": "11","dec": "12" };
    const mMatch = str.toLowerCase().match(/\b(jan|fév|mars|avr|mai|juin|juil|août|sep|oct|nov|déc|feb|mar|apr|may|jun|jul|aug)\b/i);
    if (mMatch) {
      const monthNum = monthNames[mMatch[1].toLowerCase().slice(0, 3)] || "01";
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

    // Email & téléphone
    const emailMatch = raw.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/i);
    if (emailMatch) out.identity.email = emailMatch[0];
    const phoneMatch = raw.match(/(\+?\d[\d\s().\-]{7,}\d)/);
    if (phoneMatch) out.identity.telephone = normalizeSpace(phoneMatch[0]);

    const lines = raw.split("\n").map(l => l.trim());

    // Détection du nom (première ligne non-vide courte)
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

    // Titre professionnel (ligne ~3-8, courte, contient souvent @ ou |)
    for (const l of lines.slice(1, 8)) {
      if (l.length >= 5 && l.length <= 80 && !detectSection(l) && !/\bbonjour\b/i.test(l)) {
        if (/développeur|engineer|manager|directeur|consultant|analyst|designer|chef|respon|commercial|comptable/i.test(l)) {
          out.identity.titre = l;
          break;
        }
      }
    }

    // Parcours en sections
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

    // ── Profil ──
    if (sectionLines.profil?.length) {
      out.profile.summary = sectionLines.profil.slice(0, 8).join(" ");
    } else {
      // Cherche le premier paragraphe > 80 chars
      const firstBig = raw.split(/\n{2,}/).find(s => s.trim().length > 80);
      if (firstBig) out.profile.summary = firstBig.trim().slice(0, 800);
    }

    // ── Expériences ──
    if (sectionLines.experience?.length) {
      const expLines = sectionLines.experience;
      let i = 0;
      while (i < expLines.length) {
        const L = expLines[i];
        if (!L || L.length < 2) { i++; continue; }
        // Pattern: ligne titre poste, ligne suivante entreprise, puis dates
        const hasDate = expLines.slice(i, i + 6).some(x => /\b(19|20)\d{2}\b/.test(x));
        if (hasDate) {
          const poste = L;
          const entreprise = expLines[i + 1] && expLines[i + 1].length <= 80 && !/\b(19|20)\d{2}\b/.test(expLines[i + 1]) ? expLines[i + 1] : "";
          // Cherche dates
          const dateStr = expLines.slice(i, i + 5).find(x => /\b(19|20)\d{2}\b/.test(x)) || "";
          const years = dateStr.match(/\b(19|20)\d{2}\b/g) || [];
          const startYM = years.length ? parseYearMonth(dateStr.split(/[-–—à]/)[0] || "") : "";
          const endYM = years.length > 1 ? parseYearMonth(dateStr.split(/[-–—à]/)[1] || "") : "";
          const isCurrent = /\b(en cours|présent|current|aujourd|aujourd'hui|maintenant)\b/i.test(dateStr);

          // Missions : lignes suivantes jusqu'à prochain "bloc"
          const missions = [];
          let j = entreprise ? i + 2 : i + 1;
          while (j < expLines.length && j < i + 15) {
            const ml = expLines[j];
            if (ml && ml.length > 10 && !detectSection(ml) && !/\b(19|20)\d{2}\b/.test(ml) && !/^[-•·▪▸→]/.test(ml) === false) {
              missions.push({ id: uid(), text: ml.replace(/^[-•·▪▸→]\s*/, "") });
            } else if (ml && /^[-•·▪▸→]/.test(ml)) {
              missions.push({ id: uid(), text: ml.replace(/^[-•·▪▸→]\s*/, "") });
            }
            j++;
            if (missions.length >= 8) break;
          }

          out.experiences.push({ id: uid(), poste: poste.slice(0, 80), entreprise: entreprise.slice(0, 80), startYM, endYM, isCurrent, missions });
          i = entreprise ? i + 2 : i + 1;
          if (out.experiences.length >= 8) break;
        } else {
          i++;
        }
      }
    }

    // Fallback expériences si section non détectée
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

    // ── Formations ──
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

    // ── Certifications ──
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

    // ── Compétences ──
    if (sectionLines.competences?.length) {
      const skills = sectionLines.competences.flatMap(l =>
        l.split(/[,;|•·▪▸→]/).map(s => s.trim()).filter(s => s.length >= 2 && s.length <= 40)
      );
      out.skills.hard = [...new Set(skills)].slice(0, 20);
    }

    // ── Langues ──
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

  /* ========================= Apply Import (FIXED) ========================= */
  const applyImport = () => {
    const draft = state.ui.importDraft;
    if (!draft) return;

    const s = deepClone(state);

    // Identité : ne pas écraser si déjà renseigné
    if (draft.identity) {
      Object.keys(draft.identity).forEach(k => {
        if (!s.data.identity[k] && draft.identity[k]) s.data.identity[k] = draft.identity[k];
      });
    }

    // Profil
    if (draft.profile?.summary && !s.data.profile.summary) {
      s.data.profile.summary = draft.profile.summary;
    }

    // Expériences : ajouter seulement les nouvelles (par poste+entreprise)
    if (draft.experiences?.length) {
      const existing = s.data.experiences.map(e => (e.poste + e.entreprise).toLowerCase());
      draft.experiences.forEach(e => {
        if (!existing.includes((e.poste + e.entreprise).toLowerCase())) {
          s.data.experiences.push(e);
        }
      });
    }

    // Formations : ajouter nouvelles
    if (draft.formations?.length) {
      if (!s.data.formations) s.data.formations = [];
      const existing = s.data.formations.map(f => (f.diplome + f.etablissement).toLowerCase());
      draft.formations.forEach(f => {
        if (!existing.includes((f.diplome + f.etablissement).toLowerCase())) {
          s.data.formations.push(f);
        }
      });
    }

    // Certifications
    if (draft.certifications?.length) {
      if (!s.data.certifications) s.data.certifications = [];
      const existing = s.data.certifications.map(c => c.nom.toLowerCase());
      draft.certifications.forEach(c => {
        if (!existing.includes(c.nom.toLowerCase())) {
          s.data.certifications.push(c);
        }
      });
    }

    // Compétences
    if (draft.skills?.hard?.length) {
      const merged = [...new Set([...s.data.skills.hard, ...draft.skills.hard])];
      s.data.skills.hard = merged.slice(0, 20);
    }

    // Langues
    if (draft.languages?.length) {
      if (!s.data.languages) s.data.languages = [];
      const existing = s.data.languages.map(l => l.langue.toLowerCase());
      draft.languages.forEach(l => {
        if (!existing.includes(l.langue.toLowerCase())) s.data.languages.push(l);
      });
    }

    // Activer export si données suffisantes
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
    { key: "prenom", text: "Quel est votre prénom ?", type: "text", validate: vRequired("Prénom requis.") },
    { key: "nom", text: "Quel est votre nom de famille ?", type: "text", validate: vRequired("Nom requis.") },
    { key: "email", text: "Quelle est votre adresse email professionnelle ?", type: "email", validate: vEmail("Email invalide (format nom@domaine.com).") },
    { key: "telephone", text: "Quel est votre numéro de téléphone ? (avec indicatif, ex : +33 6 12 34 56 78)", type: "tel", validate: vPhone("Téléphone invalide (min. 8 chiffres).") },
    { key: "ville", text: "Dans quelle ville habitez-vous ?", type: "text", validate: vRequired("Ville requise.") },
    { key: "titre", text: "Quel est votre titre professionnel actuel ou souhaité ? (ex : Développeur Full-Stack, Chef de projet…)", type: "text", validate: vRequired("Titre requis.") },
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
      const msg = bot("👋 Bonjour ! Je suis Troptop CV, votre assistant de création de CV optimisé ATS.\n\nJe vais vous guider étape par étape pour créer un CV professionnel. Commençons !", { isQuestion: true });
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
      bot("Rédigez votre Profil professionnel (3–6 lignes) : qui vous êtes, votre valeur ajoutée, votre objectif.", { isQuestion: true });
      rebuildChatDOM();
      showTextAreaWidget({
        title: "Profil professionnel",
        placeholder: "Ex : Développeur Full-Stack avec 5 ans d'expérience, spécialisé en React et Node.js…",
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
        : "Maintenant, parlons de vos expériences professionnelles. Avez-vous des expériences à ajouter ?",
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
        : "Maintenant, renseignez vos formations et diplômes.",
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
        : "Avez-vous des certifications professionnelles (AWS, TOEIC, PMI…) ?",
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
      bot("Quelles sont vos compétences techniques ? (choisissez dans la liste ou saisissez les vôtres)", { isQuestion: true });
      rebuildChatDOM();
      showPillWidget({
        title: "Compétences techniques",
        current: state.data.skills.hard,
        suggestions: hardSkillSuggestions(jobTitle),
        placeholder: "Ajouter une compétence (séparées par des virgules)…",
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

          // Centres d'intérêt inline
          bot("Vos centres d'intérêt / hobbies ? (optionnel)", { isQuestion: true });
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
      bot("Quelles langues parlez-vous et à quel niveau ?", { isQuestion: true });
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
      bot("🎉 Votre CV est prêt ! Vérifiez l'aperçu à droite.\n\nVous pouvez télécharger en PDF ou DOCX, modifier n'importe quelle section, ou changer de modèle.", { isQuestion: false });
      rebuildChatDOM();

      downloadPdfBtn.disabled = false;
      downloadDocxBtn.disabled = false;
      printBtn.disabled = false;
      templateSwitcher.hidden = false;

      showChoices({
        title: "Que souhaitez-vous faire ?",
        choices: [
          { label: "✏️ Modifier mes expériences", variant: "btn btn--ghost", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.EXP_START; setState(s2);
          }},
          { label: "🎓 Modifier formations", variant: "btn btn--ghost", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.FORMATIONS; setState(s2);
          }},
          { label: "🏆 Modifier certifications", variant: "btn btn--ghost", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.CERTIFICATIONS; setState(s2);
          }},
          { label: "✅ Terminer", variant: "btn btn--primary", onClick: () => {
            const s2 = deepClone(state); s2.flow.step = Steps.FINISHED; setState(s2);
          }},
        ],
      });
      renderATS();
      return;
    }

    if (s === Steps.FINISHED) {
      bot("✅ CV finalisé ! Téléchargez votre CV en PDF ou DOCX via les boutons ci-dessous.", { isQuestion: false });
      rebuildChatDOM();

      downloadPdfBtn.disabled = false;
      downloadDocxBtn.disabled = false;
      printBtn.disabled = false;

      showChoices({
        title: "Actions",
        choices: [
          { label: "🔄 Recommencer depuis l'aperçu", variant: "btn btn--ghost", onClick: () => {
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
      if (error) { inputHint.textContent = error; return; }
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
    if (!confirm("Réinitialiser et effacer toutes vos données ?")) return;
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
    system("✅ Sauvegarde reprise !");
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
      // Proposer de reprendre
      state = initialState();
      const msg = bot("Bienvenue sur Troptop CV !", { isQuestion: true });
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
