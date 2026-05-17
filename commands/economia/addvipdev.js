// commands/admin/darVipDev.js
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

const tiers = {
    'bronze': { mult: 1.2, dias: 7 },
    'prata': { mult: 1.5, dias: 15 },
    'ouro': { mult: 2.0, dias: 30 },
    'diamante': { mult: 3.0, dias: 60 }
};

module.exports = {
    name: 'darvipl',
    aliases: ['givevip', 'addvipdev'],
    
    async executePrefix(message, args, client) {
        if (!DEVELOPERS_IDS.includes(message.author.id)) {
            return message.reply('❌ Acesso orbital negado! Apenas desenvolvedores.');
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!darvipl @usuario <tier> <dias>`');
        
        const tier = args[1]?.toLowerCase();
        const dias = parseInt(args[2]) || 30;
        
        if (!tier || !tiers[tier]) {
            return message.reply('❌ Tier inválido! Opções: bronze, prata, ouro, diamante');
        }
        
        const db = getDB();
        const userId = user.id;
        
        const agora = Date.now();
        const expira = agora + (dias * 86400000);
        
        if (!db.vip_list) db.vip_list = {};
        db.vip_list[userId] = {
            tier: tier,
            expira: expira,
            multiplicador: tiers[tier].mult
        };
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('⭐ Orbit Prime Ativado!')
            .setDescription(`**${user.username}** agora é **VIP ${tier.toUpperCase()}** por ${dias} dias!`)
            .addFields(
                { name: '✨ Multiplicador', value: `${tiers[tier].mult}x`, inline: true },
                { name: '👑 Ativado por', value: message.author.tag, inline: true },
                { name: '⏰ Expira em', value: `<t:${Math.floor(expira / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Ação registrada pelo desenvolvedor' });
        
        await message.reply({ embeds: [embed] });
    }
};