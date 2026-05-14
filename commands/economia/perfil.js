// commands/economia/perfil.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel, xpParaProximoNivel, xpAtualNoNivel, getTituloPorNivel } = require('../utilidades/levelSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {}, clans: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'perfil',
    aliases: ['profile', 'me'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0 };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        const banco = db.usuarios[userId].banco || 0;
        const totalOrbs = carteira + banco;
        const xpTotal = db.usuarios[userId].xpTotal || 0;
        
        const nivel = calcularNivel(xpTotal);
        const titulo = getTituloPorNivel(nivel);
        const xpNecessario = xpParaProximoNivel(nivel);
        const xpAtual = xpAtualNoNivel(xpTotal, nivel);
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        
        let isVip = false;
        let vipTier = null;
        let vipMult = 1.0;
        
        if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            isVip = true;
            vipTier = db.vip_list[userId].tier;
            vipMult = db.vip_list[userId].multiplicador || 1.5;
        }
        
        let clanNome = null;
        if (db.usuarios[userId].clan && db.clans[db.usuarios[userId].clan]) {
            clanNome = db.clans[db.usuarios[userId].clan].nome;
        }
        
        const barraProgresso = gerarBarraProgresso(progresso, 20);
        
        const embed = new EmbedBuilder()
            .setColor(isVip ? 0xFFD700 : 0x00BFFF)
            .setTitle(`📋 Perfil de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`${titulo}${clanNome ? `\n🚀 Star Federation: ${clanNome}` : ''}`)
            .addFields(
                { name: '💎 ORBS', value: `💵 Carteira: **${carteira.toLocaleString()}**\n🏦 Orbital Bank: **${banco.toLocaleString()}**`, inline: true },
                { name: '✨ Stellar XP', value: `${barraProgresso}\n📊 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP`, inline: true }
            );
        
        if (isVip) {
            embed.addFields({ name: '⭐ Orbit Prime', value: `**${vipTier?.toUpperCase()}** (${vipMult}x)`, inline: true });
        }
        
        embed.setFooter({ text: `🌌 Orbit • Use bt!perfil @usuario para ver outros perfis` });
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    return `🟩`.repeat(preenchido) + `⬜`.repeat(tamanho - preenchido);
}