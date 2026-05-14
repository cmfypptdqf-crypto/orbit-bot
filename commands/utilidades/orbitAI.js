// utilidades/orbitAI.js

// Personalidade do Orbit
const orbitPersonality = {
    nome: 'Orbit',
    versao: '2.0.0',
    humor: ['curioso', 'misterioso', 'animado', 'calmo', 'sabio'],
    
    // Frases de inicialização
    frasesInicio: [
        '🔮 Sistema Orbit iniciado...',
        '🌌 Sondando o espaço...',
        '🛸 Orbit online. Aguardando comandos.',
        '✨ Sensores galácticos ativados.',
        '📡 Conectado à rede interestelar.'
    ],
    
    // Frases de erro
    frasesErro: [
        '⚠️ Anomalia detectada. Tente novamente.',
        '🔧 Falha na conexão. Reiniciando módulos...',
        '🌠 Erro de coordenadas. Redirecionando...',
        '⚡ Instabilidade no núcleo. Aguarde...',
        '📡 Sinal perdido. Reconectando...'
    ],
    
    // Frases de sucesso
    frasesSucesso: [
        '✅ Operação concluída com sucesso!',
        '🎉 Missão cumprida, comandante!',
        '💫 Transação realizada com êxito.',
        '🚀 Você é incrível! Operação finalizada.',
        '✨ Mais uma conquista registrada.'
    ],
    
    // Frases de cooldown
    frasesCooldown: [
        '⏰ Calma, comandante! Aguarde um pouco.',
        '🔄 Sistemas recarregando. Volte em breve.',
        '🔋 Energia em recuperação. Tenha paciência.',
        '🌙 Nem tudo acontece ao mesmo tempo.',
        '📡 Sinal instável. Tente novamente mais tarde.'
    ],
    
    // Frases de evento aleatório
    eventos: [
        { chance: 0.05, frase: '🌠 Você sentiu uma onda de energia cósmica!', efeito: 'positivo' },
        { chance: 0.03, frase: '👽 Sensores detectaram vida alienígena próxima!', efeito: 'positivo' },
        { chance: 0.04, frase: '💫 Uma estrela cadente cruzou o céu!', efeito: 'neutro' },
        { chance: 0.02, frase: '⚠️ Uma anomalia temporal foi detectada!', efeito: 'negativo' },
        { chance: 0.08, frase: '🔭 Você avistou uma nave misteriosa ao longe.', efeito: 'neutro' },
        { chance: 0.06, frase: '🪐 Os anéis de Saturno brilham intensamente hoje!', efeito: 'positivo' },
        { chance: 0.03, frase: '💀 Um cometa escuro cruzou seu caminho...', efeito: 'negativo' },
        { chance: 0.05, frase: '✨ Você encontrou uma cápsula do tempo espacial!', efeito: 'positivo' }
    ]
};

// Função para gerar frase aleatória
function getRandomFrase(tipo) {
    let frases = [];
    
    switch(tipo) {
        case 'inicio':
            frases = orbitPersonality.frasesInicio;
            break;
        case 'erro':
            frases = orbitPersonality.frasesErro;
            break;
        case 'sucesso':
            frases = orbitPersonality.frasesSucesso;
            break;
        case 'cooldown':
            frases = orbitPersonality.frasesCooldown;
            break;
        default:
            frases = orbitPersonality.frasesSucesso;
    }
    
    return frases[Math.floor(Math.random() * frases.length)];
}

// Função para verificar evento aleatório
function checkRandomEvent() {
    const roll = Math.random();
    let acumulado = 0;
    
    for (const evento of orbitPersonality.eventos) {
        acumulado += evento.chance;
        if (roll <= acumulado) {
            return { ...evento }; // Retorna uma cópia
        }
    }
    return null;
}

