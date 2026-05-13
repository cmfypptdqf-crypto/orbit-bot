const { EmbedBuilder } = require('discord.js');
const db = require('quick.db');

module.exports = {
    name: 'daily',
    aliases: ['diario', 'bonus'],
    
    async executePrefix(message) {
        // ✅ get() → fetch()
        const lastDaily = await db.fetch(`daily_${message.author.id}`);
        const now = Date.now();
        const cooldown = 86400000; // 24 horas
        
        if (lastDaily && now - lastDaily < cooldown) {
            const remaining = cooldown - (now - lastDaily);
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);
            return message.reply(`⏰ Você já resgatou seu daily! Próximo em ${hours}h ${minutes}m.`);
        }
        
        const reward = 500;
        
        // ✅ add() → precisa usar math + set, ou subtract/add manual
        let carteiraAtual = await db.fetch(`carteira_${message.author.id}`) || 0;
        await db.set(`carteira_${message.author.id}`, carteiraAtual + reward);
        
        // ✅ set continua igual
        await db.set(`daily_${message.author.id}`, now);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎉 Bônus Diário!')
            .setDescription(`Você recebeu **${reward} moedas**!`)
            .setFooter({ text: 'Volte amanhã para mais!' });
        
        await message.reply({ embeds: [embed] });
    }
};