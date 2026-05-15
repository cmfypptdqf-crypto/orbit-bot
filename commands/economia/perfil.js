// commands/perfil/perfil.js
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
    name: 'perfil',
    aliases: ['profile', 'me', 'mystats'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { 
                carteira: 0, banco: 0, inventario: {}, xpTotal: 0,
                bio: '🌌 Explorador Espacial', tema: 'default', background: 'espaco',
                total_missoes: 0, total_ataques: 0, vitorias: 0,
                reputacao: 0, titulos: [], tituloAtivo: null
            };
        }
        
        const userData = db.usuarios[userId];
        const carteira = userData.carteira || 0;
        const banco = userData.banco || 0;
        const totalOrbs = carteira + banco;
        const xpTotal = userData.xpTotal || 0;
        
        // ========== NÍVEL E XP ==========
        const nivel = calcularNivel(xpTotal);
        const xpNecessario = nivel * 1000;
        const xpAtual = xpTotal % xpNecessario;
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        const barraProgresso = gerarBarraProgresso(progresso, 20);
        
        // ========== TÍTULO ==========
        const tituloAtivo = userData.tituloAtivo ? userData.tituloAtivo : 'Explorador Espacial';
        
        // ========== VIP ==========
        let isVip = false;
        let vipTier = null;
        let vipMult = 1.0;
        
        if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            isVip = true;
            vipTier = db.vip_list[userId].tier;
            vipMult = db.vip_list[userId].multiplicador || 1.5;
        }
        
        // ========== CLÃ ==========
        let clanNome = null;
        if (userData.clan && db.clans[userData.clan]) {
            clanNome = db.clans[userData.clan].nome;
        }
        
        // ========== REPUTAÇÃO ==========
        const reputacao = userData.reputacao || 0;
        let reputacaoNivel = '';
        if (reputacao >= 100) reputacaoNivel = '👑 Lendário';
        else if (reputacao >= 50) reputacaoNivel = '🌟 Respeitado';
        else if (reputacao >= 10) reputacaoNivel = '👍 Confiável';
        else reputacaoNivel = '🌱 Novato';
        
        // ========== ESTATÍSTICAS ==========
        const missoes = userData.total_missoes || 0;
        const ataques = userData.total_ataques || 0;
        const vitorias = userData.vitorias || 0;
        const taxaVitoria = ataques > 0 ? Math.round((vitorias / ataques) * 100) : 0;
        
        // ========== INVENTÁRIO ==========
        const inventario = userData.inventario || {};
        const totalItens = Object.values(inventario).reduce((a, b) => a + b, 0);
        
        // ========== TÍTULOS ADQUIRIDOS ==========
        const titulosAdquiridos = userData.titulos || [];
        
        // ========== COR DO TEMA ==========
        const tema = userData.tema || 'default';
        const cores = {
            'default': 0x00BFFF,
            'espacial': 0x2C3E50,
            'neon': 0x00FF00,
            'dark': 0x1a1a2e,
            'light': 0xF5F5F5,
            'oceano': 0x1ABC9C,
            'fogo': 0xE74C3C
        };
        const embedColor = cores[tema] || 0x00BFFF;
        
        // ========== FUNDO DO PERFIL ==========
        const background = userData.background || 'espaco';
        const fundos = {
            'espaco': '🌌',
            'nebulosa': '🌫️',
            'planeta': '🪐',
            'estrelas': '⭐'
        };
        const fundoIcon = fundos[background] || '🌌';
        
        // ========== BIO ==========
        const bio = userData.bio || '🌌 Explorador Espacial em busca de aventuras!';
        
        // ========== EMBED PRINCIPAL ==========
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${fundoIcon} Perfil de ${user.username} ${isVip ? '⭐' : ''}`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setDescription(`🏷️ *${tituloAtivo}*\n📝 ${bio}`)
            .setTimestamp();
        
        // ========== INFORMAÇÕES PRINCIPAIS ==========
        embed.addFields({
            name: '💎 ORBS',
            value: `💵 Carteira: **${carteira.toLocaleString()}**\n🏦 Orbital Bank: **${banco.toLocaleString()}**\n📊 Total: **${totalOrbs.toLocaleString()}**`,
            inline: true
        });
        
        embed.addFields({
            name: '✨ STELLAR XP',
            value: `${barraProgresso}\n📊 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP (${progresso}%)`,
            inline: true
        });
        
        // ========== VIP ==========
        if (isVip) {
            let vipIcon = vipTier === 'diamante' ? '💎' : vipTier === 'ouro' ? '⭐' : vipTier === 'prata' ? '✨' : '🌟';
            embed.addFields({
                name: '⭐ ORBIT PRIME',
                value: `${vipIcon} **${vipTier?.toUpperCase()}** (${vipMult}x)\n⏰ Expira: <t:${Math.floor(db.vip_list[userId].expira / 1000)}:R>`,
                inline: true
            });
        }
        
        // ========== CLÃ ==========
        if (clanNome) {
            embed.addFields({
                name: '🚀 STAR FEDERATION',
                value: `**${clanNome}**`,
                inline: true
            });
        }
        
        // ========== REPUTAÇÃO ==========
        embed.addFields({
            name: '⭐ REPUTAÇÃO',
            value: `📊 **${reputacao} pontos**\n🏆 ${reputacaoNivel}`,
            inline: true
        });
        
        // ========== ESTATÍSTICAS ==========
        embed.addFields({
            name: '📊 ESTATÍSTICAS',
            value: `🎯 Missões: **${missoes}**\n⚔️ Ataques: **${ataques}**\n🏆 Vitórias: **${vitorias}** (${taxaVitoria}%)`,
            inline: false
        });
        
        // ========== INVENTÁRIO ==========
        embed.addFields({
            name: '🎒 INVENTÁRIO',
            value: `📦 Total de itens: **${totalItens}**\n🔖 Tipos: **${Object.keys(inventario).length}**\n🛒 Use \`bt!mochila\` para detalhes`,
            inline: true
        });
        
        // ========== TÍTULOS ==========
        embed.addFields({
            name: '🏷️ TÍTULOS',
            value: `📚 Adquiridos: **${titulosAdquiridos.length}**\n👑 Ativo: **${tituloAtivo}**\n🔰 Use \`bt!titulos meus\` para ver todos`,
            inline: true
        });
        
        // ========== BADGES/CONQUISTAS (resumo) ==========
        const missoesFeitas = missoes;
        let conquistasCount = 0;
        if (missoesFeitas >= 10) conquistasCount++;
        if (missoesFeitas >= 100) conquistasCount++;
        if (totalOrbs >= 1000000) conquistasCount++;
        if (ataques >= 50) conquistasCount++;
        if (nivel >= 50) conquistasCount++;
        
        embed.addFields({
            name: '🏆 CONQUISTAS',
            value: `📊 Progresso: **${conquistasCount}/5**\n🔰 Use \`bt!conquistas\` para detalhes`,
            inline: true
        });
        
        // ========== TEMA E BACKGROUND ==========
        const temasNomes = {
            'default': '🎨 Padrão',
            'espacial': '🌌 Espacial',
            'neon': '💚 Neon',
            'dark': '🖤 Dark',
            'light': '🤍 Light',
            'oceano': '💙 Oceano',
            'fogo': '❤️ Fogo'
        };
        
        const backgroundsNomes = {
            'espaco': '🌌 Espaço',
            'nebulosa': '🌫️ Nebulosa',
            'planeta': '🪐 Planeta',
            'estrelas': '⭐ Estrelas'
        };
        
        embed.addFields({
            name: '🎨 PERSONALIZAÇÃO',
            value: `🎭 Tema: ${temasNomes[tema]}\n🖼️ Background: ${backgroundsNomes[background]}`,
            inline: true
        });
        
        // ========== BANNER (se tiver) ==========
        if (userData.banner) {
            embed.setImage(userData.banner);
            embed.addFields({
                name: '🖼️ BANNER',
                value: `✨ Banner personalizado ativo!`,
                inline: true
            });
        }
        
        // ========== RODAPÉ ==========
        embed.setFooter({ text: `ID: ${userId} • Use bt!perfil @usuario para ver outros perfis` });
        
        await message.reply({ embeds: [embed] });
    }
};

// ========== FUNÇÕES AUXILIARES ==========
function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    const nivel = Math.floor(Math.sqrt(xpTotal / 100)) + 1;
    return Math.min(100, Math.max(1, nivel));
}

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}