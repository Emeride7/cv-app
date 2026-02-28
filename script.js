(() => {
  "use strict";

  /* =========================================================
   * Troptop CV — Refonte complète (state + widgets + export)
   * ========================================================= */

  /* =========================
   * Utils
   * ========================= */
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
    String(s || "")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40) || "X";

  const debounce = (fn, wait = 250) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const normalizeSpace = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

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
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const monthDiff = (startYM, endYM) => {
    const a = parseMonthValue(startYM);
    const b = parseMonthValue(endYM);
    if (!a || !b) return null;
    const start = a.y * 12 + (a.m - 1);
    const end = b.y * 12 + (b.m - 1);
    const diff = end - start;
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

  const downloadBlob = (blob, filename) => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const vRequired = (msg) => (v) => (String(v || "").trim() ? "" : msg);

  const vEmail = (msg) => (v) => {
    const s = String(v || "").trim();
    if (!s) return msg;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
    return ok ? "" : msg;
  };

  const vPhone = (msg) => (v) => {
    const s = String(v || "").trim();
    if (!s) return msg;
    const cleaned = s.replace(/[^\d+]/g, "");
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return msg;
    if (!/^[+\d]+$/.test(cleaned)) return msg;
    return "";
  };

  const splitCommaList = (text) =>
    String(text || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 80);

  /* =========================
   * DOM
   * ========================= */
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

  /* =========================
   * Storage (autosave)
   * ========================= */
  const STORAGE_KEY = "troptopcv:v2";

  const saveToStorage = debounce((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore quota errors
    }
  }, 300);

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 2) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const clearStorage = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  /* =========================
   * State (single source of truth)
   * ========================= */
  const Steps = Object.freeze({
    WELCOME: "welcome",
    IDENTITY: "identity",
    PROFILE: "profile",
    EXP_START: "exp_start",
    EXP_FORM: "exp_form",
    EXP_MISSIONS: "exp_missions",
    SKILLS: "skills",
    SOFT: "soft",
    LANGUAGES: "languages",
    REVIEW: "review",
    FINISHED: "finished",
  });

  const initialState = () => ({
    version: 2,
    flow: {
      step: Steps.WELCOME,
      identityIndex: 0,
      currentExpId: null,
    },
    ui: {
      selectedTemplate: "t1",
      atsMode: true,
      chat: [],
      lockedInput: false,
      lockReason: "",
      importDraft: null,
    },
    data: {
      identity: {
        prenom: "",
        nom: "",
        email: "",
        telephone: "",
        ville: "",
        titre: "",
      },
      profile: {
        summary: "",
      },
      experiences: [], // {id, entreprise, poste, startYM, endYM, isCurrent, missions:[{id,text}]}
      skills: {
        hard: [],
        soft: [],
        passions: [],
      },
      languages: [], // {id, langue, niveau}
    },
  });

  let state = initialState();
  let history = []; // snapshots for "Retour"

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

  /* =========================
   * Chat UI helpers
   * ========================= */
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
  };

  const scrollQuestionToTop = (msgId) => {
    const el = chatLog.querySelector(`[data-msgid="${msgId}"]`);
    if (!el) return;
    const top = el.offsetTop;
    chatLog.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
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
    if (!node) {
      widgetArea.hidden = true;
      setInputLock(false, "");
      return;
    }
    widgetArea.hidden = false;
    widgetArea.appendChild(node);
    setInputLock(lockTextInput, lockReason);
  };

  const system = (text) => addChat("system", text, { isQuestion: false });
  const bot = (text, { isQuestion = false } = {}) => addChat("bot", text, { isQuestion });
  const user = (text) => addChat("user", text, { isQuestion: false });

  /* =========================
   * CV Render (ATS-friendly)
   * ========================= */
  const computeExpDisplay = (exp) => {
    const start = exp.startYM ? formatMonthFR(exp.startYM) : "";
    const end = exp.isCurrent ? "En cours" : (exp.endYM ? formatMonthFR(exp.endYM) : "");
    const endForDur = exp.isCurrent ? nowMonth() : exp.endYM;
    const md = exp.startYM && endForDur ? monthDiff(exp.startYM, endForDur) : null;
    const dur = md != null ? formatDurationFR(md + 1) : ""; // +1 pour inclure le mois courant
    const range = [start, end].filter(Boolean).join(" – ");
    const suffix = dur ? ` (${dur})` : "";
    return (range || "") + suffix;
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

    const expHTML = a.experiences.map((exp) => {
      const missions = (exp.missions || []).map((m) => `<li>${escapeHTML(m.text)}</li>`).join("");
      const dates = computeExpDisplay(exp);

      return `
        <div class="exp-item avoid-pagebreak">
          <div class="exp-top">
            <div class="exp-role">${escapeHTML(exp.poste || "")}</div>
            <div class="exp-company">— ${escapeHTML(exp.entreprise || "")}</div>
          </div>
          ${dates ? `<div class="exp-dates">${escapeHTML(dates)}</div>` : ""}
          ${missions ? `<ul class="exp-missions">${missions}</ul>` : `<div class="muted">Aucune mission.</div>`}
        </div>
      `;
    }).join("");

    const hardSkills = (a.skills.hard || []).map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const softSkills = (a.skills.soft || []).map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");
    const passions = (a.skills.passions || []).map((s) => `<span class="chip">${escapeHTML(s)}</span>`).join("");

    const langs = (a.languages || []).map((l) => `<span class="chip">${escapeHTML(l.langue)} — ${escapeHTML(l.niveau)}</span>`).join("");

    const atsClass = state.ui.atsMode ? "is-ats" : "";

    // ATS mode: forcer un modèle “simple”
    const tpl = state.ui.atsMode ? "t2" : state.ui.selectedTemplate;

    cvPreview.innerHTML = `
      <div class="cv-paper" id="cv-paper">
        <div class="cv-root cv--${tpl} ${atsClass}" id="cv-root" aria-label="CV">
          <div class="cv-headline avoid-pagebreak">
            <h1 class="cv-name">${escapeHTML(fullName)}</h1>
            ${title ? `<div class="cv-title">${escapeHTML(title)}</div>` : ""}
            ${contacts.length ? `<div class="cv-contact">${contacts.map(c => `<span>${escapeHTML(c)}</span>`).join("")}</div>` : ""}
          </div>

          ${summary ? `
            <section class="cv-section avoid-pagebreak">
              <h2 class="cv-section-title">Profil professionnel</h2>
              <div class="cv-summary">${escapeHTML(summary)}</div>
            </section>
          ` : ""}

          <div class="two-col">
            <div>
              <section class="cv-section">
                <h2 class="cv-section-title">Expériences</h2>
                ${expHTML || `<div class="muted">Aucune expérience renseignée.</div>`}
              </section>
            </div>

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
                <h2 class="cv-section-title">Centres d’intérêt</h2>
                ${passions ? `<div class="chips">${passions}</div>` : `<div class="muted">—</div>`}
              </section>

              <section class="cv-section avoid-pagebreak">
                <h2 class="cv-section-title">Langues</h2>
                ${langs ? `<div class="chips">${langs}</div>` : `<div class="muted">—</div>`}
              </section>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  /* =========================
   * ATS score (heuristique)
   * ========================= */
  const getATS = () => {
    const a = state.data;
    const id = a.identity;

    const recos = [];
    let score = 0;

    const hasName = normalizeSpace(`${id.prenom} ${id.nom}`).length >= 3;
    const hasEmail = !!id.email && !vEmail("bad")(id.email);
    const hasPhone = !!id.telephone && !vPhone("bad")(id.telephone);
    const hasTitle = normalizeSpace(id.titre).length >= 2;

    const expCount = a.experiences.length;
    const missionCount = a.experiences.reduce((n, e) => n + (e.missions?.length || 0), 0);

    const hardCount = a.skills.hard.length;
    const langCount = a.languages.length;
    const summaryLen = normalizeSpace(a.profile.summary).length;

    // Baselines
    if (hasName) score += 8; else recos.push("Ajoutez votre prénom et nom (obligatoire).");
    if (hasEmail) score += 8; else recos.push("Ajoutez un email valide (format nom@domaine.com).");
    if (hasPhone) score += 5; else recos.push("Ajoutez un téléphone (avec indicatif si possible).");
    if (hasTitle) score += 6; else recos.push("Ajoutez un titre métier clair (ex : Développeur Full‑Stack).");

    if (summaryLen >= 260) score += 10;
    else if (summaryLen >= 120) score += 7;
    else if (summaryLen > 0) score += 4;
    else recos.push("Ajoutez un “Profil professionnel” de 3–6 lignes (valeur + objectif + compétences).");

    if (expCount >= 2) score += 12;
    else if (expCount === 1) score += 7;
    else recos.push("Ajoutez au moins une expérience professionnelle.");

    if (missionCount >= 8) score += 12;
    else if (missionCount >= 3) score += 8;
    else if (missionCount > 0) score += 4;
    else recos.push("Ajoutez des missions (idéal : 3–6 par expérience).");

    // Quantification: cherche des chiffres dans les missions
    const missionsText = a.experiences.flatMap(e => (e.missions || []).map(m => m.text)).join(" ");
    const hasNumbers = /\b\d+([.,]\d+)?\b/.test(missionsText);
    if (hasNumbers) score += 8;
    else recos.push("Quantifiez vos résultats (ex : +25%, 30 clients, 2M€…).");

    if (hardCount >= 10) score += 10;
    else if (hardCount >= 5) score += 7;
    else if (hardCount > 0) score += 4;
    else recos.push("Ajoutez des compétences techniques pertinentes (5–12).");

    if (langCount >= 2) score += 7;
    else if (langCount === 1) score += 4;
    else recos.push("Ajoutez au moins une langue + niveau.");

    // Format ATS: éviter colonnes => en mode ATS on bonus
    if (state.ui.atsMode) score += 12;
    else recos.push("Activez le Mode ATS pour une mise en page plus compatible (une colonne).");

    // Cap
    score = Math.max(0, Math.min(100, score));

    // Reco métier (simple)
    const job = (id.titre || "").toLowerCase();
    if (job.includes("dévelop") || job.includes("dev") || job.includes("software")) {
      recos.push("Tech : ajoutez des mots-clés stack (ex : React, Node, SQL, CI/CD) alignés au poste visé.");
    } else if (job.includes("marketing")) {
      recos.push("Marketing : ajoutez des KPI (CPC, CPA, ROAS, CTR) et outils (GA4, Ads, CRM…).");
    } else if (job.includes("finance") || job.includes("compta")) {
      recos.push("Finance : ajoutez outils (Excel avancé, ERP), normes (IFRS), et réalisations chiffrées.");
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

  /* =========================
   * Template switcher
   * ========================= */
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
        rebuildChatDOM();
        return;
      }
      templateSwitcher.querySelectorAll("button[data-template]").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      setTemplate(btn.dataset.template);
    });
  };

  /* =========================
   * PDF export (anti-PDF blanc)
   * ========================= */
  const downloadPDF = async () => {
    const paper = document.getElementById("cv-paper");
    if (!paper || !paper.textContent || paper.textContent.trim().length < 20) {
      system("Le CV n’est pas prêt pour l’export (contenu insuffisant).");
      rebuildChatDOM();
      return;
    }

    // Fonts ready (réduit le risque de rendu blanc/partiel)
    try { await document.fonts?.ready; } catch {}

    const prenom = safeFilePart(state.data.identity.prenom || "Prenom");
    const nom = safeFilePart(state.data.identity.nom || "Nom");
    const filename = `CV_${prenom}_${nom}.pdf`;

    // Offscreen sandbox attaché au DOM (pas display:none)
    const sandbox = document.createElement("div");
    sandbox.style.position = "fixed";
    sandbox.style.left = "-99999px";
    sandbox.style.top = "0";
    sandbox.style.width = "210mm";
    sandbox.style.background = "#fff";
    sandbox.style.overflow = "visible";
    sandbox.style.zIndex = "999999";
    sandbox.style.pointerEvents = "none";
    document.body.appendChild(sandbox);

    const clone = paper.cloneNode(true);
    // sécurité : pas de contenteditable, pas d’éléments interactifs
    clone.querySelectorAll("[contenteditable]").forEach(el => el.removeAttribute("contenteditable"));
    sandbox.appendChild(clone);

    const opt = {
      margin: [10, 10, 10, 10], // mm
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: sandbox.scrollWidth || 800,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    try {
      await html2pdf().set(opt).from(clone).save();
    } catch (e) {
      console.error(e);
      system("Erreur lors de l’export PDF. Ouvrez la console pour le détail.");
    } finally {
      sandbox.remove();
      rebuildChatDOM();
    }
  };

  const printCV = () => window.print();

  /* =========================
   * DOCX export (docx UMD)
   * ========================= */
  const exportDOCX = async () => {
    if (!window.docx) {
      system("La librairie DOCX n’est pas chargée. Vérifiez votre connexion (CDN).");
      rebuildChatDOM();
      return;
    }

    const a = state.data;
    const id = a.identity;

    const fullName = normalizeSpace(`${id.prenom} ${id.nom}`) || "Votre Nom";
    const title = normalizeSpace(id.titre);
    const summary = normalizeSpace(a.profile.summary);

    const prenom = safeFilePart(id.prenom || "Prenom");
    const nom = safeFilePart(id.nom || "Nom");
    const filename = `CV_${prenom}_${nom}.docx`;

    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      AlignmentType,
    } = window.docx;

    const children = [];

    // Header
    children.push(new Paragraph({
      text: fullName,
      heading: HeadingLevel.TITLE,
    }));

    if (title) {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: true })],
      }));
    }

    const contacts = [
      id.email ? `Email : ${id.email}` : "",
      id.telephone ? `Tél : ${id.telephone}` : "",
      id.ville ? `Ville : ${id.ville}` : "",
    ].filter(Boolean);

    if (contacts.length) {
      children.push(new Paragraph({
        children: [new TextRun({ text: contacts.join(" | "), color: "555555" })],
      }));
    }

    children.push(new Paragraph({ text: "" }));

    // Summary
    if (summary) {
      children.push(new Paragraph({ text: "Profil professionnel", heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: summary }));
      children.push(new Paragraph({ text: "" }));
    }

    // Experiences
    children.push(new Paragraph({ text: "Expériences", heading: HeadingLevel.HEADING_2 }));
    if (!a.experiences.length) {
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

        const missions = exp.missions || [];
        if (!missions.length) {
          children.push(new Paragraph({ text: "Aucune mission." }));
        } else {
          for (const m of missions) {
            children.push(new Paragraph({
              text: normalizeSpace(m.text),
              bullet: { level: 0 },
            }));
          }
        }
        children.push(new Paragraph({ text: "" }));
      }
    }

    // Skills
    children.push(new Paragraph({ text: "Compétences techniques", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: a.skills.hard.length ? a.skills.hard.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "Soft skills", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: a.skills.soft.length ? a.skills.soft.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "Centres d’intérêt", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: a.skills.passions.length ? a.skills.passions.join(", ") : "—" }));
    children.push(new Paragraph({ text: "" }));

    // Languages
    children.push(new Paragraph({ text: "Langues", heading: HeadingLevel.HEADING_2 }));
    if (!a.languages.length) {
      children.push(new Paragraph({ text: "—" }));
    } else {
      for (const l of a.languages) {
        children.push(new Paragraph({
          text: `${l.langue} — ${l.niveau}`,
          bullet: { level: 0 },
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, filename);
    } catch (e) {
      console.error(e);
      system("Erreur export DOCX. Vérifiez la console.");
      rebuildChatDOM();
    }
  };

  /* =========================
   * Suggestions dynamiques
   * ========================= */
  const hardSkillSuggestions = (jobTitle) => {
    const t = (jobTitle || "").toLowerCase();

    const IT = [
      "JavaScript", "TypeScript", "HTML", "CSS", "React", "Node.js", "Express",
      "SQL", "PostgreSQL", "MongoDB", "Docker", "Git", "CI/CD", "REST API", "Tests",
    ];
    const MKT = [
      "SEO", "SEA", "Google Ads", "Meta Ads", "GA4", "GTM", "CRM", "Emailing",
      "Content marketing", "Copywriting", "A/B testing", "Funnel", "KPI",
    ];
    const FIN = [
      "Excel avancé", "Contrôle de gestion", "Reporting", "Budget", "Forecast",
      "Analyse financière", "ERP", "Power BI", "Tableaux de bord", "IFRS",
    ];

    if (t.includes("dévelop") || t.includes("dev") || t.includes("software") || t.includes("data") || t.includes("ingénieur")) return IT;
    if (t.includes("marketing") || t.includes("growth") || t.includes("communication")) return MKT;
    if (t.includes("finance") || t.includes("compta") || t.includes("contrôl")) return FIN;

    return [...new Set([...IT.slice(0, 6), ...MKT.slice(0, 6), ...FIN.slice(0, 6)])];
  };

  const SOFT_SUGGESTIONS = [
    "Communication", "Leadership", "Esprit d’équipe", "Autonomie", "Rigueur",
    "Organisation", "Curiosité", "Résolution de problèmes", "Adaptabilité", "Proactivité",
    "Gestion du temps", "Esprit d’analyse", "Sens du service", "Négociation", "Créativité",
  ];

  const PASSION_SUGGESTIONS = [
    "Sport", "Lecture", "Musique", "Voyages", "Photographie",
    "Bénévolat", "Tech / veille", "Jeux d’échecs", "Cuisine", "Randonnée",
  ];

  const LANGUAGE_SUGGESTIONS = [
    "Français", "Anglais", "Espagnol", "Allemand", "Italien", "Portugais",
    "Arabe", "Chinois", "Japonais", "Russe", "Néerlandais", "Turc", "Autre"
  ];

  const LANGUAGE_LEVELS = [
    "Maternelle",
    "Débutant",
    "Intermédiaire",
    "Avancé",
    "Courant",
    "Bilingue",
    "Technique",
  ];

  /* =========================
   * Widgets (UI réutilisables)
   * ========================= */
  const widgetTitle = (t) => {
    const div = document.createElement("div");
    div.className = "widget-title";
    div.textContent = t;
    return div;
  };

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

    setWidget(wrap, { lockTextInput: true, lockReason: "Saisissez votre texte dans la zone ci-dessus." });
    setTimeout(() => ta.focus(), 50);
  };

  const showExperienceFormWidget = ({ exp, onSave, onCancel }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(exp ? "Modifier une expérience" : "Ajouter une expérience"));

    const fEntreprise = document.createElement("input");
    fEntreprise.className = "input";
    fEntreprise.placeholder = "Nom de l’entreprise";
    fEntreprise.value = exp?.entreprise || "";

    const fPoste = document.createElement("input");
    fPoste.className = "input";
    fPoste.placeholder = "Intitulé du poste";
    fPoste.value = exp?.poste || "";

    const start = document.createElement("input");
    start.className = "input";
    start.type = monthInputSupported() ? "month" : "text";
    start.placeholder = monthInputSupported() ? "" : "Format AAAA-MM (ex: 2020-01)";
    start.value = exp?.startYM || "";

    const end = document.createElement("input");
    end.className = "input";
    end.type = monthInputSupported() ? "month" : "text";
    end.placeholder = monthInputSupported() ? "" : "Format AAAA-MM (ex: 2023-03)";
    end.value = exp?.endYM || "";

    const currentWrap = document.createElement("label");
    currentWrap.style.display = "inline-flex";
    currentWrap.style.alignItems = "center";
    currentWrap.style.gap = "8px";
    currentWrap.style.marginTop = "8px";
    currentWrap.style.fontWeight = "900";
    currentWrap.style.color = "var(--muted)";

    const current = document.createElement("input");
    current.type = "checkbox";
    current.checked = !!exp?.isCurrent;

    const currentTxt = document.createElement("span");
    currentTxt.textContent = "En cours";

    currentWrap.appendChild(current);
    currentWrap.appendChild(currentTxt);

    const row1 = document.createElement("div");
    row1.className = "row";
    row1.appendChild(field("Entreprise", fEntreprise));
    row1.appendChild(field("Poste", fPoste));

    const row2 = document.createElement("div");
    row2.className = "row row--2";
    row2.appendChild(field("Date de début (Mois/Année)", start));
    row2.appendChild(field("Date de fin (Mois/Année)", end));

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn--success";
    saveBtn.textContent = "Enregistrer";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn--ghost";
    cancelBtn.textContent = "Annuler";

    current.addEventListener("change", () => {
      end.disabled = current.checked;
      if (current.checked) end.value = "";
    });
    end.disabled = current.checked;

    saveBtn.addEventListener("click", () => {
      const entreprise = normalizeSpace(fEntreprise.value);
      const poste = normalizeSpace(fPoste.value);
      const startYM = normalizeSpace(start.value);
      const isCurrent = !!current.checked;
      const endYM = isCurrent ? "" : normalizeSpace(end.value);

      if (!entreprise) return toastSystem("Veuillez saisir le nom de l’entreprise.");
      if (!poste) return toastSystem("Veuillez saisir l’intitulé du poste.");
      if (!parseMonthValue(startYM)) return toastSystem("Date de début invalide (format AAAA-MM).");
      if (!isCurrent && !parseMonthValue(endYM)) return toastSystem("Date de fin invalide (format AAAA-MM) ou cochez “En cours”.");
      if (!isCurrent) {
        const d = monthDiff(startYM, endYM);
        if (d == null) return toastSystem("La date de fin doit être postérieure à la date de début.");
      }

      onSave?.({
        entreprise, poste, startYM,
        endYM: isCurrent ? "" : endYM,
        isCurrent,
      });
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

  const field = (labelText, inputEl) => {
    const w = document.createElement("div");
    w.className = "field";
    const l = document.createElement("label");
    l.textContent = labelText;
    w.appendChild(l);
    w.appendChild(inputEl);
    return w;
  };

  const toastSystem = (text) => {
    system(text);
    rebuildChatDOM();
    // on laisse le widget visible
  };

  const showMissionEditorWidget = ({ expId, onDone }) => {
    const exp = state.data.experiences.find(e => e.id === expId);
    if (!exp) return;

    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Missions (ajout / modification / suppression)"));

    const info = document.createElement("div");
    info.className = "muted small";
    info.textContent = "Astuce : ajoutez des verbes d’action + résultats chiffrés (ex : +25%).";
    wrap.appendChild(info);

    const list = document.createElement("div");
    list.style.marginTop = "10px";

    const renderList = () => {
      list.innerHTML = "";
      (exp.missions || []).forEach((m) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.gap = "8px";
        row.style.alignItems = "center";
        row.style.marginTop = "8px";

        const input = document.createElement("input");
        input.className = "input";
        input.value = m.text;
        input.style.flex = "1";

        const save = document.createElement("button");
        save.type = "button";
        save.className = "btn btn--ghost";
        save.textContent = "Mettre à jour";

        const del = document.createElement("button");
        del.type = "button";
        del.className = "btn btn--danger";
        del.textContent = "Supprimer";

        save.addEventListener("click", () => {
          const val = normalizeSpace(input.value);
          if (!val) return;
          m.text = val;
          saveToStorage(state);
          renderCV();
        });

        del.addEventListener("click", () => {
          exp.missions = exp.missions.filter(x => x.id !== m.id);
          saveToStorage(state);
          renderCV();
          renderList();
        });

        row.appendChild(input);
        row.appendChild(save);
        row.appendChild(del);
        list.appendChild(row);
      });
    };

    renderList();

    const addRow = document.createElement("div");
    addRow.style.display = "flex";
    addRow.style.gap = "8px";
    addRow.style.alignItems = "center";
    addRow.style.marginTop = "12px";

    const addInput = document.createElement("input");
    addInput.className = "input";
    addInput.placeholder = "Ajouter une mission…";
    addInput.style.flex = "1";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn--primary";
    addBtn.textContent = "Ajouter";

    addBtn.addEventListener("click", () => {
      const val = normalizeSpace(addInput.value);
      if (!val) return;
      exp.missions.push({ id: uid(), text: val });
      addInput.value = "";
      saveToStorage(state);
      renderCV();
      renderList();
      addInput.focus();
    });

    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const done = document.createElement("button");
    done.type = "button";
    done.className = "btn btn--success";
    done.textContent = "Terminer";

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
      if (!state.data.experiences.length) {
        const p = document.createElement("div");
        p.className = "muted";
        p.textContent = "Aucune expérience.";
        list.appendChild(p);
        return;
      }

      state.data.experiences.forEach((exp) => {
        const box = document.createElement("div");
        box.style.border = "1px solid var(--border)";
        box.style.borderRadius = "12px";
        box.style.padding = "10px";
        box.style.marginTop = "10px";
        box.style.background = "#fff";

        const title = document.createElement("div");
        title.style.fontWeight = "950";
        title.textContent = `${exp.poste} — ${exp.entreprise}`;

        const meta = document.createElement("div");
        meta.className = "muted small";
        meta.textContent = computeExpDisplay(exp) || "";

        const actions = document.createElement("div");
        actions.className = "widget-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "btn btn--ghost";
        edit.textContent = "Modifier";

        const missions = document.createElement("button");
        missions.type = "button";
        missions.className = "btn btn--primary";
        missions.textContent = "Missions";

        const del = document.createElement("button");
        del.type = "button";
        del.className = "btn btn--danger";
        del.textContent = "Supprimer";

        edit.addEventListener("click", () => {
          showExperienceFormWidget({
            exp,
            onSave: (patch) => {
              Object.assign(exp, patch);
              saveToStorage(state);
              renderCV();
              showExperienceManagerWidget({ onClose });
            },
            onCancel: () => showExperienceManagerWidget({ onClose }),
          });
        });

        missions.addEventListener("click", () => {
          showMissionEditorWidget({
            expId: exp.id,
            onDone: () => showExperienceManagerWidget({ onClose }),
          });
        });

        del.addEventListener("click", () => {
          if (!confirm("Supprimer cette expérience ?")) return;
          state.data.experiences = state.data.experiences.filter(e => e.id !== exp.id);
          saveToStorage(state);
          renderCV();
          renderList();
        });

        actions.appendChild(edit);
        actions.appendChild(missions);
        actions.appendChild(del);

        box.appendChild(title);
        box.appendChild(meta);
        box.appendChild(actions);

        list.appendChild(box);
      });
    };

    renderList();

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn btn--success";
    add.textContent = "Ajouter une expérience";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "btn btn--ghost";
    close.textContent = "Fermer";

    add.addEventListener("click", () => {
      showExperienceFormWidget({
        exp: null,
        onSave: (data) => {
          state.data.experiences.push({ id: uid(), ...data, missions: [] });
          saveToStorage(state);
          renderCV();
          showExperienceManagerWidget({ onClose });
        },
        onCancel: () => showExperienceManagerWidget({ onClose }),
      });
    });

    close.addEventListener("click", () => onClose?.());

    actions.appendChild(add);
    actions.appendChild(close);

    wrap.appendChild(list);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Gérez vos expériences ci-dessus." });
  };

  const showMultiSelectWidget = ({ title, suggestions, selected, allowOtherLabel = "Ajouter", onSave }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle(title));

    const hint = document.createElement("div");
    hint.className = "muted small";
    hint.textContent = "Cliquez pour sélectionner/désélectionner. Vous pouvez aussi ajouter un item personnalisé.";
    wrap.appendChild(hint);

    const pills = document.createElement("div");
    pills.className = "pillrow";
    pills.style.marginTop = "10px";

    const local = new Set(selected || []);

    const redraw = () => {
      pills.innerHTML = "";
      suggestions.forEach((s) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `btn btn--ghost ${local.has(s) ? "is-active" : ""}`;
        b.textContent = s;
        b.addEventListener("click", () => {
          if (local.has(s)) local.delete(s); else local.add(s);
          redraw();
        });
        pills.appendChild(b);
      });
    };

    redraw();

    const addRow = document.createElement("div");
    addRow.style.display = "flex";
    addRow.style.gap = "8px";
    addRow.style.marginTop = "12px";
    addRow.style.alignItems = "center";

    const addInput = document.createElement("input");
    addInput.className = "input";
    addInput.placeholder = "Autre…";
    addInput.style.flex = "1";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn--primary";
    addBtn.textContent = allowOtherLabel;

    addBtn.addEventListener("click", () => {
      const v = normalizeSpace(addInput.value);
      if (!v) return;
      local.add(v);
      addInput.value = "";
      redraw();
      addInput.focus();
    });

    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn btn--success";
    save.textContent = "Valider";

    save.addEventListener("click", () => onSave?.(Array.from(local)));

    actions.appendChild(save);

    wrap.appendChild(pills);
    wrap.appendChild(addRow);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Utilisez les choix ci-dessus." });
    setTimeout(() => addInput.focus(), 50);
  };

  const showLanguagesWidget = ({ onSave }) => {
    const wrap = document.createElement("div");
    wrap.appendChild(widgetTitle("Langues (tableau dynamique)"));

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.innerHTML = `
      <thead>
        <tr>
          <th style="text-align:left; padding:8px; border-bottom:1px solid var(--border); color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em;">Langue</th>
          <th style="text-align:left; padding:8px; border-bottom:1px solid var(--border); color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em;">Niveau</th>
          <th style="padding:8px; border-bottom:1px solid var(--border);"></th>
        </tr>
      </thead>
      <tbody id="lang-body"></tbody>
    `;

    const body = table.querySelector("#lang-body");

    const addRow = (prefill = {}) => {
      const tr = document.createElement("tr");

      const td1 = document.createElement("td");
      td1.style.padding = "8px";
      td1.style.borderBottom = "1px solid var(--border)";

      const td2 = document.createElement("td");
      td2.style.padding = "8px";
      td2.style.borderBottom = "1px solid var(--border)";

      const td3 = document.createElement("td");
      td3.style.padding = "8px";
      td3.style.borderBottom = "1px solid var(--border)";
      td3.style.textAlign = "right";

      const selLang = document.createElement("select");
      selLang.className = "select";
      selLang.innerHTML = LANGUAGE_SUGGESTIONS.map(l => `<option value="${escapeHTML(l)}">${escapeHTML(l)}</option>`).join("");
      selLang.value = prefill.langue && LANGUAGE_SUGGESTIONS.includes(prefill.langue) ? prefill.langue : (prefill.langue ? "Autre" : "Français");

      const other = document.createElement("input");
      other.className = "input";
      other.placeholder = "Saisir la langue…";
      other.value = prefill.langue && !LANGUAGE_SUGGESTIONS.includes(prefill.langue) ? prefill.langue : "";
      other.style.marginTop = "8px";
      other.hidden = selLang.value !== "Autre";

      selLang.addEventListener("change", () => {
        other.hidden = selLang.value !== "Autre";
        if (!other.hidden) other.focus();
      });

      const selLvl = document.createElement("select");
      selLvl.className = "select";
      selLvl.innerHTML = LANGUAGE_LEVELS.map(l => `<option value="${escapeHTML(l)}">${escapeHTML(l)}</option>`).join("");
      selLvl.value = prefill.niveau && LANGUAGE_LEVELS.includes(prefill.niveau) ? prefill.niveau : "Intermédiaire";

      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn--ghost";
      del.textContent = "Supprimer";
      del.addEventListener("click", () => tr.remove());

      td1.appendChild(selLang);
      td1.appendChild(other);
      td2.appendChild(selLvl);
      td3.appendChild(del);

      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      body.appendChild(tr);
    };

    // prefill existing
    if (state.data.languages.length) {
      state.data.languages.forEach(l => addRow({ langue: l.langue, niveau: l.niveau }));
    } else {
      addRow();
    }

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn--primary";
    addBtn.textContent = "Ajouter une langue";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn--success";
    saveBtn.textContent = "Valider";

    addBtn.addEventListener("click", () => addRow());

    saveBtn.addEventListener("click", () => {
      const rows = Array.from(body.querySelectorAll("tr"));
      const languages = rows.map((tr) => {
        const selects = tr.querySelectorAll("select");
        const langSel = selects[0];
        const lvlSel = selects[1];
        const other = tr.querySelector("input");
        const lang = (langSel.value === "Autre" ? normalizeSpace(other.value) : normalizeSpace(langSel.value));
        const lvl = normalizeSpace(lvlSel.value);
        return lang && lvl ? { id: uid(), langue: lang, niveau: lvl } : null;
      }).filter(Boolean);

      if (!languages.length) return toastSystem("Ajoutez au moins une langue et un niveau.");

      // Dedup
      const seen = new Set();
      const dedup = languages.filter(l => {
        const k = `${l.langue.toLowerCase()}|${l.niveau.toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      onSave?.(dedup);
    });

    actions.appendChild(addBtn);
    actions.appendChild(saveBtn);

    wrap.appendChild(table);
    wrap.appendChild(actions);

    setWidget(wrap, { lockTextInput: true, lockReason: "Renseignez vos langues dans le tableau." });
  };

  /* =========================
   * Flow engine (questions / state)
   * ========================= */
  const identityQuestions = [
    { key: "prenom", text: "Quel est votre prénom ?", validate: vRequired("Veuillez saisir votre prénom.") },
    { key: "nom", text: "Quel est votre nom ?", validate: vRequired("Veuillez saisir votre nom.") },
    { key: "email", text: "Quelle est votre adresse email ?", validate: vEmail("Email invalide (ex : nom@domaine.com).") },
    { key: "telephone", text: "Quel est votre numéro de téléphone ?", validate: vPhone("Téléphone invalide (ex : +33 6 12 34 56 78).") },
    { key: "ville", text: "Dans quelle ville habitez-vous ?", validate: vRequired("Veuillez saisir votre ville.") },
    { key: "titre", text: "Quel est votre titre professionnel (ex : Développeur Full‑Stack, Commercial…)", validate: vRequired("Veuillez saisir un titre professionnel.") },
  ];

  const askCurrentQuestion = () => {
    if (state.flow.step === Steps.IDENTITY) {
      const q = identityQuestions[state.flow.identityIndex];
      const msg = bot(q.text, { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);
      setWidget(null);
      return;
    }

    if (state.flow.step === Steps.PROFILE) {
      const msg = bot(
        "Écrivez votre Profil professionnel (3–6 lignes) : profil, objectif, valeur ajoutée.",
        { isQuestion: true }
      );
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      showTextAreaWidget({
        title: "Profil professionnel",
        placeholder: "Ex : Développeur full‑stack avec 4 ans d’expérience… Je recherche… Ma valeur ajoutée…",
        value: state.data.profile.summary || "",
        onSave: (text) => {
          const t = normalizeSpace(text);
          if (t.length < 40) return toastSystem("Ajoutez au moins 40 caractères (3–6 lignes recommandées).");
          const next = deepClone(state);
          next.data.profile.summary = text.trim();
          next.flow.step = Steps.EXP_START;
          setState(next);
          proceed();
        },
      });
      return;
    }

    if (state.flow.step === Steps.EXP_START) {
      const msg = bot("Souhaitez-vous ajouter une expérience professionnelle ?", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      showChoices({
        title: "Ajouter une expérience",
        choices: [
          {
            label: "Oui",
            variant: "btn btn--success",
            onClick: () => {
              const next = deepClone(state);
              next.flow.step = Steps.EXP_FORM;
              next.flow.currentExpId = null;
              setState(next);
              proceed();
            }
          },
          {
            label: "Non",
            variant: "btn btn--danger",
            onClick: () => {
              const next = deepClone(state);
              next.flow.step = Steps.SKILLS;
              setState(next);
              proceed();
            }
          }
        ],
        lockReason: "Choisissez Oui/Non pour continuer.",
      });
      return;
    }

    if (state.flow.step === Steps.EXP_FORM) {
      const msg = bot("Renseignez votre expérience (Mois/Année).", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      showExperienceFormWidget({
        exp: null,
        onSave: (data) => {
          const next = deepClone(state);
          const newExp = { id: uid(), ...data, missions: [] };
          next.data.experiences.push(newExp);
          next.flow.step = Steps.EXP_MISSIONS;
          next.flow.currentExpId = newExp.id;
          setState(next);
          proceed();
        },
        onCancel: () => {
          const next = deepClone(state);
          next.flow.step = Steps.EXP_START;
          setState(next);
          proceed();
        },
      });
      return;
    }

    if (state.flow.step === Steps.EXP_MISSIONS) {
      const expId = state.flow.currentExpId;
      const exp = state.data.experiences.find(e => e.id === expId);
      if (!exp) {
        const next = deepClone(state);
        next.flow.step = Steps.EXP_START;
        setState(next);
        proceed();
        return;
      }

      const msg = bot("Ajoutez / modifiez vos missions pour cette expérience.", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      // Missions similaires: proposer copie depuis l’expérience précédente si existe
      const idx = state.data.experiences.findIndex(e => e.id === expId);
      const prev = idx > 0 ? state.data.experiences[idx - 1] : null;

      const wrap = document.createElement("div");
      wrap.appendChild(widgetTitle(`Missions — ${exp.poste} / ${exp.entreprise}`));

      if (prev && (prev.missions || []).length && !(exp.missions || []).length) {
        const tip = document.createElement("div");
        tip.className = "muted small";
        tip.textContent = "Vos missions semblent parfois réutilisables : vous pouvez copier celles de l’expérience précédente puis ajuster.";
        wrap.appendChild(tip);

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "btn btn--primary";
        copyBtn.style.marginTop = "10px";
        copyBtn.textContent = "Utiliser les mêmes missions que l’expérience précédente";

        copyBtn.addEventListener("click", () => {
          exp.missions = prev.missions.map(m => ({ id: uid(), text: m.text }));
          saveToStorage(state);
          renderCV();
          // ouvrir l’éditeur pour ajuster
          showMissionEditorWidget({
            expId,
            onDone: () => {
              const next = deepClone(state);
              next.flow.step = Steps.EXP_START;
              setState(next);
              proceed();
            }
          });
        });

        wrap.appendChild(copyBtn);
      }

      const manageBtn = document.createElement("button");
      manageBtn.type = "button";
      manageBtn.className = "btn btn--success";
      manageBtn.style.marginTop = "10px";
      manageBtn.textContent = "Gérer les missions (ajouter / modifier / supprimer)";
      manageBtn.addEventListener("click", () => {
        showMissionEditorWidget({
          expId,
          onDone: () => {
            const next = deepClone(state);
            next.flow.step = Steps.EXP_START;
            setState(next);
            proceed();
          }
        });
      });

      const actions = document.createElement("div");
      actions.className = "widget-actions";

      const done = document.createElement("button");
      done.type = "button";
      done.className = "btn btn--success";
      done.textContent = "Terminer cette expérience";

      done.addEventListener("click", () => {
        const next = deepClone(state);
        next.flow.step = Steps.EXP_START;
        setState(next);
        proceed();
      });

      const manageExp = document.createElement("button");
      manageExp.type = "button";
      manageExp.className = "btn btn--ghost";
      manageExp.textContent = "Modifier/Supprimer une expérience";
      manageExp.addEventListener("click", () => {
        showExperienceManagerWidget({
          onClose: () => {
            setWidget(null);
            askCurrentQuestion();
          }
        });
      });

      actions.appendChild(done);
      actions.appendChild(manageExp);

      wrap.appendChild(manageBtn);
      wrap.appendChild(actions);

      setWidget(wrap, { lockTextInput: true, lockReason: "Utilisez les boutons du widget pour gérer vos missions." });
      return;
    }

    if (state.flow.step === Steps.SKILLS) {
      const msg = bot("Sélectionnez vos compétences techniques (vous pouvez ajouter “Autre”).", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      showMultiSelectWidget({
        title: "Compétences techniques",
        suggestions: hardSkillSuggestions(state.data.identity.titre),
        selected: state.data.skills.hard,
        onSave: (arr) => {
          if (!arr.length) return toastSystem("Ajoutez au moins 3 compétences techniques.");
          const next = deepClone(state);
          next.data.skills.hard = arr.slice(0, 30);
          next.flow.step = Steps.SOFT;
          setState(next);
          proceed();
        }
      });
      return;
    }

    if (state.flow.step === Steps.SOFT) {
      const msg = bot("Ajoutons vos Soft skills et vos centres d’intérêt.", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      const wrap = document.createElement("div");
      wrap.appendChild(widgetTitle("Soft skills & centres d’intérêt"));

      const softBtn = document.createElement("button");
      softBtn.type = "button";
      softBtn.className = "btn btn--primary";
      softBtn.textContent = "Sélectionner Soft skills";

      const passBtn = document.createElement("button");
      passBtn.type = "button";
      passBtn.className = "btn btn--primary";
      passBtn.textContent = "Sélectionner centres d’intérêt";

      const actions = document.createElement("div");
      actions.className = "widget-actions";
      actions.appendChild(softBtn);
      actions.appendChild(passBtn);

      const done = document.createElement("button");
      done.type = "button";
      done.className = "btn btn--success";
      done.textContent = "Continuer";
      actions.appendChild(done);

      softBtn.addEventListener("click", () => {
        showMultiSelectWidget({
          title: "Soft skills",
          suggestions: SOFT_SUGGESTIONS,
          selected: state.data.skills.soft,
          onSave: (arr) => {
            state.data.skills.soft = arr.slice(0, 20);
            saveToStorage(state);
            renderCV();
            askCurrentQuestion();
          }
        });
      });

      passBtn.addEventListener("click", () => {
        showMultiSelectWidget({
          title: "Centres d’intérêt",
          suggestions: PASSION_SUGGESTIONS,
          selected: state.data.skills.passions,
          onSave: (arr) => {
            state.data.skills.passions = arr.slice(0, 20);
            saveToStorage(state);
            renderCV();
            askCurrentQuestion();
          }
        });
      });

      done.addEventListener("click", () => {
        const next = deepClone(state);
        next.flow.step = Steps.LANGUAGES;
        setState(next);
        proceed();
      });

      wrap.appendChild(actions);

      setWidget(wrap, { lockTextInput: true, lockReason: "Sélectionnez via les boutons (widgets)." });
      return;
    }

    if (state.flow.step === Steps.LANGUAGES) {
      const msg = bot("Ajoutons vos langues (niveaux : Maternelle / Technique inclus).", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      showLanguagesWidget({
        onSave: (languages) => {
          const next = deepClone(state);
          next.data.languages = languages.slice(0, 12);
          next.flow.step = Steps.REVIEW;
          setState(next);
          proceed();
        }
      });
      return;
    }

    if (state.flow.step === Steps.REVIEW) {
      const msg = bot("C’est prêt. Vous pouvez ajuster, activer/désactiver le Mode ATS, puis exporter.", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      templateSwitcher.hidden = false;
      downloadPdfBtn.disabled = false;
      downloadDocxBtn.disabled = false;
      printBtn.disabled = false;

      showChoices({
        title: "Dernières actions",
        choices: [
          {
            label: "Gérer expériences",
            variant: "btn btn--primary",
            onClick: () => showExperienceManagerWidget({ onClose: () => { setWidget(null); askCurrentQuestion(); } })
          },
          {
            label: "Modifier compétences",
            variant: "btn btn--primary",
            onClick: () => {
              const next = deepClone(state);
              next.flow.step = Steps.SKILLS;
              setState(next);
              proceed();
            }
          },
          {
            label: "Terminer",
            variant: "btn btn--success",
            onClick: () => {
              const next = deepClone(state);
              next.flow.step = Steps.FINISHED;
              setState(next);
              proceed();
            }
          }
        ],
        lockReason: "Choisissez une action.",
      });
      return;
    }

    if (state.flow.step === Steps.FINISHED) {
      const msg = bot("Terminé. Exportez votre CV en PDF ou DOCX, ou utilisez “Import / Reprendre plus tard”.", { isQuestion: true });
      rebuildChatDOM();
      scrollQuestionToTop(msg.id);

      templateSwitcher.hidden = false;
      downloadPdfBtn.disabled = false;
      downloadDocxBtn.disabled = false;
      printBtn.disabled = false;

      setWidget(null);
      setInputLock(true, "Le parcours est terminé. Utilisez les actions d’export ou Réinitialiser.");
      return;
    }
  };

  const proceed = () => {
    // Activer actions au fil de l’eau
    renderCV();
    renderATS();

    // Templates visibles quand on a des données suffisantes
    const hasEnough = normalizeSpace(state.data.identity.prenom).length && normalizeSpace(state.data.identity.nom).length;
    templateSwitcher.hidden = !hasEnough;

    // Input texte : actif seulement pour étape IDENTITY (le reste via widgets)
    const needsText = state.flow.step === Steps.IDENTITY;
    if (needsText) {
      setWidget(null);
      setInputLock(false, "");
      userInput.placeholder = "Votre réponse…";
      userInput.focus();
    }

    askCurrentQuestion();
  };

  /* =========================
   * Identity text handler
   * ========================= */
  const onSend = () => {
    const answer = normalizeSpace(userInput.value);
    if (!answer) return;

    // si l’input est locké, on ignore
    if (state.ui.lockedInput) return;

    user(answer);
    userInput.value = "";

    if (state.flow.step === Steps.IDENTITY) {
      const q = identityQuestions[state.flow.identityIndex];
      const err = q.validate(answer);
      if (err) {
        system(err);
        rebuildChatDOM();
        return;
      }

      const next = deepClone(state);
      next.data.identity[q.key] = answer;
      next.flow.identityIndex += 1;

      // Reformulation pro demandée:
      // (la question entreprise d’origine n’existe plus dans le flow texte,
      // mais on applique l’esprit pro sur tout le parcours) [Source](https://www.genspark.ai/api/files/s/cjJmc3Jl)

      if (next.flow.identityIndex >= identityQuestions.length) {
        next.flow.step = Steps.PROFILE;
      }

      setState(next);
      rebuildChatDOM();
      proceed();
      return;
    }

    rebuildChatDOM();
  };

  /* =========================
   * Import (LinkedIn + PDF)
   * ========================= */
  const openModal = () => { importModal.hidden = false; document.body.style.overflow = "hidden"; };
  const closeModal = () => { importModal.hidden = true; document.body.style.overflow = ""; };

  const initModal = () => {
    importModal.addEventListener("click", (e) => {
      const close = e.target?.dataset?.close;
      if (close === "true") closeModal();
    });

    // Tabs
    importModal.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        importModal.querySelectorAll(".tab").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        const tab = btn.dataset.tab;
        importModal.querySelectorAll("[data-tabpane]").forEach(p => p.hidden = p.dataset.tabpane !== tab);
      });
    });
  };

  const previewImport = (obj) => {
    state.ui.importDraft = obj;
    applyImportBtn.disabled = !obj;
    importPreview.hidden = !obj;
    importPreviewPre.textContent = obj ? JSON.stringify(obj, null, 2) : "";
  };

  const parseLinkedIn = (text) => {
    const raw = String(text || "").trim();
    if (!raw) return null;

    const out = {
      identity: {},
      profile: {},
      experiences: [],
      skills: { hard: [], soft: [], passions: [] },
      languages: [],
      _rawPreview: raw.slice(0, 5000),
    };

    // email / phone (simple)
    const email = raw.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/i)?.[0];
    if (email) out.identity.email = email;

    const phone = raw.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0];
    if (phone) out.identity.telephone = normalizeSpace(phone);

    // profil: première grosse phrase
    const firstPara = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean)[0];
    if (firstPara && firstPara.length > 80) out.profile.summary = firstPara;

    // expériences: heuristique “poste” + “entreprise” + dates YYYY ou MMM YYYY
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    const exp = [];
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      // pattern simple: "Poste" puis "Entreprise" puis "Dates"
      if (L.length >= 3 && L.length <= 80 && i + 1 < lines.length) {
        const next = lines[i + 1];
        const hasDateNearby = lines.slice(i, i + 5).some(x => /\b(19|20)\d{2}\b/.test(x) || /janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc/i.test(x));
        if (hasDateNearby && next && next.length <= 80) {
          exp.push({ poste: L, entreprise: next });
        }
      }
      if (exp.length >= 6) break;
    }
    out.experiences = exp.map(e => ({
      id: uid(),
      poste: e.poste,
      entreprise: e.entreprise,
      startYM: "",
      endYM: "",
      isCurrent: false,
      missions: [],
    }));

    return out;
  };

  const parsePDF = async (file) => {
    if (!file) return null;

    if (!window.pdfjsLib) {
      throw new Error("PDF.js non chargé");
    }

    // Worker config
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    } catch {}

    const buf = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: buf });
    const pdf = await loadingTask.promise;

    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const strings = content.items.map(it => it.str).filter(Boolean);
      text += strings.join(" ") + "\n\n";
    }

    const out = parseLinkedIn(text) || {
      identity: {},
      profile: {},
      experiences: [],
      skills: { hard: [], soft: [], passions: [] },
      languages: [],
      _rawPreview: text.slice(0, 5000),
    };

    return out;
  };

  const applyImport = () => {
    const imp = state.ui.importDraft;
    if (!imp) return;

    const next = deepClone(state);

    // merge identity (sans écraser si déjà rempli)
    for (const k of Object.keys(next.data.identity)) {
      if (!next.data.identity[k] && imp.identity?.[k]) next.data.identity[k] = imp.identity[k];
    }

    if (!next.data.profile.summary && imp.profile?.summary) {
      next.data.profile.summary = imp.profile.summary;
    }

    if (!next.data.experiences.length && Array.isArray(imp.experiences) && imp.experiences.length) {
      next.data.experiences = imp.experiences.slice(0, 8).map(e => ({
        id: uid(),
        entreprise: e.entreprise || "",
        poste: e.poste || "",
        startYM: e.startYM || "",
        endYM: e.endYM || "",
        isCurrent: !!e.isCurrent,
        missions: (e.missions || []).map(m => ({ id: uid(), text: m.text || "" })).filter(m => m.text),
      }));
    }

    // skills/languages : optionnel (ici on n’applique pas agressif)
    next.ui.importDraft = null;

    // Avancer le flow si on a déjà l’essentiel
    if (next.data.identity.prenom && next.data.identity.nom && next.data.profile.summary) {
      next.flow.step = Steps.REVIEW;
    } else {
      next.flow.step = Steps.IDENTITY;
      next.flow.identityIndex = 0;
    }

    setState(next);
    previewImport(null);
    closeModal();
    proceed();
  };

  /* =========================
   * Render all
   * ========================= */
  const renderAll = () => {
    // ATS toggle UI
    atsToggle.checked = !!state.ui.atsMode;

    // Template switcher state
    templateSwitcher.querySelectorAll("button[data-template]").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.template === state.ui.selectedTemplate);
      // désactiver t3 en ATS
      if (state.ui.atsMode && b.dataset.template === "t3") b.disabled = true;
      else b.disabled = false;
    });

    rebuildChatDOM();
    renderCV();
    renderATS();

    backBtn.disabled = history.length === 0;
  };

  /* =========================
   * Back (state management propre)
   * ========================= */
  const goBack = () => {
    const prev = popHistory();
    if (!prev) return;
    state = prev;
    saveToStorage(state);
    renderAll();
    proceed();
  };

  /* =========================
   * Reset / Resume
   * ========================= */
  const startNew = ({ keepHistory = false } = {}) => {
    history = [];
    backBtn.disabled = true;

    state = initialState();
    clearStorage();

    bot("Bonjour ! Je vais vous aider à créer un CV clair, moderne et optimisé ATS.", { isQuestion: false });
    bot("Commençons par votre identité.", { isQuestion: false });

    const next = deepClone(state);
    next.flow.step = Steps.IDENTITY;
    next.flow.identityIndex = 0;
    state = next;

    renderAll();
    proceed();
  };

  const resumeSaved = () => {
    const saved = loadFromStorage();
    if (!saved) {
      system("Aucune sauvegarde trouvée.");
      rebuildChatDOM();
      return;
    }
    history = [];
    backBtn.disabled = true;
    state = saved;

    // si chat vide, recréer un minimum
    if (!state.ui.chat || !state.ui.chat.length) {
      state.ui.chat = [];
      bot("Reprise de votre projet.", { isQuestion: false });
    }
    renderAll();
    proceed();
  };

  /* =========================
   * Events / Init
   * ========================= */
  document.addEventListener("DOMContentLoaded", () => {
    // Start or resume prompt
    const saved = loadFromStorage();

    initTemplateSwitcher();
    initModal();

    sendBtn.addEventListener("click", onSend);
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSend();
      }
    });

    backBtn.addEventListener("click", goBack);

    atsToggle.addEventListener("change", () => {
      const next = deepClone(state);
      next.ui.atsMode = !!atsToggle.checked;
      // si ATS activé et template t3, repasser t2
      if (next.ui.atsMode && next.ui.selectedTemplate === "t3") next.ui.selectedTemplate = "t2";
      setState(next);
      proceed();
    });

    downloadPdfBtn.addEventListener("click", downloadPDF);
    downloadDocxBtn.addEventListener("click", exportDOCX);
    printBtn.addEventListener("click", printCV);

    importBtn.addEventListener("click", () => {
      openModal();
      previewImport(null);
      applyImportBtn.disabled = true;
      pdfStatus.textContent = "";
    });

    resetBtn.addEventListener("click", () => {
      if (!confirm("Réinitialiser ? Toutes les données locales seront supprimées.")) return;
      startNew();
    });

    resumeBtn.addEventListener("click", () => resumeSaved());

    parseLinkedinBtn.addEventListener("click", () => {
      const parsed = parseLinkedIn(linkedinText.value);
      if (!parsed) {
        pdfStatus.textContent = "";
        previewImport(null);
        applyImportBtn.disabled = true;
        importPreview.hidden = true;
        return;
      }
      previewImport(parsed);
    });

    parsePdfBtn.addEventListener("click", async () => {
      try {
        const file = pdfFileInput.files?.[0];
        if (!file) return;
        pdfStatus.textContent = "Extraction en cours…";
        const parsed = await parsePDF(file);
        pdfStatus.textContent = "Extraction terminée.";
        previewImport(parsed);
      } catch (e) {
        console.error(e);
        pdfStatus.textContent = "Erreur lors de l’extraction PDF (voir console).";
      }
    });

    applyImportBtn.addEventListener("click", applyImport);

    // Boot
    if (saved) {
      state = saved;
      history = [];
      if (!state.ui.chat?.length) state.ui.chat = [];
      bot("Bonjour ! Une sauvegarde a été détectée.", { isQuestion: false });
      bot("Souhaitez-vous reprendre votre projet ?", { isQuestion: true });

      state.flow.step = Steps.WELCOME;
      renderAll();

      showChoices({
        title: "Reprise",
        choices: [
          { label: "Reprendre", variant: "btn btn--success", onClick: () => resumeSaved() },
          { label: "Nouveau projet", variant: "btn btn--danger", onClick: () => startNew() },
        ],
        lockReason: "Choisissez Reprendre ou Nouveau projet.",
      });
    } else {
      startNew();
    }
  });
})();
