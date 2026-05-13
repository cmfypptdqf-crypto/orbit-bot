const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'shop',
    aliases: ['loja', 'store'],
    
    async executePrefix(message, args, client) {
        const items = [
            { id: 1, nome: '🎨 Cargo Colorido', preco: 5000, desc: 'Um cargo personalizado no servidor', emoji: '🎨' },
            { id: 2, nome: '🐶 Pet Virtual', preco: 3000, desc: 'Um animal de estimação virtual', emoji: '🐶' },
            { id: 3, nome: '📈 Multiplicador x2', preco: 10000, desc: 'Dobra seus ganhos por 1 hora', emoji: '📈' },
            { id: 4, nome: '🖼️ Banner no Servidor', preco: 15000, desc: 'Seu nome no banner do servidor', emoji: '🖼️' },
            { id: 5, nome: '🎵 Música Personalizada', preco: 8000, desc: 'Peça uma música no chat de voz', emoji: '🎵' },
            { id: 6, nome: '💎 VIP Pass', preco: 25000, desc: 'Acesso a canais exclusivos', emoji: '💎' },
            { id: 7, nome: '🔨 Hammer de Ban', preco: 50000, desc: 'Diverte-te com amigos (fake ban)', emoji: '🔨' },
            { id: 8, nome: '🎰 Cassino', preco: 20000, desc: 'Desbloqueia comandos de aposta', emoji: '🎰' }
        ];
        
        // Paginação
        let pagina = 1;
        const itemsPorPagina = 4;
        const totalPaginas = Math.ceil(items.length / itemsPorPagina);
        
        if (args[0] && !isNaN(args[0])) {
            pagina = parseInt(args[0]);
            if (pagina < 1) pagina = 1;
            if (pagina > totalPaginas) pagina = totalPaginas;
        }
        
        const start = (pagina - 1) * itemsPorPagina;
        const end = start + itemsPorPagina;
        const itemsPagina = items.slice(start, end);
        
        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle('🛒 LOJA DO SERVIDOR')
            .setDescription(`Use \`${client.prefix}comprar <id>\` para adquirir um item\nUse \`${client.prefix}shop <página>\` para navegar`)
            .setTimestamp();
        
        itemsPagina.forEach(item => {
            embed.addFields({
                name: `${item.emoji} ${item.id} - ${item.nome}`,
                value: `💰 Preço: **${item.preco} moedas**\n📝 ${item.desc}`,
                inline: false
            });
        });
        
        embed.setFooter({ text: `Página ${pagina} de ${totalPaginas} • ${client.prefix}inventory para ver seus itens` });
        
        await message.reply({ embeds: [embed] });
    }
};