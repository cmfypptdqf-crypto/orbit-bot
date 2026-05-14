// commands/economia/rank.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {}, clans: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'rank',
    aliases: ['liderança', 'top', 'ranking', 'leaderboard'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const guildId = message.guild.id;
        
        // Garantir que estruturas existem
        if (!db.vip_list) db.vip_list = {};
        if (!db.clans) db.clans = {};
        
        // ========== COLETAR DADOS DO RANKING ==========
        const ranking = [];
        
        for (const [userId, data] of Object.entries(db.usuarios)) {
            const carteira = data.carteira || 0;
            const banco = data.banco || 0;
            const total = carteira + banco;
            
            if (total > 0) {
                let user = null;
                try {
                    user = await client.users.fetch(userId);
                } catch (e) {
                    continue;
                }
                
                if (user) {
                    // Verificar VIP
                    const vipData = db.vip_list[userId];
                    const isVip = vipData && vipData.expira > Date.now();
                    const vipTier = isVip ? vipData.tier : null;
                    
                    // Verificar clã
                    let clanNome = null;
                    if (data.clan && db.clans[data.clan]) {
                        clanNome = db.clans[data.clan].nome;
                    }
                    
                    ranking.push({
                        user: user,
                        total: total,
                        carteira: carteira,
                        banco: banco,
                        vip: isVip,
                        vipTier: vipTier,
                        missoes: data.total_missoes || 0,
                        ataques: data.total_ataques || 0,
                        vitorias: data.vitorias || 0,
                        clan: clanNome,
                        nivel: Math.floor(Math.log10(total / 100 + 1) * 15) || 1
                    });
                }
            }
        }
        
        // ========== ORDENAR ==========
        ranking.sort((a, b) => b.total - a.total);
        
        if (ranking.length === 0) {
            return message.reply('📊 Nenhum usuário tem Orbs ainda! Seja o primeiro a acumular riquezas!');
        }
        
        // ========== PAGINAÇÃO ==========
        const itensPorPagina = 10;
        const totalPaginas = Math.ceil(ranking.length / itensPorPagina);
        let paginaAtual = parseInt(args[0]) || 1;
        
        if (paginaAtual < 1) paginaAtual = 1;
        if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
        
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const topPagina = ranking.slice(inicio, inicio + itensPorPagina);
        
        // ========== POSIÇÃO DO USUÁRIO ==========
        const userRank = ranking.findIndex(r => r.user.id === message.author.id) + 1;
        const userData = ranking.find(r => r.user.id === message.author.id);
        
        // ========== ESTATÍSTICAS GLOBAIS ==========
        const totalRiqueza = ranking.reduce((sum, r) => sum + r.total, 0);
        const mediaRiqueza = Math.floor(totalRiqueza / ranking.length);
        const totalVips = ranking.filter(r => r.vip).length;
        
        // ========== CRIAR EMBED ==========
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Ranking Galáctico de Riqueza')
            .setDescription(`Os exploradores mais ricos do universo!`)
            .setThumbnail(message.guild.iconURL())
            .addFields(
                { name: '📊 Total de Exploradores', value: `${ranking.length}`, inline: true },
                { name: '💰 Riqueza Total', value: `${totalRiqueza.toLocaleString()} Orbs`, inline: true },
                { name: '📈 Média por Explorador', value: `${mediaRiqueza.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ VIPs no Ranking', value: `${totalVips}`, inline: true }
            )
            .setTimestamp();
        
        // ========== TOP USUÁRIOS ==========
        for (let i = 0; i < topPagina.length; i++) {
            const r = topPagina[i];
            const pos = inicio + i + 1;
            
            let medalha = '';
            if (pos === 1) medalha = '👑 ';
            else if (pos === 2) medalha = '🥈 ';
            else if (pos === 3) medalha = '🥉 ';
            else medalha = `${pos}. `;
            
            let vipIcon = '';
            if (r.vip) {
                if (r.vipTier === 'diamante') vipIcon = ' 💎';
                else if (r.vipTier === 'ouro') vipIcon = ' ⭐';
                else if (r.vipTier === 'prata') vipIcon = ' ✨';
                else vipIcon = ' 🌟';
            }
            
            let clanIcon = '';
            if (r.clan) clanIcon = `\n👥 ${r.clan}`;
            
            // Barra de progresso visual
            const nivelAtual = r.nivel;
            const xpParaProximo = nivelAtual * 1000;
            const xpAtual = r.total % xpParaProximo;
            const percentual = Math.floor((xpAtual / xpParaProximo) * 100);
            const barra = gerarBarraMini(percentual);
            
            embed.addFields({
                name: `${medalha}${r.user.username}${vipIcon}${clanIcon}`,
                value: `💰 **${r.total.toLocaleString()} Orbs**\n📊 Nível ${r.nivel} ${barra}\n🚀 ${r.missoes} missões | ⚔️ ${r.ataques} ataques | 🏆 ${r.vitorias} vitórias`,
                inline: false
            });
        }
        
        // ========== INFORMAÇÕES DO USUÁRIO ==========
        if (userRank > 0 && userData) {
            const faltaParaProximo = ranking[userRank - 2]?.total - userData.total || 0;
            const proximoAlvo = userRank - 2 >= 0 ? ranking[userRank - 2]?.user.username : 'ninguém';
            
            embed.addFields({
                name: '📍 SUA POSIÇÃO',
                value: `🎯 **#${userRank} de ${ranking.length}**\n💰 ${userData.total.toLocaleString()} Orbs\n📊 Nível ${userData.nivel}\n🚀 ${userData.missoes} missões`,
                inline: false
            });
            
            if (userRank > 1 && faltaParaProximo > 0) {
                embed.addFields({
                    name: '📈 PRÓXIMO ALVO',
                    value: `Faltam **${faltaParaProximo.toLocaleString()} Orbs** para ultrapassar **${proximoAlvo}**!`,
                    inline: false
                });
            }
        }
        
        // ========== RODAPÉ ==========
        embed.setFooter({ 
            text: `Página ${paginaAtual}/${totalPaginas} • Use bt!rank <número> para navegar | ⭐ = VIP` 
        });
        
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraMini(percentual, tamanho = 10) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `[${'█'.repeat(preenchido)}${'░'.repeat(vazio)}] ${percentual}%`;
}