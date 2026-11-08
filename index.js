// ---------- Cronômetro do relacionamento ----------
// Data de início no horário de Rio Branco (Acre). Mês de 1 a 12.
const INICIO = { ano: 2024, mes: 5, dia: 8, hora: 0, min: 0, seg: 0 };

const formatoAcre = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Rio_Branco',
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric',
  hourCycle: 'h23'
});

// Relógio de parede do Acre, não importa em que fuso o celular esteja
function agoraAcre() {
  const p = {};
  for (const parte of formatoAcre.formatToParts(new Date())) {
    p[parte.type] = parseInt(parte.value, 10);
  }
  return { ano: p.year, mes: p.month, dia: p.day, hora: p.hour % 24, min: p.minute, seg: p.second };
}

function atualizarCronometro() {
  const a = agoraAcre();

  let anos = a.ano - INICIO.ano;
  let meses = a.mes - INICIO.mes;
  let dias = a.dia - INICIO.dia;
  let horas = a.hora - INICIO.hora;
  let minutos = a.min - INICIO.min;
  let segundos = a.seg - INICIO.seg;

  if (segundos < 0) { segundos += 60; minutos -= 1; }
  if (minutos < 0) { minutos += 60; horas -= 1; }
  if (horas < 0) { horas += 24; dias -= 1; }
  if (dias < 0) {
    // último dia do mês anterior
    dias += new Date(Date.UTC(a.ano, a.mes - 1, 0)).getUTCDate();
    meses -= 1;
  }
  if (meses < 0) { meses += 12; anos -= 1; }

  document.getElementById('anos').textContent = anos;
  document.getElementById('meses').textContent = meses;
  document.getElementById('dias').textContent = dias;
  document.getElementById('horas').textContent = horas;
  document.getElementById('minutos').textContent = minutos;
  document.getElementById('segundos').textContent = segundos;

  document.getElementById('anos-box').style.display = anos === 0 ? 'none' : 'flex';
}

atualizarCronometro();                 // mostra já no primeiro instante
setInterval(atualizarCronometro, 1000);

// ---------- Corações caindo ----------
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_ELEMENTOS = 25;
const SIMBOLOS = ['❤️', '💕', '😍', '❤️‍🔥'];
let ativos = 0;

function criarElementoFalling() {
  if (reduzirMovimento || document.hidden || ativos >= MAX_ELEMENTOS) return;

  const el = document.createElement('div');
  el.textContent = SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)];
  el.className = 'falling';
  el.style.left = Math.random() * 95 + 'vw';
  el.style.animationDuration = (Math.random() * 3 + 4) + 's';
  el.style.fontSize = (18 + Math.random() * 14) + 'px';

  ativos++;
  el.addEventListener('animationend', () => { el.remove(); ativos--; });
  document.body.appendChild(el);
}

setInterval(criarElementoFalling, 700);
