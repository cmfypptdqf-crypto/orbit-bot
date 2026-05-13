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
    name: 'roubar',
    aliases: ['rob', 'steal', 'assaltar'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione alguém para roubar!');
        if (user.id === message.author.id) return message.reply('❌ Você não pode roubar a si mesmo!');
        if (user.bot) return message.reply('❌ Você não pode roubar bots!');
        
        const db = getDB();
        const userId = message.author.id;
        const targetId = user.id;
        const guildId = message.guild.id;
        
        // Cooldown de 5 minutos
        const lastRob = db[`rob_${userId}_${guildId}`] || 0;
        const now = Date.now();
        const cooldown = 300000;
        
        if (lastRob && now - lastRob < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastRob)) / 60000);
            return message.reply(`⏰ Espere ${remaining} minutos antes de roubar novamente!`);
        }
        
        let vítimaCarteira = db[`carteira_${targetId}_${guildId}`] || 0;
        
        if (vítimaCarteira < 100) {
            return message.reply(`❌ ${user.username} é muito pobre para ser roubado! (menos de 100 moedas)`);
        }
        
        const sucesso = Math.random() < 0.35; // 35% de chance
        
        if (sucesso) {
            const roubado = Math.floor(vítimaCarteira * (Math.random() * 0.3 + 0.1));
            const valorFinal = Math.min(roubado, vítimaCarteira);
            
            db[`carteira_${targetId}_${guildId}`] = vítimaCarteira - valorFinal;
            db[`carteira_${userId}_${guildId}`] = (db[`carteira_${userId}_${guildId}`] || 0) + valorFinal;
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🦹‍♂️ ROUBO BEM-SUCEDIDO!')
                .setDescription(`Você roubou **${valorFinal} moedas** de ${user.username}!`)
                .addFields(
                    { name: '💰 Valor roubado', value: `${valorFinal} moedas`, inline: true },
                    { name: '🎯 Chance', value: '35%', inline: true }
                )
                .setFooter({ text: 'Cuidado, ele pode querer revanche!' });
            
            await message.reply({ embeds: [embed] });
        } else {
            const multa = Math.floor(vítimaCarteira * 0.15);
            const carteiraAtual = db[`carteira_${userId}_${guildId}`] || 0;
            const multaFinal = Math.min(multa, carteiraAtual);
            
            if (multaFinal > 0) {
                db[`carteira_${userId}_${guildId}`] = carteiraAtual - multaFinal;
                db[`carteira_${targetId}_${guildId}`] = vítimaCarteira + multaFinal;
            }
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚨 ROUBO FALHOU!')
                .setDescription(`Você foi pego tentando roubar ${user.username}!`)
                .addFields(
                    { name: '💰 Multa paga', value: `${multaFinal} moedas`, inline: true },
                    { name: '🎯 Chance', value: '35%', inline: true }
                )
                .setFooter({ text: 'Tente novamente em 5 minutos' });
            
            await message.reply({ embeds: [embed] });
        }
        
        db[`rob_${userId}_${guildId}`] = now;
        saveDB(db);
    }
};