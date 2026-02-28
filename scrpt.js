// script.js (version robuste)

// État de l'application
let currentStep = 'identity'; // identity, experience, compétences, langues, finished
let currentQuestionIndex = 0;
let userAnswers = {
    experiences: []  // tableau des expériences
};
let currentExperience = {}; // pour construire une expérience en cours
let experienceCount = 0;

// Définition des questions (identique)
const questions = [
    { key: 'prenom', text: "Quel est votre prénom ?", section: 'identity' },
    { key: 'nom', text: "Quel est votre nom ?", section: 'identity' },
    { key: 'email', text: "Quelle est votre adresse email ?", section: 'identity' },
    { key: 'telephone', text: "Quel est votre numéro de téléphone ?", section: 'identity' },
    { key: 'ville', text: "Dans quelle ville habitez-vous ?", section: 'identity' },
    { key: 'titre', text: "Quel est votre titre professionnel (ex: Développeur, Commercial, etc.) ?", section: 'identity' },
    
    // Expérience (ces questions seront posées en boucle)
    { key: 'exp_entreprise', text: "Dans quelle entreprise travailliez-vous ?", section: 'experience' },
    { key: 'exp_poste', text: "Quel était votre poste ?", section: 'experience' },
    { key: 'exp_debut', text: "Quand avez-vous commencé ? (ex: Janvier 2020)", section: 'experience' },
    { key: 'exp_fin', text: "Quand avez-vous terminé ? (si en cours, dites 'Présent')", section: 'experience' },
    { key: 'exp_taches', text: "Décrivez vos principales missions (une par ligne)", section: 'experience' }
];

window.onload = function() {
    // Initialiser avec la première question d'identité
    currentStep = 'identity';
    currentQuestionIndex = 0;
    displayMessage(questions[currentQuestionIndex].text, 'bot');
    showInputField(true);
};

// Fonction unique appelée par le bouton Envoyer
function sendMessage() {
    const input = document.getElementById('user-input');
    const answer = input.value.trim();
    if (answer === '') return;

    // Afficher la réponse de l'utilisateur
    displayMessage(answer, 'user');
    input.value = '';

    // Traiter selon l'étape courante
    if (currentStep === 'identity') {
        handleIdentityAnswer(answer);
    } else if (currentStep === 'experience') {
        handleExperienceAnswer(answer);
    } else if (currentStep === 'competences') {
        handleCompetencesAnswer(answer);
    } else if (currentStep === 'langues') {
        handleLanguesAnswer(answer);
    }
}

function handleIdentityAnswer(answer) {
    // Sauvegarder la réponse
    const q = questions[currentQuestionIndex];
    userAnswers[q.key] = answer;

    // Passer à la question suivante dans la section identity
    if (currentQuestionIndex < questions.filter(q => q.section === 'identity').length - 1) {
        currentQuestionIndex++;
        displayMessage(questions[currentQuestionIndex].text, 'bot');
    } else {
        // Fin de l'identité → commencer la première expérience
        currentStep = 'experience';
        // Réinitialiser l'index sur la première question d'expérience
        const firstExpIndex = questions.findIndex(q => q.section === 'experience');
        currentQuestionIndex = firstExpIndex;
        displayMessage(questions[currentQuestionIndex].text, 'bot');
    }
}

function handleExperienceAnswer(answer) {
    const q = questions[currentQuestionIndex];
    currentExperience[q.key] = answer;

    // Si c'était la dernière question de l'expérience (exp_taches)
    if (q.key === 'exp_taches') {
        // Finaliser et ajouter l'expérience
        experienceCount++;
        currentExperience.id = experienceCount;
        userAnswers.experiences.push({...currentExperience});
        currentExperience = {};

        // Demander s'il veut ajouter une autre expérience
        displayMessage("Souhaitez-vous ajouter une autre expérience ?", 'bot');
        showChoiceButtons(); // Affiche Oui/Non
    } else {
        // Passer à la question suivante dans la section experience
        currentQuestionIndex++;
        displayMessage(questions[currentQuestionIndex].text, 'bot');
    }
}

