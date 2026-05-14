// commands/economia/perfil.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {}, badges: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Lista de todas as medalhas disponíveis
const todasBadges = [
    { id: '1', nome: '🚀 Explorador Iniciante', desc: 'Completou 10 missões', requisito: (data) => (data.total_missoes || 0) >= 10 },
    { id: '2', nome: '⭐ Veterano Espacial', desc: 'Completou 100 missões', requisito: (data) => (data.total_missoes || 0) >= 100 },
    { id: '3', nome: '💰 Magnata Cósmico', desc: 'Acumulou 1.000.000 Orbs', requisito: (data) => ((data.carteira || 0) + (data.banco || 0)) >= 1000000 },
    { id: '4', nome: '🛸 Caçador de Naves', desc: 'Realizou 50 ataques', requisito: (data) => (data.total_ataques || 0) >= 50 },
    { id: '5', nome: '👑 Lenda Galáctica', desc: 'Top 10 do ranking', requisito: (data) => (data.ranking || 0) <= 10 },
    { id: '6', nome: '💎 Colecionador', desc: 'Possui 10 itens diferentes', requisito: (data) => Object.keys(data.inventario || {}).length >= 10 },
    { id: '7', nome: '⚔️ Guerreiro Estelar', desc: 'Venceu 20 batalhas', requisito: (data) => (data.vitorias || 0) >= 20 }
];

// Títulos disponíveis
const titulos = {
    '1': { nome: '🌱 Recruta Estelar', preco: 1000, nivelMin: 0 },
    '2': { nome: '⚔️ Guerreiro Cósmico', preco: 5000, nivelMin: 10 },
    '3': { nome: '👑 Lorde das Estrelas', preco: 10000, nivelMin: 25 },
    '4': { nome: '🐉 Dragão Galáctico', preco: 50000, nivelMin: 50 },
    '5': { nome: '✨ Divindade Espacial', preco: 100000, nivelMin: 100 }
};

