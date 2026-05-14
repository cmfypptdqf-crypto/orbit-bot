// commands/economia/missao.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent, getComandoFrase } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'missao',
    aliases: ['trabalhar', 'work', 'job', 'mission'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // ========== VERIFICAR COOLDOWN ==========
        const cooldownCheck = cooldownsManager.check(userId, 'missao');
        if (!cooldownCheck.available) {
            const fraseCooldown = getRandomFrase('cooldown');
            return message.reply(`${fraseCooldown}\n⏰ Aguarde mais **${cooldownCheck.formatted}** para outra missão!`);
        }
        
        // Frase inicial do Orbit
        const fraseInicial = getComandoFrase('missao') || getRandomFrase('inicio');
        
        // Lista de missões
        const missoes = [
            { nome: '🚀 Explorar Andrômeda', ganho: [80, 200] },
            { nome: '🛸 Resgatar Alienígenas', ganho: [60, 150] },
            { nome: '💎 Minerar Cristais Cósmicos', ganho: [50, 120] },
            { nome: '🔭 Mapear Nebulosas', ganho: [70, 180] },
            { nome: '⚔️ Derrotar Invasores', ganho: [100, 250] },
            { nome: '📡 Consertar Satélite', ganho: [65, 160] },
            { nome: '🌍 Salvar Planeta', ganho: [120, 300] },
            { nome: '🪐 Coletar Minerais', ganho: [90, 220] }
        ];
        
        const missao = missoes[Math.floor(Math.random() * missoes.length)];
        let ganhoBase = Math.floor(Math.random() * (missao.ganho[1] - missao.ganho[0] + 1) + missao.ganho[0]);
        
        // ========== APLICAR BÔNUS VIP + CLÃ ==========
        const bonusInfo = calcularBonusTotal(userId, 'missoes');
        const ganhoFinal = Math.floor(ganhoBase * bonusInfo.bonus);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0 };
        }
        
        // Adicionar ganho
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganhoFinal;
        db.usuarios[userId].total_missoes = (db.usuarios[userId].total_missoes || 0) + 1;
        
        // ========== VERIFICAR EVENTO ALEATÓRIO ==========
        const evento = checkRandomEvent();
        let eventoResultado = null;
        
        if (evento) {
            eventoResultado = await processEvent(evento, userId, db, client);
        }
        
        saveDB(db);
        
        // ========== REGISTRAR COOLDOWN ==========
        cooldownsManager.set(userId, 'missao');
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        // Calcular nível para mostrar progresso
        const totalOrbs = db.usuarios[userId].carteira + (db.usuarios[userId].banco || 0);
        const nivel = Math.floor(Math.log10(totalOrbs / 100 + 1) * 15) || 1;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`🤖 ${fraseInicial}`)
            .setDescription(`📡 **${missao.nome}**\n${fraseSucesso}`)
            .addFields(
                { name: '💰 Ganho Base', value: `${ganhoBase.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '🎉 Total Recebido', value: `**+${ganhoFinal.toLocaleString()} Orbs**`, inline: false },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                { name: '🚀 Missões Completadas', value: `${db.usuarios[userId].total_missoes}`, inline: true },
                { name: '🏆 Nível Atual', value: `${nivel}`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Próxima missão disponível em 1 hora' })
            .setTimestamp();
        
        if (eventoResultado) {
            embed.addFields(
                { name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false },
                { name: '✨ Efeito', value: eventoResultado.efeito || 'Neutro', inline: true }
            );
        }
        
        await message.reply({ embeds: [embed] });
    }
};