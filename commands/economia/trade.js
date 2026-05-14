// commands/economia/trade.js
let trades = {};

module.exports = {
    name: 'trade',
    description: 'Troque itens com outros jogadores',
    aliases: ['trocar'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione um usuário para trocar!');
        
        const itemId = args[1];
        const quantidade = parseInt(args[2]) || 1;
        
        const db = getDB();
        const userId = message.author.id;
        
        if ((db.usuarios[userId]?.inventario?.[itemId] || 0) < quantidade) {
            return message.reply('❌ Você não tem este item!');
        }
        
        const tradeId = `${userId}_${user.id}`;
        
        if (!trades[tradeId]) {
            trades[tradeId] = {
                user1: userId,
                user2: user.id,
                items1: [],
                items2: []
            };
        }
        
        trades[tradeId].items1.push({ id: itemId, qtd: quantidade });
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🔄 Proposta de Troca')
            .setDescription(`${message.author} propôs uma troca com ${user}`)
            .addFields({ name: '📦 Itens oferecidos', value: `Item ${itemId} x${quantidade}`, inline: true })
            .setFooter({ text: `${user.username}, use !trade aceitar ${tradeId} para aceitar` });
        
        await message.reply({ embeds: [embed] });
    }
};