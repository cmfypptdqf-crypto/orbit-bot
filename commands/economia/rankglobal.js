// commands/economia/rank.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel } = require('../utilidades/levelSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'rank',
    aliases: ['liderança', 'top', 'ranking', 'leaderboard'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        
        const ranking = [];
        for (const [userId, data] of Object.entries(db.usuarios)) {
            const total = (data.carteira || 0) + (data.banco || 0);
            if (total > 0) {
                try {
                    const user = await client.users.fetch(userId);
                    const isVip = db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now();
                    const nivel = calcularNivel(data.xpTotal || 0);
                    
                    ranking.push({
                        user: user,
                        total: total,
                        vip: isVip,
                        nivel: nivel,
                        missoes: data.total_missoes || 0
                    });
                } catch (e) { continue; }
            }
        }
        
        ranking.sort((a, b) => b.total - a.total);
        const top10 = ranking.slice(0, 10);
        
        if (top10.length === 0) return message.reply('📊 Nenhum usuário tem Orbs ainda!');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Stellar Leaderboard')
            .setDescription(`Os maiores exploradores do universo!\n📊 Total: ${ranking.length} exploradores`)
            .setThumbnail(message.guild.iconURL());
        
        for (let i = 0; i < top10.length; i++) {
            const pos = i + 1;
            let medalha = pos === 1 ? '👑 ' : pos === 2 ? '🥈 ' : pos === 3 ? '🥉 ' : `${pos}. `;
            let vipIcon = top10[i].vip ? ' ⭐' : '';
            
            embed.addFields({
                name: `${medalha}${top10[i].user.username}${vipIcon}`,
                value: `💰 ${top10[i].total.toLocaleString()} Orbs | ✨ Stellar XP Nível ${top10[i].nivel}`,
                inline: false
            });
        }
        
        const userRank = ranking.findIndex(r => r.user.id === message.author.id) + 1;
        if (userRank > 0) {
            embed.setFooter({ text: `📍 Sua posição: #${userRank} de ${ranking.length}` });
        }
        
        await message.reply({ embeds: [embed] });
    }
};