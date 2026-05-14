const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'rank',
    aliases: ['liderança', 'top', 'ranking'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        
        const ranking = [];
        for (const [userId, data] of Object.entries(db.usuarios)) {
            const total = (data.carteira || 0) + (data.banco || 0);
            
            if (total > 0) {
                let user = null;
                try {
                    user = await client.users.fetch(userId);
                } catch (e) {
                    continue;
                }
                
                if (user) {
                    const isVip = db.vip_list[userId] && db.vip_list[userId].expira > Date.now();
                    const vipTier = isVip ? db.vip_list[userId].tier : null;
                    
                    ranking.push({
                        user: user,
                        total: total,
                        vip: isVip,
                        vipTier: vipTier,
                        missoes: data.total_missoes || 0
                    });
                }
            }
        }
        
        ranking.sort((a, b) => b.total - a.total);
        const top10 = ranking.slice(0, 10);
        
        if (top10.length === 0) {
            return message.reply('📊 Nenhum usuário tem Orbs ainda!');
        }
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Ranking Galáctico de Riqueza')
            .setDescription('Os exploradores mais ricos do universo!')
            .setFooter({ text: '⭐ = VIP' });
        
        for (let i = 0; i < top10.length; i++) {
            const pos = i + 1;
            let medalha = '';
            if (pos === 1) medalha = '👑 ';
            else if (pos === 2) medalha = '🥈 ';
            else if (pos === 3) medalha = '🥉 ';
            
            let vipIcon = '';
            if (top10[i].vip) {
                if (top10[i].vipTier === 'diamante') vipIcon = ' 💎';
                else if (top10[i].vipTier === 'ouro') vipIcon = ' ⭐';
                else if (top10[i].vipTier === 'prata') vipIcon = ' ✨';
                else vipIcon = ' 🌟';
            }
            
            embed.addFields({
                name: `${medalha}#${pos} - ${top10[i].user.username}${vipIcon}`,
                value: `💰 ${top10[i].total.toLocaleString()} Orbs | 🚀 ${top10[i].missoes} missões`,
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
};