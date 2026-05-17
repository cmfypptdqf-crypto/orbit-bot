// commands/social/amizadeOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

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
    aliases: ['friendship', 'friend', 'amizadeorbital'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.amizades) db.amizades = {};
        if (!db.amizades[userId]) db.amizades[userId] = [];
        
        // Adicionar XP por usar o comando
        const xpGanho = 5;
        const resultadoXP = adicionarXP(userId, xpGanho, 'amizade');
        
        // ========== ADICIONAR ==========
        if (subcmd === 'adicionar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!amizade adicionar @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode adicionar a si mesmo orbitalmente!');
            
            if (db.amizades[userId].includes(user.id)) return message.reply('❌ Vocês já são amigos orbitais!');
            
            db.amizades[userId].push(user.id);
            if (!db.amizades[user.id]) db.amizades[user.id] = [];
            if (!db.amizades[user.id].includes(userId)) db.amizades[user.id].push(userId);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🤝 Amizade Orbital!')
                .setDescription(`✨ ${message.author} e ${user.username} agora são amigos orbitais!`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • A amizade orbital é uma conexão estelar!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== REMOVER ==========
        else if (subcmd === 'remover') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!amizade remover @usuario`');
            
            if (!db.amizades[userId].includes(user.id)) return message.reply('❌ Vocês não são amigos orbitais!');
            
            db.amizades[userId] = db.amizades[userId].filter(id => id !== user.id);
            if (db.amizades[user.id]) {
                db.amizades[user.id] = db.amizades[user.id].filter(id => id !== userId);
            }
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('💔 Amizade Orbital Desfeita!')
                .setDescription(`💫 A amizade orbital entre ${message.author} e ${user.username} foi desfeita.`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • As órbitas nem sempre se alinham...' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== LISTAR ==========
        else if (subcmd === 'listar') {
            const amigos = [];
            for (const id of db.amizades[userId]) {
                try {
                    const user = await client.users.fetch(id);
                    amigos.push(user.username);
                } catch (e) {}
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle(`🤝 Amizades Orbitais de ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(amigos.join('\n') || '🌌 Nenhuma amizade orbital ainda.')
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Use bt!amizade adicionar @user para fazer amigos orbitais!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🤝 Amizade Orbital - Sistema de Amizade')
                .setDescription('Comandos orbitais disponíveis:')
                .addFields(
                    { name: '➕ `bt!amizade adicionar @user`', value: 'Adiciona alguém como amigo orbital', inline: false },
                    { name: '➖ `bt!amizade remover @user`', value: 'Remove um amigo orbital', inline: false },
                    { name: '📋 `bt!amizade listar`', value: 'Lista seus amigos orbitais', inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (comando orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • A amizade orbital é uma conexão estelar!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};