// commands/economia/rank.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel } = require('../utilidades/xpSystem.js');

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
            .setColor(0x00008B)
            .setTitle('<a:f_primeirolugar:1503775329322270860> Stellar Leaderboard')
            .setDescription(`Os maiores exploradores do universo!\n📊 Total: ${ranking.length} exploradores`)
            .setThumbnail(message.guild.iconURL());
        
        for (let i = 0; i < top10.length; i++) {
            const pos = i + 1;
            let medalha = pos === 1 ? '<a:f_primeirolugar:1503775329322270860> ' : pos === 2 ? '🥈 ' : pos === 3 ? '🥉 ' : `${pos}. `;
            let vipIcon = top10[i].vip ? ' <:vip:1503775357122379859>' : '';
            
            embed.addFields({
                name: `${medalha}${top10[i].user.username}${vipIcon}`,
                value: `<a:gcoin:1503617439202545757> ${top10[i].total.toLocaleString()} Orbs | ✨ Stellar Nível ${top10[i].nivel}`,
                inline: false
            });
        }
        
        const userRank = ranking.findIndex(r => r.user.id === message.author.id) + 1;
        if (userRank > 0) {
            embed.setFooter({ text: `<:emoji_53:1504077672781709382> Sua posição: #${userRank} de ${ranking.length}` });
        }
        
        await message.reply({ embeds: [embed] });
    }
};