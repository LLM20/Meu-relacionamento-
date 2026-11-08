const chat = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const suggestionBtn = document.getElementById('suggestionBtn');
const badge = document.getElementById('badge');

const STORAGE_KEY = 'chatDoAmorHistorico';

let userMessageCount = 0;
let suggestionTimer;
let badgeTimer;
let unlockedBadges = [];

// Perguntas/sugestões para puxar assunto
const suggestions = [
  "Qual seu filme favorito? 🎬",
  "Se pudesse viajar agora, pra onde iria? ✈️",
  "Qual foi a melhor coisa que aconteceu com você essa semana? 🤩",
  "Como foi sua reação quando demos nosso primeiro beijo? 😘",
  "Qual comida você nunca recusaria? 🍕",
  "Se pudesse ter um superpoder, qual seria? 🦸‍♂️",
  "Quando você percebeu que realmente gostava de mim? 😍",
  "Qual foi a primeira coisa que você notou em mim quando me viu pela primeira vez? 💕",
  "Qual é a nossa memória favorita até hoje? 📸",
  "Se pudéssemos morar em qualquer lugar do mundo, onde seria? 🌍",
  "Qual música te lembra a gente? 🎶",
  "O que você mais sente saudade quando estamos longe? 🥺",
  "Qual é o seu sonho para o nosso futuro? 💫",
  "Qual foi o momento mais engraçado que já vivemos juntos? 😂",
  "O que eu faço que te deixa com mais vontade de me abraçar? 🤗",
  "Se hoje fosse nosso primeiro encontro de novo, o que você faria diferente? 💌",
  "Qual é a coisa mais fofa que eu já fiz por você? 🌹",
  "Como você imagina a gente daqui a 10 anos? 👵👴",
  "Qual apelido carinhoso você mais gosta que eu use? 💗",
  "O que te faz sorrir só de pensar em mim? ✨"
];

// Respostas automáticas por palavra-chave (o "bot" simula você respondendo)
const keywordReplies = [
  { keys: ["amo você", "te amo", "amo vc", "amo tc"], replies: [
      "Eu te amo muito mais ainda, viu? 💗",
      "Ler isso fez meu coração disparar 🥰",
      "Também te amo, infinitamente e sem medida ❤️"
  ]},
  { keys: ["saudade", "sdd", "sinto sua falta"], replies: [
      "Eu também estou contando os minutos pra te ver 🥺💕",
      "A saudade aqui também não passa... vem logo pra mim 🫂",
      "Fecho os olhos e já sinto que estou aí com você 💫"
  ]},
  { keys: ["bom dia"], replies: [
      "Bom dia, meu amor! Que seu dia seja tão lindo quanto você ☀️💕",
      "Bom dia! Já acordei pensando em você 😘"
  ]},
  { keys: ["boa noite"], replies: [
      "Boa noite, meu bem. Sonhe com a gente 🌙💫",
      "Durma bem, te amo até o infinito 💗😴"
  ]},
  { keys: ["penso em você", "pensando em você"], replies: [
      "Eu também não paro de pensar em você um segundo 💭❤️"
  ]},
  { keys: ["linda", "linda demais", "gata", "maravilhosa"], replies: [
      "Para de me deixar assim toda boba, seu bobo 🙈💕",
      "Você é quem deixa meus dias mais bonitos 🌹"
  ]},
  { keys: ["obrigado", "obrigada"], replies: [
      "Não precisa agradecer, é tudo por amor 💖",
      "Eu que agradeço por ter você 🥰"
  ]},
  { keys: ["casar", "casamento", "futuro"], replies: [
      "Mal posso esperar por cada capítulo do nosso futuro juntos 💍✨",
      "Com você, quero viver todos os 'para sempre' 💫"
  ]}
];

// Respostas genéricas quando nenhuma palavra-chave bate
const fallbackReplies = [
  "Que fofo isso que você disse 🥰",
  "Adorei ler sua mensagem, me conta mais 💬",
  "Você sempre sabe como alegrar meu dia 💗",
  "Isso me fez sorrir aqui sozinho(a) 😊",
  "Cada mensagem sua é um presente 🎁💕",
  "Fico imaginando seu sorriso enquanto escreve isso 😍"
];

