const { EmbedBuilder } = require('discord.js');
const db = require('quick.db');

module.exports = {
    name: 'daily',
    aliases: ['diario', 'bonus'],
    
    async executePrefix(message, args, client) {
        const lastDaily = db.get(`daily_${message.author.id}_${message.guild.id}`);
        const now = Date.now();
        const cooldown = 86400000; // 24 horas
        
        if (lastDaily && now - lastDaily < cooldown) {
            const remaining = new Date(cooldown - (now - lastDaily));
            const hours = remaining.getUTCHours();
            const minutes = remaining.getUTCMinutes();
            return message.reply(`⏰ Você já resgatou seu daily! Próximo em ${hours}h ${minutes}m.`);
        }
        
        const reward = 500;
        db.add(`carteira_${message.author.id}_${message.guild.id}`, reward);
        db.set(`daily_${message.author.id}_${message.guild.id}`, now);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎉 Bônus Diário!')
            .setDescription(`Você recebeu **${reward} moedas**!`)
            .setFooter({ text: 'Volte amanhã para mais!' });
        
        await message.reply({ embeds: [embed] });
    }
};