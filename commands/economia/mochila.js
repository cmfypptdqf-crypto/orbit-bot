// commands/economia/mochilaEstelar.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const nomesItens = {
    '1': '🔭 Telescópio Orbital', '2': '🚀 Nave Explorer', '3': '💍 Anel Cósmico',
    '4': '🛡️ Escudo Orbital', '5': '👻 Capa Estelar', '6': '🚨 Alarme Orbital',
    '7': '⭐ Orbit Prime Bronze', '8': '⭐ Orbit Prime Prata', '9': '⭐ Orbit Prime Ouro',
    '10': '⭐ Orbit Prime Diamante', '11': '🍀 Amuleto Orbital', '12': '📈 Ação Orbital',
    '13': '🎰 Nebula Crate', '14': '🚀 Nave Hiperespacial', '15': '💎 Cristal Orbital'
};

module.exports = {
    name: 'mochila',
    aliases: ['inv', 'inventario', 'itens', 'bag', 'mochilaestelar'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const inventario = db.usuarios[userId].inventario || {};
        const itensLista = Object.entries(inventario);
        
        if (itensLista.length === 0) {
            return message.reply(`🎒 **Mochila Estelar** de ${user.username} está vazia! Visite a **Galaxy Store** para adquirir itens orbitais!`);
        }
        
        let totalItens = 0;
        for (const [_, qtd] of itensLista) totalItens += qtd;
        
        // Adicionar XP por consultar a mochila
        const xpGanho = 3;
        const resultadoXP = adicionarXP(userId, xpGanho, 'mochila');
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle(`🎒 Mochila Estelar de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`📦 **${totalItens} itens orbitais** no total`)
            .addFields(
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta à mochila)`, inline: true }
            );
        
        for (const [id, qtd] of itensLista.slice(0, 15)) {
            const nome = nomesItens[id] || `Item Orbital ${id}`;
            embed.addFields({ name: nome, value: `📦 Quantidade: ${qtd}`, inline: true });
        }
        
        if (itensLista.length > 15) {
            embed.setFooter({ text: `+ ${itensLista.length - 15} outros itens orbitais` });
        }
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};