// commands/perfil/perfil.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel, getTituloPorNivel } = require('../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {}, clans: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Funções auxiliares
function gerarBarraProgresso(percentual, tamanho = 15) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}

function getTierIcon(tier) {
    switch(tier?.toLowerCase()) {
        case 'diamante': return '💎';
        case 'ouro': return '⭐';
        case 'prata': return '✨';
        case 'bronze': return '🌟';
        default: return '💎';
    }
}

module.exports = {
    name: 'perfil',
    aliases: ['profile', 'me', 'stats'],
    
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
                carteira: 0, banco: 0, xpTotal: 0, bio: '🌌 Explorador Espacial',
                total_missoes: 0, total_ataques: 0, vitorias: 0, reputacao: 0,
                inventario: {}, titulos: [], tituloAtivo: null,
                background: 'espaco', tema: 'default', banner: null
            };
        }
        
        const userData = db.usuarios[userId];
        
        // ========== INFORMAÇÕES BÁSICAS ==========
        const carteira = userData.carteira || 0;
        const banco = userData.banco || 0;
        const totalOrbs = carteira + banco;
        const xpTotal = userData.xpTotal || 0;
        
        // ========== NÍVEL E PROGRESSO ==========
        const nivel = calcularNivel(xpTotal);
        const xpNecessario = nivel * 1000;
        const xpAtual = xpTotal % xpNecessario;
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        const barraProgresso = gerarBarraProgresso(progresso, 15);
        const titulo = getTituloPorNivel(nivel);
        
        // ========== TÍTULO ATIVO ==========
        const tituloAtivo = userData.tituloAtivo ? userData.tituloAtivo : '🌱 Aprendiz Cósmico';
        
        // ========== VIP ==========
        let isVip = false;
        let vipTier = null;
        let vipMult = 1.0;
        let vipExpira = null;
        
        if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            isVip = true;
            vipTier = db.vip_list[userId].tier;
            vipMult = db.vip_list[userId].multiplicador || 1.5;
            vipExpira = db.vip_list[userId].expira;
        }
        
        // ========== CLÃ ==========
        let clanNome = null;
        let clanLevel = null;
        let galaxiaNome = null;
        
        if (userData.clan && db.clans[userData.clan]) {
            const clan = db.clans[userData.clan];
            clanNome = clan.nome;
            clanLevel = clan.level;
            if (clan.galaxiaAtual) {
                const galaxias = {
                    'via_lactea': '🌌 Via Láctea',
                    'andromeda': '🌀 Andrômeda',
                    'triangulo': '🔺 Triângulo',
                    'olho_negro': '👁️ Olho Negro',
                    'sombreiro': '🎩 Sombreiro',
                    'centaurus': '⚡ Centaurus A',
                    'rosquinha': '🍩 Galáxia do Anel'
                };
                galaxiaNome = galaxias[clan.galaxiaAtual] || 'Desconhecida';
            }
        }
        
        // ========== ESTATÍSTICAS ==========
        const missoes = userData.total_missoes || 0;
        const ataques = userData.total_ataques || 0;
        const vitorias = userData.vitorias || 0;
        const taxaVitoria = ataques > 0 ? Math.round((vitorias / ataques) * 100) : 0;
        const reputacao = userData.reputacao || 0;
        
        let reputacaoNivel = '';
        if (reputacao >= 100) reputacaoNivel = '👑 Lendário';
        else if (reputacao >= 50) reputacaoNivel = '🌟 Respeitado';
        else if (reputacao >= 10) reputacaoNivel = '👍 Confiável';
        else reputacaoNivel = '🌱 Novato';
        
        // ========== INVENTÁRIO ==========
        const inventario = userData.inventario || {};
        const totalItens = Object.values(inventario).reduce((a, b) => a + b, 0);
        const tiposItens = Object.keys(inventario).length;
        
        // ========== TÍTULOS ADQUIRIDOS ==========
        const titulosAdquiridos = userData.titulos || [];
        
        // ========== BIO ==========
        const bio = userData.bio || '🌌 Explorador Espacial em busca de aventuras!';
        
        // ========== EVOLUÇÃO ==========
        const evolucao = userData.evolucao || 1;
        const evolucoes = {
            1: '🌟 Estagiário',
            2: '⚔️ Guerreiro',
            3: '🛡️ Cavaleiro',
            4: '👑 Lorde',
            5: '✨ Divindade'
        };
        const evolucaoNome = evolucoes[evolucao] || '🌟 Estagiário';
        
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
        
        // ========== BACKGROUND ==========
        const backgrounds = {
            'espaco': '🌌',
            'nebulosa': '🌫️',
            'planeta': '🪐',
            'estrelas': '⭐'
        };
        const backgroundIcon = backgrounds[userData.background] || '🌌';
        
        // ========== CRIAÇÃO DO EMBED ==========
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${backgroundIcon} Perfil de ${user.username} ${isVip ? '⭐' : ''}`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setDescription(`📝 *${bio}*`)
            .setTimestamp();
        
        // Linha 1: Informações básicas
        embed.addFields({
            name: '📌 IDENTIFICAÇÃO',
            value: `🎭 **Título:** ${tituloAtivo}\n🏆 **Evolução:** ${evolucaoNome}\n📊 **Temporada:** ${Math.floor(Date.now() / 86400000) % 100}`,
            inline: true
        });
        
        // Linha 2: Orbs
        embed.addFields({
            name: '💎 ORBS',
            value: `💵 **Carteira:** ${carteira.toLocaleString()}\n🏦 **Orbital Bank:** ${banco.toLocaleString()}\n📊 **Total:** ${totalOrbs.toLocaleString()}`,
            inline: true
        });
        
        // Linha 3: Nível e XP
        embed.addFields({
            name: '✨ STELLAR XP',
            value: `🏆 **Nível:** ${nivel} - ${titulo}\n${barraProgresso} **${progresso}%**\n📈 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP`,
            inline: true
        });
        
        // Linha 4: VIP e Clã
        let vipInfo = '❌ **Inativo**\nCompre na Galaxy Store!';
        if (isVip) {
            vipInfo = `${getTierIcon(vipTier)} **${vipTier?.toUpperCase()}**\n✨ Multiplicador: ${vipMult}x\n⏰ Expira: <t:${Math.floor(vipExpira / 1000)}:R>`;
        }
        
        embed.addFields({
            name: '⭐ ORBIT PRIME',
            value: vipInfo,
            inline: true
        });
        
        if (clanNome) {
            embed.addFields({
                name: '🚀 STAR FEDERATION',
                value: `**${clanNome}**\n📊 Nível ${clanLevel}\n${galaxiaNome ? `🌌 Galáxia: ${galaxiaNome}` : '🏠 Sem galáxia'}`,
                inline: true
            });
        } else {
            embed.addFields({
                name: '🚀 STAR FEDERATION',
                value: '❌ **Sem clã**\nCrie um com `bt!clan criar`',
                inline: true
            });
        }
        
        // Linha 5: Estatísticas de batalha
        embed.addFields({
            name: '⚔️ ESTATÍSTICAS',
            value: `🎯 **Missões:** ${missoes.toLocaleString()}\n☄️ **Ataques:** ${ataques.toLocaleString()}\n🏆 **Vitórias:** ${vitorias.toLocaleString()} (${taxaVitoria}%)`,
            inline: true
        });
        
        // Linha 6: Social
        embed.addFields({
            name: '⭐ SOCIAL',
            value: `🎭 **Reputação:** ${reputacao} (${reputacaoNivel})\n🎒 **Itens:** ${totalItens} (${tiposItens} tipos)\n🏷️ **Títulos:** ${titulosAdquiridos.length}`,
            inline: true
        });
        
        // Linha 7: Conquistas (resumo)
        const conquistas = [
            { nome: '💰 Milionário', obtido: totalOrbs >= 1000000 },
            { nome: '⚔️ Veterano', obtido: ataques >= 100 },
            { nome: '🎯 Mestre', obtido: missoes >= 100 },
            { nome: '👑 Lendário', obtido: nivel >= 50 },
            { nome: '🌟 Evoluído', obtido: evolucao >= 3 }
        ];
        const conquistasObtidas = conquistas.filter(c => c.obtido).length;
        
        embed.addFields({
            name: '🏆 CONQUISTAS',
            value: `📊 Progresso: **${conquistasObtidas}/${conquistas.length}**\n${conquistas.map(c => `${c.obtido ? '✅' : '🔒'} ${c.nome}`).join(' • ')}`,
            inline: false
        });
        
        
        
        // Linha 9: Itens especiais (destaque)
        const itensEspeciais = [];
        if (inventario['4'] > 0) itensEspeciais.push(`🛡️ Escudo x${inventario['4']}`);
        if (inventario['5'] > 0) itensEspeciais.push(`👻 Capa x${inventario['5']}`);
        if (inventario['6'] > 0) itensEspeciais.push(`🚨 Alarme x${inventario['6']}`);
        if (inventario['11'] > 0) itensEspeciais.push(`🍀 Amuleto x${inventario['11']}`);
        if (inventario['13'] > 0) itensEspeciais.push(`🎰 Caça-Níquel x${inventario['13']}`);
        
        if (itensEspeciais.length > 0) {
            embed.addFields({
                name: '🎒 ITENS ESPECIAIS',
                value: itensEspeciais.join(' • '),
                inline: false
            });
        }
        
        // Linha 10: Datas importantes
        const member = await message.guild.members.fetch(user.id);
        embed.addFields({
            name: '📅 DATAS',
            value: `📆 **Entrou no servidor:** <t:${Math.floor(member.joinedTimestamp / 1000)}:D>\n🔰 **Conta criada:** <t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
            inline: false
        });
        
        // Rodapé
        embed.setFooter({ text: `🆔 ID: ${userId} • Use bt!perfil @usuario para ver outros perfis` });
        
        // Adicionar banner se existir
        if (userData.banner) {
            embed.setImage(userData.banner);
        }
        
        await message.reply({ embeds: [embed] });
    }
};