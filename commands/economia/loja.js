const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const itensLoja = {
    // Itens normais
    '1': { nome: '🔭 Telescópio Avançado', preco: 500, descricao: '+5% em explorações', tipo: 'search', bonus: 1.05 },
    '2': { nome: '🚀 Nave Explorer', preco: 800, descricao: '+10% em missões', tipo: 'missao', bonus: 1.10 },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, descricao: '+15% em todas atividades', tipo: 'all', bonus: 1.15 },
    '4': { nome: '🛡️ Escudo Energético', preco: 1500, descricao: 'Protege contra 1 roubo', tipo: 'protecao', duracao: 1 },
    '5': { nome: '👻 Capa da Invisibilidade', preco: 3000, descricao: '+20% chance em ataques', tipo: 'pirataria', bonus: 1.20 },
    '6': { nome: '🚨 Alarme Anti-Roubo', preco: 1000, descricao: '-30% chance de ser roubado', tipo: 'alarme', bonus: 0.7 },
    
    // Itens de upgrade VIP
    '7': { nome: '⭐ VIP Bronze', preco: 10000, descricao: 'Multiplicador x1.2 por 7 dias', tipo: 'vip', tier: 'bronze', mult: 1.2, dias: 7 },
    '8': { nome: '⭐ VIP Prata', preco: 25000, descricao: 'Multiplicador x1.5 por 15 dias', tipo: 'vip', tier: 'prata', mult: 1.5, dias: 15 },
    '9': { nome: '⭐ VIP Ouro', preco: 50000, descricao: 'Multiplicador x2.0 por 30 dias', tipo: 'vip', tier: 'ouro', mult: 2.0, dias: 30 },
    '10': { nome: '⭐ VIP Diamante', preco: 100000, descricao: 'Multiplicador x3.0 por 60 dias', tipo: 'vip', tier: 'diamante', mult: 3.0, dias: 60 },
    
    // Itens de evento
    '11': { nome: '🍀 Amuleto da Sorte', preco: 5000, descricao: 'Dobra chance de eventos positivos', tipo: 'sorte', bonus: 2 },
    '12': { nome: '📈 Ação da Bolsa', preco: 3000, descricao: '+50% em próximos 5 ganhos', tipo: 'boost', usos: 5, bonus: 1.5 },
    '13': { nome: '🎰 Caça-Níquel', preco: 2000, descricao: 'Gire para ganhar prêmios', tipo: 'slot' }
};

module.exports = {
    name: 'mercadogalactico',
    aliases: ['loja', 'shop', 'mercado', 'galactic'],
    
    async executePrefix(message, args, client) {
        let paginaAtual = parseInt(args[0]) || 1;
        const itensPorPagina = 5;
        const totalItens = Object.keys(itensLoja).length;
        const totalPaginas = Math.ceil(totalItens / itensPorPagina);
        
        if (paginaAtual < 1 || paginaAtual > totalPaginas) {
            return message.reply(`❌ Página inválida! Use 1 até ${totalPaginas}.`);
        }
        
        function criarEmbed(pagina) {
            const inicio = (pagina - 1) * itensPorPagina;
            const itensPagina = Object.entries(itensLoja).slice(inicio, inicio + itensPorPagina);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🪐 Mercado Galáctico')
                .setDescription('Use `bt!comprar <id>` para adquirir itens interestelares!\n🌌 Todas as transações são em **Orbs**')
                .setFooter({ text: `Página ${pagina}/${totalPaginas} • Total: ${totalItens} itens` });
            
            for (const [id, item] of itensPagina) {
                let precoText = `${item.preco.toLocaleString()} Orbs`;
                if (item.tipo === 'vip') {
                    precoText = `⭐ ${item.tier} | ${item.mult}x | ${item.dias} dias`;
                }
                embed.addFields({
                    name: `${id} - ${item.nome}`,
                    value: `💰 ${precoText}\n📝 ${item.descricao}`,
                    inline: false
                });
            }
            
            return embed;
        }
        
        // Se for apenas 1 página, não precisa de botões
        if (totalPaginas === 1) {
            const embed = criarEmbed(1);
            return await message.reply({ embeds: [embed] });
        }
        
        // Criar botões de navegação
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('◀ Anterior')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(paginaAtual === 1),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Próximo ▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(paginaAtual === totalPaginas)
            );
        
        const embed = criarEmbed(paginaAtual);
        const msg = await message.reply({ embeds: [embed], components: [row] });
        
        // Criar collector para os botões
        const filter = (interaction) => {
            return interaction.user.id === message.author.id && 
                   (interaction.customId === 'prev_page' || interaction.customId === 'next_page');
        };
        
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });
        
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev_page' && paginaAtual > 1) {
                paginaAtual--;
            } else if (interaction.customId === 'next_page' && paginaAtual < totalPaginas) {
                paginaAtual++;
            } else {
                return await interaction.deferUpdate();
            }
            
            const novoEmbed = criarEmbed(paginaAtual);
            const novoRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(paginaAtual === 1),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Próximo ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(paginaAtual === totalPaginas)
                );
            
            await interaction.update({ embeds: [novoEmbed], components: [novoRow] });
        });
        
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Próximo ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true)
                );
            await msg.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};