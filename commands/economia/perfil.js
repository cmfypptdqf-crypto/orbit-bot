// commands/perfil/perfilOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel, getTituloPorNivel } = require('../utilidades/xpSystem.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {}, clans: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function gerarBarraProgresso(percentual, tamanho = 15) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}

module.exports = {
    name: 'perfil',
    aliases: ['profile', 'me', 'perfilorbital'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0, bio: '🌌 Explorador Orbital' };
        }
        
        const userData = db.usuarios[userId];
        const carteira = userData.carteira || 0;
        const banco = userData.banco || 0;
        const totalOrbs = carteira + banco;
        const xpTotal = userData.xpTotal || 0;
        
        const nivel = calcularNivel(xpTotal);
        const titulo = getTituloPorNivel(nivel);
        const xpNecessario = nivel * 1000;
        const xpAtual = xpTotal % xpNecessario;
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        const barraProgresso = gerarBarraProgresso(progresso, 15);
        
        let isVip = false;
        let vipTier = null;
        let vipMult = 1.0;
        
        if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            isVip = true;
            vipTier = db.vip_list[userId].tier;
            vipMult = db.vip_list[userId].multiplicador || 1.5;
        }
        
        let clanNome = null;
        if (userData.clan && db.clans[userData.clan]) {
            clanNome = db.clans[userData.clan].nome;
        }
        
        const missoes = userData.total_missoes || 0;
        const ataques = userData.total_ataques || 0;
        const vitorias = userData.vitorias || 0;
        const taxaVitoria = ataques > 0 ? Math.round((vitorias / ataques) * 100) : 0;
        
        // Adicionar XP por usar o comando perfil
        const xpGanho = 2;
        const resultadoXP = adicionarXP(userId, xpGanho, 'perfil');
        
        const embed = new EmbedBuilder()
            .setColor(isVip ? 0xFFD700 : 0x00BFFF)
            .setTitle(`📡 Perfil Orbital de ${user.username} ${isVip ? '⭐' : ''}`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setDescription(`📝 *${userData.bio || '🌌 Explorador Orbital'}*`)
            .addFields(
                { name: '💎 ORBS', value: `💵 Carteira: **${carteira.toLocaleString()}**\n🏦 Orbital Bank: **${banco.toLocaleString()}**`, inline: true },
                { name: '✨ STELLAR XP', value: `${barraProgresso}\n📊 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP (${progresso}%)`, inline: true },
                { name: '🏆 NÍVEL ORBITAL', value: `**${nivel}** - ${titulo}`, inline: true },
                { name: '⚔️ ESTATÍSTICAS', value: `🚀 Missões: ${missoes}\n☄️ Ataques: ${ataques}\n🏆 Vitórias: ${vitorias} (${taxaVitoria}%)`, inline: false }
            );
        
        if (isVip) {
            embed.addFields({ name: '⭐ ORBIT PRIME', value: `**${vipTier?.toUpperCase()}** (${vipMult}x)`, inline: true });
        }
        
        if (clanNome) {
            embed.addFields({ name: '🚀 STAR FEDERATION', value: `**${clanNome}**`, inline: true });
        }
        
        embed.addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta ao perfil)`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        embed.setFooter({ text: `🌌 Orbit • ID: ${userId} • Use bt!perfil @usuario para ver outros perfis` });
        
        await message.reply({ embeds: [embed] });
    }
};