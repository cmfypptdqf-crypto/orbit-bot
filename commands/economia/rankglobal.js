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

function saveDB(data) {  // ← ADICIONAR ESTA FUNÇÃO (opcional, mas bom ter)
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'rank',
    aliases: ['liderança', 'top', 'ranking'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        
        // Garantir que vip_list existe
        if (!db.vip_list) db.vip_list = {};
        
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
                    // Verificar VIP corretamente
                    const vipData = db.vip_list[userId];
                    const isVip = vipData && vipData.expira > Date.now();
                    const vipTier = isVip ? vipData.tier : null;
                    
                    ranking.push({
                        user: user,
                        total: total,
                        vip: isVip,
                        vipTier: vipTier,
                        missoes: data.total_missoes || 0,
                        carteira: data.carteira || 0,
                        banco: data.banco || 0
                    });
                }
            }
        }
        
        if (ranking.length === 0) {
            return message.reply('📊 Nenhum usuário tem Orbs ainda!');
        }
        
        ranking.sort((a, b) => b.total - a.total);
        const top10 = ranking.slice(0, 10);
        
        // Encontrar posição do autor
        const userRank = ranking.findIndex(r => r.user.id === message.author.id) + 1;
        const userData = ranking.find(r => r.user.id === message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Ranking Galáctico de Riqueza')
            .setDescription(`Os exploradores mais ricos do universo!\n📊 Total de usuários: **${ranking.length}**`)
            .setTimestamp();
        
        for (let i = 0; i < top10.length; i++) {
            const pos = i + 1;
            let medalha = '';
            if (pos === 1) medalha = '👑 ';
            else if (pos === 2) medalha = '🥈 ';
            else if (pos === 3) medalha = '🥉 ';
            else medalha = `${pos}. `;
            
            let vipIcon = '';
            if (top10[i].vip) {
                if (top10[i].vipTier === 'diamante') vipIcon = ' 💎';
                else if (top10[i].vipTier === 'ouro') vipIcon = ' ⭐';
                else if (top10[i].vipTier === 'prata') vipIcon = ' ✨';
                else vipIcon = ' 🌟';
            }
            
            embed.addFields({
                name: `${medalha}${top10[i].user.username}${vipIcon}`,
                value: `💰 ${top10[i].total.toLocaleString()} Orbs | 🚀 ${top10[i].missoes} missões`,
                inline: false
            });
        }
        
        // Mostrar posição do usuário atual
        if (userRank > 0 && userData) {
            embed.setFooter({ 
                text: `📍 Sua posição: #${userRank} de ${ranking.length} | Patrimônio: ${userData.total.toLocaleString()} Orbs` 
            });
        } else {
            embed.setFooter({ text: '⭐ = VIP • Use !nucleo para ver seu saldo' });
        }
        
        await message.reply({ embeds: [embed] });
    }
};