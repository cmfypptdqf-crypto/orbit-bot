// commands/utilidades/orbitAI.js
const orbitPersonality = {
    nome: 'Orbit', versao: '2.0.0',
    frasesInicio: ['🔮 Sistema Orbit iniciado...', '🌌 Sondando o espaço...', '🛸 Orbit online.', '✨ Sensores galácticos ativados.', '📡 Conectado à rede interestelar.'],
    frasesErro: ['⚠️ Anomalia detectada.', '🔧 Falha na conexão.', '🌠 Erro de coordenadas.', '⚡ Instabilidade no núcleo.', '📡 Sinal perdido.'],
    frasesSucesso: ['✅ Operação concluída!', '🎉 Missão cumprida!', '💫 Transação realizada!', '🚀 Você é incrível!', '✨ Mais uma conquista!'],
    
    eventos: [
        { chance: 0.05, frase: '🌠 Energia cósmica!', efeito: 'positivo' },
        { chance: 0.03, frase: '👽 Vida alienígena!', efeito: 'positivo' },
        { chance: 0.04, frase: '💫 Estrela cadente!', efeito: 'neutro' },
        { chance: 0.02, frase: '⚠️ Anomalia temporal!', efeito: 'negativo' }
    ]
};

function getRandomFrase(tipo) {
    const frases = {
        'inicio': orbitPersonality.frasesInicio,
        'erro': orbitPersonality.frasesErro,
        'sucesso': orbitPersonality.frasesSucesso
        
    };
    const lista = frases[tipo] || orbitPersonality.frasesSucesso;
    return lista[Math.floor(Math.random() * lista.length)];
}

function checkRandomEvent() {
    const roll = Math.random();
    let acumulado = 0;
    for (const evento of orbitPersonality.eventos) {
        acumulado += evento.chance;
        if (roll <= acumulado) return { ...evento };
    }
    return null;
}

async function processEvent(evento, userId, db, client) {
    if (!evento) return null;
    let resultado = { mensagem: evento.frase, efeito: null };
    if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0 };
    if (evento.efeito === 'positivo') {
        const bonus = Math.floor(Math.random() * 200) + 50;
        db.usuarios[userId].carteira += bonus;
        resultado.efeito = `💰 +${bonus} Orbs`;
    } else if (evento.efeito === 'negativo') {
        const perda = Math.floor(Math.random() * 100) + 20;
        db.usuarios[userId].carteira = Math.max(0, db.usuarios[userId].carteira - perda);
        resultado.efeito = `💸 -${perda} Orbs`;
    }
    return resultado;
}

function getOrbitResponse(acao) {
    return '🌌 Orbit online! Como posso ajudar?';
}

function getComandoFrase(comando) {
    const frases = { 'missao': '🚀 Iniciando missão...', 'pirataria': '☄️ Preparando ataque...' };
    return frases[comando] || '🚀 Orbit processando...';
}

module.exports = { getRandomFrase, checkRandomEvent, processEvent, getOrbitResponse, getComandoFrase };
