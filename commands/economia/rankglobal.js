const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'rankglobal',
    aliases: ['globalrank', 'topglobal', 'liderancaglobal'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        
        // Coletar todos os usuários de TODOS os servidores
        const usuariosGlobal = new Map();
        
        for (const [key, value] of Object.entries(db)) {
            if (key.startsWith('carteira_')) {
                const parts = key.split('_');
                const userId = parts[1];
                const guildId = parts[2];
                const bankKey = `banco_${userId}_${guildId}`;
                const carteira = value || 0;
                const banco = db[bankKey] || 0;
                const total = carteira + banco;
                
                if (!usuariosGlobal.has(userId)) {
                    usuariosGlobal.set(userId, {
                        total: 0,
                        carteira: 0,
                        banco: 0,
                        servidores: []
                    });
                }
                
                const userData = usuariosGlobal.get(userId);
                userData.total += total;
                userData.carteira += carteira;
                userData.banco += banco;
                userData.servidores.push(guildId);
            }
        }
        
        // Converter para array e ordenar
        const ranking = [];
        for (const [userId, data] of usuariosGlobal) {
            let user = null;
            for (const guildId of data.servidores) {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    try {
                        user = await guild.members.fetch(userId).then(m => m.user).catch(() => null);
                        if (user) break;
                    } catch (e) {}
                }
            }
            
            if (user) {
                ranking.push({
                    user: user,
                    total: data.total,
                    carteira: data.carteira,
                    banco: data.banco,
                    servidores: data.servidores.length
                });
            }
        }
        
        ranking.sort((a, b) => b.total - a.total);
        
        if (ranking.length === 0) {
            return message.reply('📊 Nenhum usuário tem moedas ainda em nenhum servidor!');
        }
        
        const itensPorPagina = 10;
        const totalPaginas = Math.ceil(ranking.length / itensPorPagina);
        let paginaAtual = 1;
        
        function criarEmbed(pagina) {
            const inicio = (pagina - 1) * itensPorPagina;
            const fim = inicio + itensPorPagina;
            const topPagina = ranking.slice(inicio, fim);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🌍 Ranking Global de Riqueza')
                .setDescription(`Os usuários mais ricos em TODOS os servidores!\n📊 Total: **${ranking.length}** usuários | 🌍 **${new Set(ranking.flatMap(r => r.servidores)).size}** servidores`)
                .setFooter({ text: `Página ${pagina}/${totalPaginas}` })
                .setTimestamp();
            
            for (let i = 0; i < topPagina.length; i++) {
                const pos = inicio + i + 1;
                let medalha = '';
                if (pos === 1) medalha = '👑 ';
                else if (pos === 2) medalha = '🥈 ';
                else if (pos === 3) medalha = '🥉 ';
                
                embed.addFields({
                    name: `${medalha}#${pos} - ${topPagina[i].user.username}`,
                    value: `💰 ${topPagina[i].total.toLocaleString()} moedas (💵 ${topPagina[i].carteira.toLocaleString()} | 🏦 ${topPagina[i].banco.toLocaleString()})\n📌 ${topPagina[i].servidores} servidor(es)`,
                    inline: false
                });
            }
            
            return embed;
        }
        
        // Mostrar posição do usuário atual
        const userRank = ranking.findIndex(r => r.user.id === message.author.id) + 1;
        const userData = ranking.find(r => r.user.id === message.author.id);
        
        if (totalPaginas === 1) {
            const embed = criarEmbed(1);
            if (userRank > 0 && userData) {
                embed.setFooter({ 
                    text: `Sua posição global: #${userRank} de ${ranking.length} usuários | Patrimônio: ${userData.total.toLocaleString()} moedas` 
                });
            }
            return await message.reply({ embeds: [embed] });
        }
        
        // Criar botões de paginação
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_global')
                    .setLabel('◀ Anterior')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(paginaAtual === 1),
                new ButtonBuilder()
                    .setCustomId('next_global')
                    .setLabel('Próximo ▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(paginaAtual === totalPaginas)
            );
        
        const embed = criarEmbed(paginaAtual);
        if (userRank > 0 && userData) {
            embed.addFields({
                name: '📌 Sua posição',
                value: `#${userRank} de ${ranking.length} | Patrimônio: ${userData.total.toLocaleString()} moedas`,
                inline: false
            });
        }
        
        const msg = await message.reply({ embeds: [embed], components: [row] });
        
        // Coletor de interações
        const filter = (interaction) => {
            return interaction.user.id === message.author.id && 
                   (interaction.customId === 'prev_global' || interaction.customId === 'next_global');
        };
        
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });
        
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev_global' && paginaAtual > 1) {
                paginaAtual--;
            } else if (interaction.customId === 'next_global' && paginaAtual < totalPaginas) {
                paginaAtual++;
            } else {
                return await interaction.deferUpdate();
            }
            
            const newEmbed = criarEmbed(paginaAtual);
            if (userRank > 0 && userData) {
                newEmbed.addFields({
                    name: '📌 Sua posição',
                    value: `#${userRank} de ${ranking.length} | Patrimônio: ${userData.total.toLocaleString()} moedas`,
                    inline: false
                });
            }
            
            const newRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_global')
                        .setLabel('◀ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(paginaAtual === 1),
                    new ButtonBuilder()
                        .setCustomId('next_global')
                        .setLabel('Próximo ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(paginaAtual === totalPaginas)
                );
            
            await interaction.update({ embeds: [newEmbed], components: [newRow] });
        });
        
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_global')
                        .setLabel('◀ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next_global')
                        .setLabel('Próximo ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
            await msg.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};