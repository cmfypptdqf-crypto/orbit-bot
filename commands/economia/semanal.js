// commands/economia/semanal.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cooldownsManager = require('../../utils/cooldownsManager.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'semanal',
    aliases: ['weekly', 'bonus_semanal'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // VERIFICAR COOLDOWN
        const cooldownCheck = cooldownsManager.check(userId, 'weekly');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde **${cooldownCheck.formatted}** para pegar seu próximo bônus semanal!`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const bonus = 1500;
        
        db.usuarios[userId].banco = (db.usuarios[userId].banco || 0) + bonus;
        saveDB(db);
        
        // REGISTRAR COOLDOWN
        cooldownsManager.set(userId, 'weekly');
        
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('📅 Bônus Semanal!')
            .setDescription(`🎉 Você recebeu **${bonus} Orbs** no banco!`)
            .addFields(
                { name: '🏦 Banco', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: 'Volte semana que vem! Use bt!cooldowns para ver os tempos' });
        
        await message.reply({ embeds: [embed] });
    }
};