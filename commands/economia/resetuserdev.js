// commands/admin/removerVipDev.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DEVELOPERS_IDS = ['SEU_ID_DISCORD_AQUI'];

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'removervipl',
    aliases: ['removevip', 'deletevipdev'],
    
    async executePrefix(message, args, client) {
        if (!DEVELOPERS_IDS.includes(message.author.id)) {
            return message.reply('❌ Acesso orbital negado! Apenas desenvolvedores.');
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!removervipl @usuario`');
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.vip_list || !db.vip_list[userId]) {
            return message.reply(`❌ ${user.username} não possui Orbit Prime ativo!`);
        }
        
        const vipInfo = db.vip_list[userId];
        delete db.vip_list[userId];
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⭐ Orbit Prime Removido!')
            .setDescription(`**${user.username}** perdeu o Orbit Prime!`)
            .addFields(
                { name: '🎯 Tier Anterior', value: vipInfo.tier.toUpperCase(), inline: true },
                { name: '👑 Removido por', value: message.author.tag, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Ação registrada pelo desenvolvedor' });
        
        await message.reply({ embeds: [embed] });
    }
};