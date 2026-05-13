const { EmbedBuilder } = require('discord.js');
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
    name: 'inventory',
    aliases: ['inv', 'itens', 'mochila'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        let inventory = db[`inventory_${userId}_${guildId}`] || [];
        
        if (inventory.length === 0) {
            return message.reply(`❌ Você não tem nenhum item!\nUse \`${client.prefix}shop\` para comprar itens.`);
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle(`🎒 Inventário de ${message.author.username}`)
            .setDescription(`Você tem **${inventory.length}** itens no total`)
            .setTimestamp();
        
        // Agrupar itens duplicados
        const itensAgrupados = {};
        inventory.forEach(item => {
            if (!itensAgrupados[item.nome]) {
                itensAgrupados[item.nome] = { ...item, quantidade: 1 };
            } else {
                itensAgrupados[item.nome].quantidade++;
            }
        });
        
        Object.values(itensAgrupados).forEach(item => {
            embed.addFields({
                name: `${item.nome} ${item.quantidade > 1 ? `(x${item.quantidade})` : ''}`,
                value: `📅 Comprado em: ${new Date(item.compradoEm).toLocaleDateString()}`,
                inline: false
            });
        });
        
        await message.reply({ embeds: [embed] });
    }
};