function showChoiceButtons() {
    // Cacher la zone de texte, afficher les boutons
    document.getElementById('input-area').style.display = 'none';
    const choiceArea = document.getElementById('choice-area');
    choiceArea.style.display = 'flex';
    choiceArea.innerHTML = `
        <button class="choice-btn yes" onclick="handleExperienceChoice('yes')">Oui, ajouter</button>
        <button class="choice-btn no" onclick="handleExperienceChoice('no')">Non, passer aux compétences</button>
    `;
}

// Fonction appelée par les boutons Oui/Non
function handleExperienceChoice(choice) {
    // Cacher les boutons, réafficher l'input
    document.getElementById('choice-area').style.display = 'none';
    document.getElementById('input-area').style.display = 'flex';

    if (choice === 'yes') {
        // Recommencer une nouvelle expérience
        const firstExpIndex = questions.findIndex(q => q.section === 'experience');
        currentQuestionIndex = firstExpIndex;
        displayMessage(questions[currentQuestionIndex].text, 'bot');
    } else {
        // Passer aux compétences
        currentStep = 'competences';
        displayMessage("Quelles sont vos compétences techniques ? (séparez-les par des virgules)", 'bot');
    }
}

function handleCompetencesAnswer(answer) {
    userAnswers.competences = answer.split(',').map(s => s.trim());
    // Passer aux langues
    currentStep = 'langues';
    displayMessage("Quelles langues parlez-vous ? (précisez le niveau si vous voulez)", 'bot');
}

function handleLanguesAnswer(answer) {
    userAnswers.langues = answer;
    // Fin du parcours
    currentStep = 'finished';
    displayMessage("Merci ! Voici votre CV. Vous pouvez modifier le texte directement avant de le télécharger.", 'bot');
    generateCVPreview();
    document.getElementById('download-pdf').style.display = 'block';
    document.getElementById('input-area').style.display = 'none'; // On cache l'input, c'est fini
}

// Fonctions d'affichage (inchangées)
function displayMessage(text, sender) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender === 'bot' ? 'bot-message' : 'user-message');
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function generateCVPreview() {
    const cvDiv = document.getElementById('cv-content');
    let experiencesHTML = '';
    userAnswers.experiences.forEach((exp, index) => {
        experiencesHTML += `
            <div class="experience-item">
                <strong>${exp.exp_poste || 'Poste'}</strong> chez ${exp.exp_entreprise || 'Entreprise'}<br>
                <small>${exp.exp_debut || '?'} - ${exp.exp_fin || 'Présent'}</small><br>
                <p>${(exp.exp_taches || '').replace(/\n/g, '<br>')}</p>
            </div>
            ${index < userAnswers.experiences.length - 1 ? '<hr>' : ''}
        `;
    });
    cvDiv.innerHTML = `
        <div class="cv-template" contenteditable="true" id="editable-cv">
            <h1>${userAnswers.prenom || ''} ${userAnswers.nom || ''}</h1>
            <p>
                <strong>Email :</strong> ${userAnswers.email || ''} | 
                <strong>Tél :</strong> ${userAnswers.telephone || ''} | 
                <strong>Ville :</strong> ${userAnswers.ville || ''}
            </p>
            <div class="section">
                <div class="section-title">🎯 Titre</div>
                <p>${userAnswers.titre || ''}</p>
            </div>
            <div class="section">
                <div class="section-title">💼 Expériences professionnelles</div>
                ${experiencesHTML || 'Aucune expérience renseignée'}
            </div>
            <div class="section">
                <div class="section-title">💻 Compétences techniques</div>
                <p>${userAnswers.competences ? userAnswers.competences.join(' • ') : ''}</p>
            </div>
            <div class="section">
                <div class="section-title">🌍 Langues</div>
                <p>${userAnswers.langues || ''}</p>
            </div>
        </div>
    `;
}

function downloadCV() {
    const element = document.getElementById('editable-cv');
    const opt = {
        margin:       0.5,
        filename:     `CV_${userAnswers.prenom}_${userAnswers.nom}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}