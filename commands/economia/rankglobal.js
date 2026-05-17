// commands/economia/rankingGlobalOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel, getTituloPorNivel } = require('../../utilidades/xpSystem.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'rankingglobal',
    aliases: ['rankglobal', 'globalrank', 'topglobal', 'liderancaglobal'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        
        const ranking = [];
        for (const [userId, data] of Object.entries(db.usuarios)) {
            const total = (data.carteira || 0) + (data.banco || 0);
            if (total > 0) {
                try {
                    const user = await client.users.fetch(userId);
                    const nivel = calcularNivel(data.xpTotal || 0);
                    
                    ranking.push({
                        user: user,
                        total: total,
                        nivel: nivel,
                        missoes: data.total_missoes || 0
                    });
                } catch (e) { continue; }
            }
        }
        
        ranking.sort((a, b) => b.total - a.total);
        const top10 = ranking.slice(0, 10);
        
        if (top10.length === 0) return message.reply('📊 Nenhum explorador orbital tem Orbs ainda!');
        
        const xpGanho = 5;
        const resultadoXP = adicionarXP(userId, xpGanho, 'rankingglobal');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🌍 Ranking Global Orbital')
            .setDescription(`Os exploradores mais ricos do universo!\n📊 Total: ${ranking.length} exploradores`)
            .setThumbnail(message.guild.iconURL())
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta global)`, inline: true });
        
        for (let i = 0; i < top10.length; i++) {
            const pos = i + 1;
            let medalha = pos === 1 ? '👑 ' : pos === 2 ? '🥈 ' : pos === 3 ? '🥉 ' : `${pos}. `;
            
            embed.addFields({
                name: `${medalha}${top10[i].user.username}`,
                value: `💰 ${top10[i].total.toLocaleString()} Orbs | ✨ Nível ${top10[i].nivel}`,
                inline: false
            });
        }
        
        const userRank = ranking.findIndex(r => r.user.id === message.author.id) + 1;
        if (userRank > 0) {
            embed.setFooter({ text: `📍 Sua posição orbital global: #${userRank} de ${ranking.length}` });
        }
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};