// "você" e "voce", "Saudade" e "saudade" passam a valer igual
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escaparRegex(t) {
  return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function agora(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function salvarHistorico(historico) {
  if (historico.length > 200) historico = historico.slice(-200);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
  } catch (e) {
    // localStorage indisponível — segue sem persistir
  }
}

function carregarHistorico() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addMessage(text, isUser = true, persist = true, ts = null) {
  const row = document.createElement('div');
  row.className = `bubble-row ${isUser ? 'user' : 'bot'}`;

  if (!isUser) {
    const avatar = document.createElement('div');
    avatar.className = 'bubble-avatar';
    avatar.textContent = '💗';
    row.appendChild(avatar);
  }

  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';

  const message = document.createElement('div');
  message.className = `message ${isUser ? 'user' : 'bot'}`;
  message.textContent = text;

  const time = document.createElement('div');
  time.className = 'timestamp';
  time.textContent = agora(ts);

  wrap.appendChild(message);
  wrap.appendChild(time);
  row.appendChild(wrap);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;

  if (persist) {
    const historico = carregarHistorico();
    historico.push({ text, isUser, ts: Date.now() });
    salvarHistorico(historico);
  }
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'bubble-row bot typing';
  row.id = 'typingRow';

  const avatar = document.createElement('div');
  avatar.className = 'bubble-avatar';
  avatar.textContent = '💗';

  const message = document.createElement('div');
  message.className = 'message bot';
  message.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';

  row.appendChild(avatar);
  row.appendChild(message);
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function hideTyping() {
  const row = document.getElementById('typingRow');
  if (row) row.remove();
}

function getBotReply(userText) {
  const texto = normalizar(userText);

  for (const entry of keywordReplies) {
    const bateu = entry.keys.some(k => new RegExp('\\b' + escaparRegex(normalizar(k))).test(texto));
    if (bateu) {
      return entry.replies[Math.floor(Math.random() * entry.replies.length)];
    }
  }

  if (texto.includes('?')) {
    return "Ótima pergunta! Me conta o que te fez pensar nisso? 💭";
  }

  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}

function mostrarBadge(texto) {
  clearTimeout(badgeTimer);
  badge.textContent = texto;
  badge.classList.add('show');
  badgeTimer = setTimeout(() => {
    badge.classList.remove('show');
  }, 3200);
}

function verificarConquistas() {
  if (userMessageCount === 3 && !unlockedBadges.includes(3)) {
    unlockedBadges.push(3);
    mostrarBadge('🏆 Você é um falador apaixonado! 🎤💖');
  } else if (userMessageCount === 10 && !unlockedBadges.includes(10)) {
    unlockedBadges.push(10);
    mostrarBadge('💍 Casal old school: 10 mensagens trocadas!');
  } else if (userMessageCount === 25 && !unlockedBadges.includes(25)) {
    unlockedBadges.push(25);
    mostrarBadge('👑 Realeza do amor: 25 mensagens!');
  }
}

function resetSuggestionTimer() {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => {
    suggestionBtn.classList.add('pulse');

    const frasesAmorosas = [
      "Precisa de inspiração? 💖",
      "Deixe o amor falar! 💬💕",
      "Corações estão esperando... ❤️",
      "Declare seus sentimentos! 🌹",
      "Solte sua paixão! 🔥💘"
    ];

    const fraseAleatoria = frasesAmorosas[Math.floor(Math.random() * frasesAmorosas.length)];
    suggestionBtn.textContent = fraseAleatoria;
  }, 8000);
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (text === '') return;

  addMessage(text, true);
  messageInput.value = '';
  userMessageCount++;
  verificarConquistas();

  suggestionBtn.classList.remove('pulse');
  resetSuggestionTimer();

  // Simula a resposta chegando, como em um app de verdade
  const delay = 900 + Math.random() * 1200;
  showTyping();
  setTimeout(() => {
    hideTyping();
    addMessage(getBotReply(text), false);
  }, delay);
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  }
});

suggestionBtn.addEventListener('click', () => {
  const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  addMessage(randomSuggestion, false);
  suggestionBtn.classList.remove('pulse');
  resetSuggestionTimer();
});

// Carrega histórico salvo, ou começa com uma mensagem de boas-vindas
window.addEventListener('DOMContentLoaded', () => {
  const historico = carregarHistorico();

  if (historico.length === 0) {
    addMessage('Oi, meu amor! Esse é o nosso cantinho só nosso 💕 Manda uma mensagem pra mim!', false);
  } else {
    historico.forEach(m => addMessage(m.text, m.isUser, false, m.ts));
    userMessageCount = historico.filter(m => m.isUser).length;
  }

  resetSuggestionTimer();
});


// Celular: quando o teclado abre, a barra de digitar sobe junto (iPhone/Android antigos)
if (window.visualViewport && window.matchMedia('(max-width: 599px)').matches) {
  const shell = document.querySelector('.app-shell');
  const ajustar = () => {
    shell.style.height = window.visualViewport.height + 'px';
    window.scrollTo(0, 0);
    chat.scrollTop = chat.scrollHeight;
  };
  window.visualViewport.addEventListener('resize', ajustar);
}