// Função para processar evento e aplicar efeito
async function processEvent(evento, userId, db, client) {
    if (!evento) return null;
    
    let resultado = { mensagem: evento.frase, efeito: null };
    
    // Garantir que o usuário existe no banco
    if (!db.usuarios[userId]) {
        db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
    }
    
    if (evento.efeito === 'positivo') {
        const bonus = Math.floor(Math.random() * 200) + 50;
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + bonus;
        resultado.efeito = `💰 +${bonus.toLocaleString()} Orbs (evento cósmico)`;
    } else if (evento.efeito === 'negativo') {
        const perda = Math.floor(Math.random() * 100) + 20;
        const perdaReal = Math.min(perda, db.usuarios[userId].carteira || 0);
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - perdaReal;
        resultado.efeito = `💸 -${perdaReal.toLocaleString()} Orbs (anomalia)`;
    }
    
    return resultado;
}

// Função para gerar resposta personalizada do Orbit
function getOrbitResponse(acao, dados = {}) {
    const respostas = {
        'saudacao': [
            `🌌 Olá, comandante! Bem-vindo ao sistema Orbit.`,
            `🚀 Orbit online. Como posso ajudar hoje?`,
            `✨ Saudações, viajante espacial!`,
            `🛸 Sistemas operacionais. Aguardando comandos.`,
            `🌠 Conectado. O universo está em suas mãos.`
        ],
        'despedida': [
            `👋 Até a próxima, comandante! Que as estrelas te guiem.`,
            `🌙 Orbit entrando em modo de espera. Volte logo!`,
            `✨ Cuide-se lá fora. O espaço é perigoso.`,
            `🚀 Orbit desligando... Até breve!`
        ],
        'ajuda': [
            `📡 Comandos disponíveis: \`bt!comandos\` para lista completa.`,
            `🔭 Precisa de ajuda? Use \`bt!help\` para orientação.`,
            `🌌 Orbit está aqui para ajudar. Consulte \`bt!menu\`.`
        ],
        'agradecimento': [
            `🤖 Disponha, comandante! É para isso que existo.`,
            `✨ Fico feliz em ajudar! Continue explorando.`,
            `🚀 Missão cumprida com sucesso! Até a próxima.`
        ],
        'comando_desconhecido': [
            `❓ Comando não reconhecido. Use \`bt!ajuda\` para ver comandos disponíveis.`,
            `🔍 Não entendi esse comando. Tente novamente!`,
            `🌠 Comando inválido. Orbit não processou sua solicitação.`
        ]
    };
    
    const lista = respostas[acao] || respostas.saudacao;
    return lista[Math.floor(Math.random() * lista.length)];
}

// Frases temáticas por comando
const frasesComando = {
    'missao': [
        '🚀 Iniciando sequência de missão...',
        '🌌 Detectei atividade na galáxia!',
        '📡 Sondando setor inimigo...',
        '⚔️ Preparando para batalha espacial.'
    ],
    'nucleo': [
        '💰 Calculando ativos orbitais...',
        '📊 Exibindo relatório financeiro interestelar.',
        '💎 Seu núcleo de energia foi acessado.'
    ],
    'pirataria': [
        '☄️ Detectando vulnerabilidades na nave alvo...',
        '👾 Preparando ataque furtivo...',
        '🚨 Sensores de combate ativados!'
    ],
    'clan': [
        '👥 Acessando base de dados do clã...',
        '🚀 Comandante, seus aliados aguardam ordens.',
        '🌌 Frotas aliadas prontas para ação.'
    ],
    'galaxia': [
        '🌌 Mapeando setores galácticos...',
        '🪐 Coordenadas estelares processadas.',
        '✨ Uma nova fronteira foi descoberta.'
    ],
    'marketplace': [
        '🛒 Acessando Mercado Interestelar...',
        '💰 Negociações em andamento.',
        '📦 Itens disponíveis para aquisição.'
    ],
    'perfil': [
        '📋 Carregando dados do comandante...',
        '🔍 Perfil acessado com sucesso.',
        '✨ Exibindo relatório orbital.'
    ]
};

function getComandoFrase(comando) {
    const frases = frasesComando[comando];
    if (frases && frases.length > 0) {
        return frases[Math.floor(Math.random() * frases.length)];
    }
    return getRandomFrase('inicio');
}

module.exports = {
    orbitPersonality,
    getRandomFrase,
    checkRandomEvent,
    processEvent,
    getOrbitResponse,
    getComandoFrase
};