// commands/utilidades/orbitAI.js
const orbitPersonality = {
    nome: 'Orbit', versao: '2.0.0',
    frasesInicio: ['🔮 Sistema Orbit iniciado...', '🌌 Sondando o espaço...', '🛸 Orbit online.', '✨ Sensores galácticos ativados.', '📡 Conectado à rede interestelar.'],
    frasesErro: ['⚠️ Anomalia detectada.', '🔧 Falha na conexão.', '🌠 Erro de coordenadas.', '⚡ Instabilidade no núcleo.', '📡 Sinal perdido.'],
    
    eventos: [
        { chance: 3.0, frase: '🌠 Energia cósmica!', efeito: 'positivo' },
        { chance: 2.0, frase: '👽 Vida alienígena!', efeito: 'positivo' },
        { chance: 4.0, frase: '💫 Estrela cadente!', efeito: 'neutro' },
        { chance: 0.20, frase: '⚠️ Anomalia temporal!', efeito: 'negativo' }
    ]
};

function getRandomFrase(tipo) {
    const frases = {
        'inicio': orbitPersonality.frasesInicio,
        'erro': orbitPersonality.frasesErro,
    
        
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
        const bonus = Math.floor(Math.random() * 2000) + 500;
        db.usuarios[userId].carteira += bonus;
        resultado.efeito = `💰 +${bonus} Orbs`;
    } else if (evento.efeito === 'negativo') {
        const perda = Math.floor(Math.random() * 1000) + 200;
        db.usuarios[userId].carteira = Math.max(0, db.usuarios[userId].carteira - perda);
        resultado.efeito = `💸 -${perda} Orbs`;
    }
    return resultado;
}

function getOrbitResponse(acao) {
    return '🌌 Orbit online! Como posso ajudar?';
}



module.exports = { getRandomFrase, checkRandomEvent, processEvent, getOrbitResponse, getComandoFrase };
