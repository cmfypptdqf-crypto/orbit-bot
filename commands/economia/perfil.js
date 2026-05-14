// commands/economia/perfil.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getBonusDoUsuario } = require('../utilidades/galaxiaBonus.js');
const { calcularNivel, getTituloPorNivel } = require('../utilidades/levelSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {}, clans: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Lista de medalhas disponíveis
const todasBadges = [
    { id: '1', nome: '🚀 Explorador Iniciante', desc: 'Completou 10 missões', requisito: (data) => (data.total_missoes || 0) >= 10 },
    { id: '2', nome: '⭐ Veterano Espacial', desc: 'Completou 100 missões', requisito: (data) => (data.total_missoes || 0) >= 100 },
    { id: '3', nome: '💰 Magnata Cósmico', desc: 'Acumulou 1.000.000 Orbs', requisito: (data) => ((data.carteira || 0) + (data.banco || 0)) >= 1000000 },
    { id: '4', nome: '🛸 Caçador de Naves', desc: 'Realizou 50 ataques', requisito: (data) => (data.total_ataques || 0) >= 50 },
    { id: '5', nome: '👑 Lenda Galáctica', desc: 'Top 10 do ranking', requisito: (data) => (data.ranking || 0) <= 10 },
    { id: '6', nome: '💎 Colecionador', desc: 'Possui 10 itens diferentes', requisito: (data) => Object.keys(data.inventario || {}).length >= 10 },
    { id: '7', nome: '⚔️ Guerreiro Estelar', desc: 'Venceu 20 batalhas', requisito: (data) => (data.vitorias || 0) >= 20 }
];

// Nomes dos itens
const nomesItens = {
    '1': '🔭 Telescópio', '2': '🚀 Nave Explorer', '3': '💍 Anel Cósmico',
    '4': '🛡️ Escudo', '5': '👻 Capa', '6': '🚨 Alarme',
    '11': '🍀 Amuleto', '12': '📈 Ação', '13': '🎰 Caça-Níquel',
    '14': '🚀 Nave Hiperespacial', '15': '💎 Cristal Cósmico'
};

module.exports = {
    name: 'perfil',
    aliases: ['profile', 'me', 'perfilg'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0, total_ataques: 0, vitorias: 0 };
        }
        
        const userData = db.usuarios[userId];
        const carteira = userData.carteira || 0;
        const banco = userData.banco || 0;
        const totalOrbs = carteira + banco;
        
        // ========== NÍVEL E TÍTULO ==========
        const nivel = calcularNivel(totalOrbs);
        const titulo = getTituloPorNivel(nivel);
        const xpNecessario = nivel * 1000;
        const xpAtualValue = totalOrbs % xpNecessario;
        const progresso = Math.floor((xpAtualValue / xpNecessario) * 100);
        const barraProgresso = gerarBarraProgresso(progresso, 20);
        
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
        
        // ========== CLÃ E GALÁXIA ==========
        let clanInfo = null;
        let galaxiaBonus = null;
        
        if (userData.clan && db.clans[userData.clan]) {
            const clan = db.clans[userData.clan];
            clanInfo = { nome: clan.nome, level: clan.level, membros: clan.membros.length };
            if (clan.galaxiaAtual) {
                galaxiaBonus = getBonusDoUsuario(userId, 'carteira');
            }
        }
        
        // ========== BADGES ==========
        const badgesConquistadas = todasBadges.filter(b => b.requisito(userData));
        
        // ========== INVENTÁRIO ==========
        const inventario = userData.inventario || {};
        const totalItens = Object.values(inventario).reduce((a, b) => a + b, 0);
        const tiposItens = Object.keys(inventario).length;
        
        // ========== ESTATÍSTICAS ==========
        const missoes = userData.total_missoes || 0;
        const ataques = userData.total_ataques || 0;
        const vitorias = userData.vitorias || 0;
        const taxaVitoria = ataques > 0 ? Math.round((vitorias / ataques) * 100) : 0;
        
        // ========== TÍTULOS DO USUÁRIO ==========
        const titulosAdquiridos = userData.titulos || [];
        const tituloAtivo = userData.tituloAtivo;
        
        // Criar embed
        const embed = new EmbedBuilder()
            .setColor(isVip ? 0xFFD700 : 0x00BFFF)
            .setTitle(`📋 Perfil de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`🏷️ ${titulo}\n${userData.tituloAtivo ? `📌 Título equipado: *${userData.tituloAtivo}*` : ''}`)
            .setTimestamp();
        
        // ========== ORBS ==========
        embed.addFields({
            name: '💎 ORBS',
            value: `💵 Carteira: **${carteira.toLocaleString()}**\n🏦 Banco: **${banco.toLocaleString()}**\n📊 Total: **${totalOrbs.toLocaleString()}**`,
            inline: true
        });
        
        // ========== NÍVEL ==========
        embed.addFields({
            name: '🏆 NÍVEL',
            value: `${barraProgresso}\n📊 ${xpAtualValue.toLocaleString()} / ${xpNecessario.toLocaleString()} XP (${progresso}%)`,
            inline: true
        });
        
        // ========== VIP ==========
        if (isVip) {
            let vipIcon = vipTier === 'diamante' ? '💎' : vipTier === 'ouro' ? '⭐' : vipTier === 'prata' ? '✨' : '🌟';
            embed.addFields({
                name: '⭐ VIP',
                value: `${vipIcon} **${vipTier?.toUpperCase()}** (${vipMult}x)\n⏰ Expira: <t:${Math.floor(vipExpira / 1000)}:R>`,
                inline: true
            });
        } else {
            embed.addFields({
                name: '⭐ VIP',
                value: '❌ Não é VIP\nCompre na loja: `bt!mercadogalactico`',
                inline: true
            });
        }
        
        // ========== CLÃ ==========
        if (clanInfo) {
            embed.addFields({
                name: '🚀 CLÃ',
                value: `**${clanInfo.nome}**\n📊 Nível ${clanInfo.level}\n👥 ${clanInfo.membros} membros`,
                inline: true
            });
        }
        
        // ========== BADGES ==========
        if (badgesConquistadas.length > 0) {
            const badgesTexto = badgesConquistadas.slice(0, 5).map(b => b.nome).join('\n');
            embed.addFields({
                name: `🏅 MEDALHAS (${badgesConquistadas.length}/${todasBadges.length})`,
                value: badgesTexto,
                inline: true
            });
        }
        
        // ========== INVENTÁRIO ==========
        if (totalItens > 0) {
            const itensTexto = Object.entries(inventario).slice(0, 5).map(([id, qtd]) => {
                const nome = nomesItens[id] || `Item ${id}`;
                return `${nome} x${qtd}`;
            }).join('\n');
            
            embed.addFields({
                name: `🎒 INVENTÁRIO (${tiposItens} tipos, ${totalItens} itens)`,
                value: itensTexto + (Object.keys(inventario).length > 5 ? `\n... e ${Object.keys(inventario).length - 5} outros` : ''),
                inline: false
            });
        }
        
        // ========== ESTATÍSTICAS ==========
        embed.addFields({
            name: '📊 ESTATÍSTICAS',
            value: `🚀 Missões: **${missoes}**\n☄️ Ataques: **${ataques}**\n⚔️ Vitórias: **${vitorias}** (${taxaVitoria}%)`,
            inline: false
        });
        
        // ========== BÔNUS DO CLÃ ==========
        if (galaxiaBonus && galaxiaBonus.bonus > 1.0) {
            embed.addFields({
                name: '🌌 BÔNUS ATIVO',
                value: `✨ +${Math.round((galaxiaBonus.bonus - 1) * 100)}% em todos ganhos`,
                inline: false
            });
        }
        
        embed.setFooter({ text: `ID: ${userId} • Use bt!perfil @usuario para ver outros perfis` });
        
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}