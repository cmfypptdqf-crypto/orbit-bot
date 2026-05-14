const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const eventos = require('./eventos.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();
const eventoGlobal = { ativo: null, expira: 0 };

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
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
            return message.reply(`⏰ Sua nave ainda está em manutenção! Volte em **${remaining} minutos**.`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0 };
        }
        
        // Calcular multiplicador VIP
        let multiplicador = 1.0;
        let vipTier = null;
        
        if (db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            multiplicador = db.vip_list[userId].multiplicador;
            vipTier = db.vip_list[userId].tier;
        }
        
        // Verificar itens de boost
        const inventario = db.usuarios[userId].inventario || {};
        let boostItem = null;
        
        if (inventario['3'] > 0) { // Anel Cósmico
            multiplicador *= 1.15;
            boostItem = '💍 Anel Cósmico';
        }
        if (inventario['2'] > 0) { // Nave Explorer
            multiplicador *= 1.10;
            boostItem = boostItem ? `${boostItem} + 🚀 Nave Explorer` : '🚀 Nave Explorer';
        }
        
        // Evento global aleatório (1% de chance por comando)
        if (Math.random() < 0.01 && !eventoGlobal.ativo) {
            const evento = eventos.aplicarEvento(userId, db);
            if (evento) {
                eventoGlobal.ativo = evento;
                eventoGlobal.expira = Date.now() + 300000; // 5 minutos
                
                const channel = message.channel;
                const embedEvento = new EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle(`🎲 EVENTO GLOBAL: ${evento.nome}`)
                    .setDescription(evento.mensagem)
                    .setFooter({ text: 'Evento ativo por 5 minutos!' });
                
                await channel.send({ embeds: [embedEvento] });
            }
        }
        
        // Aplicar evento global ativo
        let eventoBonus = 1.0;
        let eventoNome = null;
        
        if (eventoGlobal.ativo && eventoGlobal.expira > Date.now()) {
            if (eventoGlobal.ativo.bonus) {
                eventoBonus = eventoGlobal.ativo.bonus;
                eventoNome = eventoGlobal.ativo.nome;
            }
        }
        
        const missoes = [
            { nome: '🚀 Explorar Andrômeda', ganhoBase: [80, 200] },
            { nome: '🛸 Resgatar Alienígenas', ganhoBase: [60, 150] },
            { nome: '💎 Minerar Cristais Cósmicos', ganhoBase: [50, 120] },
            { nome: '🔭 Mapear Nebulosas', ganhoBase: [70, 180] },
            { nome: '⚔️ Derrotar Invasores', ganhoBase: [100, 250] },
            { nome: '📡 Consertar Satélite', ganhoBase: [65, 160] }
        ];
        
        const missao = missoes[Math.floor(Math.random() * missoes.length)];
        const ganhoBase = Math.floor(Math.random() * (missao.ganhoBase[1] - missao.ganhoBase[0] + 1) + missao.ganhoBase[0]);
        const ganhoFinal = Math.floor(ganhoBase * multiplicador * eventoBonus);
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganhoFinal;
        db.usuarios[userId].total_missoes = (db.usuarios[userId].total_missoes || 0) + 1;
        saveDB(db);
        
        cooldowns.set(cooldownKey, Date.now());
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🚀 Missão Completa!')
            .setDescription(`Você completou: **${missao.nome}**`)
            .addFields(
                { name: '💰 Ganho Base', value: `${ganhoBase} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: `${multiplicador.toFixed(2)}x`, inline: true }
            );
        
        if (vipTier) {
            embed.addFields({ name: '⭐ VIP Ativo', value: `${vipTier.toUpperCase()} (${multiplicador}x)`, inline: true });
        }
        if (boostItem) {
            embed.addFields({ name: '🎁 Item Ativo', value: boostItem, inline: true });
        }
        if (eventoNome) {
            embed.addFields({ name: '🎲 Evento Ativo', value: `${eventoNome} (+${(eventoBonus-1)*100}%)`, inline: true });
        }
        
        embed.addFields(
            { name: '🎉 Total Recebido', value: `**+${ganhoFinal.toLocaleString()} Orbs**`, inline: false },
            { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
            { name: '📊 Missões completadas', value: `${db.usuarios[userId].total_missoes}`, inline: true }
        );
        
        await message.reply({ embeds: [embed] });
    }
};