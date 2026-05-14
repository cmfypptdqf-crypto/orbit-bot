const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();

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
    aliases: ['trabalhar', 'work', 'job', 'missao'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `work_${userId}`;
        const lastWork = cooldowns.get(cooldownKey);
        
        if (lastWork && Date.now() - lastWork < 3600000) {
            const remaining = Math.ceil((3600000 - (Date.now() - lastWork)) / 60000);
            return message.reply(`⏰ Sua nave ainda está em manutenção! Volte em **${remaining} minutos** para uma nova missão.`);
        }
        
        const missoes = [
            { nome: '🚀 Explorar Andrômeda', ganho: [80, 200] },
            { nome: '🛸 Resgatar Alienígenas', ganho: [60, 150] },
            { nome: '💎 Minerar Cristais Cósmicos', ganho: [50, 120] },
            { nome: '🔭 Mapear Nebulosas', ganho: [70, 180] },
            { nome: '⚔️ Derrotar Invasores', ganho: [100, 250] },
            { nome: '📡 Consertar Satélite', ganho: [65, 160] }
        ];
        
        const missao = missoes[Math.floor(Math.random() * missoes.length)];
        const ganho = Math.floor(Math.random() * (missao.ganho[1] - missao.ganho[0] + 1) + missao.ganho[0]);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
        saveDB(db);
        
        cooldowns.set(cooldownKey, Date.now());
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🚀 Missão Completa!')
            .setDescription(`Você completou a missão: **${missao.nome}** e ganhou **${ganho} Orbs**!`)
            .addFields(
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira} Orbs`, inline: true }
            )
            .setFooter({ text: 'Próxima missão disponível em 1 hora' });
        
        await message.reply({ embeds: [embed] });
    }
};