module.exports = {
    name: 'perfil',
    description: 'Seu perfil completo',
    aliases: ['profile', 'me', 'stats'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        // Inicializar usuário se não existir
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { 
                carteira: 0, 
                banco: 0, 
                inventario: {}, 
                total_missoes: 0,
                total_ataques: 0,
                vitorias: 0,
                titulos: [],
                tituloAtivo: null
            };
            saveDB(db);
        }
        
        const userData = db.usuarios[userId];
        
        // ========== ORBS ==========
        const carteira = userData.carteira || 0;
        const banco = userData.banco || 0;
        const totalOrbs = carteira + banco;
        
        // ========== NÍVEL ==========
        const level = Math.floor(Math.log10(totalOrbs / 100 + 1) * 15) || 1;
        const xpAtual = totalOrbs % 1000;
        const xpNecessario = 1000;
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        
        // ========== VIP ==========
        let isVip = false;
        let vipTier = null;
        let vipExpira = null;
        let vipMult = 1.0;
        
        if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            isVip = true;
            vipTier = db.vip_list[userId].tier;
            vipExpira = db.vip_list[userId].expira;
            vipMult = db.vip_list[userId].multiplicador || 1.5;
        }
        
        // ========== BADGES ==========
        const badgesConquistadas = [];
        for (const badge of todasBadges) {
            if (badge.requisito(userData)) {
                badgesConquistadas.push(badge);
            }
        }
        
        // ========== TÍTULOS ==========
        const titulosAdquiridos = userData.titulos || [];
        const tituloAtivo = userData.tituloAtivo;
        const tituloAtivoNome = tituloAtivo && titulos[tituloAtivo] ? titulos[tituloAtivo].nome : 'Nenhum';
        
        // ========== ITENS ==========
        const inventario = userData.inventario || {};
        const totalItens = Object.values(inventario).reduce((a, b) => a + b, 0);
        const tiposItens = Object.keys(inventario).length;
        
        // ========== ESTATÍSTICAS ==========
        const missoes = userData.total_missoes || 0;
        const ataques = userData.total_ataques || 0;
        const vitorias = userData.vitorias || 0;
        
        // Criar embed
        const embed = new EmbedBuilder()
            .setColor(isVip ? 0xFFD700 : 0x00FF00)
            .setTitle(`📋 Perfil de ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setDescription(`${tituloAtivoNome !== 'Nenhum' ? `🏷️ *${tituloAtivoNome}*` : '🌌 Explorador Espacial'}`)
            .setTimestamp();
        
        // ========== ORBS ==========
        embed.addFields({
            name: '💎 ORBS',
            value: `💵 Carteira: **${carteira.toLocaleString()}**\n🏦 Banco: **${banco.toLocaleString()}**\n📊 Total: **${totalOrbs.toLocaleString()}**`,
            inline: true
        });
        
        // ========== PROGRESSO ==========
        const barraProgresso = gerarBarraProgresso(progresso, 20);
        embed.addFields({
            name: `🏆 NÍVEL ${level}`,
            value: `${barraProgresso}\n📊 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP (${progresso}%)`,
            inline: true
        });
        
        // ========== VIP ==========
        if (isVip) {
            let vipIcon = '⭐';
            if (vipTier === 'diamante') vipIcon = '💎';
            else if (vipTier === 'ouro') vipIcon = '⭐';
            else if (vipTier === 'prata') vipIcon = '✨';
            
            embed.addFields({
                name: '⭐ STATUS VIP',
                value: `${vipIcon} **${vipTier?.toUpperCase()}**\n🎯 Multiplicador: **${vipMult}x**\n⏰ Expira: <t:${Math.floor(vipExpira / 1000)}:R>`,
                inline: true
            });
        } else {
            embed.addFields({
                name: '⭐ VIP',
                value: '❌ Não é VIP\nCompre na loja: `bt!mercadogalactico`',
                inline: true
            });
        }
        
        // ========== BADGES ==========
        const badgeEmoji = ['🏅', '🎖️', '🏆', '⭐', '🌟', '💫', '✨'];
        const badgeTexto = badgesConquistadas.slice(0, 5).map((b, i) => `${badgeEmoji[i]} ${b.nome}`).join('\n');
        
        embed.addFields({
            name: `🏅 MEDALHAS (${badgesConquistadas.length}/${todasBadges.length})`,
            value: badgeTexto || 'Nenhuma medalha ainda...',
            inline: false
        });
        
        // ========== TÍTULOS ==========
        embed.addFields({
            name: `🏷️ TÍTULOS (${titulosAdquiridos.length}/${Object.keys(titulos).length})`,
            value: `📌 Ativo: **${tituloAtivoNome}**\n📚 Adquiridos: ${titulosAdquiridos.length}\n✨ Use \`bt!titulo meus\` para ver todos`,
            inline: true
        });
        
        // ========== INVENTÁRIO ==========
        embed.addFields({
            name: `🎒 INVENTÁRIO`,
            value: `📦 Total de itens: **${totalItens}**\n🔖 Tipos diferentes: **${tiposItens}**\n🛒 Use \`bt!mochila\` para ver detalhes`,
            inline: true
        });
        
        // ========== ESTATÍSTICAS ==========
        embed.addFields({
            name: '📊 ESTATÍSTICAS',
            value: `🚀 Missões: **${missoes}**\n☄️ Ataques: **${ataques}**\n⚔️ Vitórias: **${vitorias}**`,
            inline: true
        });
        
        // ========== BADGES FALTANTES (próximas conquistas) ==========
        const badgesFaltantes = todasBadges.filter(b => !badgesConquistadas.includes(b));
        if (badgesFaltantes.length > 0) {
            const proximas = badgesFaltantes.slice(0, 3).map(b => `🔜 ${b.nome}`).join('\n');
            embed.addFields({
                name: '🎯 PRÓXIMAS CONQUISTAS',
                value: proximas,
                inline: false
            });
        }
        
        // ========== RODAPÉ ==========
        embed.setFooter({ 
            text: `ID: ${userId} | Use bt!perfil @usuario para ver outros perfis` 
        });
        
        await message.reply({ embeds: [embed] });
    }
};

// Função para gerar barra de progresso
function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}

function saveDB(data) {
    const dbPath = path.join(__dirname, '..', '..', 'database.json');
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}