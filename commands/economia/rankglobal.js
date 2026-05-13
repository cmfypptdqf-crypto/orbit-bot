const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
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
                    ranking.push({
                        user: user,
                        total: total,
                        carteira: data.carteira || 0,
                        banco: data.banco || 0
                    });
                }
            }
        }
        
        ranking.sort((a, b) => b.total - a.total);
        const top10 = ranking.slice(0, 10);
        
        if (top10.length === 0) {
            return message.reply('📊 Nenhum usuário tem moedas ainda!');
        }
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Ranking Global de Riqueza')
            .setDescription('Os usuários mais ricos em TODOS os servidores!')
            .addFields(
                { name: '📊 Total de usuários', value: `${ranking.length}`, inline: true }
            )
            .setTimestamp();
        
        for (let i = 0; i < top10.length; i++) {
            const pos = i + 1;
            let medalha = '';
            if (pos === 1) medalha = '👑 ';
            else if (pos === 2) medalha = '🥈 ';
            else if (pos === 3) medalha = '🥉 ';
            
            embed.addFields({
                name: `${medalha}#${pos} - ${top10[i].user.username}`,
                value: `💰 ${top10[i].total.toLocaleString()} orbs (💵 ${top10[i].carteira.toLocaleString()} | 🏦 ${top10[i].banco.toLocaleString()})`,
                inline: false
            });
        }
        
        const userRank = ranking.findIndex(r => r.user.id === message.author.id) + 1;
        const userData = ranking.find(r => r.user.id === message.author.id);
        
        if (userRank > 0 && userData) {
            embed.setFooter({ 
                text: `Sua posição: #${userRank} de ${ranking.length} usuários | Patrimônio: ${userData.total.toLocaleString()} moedas` 
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
};