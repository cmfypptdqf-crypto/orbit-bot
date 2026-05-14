// commands/economia/saldo.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { calcularNivel, xpParaProximoNivel, xpAtualNoNivel, getTituloPorNivel } = require('../utilidades/levelSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'saldo',
    aliases: ['bal', 'carteira', 'money', 'nucleo', 'orbs'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        let userId = message.author.id;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) userId = mention.id;
        }
        
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
        
        const user = await client.users.fetch(userId);
        const barraProgresso = gerarBarraProgresso(progresso, 20);
        
        const frasesInicio = ['📡 Sondando ativos orbitais...', '💰 Calculando núcleo financeiro...', '🌌 Escaneando sua carteira...'];
        const fraseOrbit = frasesInicio[Math.floor(Math.random() * frasesInicio.length)];
        
        const embed = new EmbedBuilder()
            .setColor(isVip ? 0xFFD700 : 0x00BFFF)
            .setTitle(`🛸 ${fraseOrbit}`)
            .setDescription(`📡 **${user.username}** | ${titulo}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '💎 ORBS', value: `💵 Carteira: **${carteira.toLocaleString()}**\n🏦 Banco: **${banco.toLocaleString()}**\n📊 Total: **${totalOrbs.toLocaleString()}**`, inline: true },
                { name: '🏆 NÍVEL', value: `${barraProgresso}\n📊 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP (${progresso}%)`, inline: true }
            );
        
        if (isVip) {
            embed.addFields({ name: '⭐ VIP', value: `**${vipTier?.toUpperCase()}** (${vipMult}x)`, inline: true });
        }
        
        embed.setFooter({ text: '🌌 Orbit • Sistema Econômico Intergaláctico' }).setTimestamp();
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}