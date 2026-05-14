const eventos = {
    positivos: [
        { nome: '🌠 Chuva de Meteoros', mensagem: 'Meteoros dourados estão caindo!', bonus: 1.5, chance: 0.15 },
        { nome: '🎉 Festival Galáctico', mensagem: 'Todo mundo está celebrando!', bonus: 1.3, chance: 0.10 },
        { nome: '💫 Alinhamento Planetário', mensagem: 'Os planetas estão alinhados a seu favor!', bonus: 1.8, chance: 0.08 },
        { nome: '🛸 Visita Alienígena', mensagem: 'Alienígenas amigáveis te presenteiam!', bonus: 2.0, chance: 0.05 },
        { nome: '🌟 Estrela Cadente', mensagem: 'Você fez um pedido e foi atendido!', bonus: 1.4, chance: 0.12 }
    ],
    negativos: [
        { nome: '🌑 Eclipse Solar', mensagem: 'Uma energia negativa te afeta...', penalidade: 0.7, chance: 0.10 },
        { nome: '👾 Invasão Alienígena', mensagem: 'Alienígenas hostis te atacaram!', penalidade: 0.6, chance: 0.05 },
        { nome: '💥 Explosão Solar', mensagem: 'Uma onda de choque te atingiu!', penalidade: 0.8, chance: 0.08 }
    ],
    neutros: [
        { nome: '🌀 Anomalia Temporal', mensagem: 'O tempo distorceu ao seu redor...', efeito: 'reset_cooldown', chance: 0.03 },
        { nome: '🃏 Carta Coringa', mensagem: 'O destino está incerto...', efeito: 'aleatorio', chance: 0.04 }
    ]
};

function aplicarEvento(usuario, db) {
    const todosEventos = [...eventos.positivos, ...eventos.negativos, ...eventos.neutros];
    const roll = Math.random();
    let acumulado = 0;
    
    for (const evento of todosEventos) {
        acumulado += evento.chance;
        if (roll <= acumulado) {
            return evento;
        }
    }
    return null;
}