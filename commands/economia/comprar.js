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

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'comprar',
    aliases: ['buy', 'compraritem'],
    
    async executePrefix(message, args, client) {
        const itemId = parseInt(args[0]);
        if (!itemId) return message.reply(`❌ Use: ${client.prefix}comprar <id>\nVeja os IDs em ${client.prefix}shop`);
        
        const items = [
            { id: 1, nome: '🎨 Cargo Colorido', preco: 5000, desc: 'Cargo personalizado' },
            { id: 2, nome: '🐶 Pet Virtual', preco: 3000, desc: 'Animal de estimação' },
            { id: 3, nome: '📈 Multiplicador x2', preco: 10000, desc: 'Dobra ganhos' },
            { id: 4, nome: '🖼️ Banner no Servidor', preco: 15000, desc: 'Banner personalizado' },
            { id: 5, nome: '🎵 Música Personalizada', preco: 8000, desc: 'Música no voice' },
            { id: 6, nome: '💎 VIP Pass', preco: 25000, desc: 'Acesso VIP' },
            { id: 7, nome: '🔨 Hammer de Ban', preco: 50000, desc: 'Fake ban' },
            { id: 8, nome: '🎰 Cassino', preco: 20000, desc: 'Comando de aposta' }
        ];
        
        const item = items.find(i => i.id === itemId);
        if (!item) return message.reply('❌ Item não encontrado! Use `bt!shop`');
        
        const db = getDB();
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        let carteira = db[`carteira_${userId}_${guildId}`] || 0;
        
        if (carteira < item.preco) {
            return message.reply(`❌ Você precisa de **${item.preco} moedas** para comprar ${item.nome}.\nVocê tem apenas ${carteira} moedas.`);
        }
        
        // Descontar o dinheiro
        db[`carteira_${userId}_${guildId}`] = carteira - item.preco;
        
        // Adicionar ao inventário
        if (!db[`inventory_${userId}_${guildId}`]) {
            db[`inventory_${userId}_${guildId}`] = [];
        }
        db[`inventory_${userId}_${guildId}`].push({
            id: item.id,
            nome: item.nome,
            compradoEm: new Date().toISOString()
        });
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ COMPRA REALIZADA!')
            .setDescription(`Você comprou **${item.nome}** por ${item.preco} moedas!`)
            .addFields(
                { name: '📦 Item', value: item.nome, inline: true },
                { name: '💰 Preço', value: `${item.preco} moedas`, inline: true },
                { name: '💵 Saldo restante', value: `${db[`carteira_${userId}_${guildId}`]} moedas`, inline: true }
            )
            .setFooter({ text: `Use ${client.prefix}inventory para ver seus itens` });
        
        await message.reply({ embeds: [embed] });
        
        // Efeito especial para itens específicos
        if (item.id === 7) {
            message.channel.send('🔨 **ATENÇÃO!** 🔨\nUse `bt!fakeban @user` para dar um susto nos amigos! (é só brincadeira)');
        }
        if (item.id === 8) {
            message.channel.send('🎰 **CASSINO DESBLOQUEADO!** 🎰\nAgora você pode usar `bt!apostar <valor>` para tentar a sorte!');
        }
    }
};