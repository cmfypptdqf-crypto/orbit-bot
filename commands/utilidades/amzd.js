// commands/social/amizade.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, amizades: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'amizade',
    aliases: ['friendship', 'friend'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.amizades) db.amizades = {};
        if (!db.amizades[userId]) db.amizades[userId] = [];
        
        if (subcmd === 'adicionar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!amizade adicionar @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode adicionar a si mesmo!');
            
            if (db.amizades[userId].includes(user.id)) return message.reply('❌ Vocês já são amigos!');
            
            db.amizades[userId].push(user.id);
            if (!db.amizades[user.id]) db.amizades[user.id] = [];
            if (!db.amizades[user.id].includes(userId)) db.amizades[user.id].push(userId);
            saveDB(db);
            
            await message.reply(`🤝 ${message.author} e ${user.username} agora são amigos!`);
        }
        
        else if (subcmd === 'listar') {
            const amigos = [];
            for (const id of db.amizades[userId]) {
                try {
                    const user = await client.users.fetch(id);
                    amigos.push(user.username);
                } catch (e) {}
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`🤝 Amigos de ${message.author.username}`)
                .setDescription(amigos.join('\n') || 'Nenhum amigo ainda.')
                .setFooter({ text: 'Use bt!amizade adicionar @user para fazer amigos!' });
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🤝 **Sistema de Amizade**\n`bt!amizade adicionar @user`\n`bt!amizade listar`');
        }
    }
};