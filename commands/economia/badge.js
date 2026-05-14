// commands/economia/badge.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'badge',
    description: 'Suas medalhas conquistadas',
    aliases: ['medalhas', 'conquistas'],
    
    async executePrefix(message, args, client) {
        const badges = [
            { nome: '🚀 Explorador Iniciante', desc: 'Completou 10 missões', cor: '#808080' },
            { nome: '⭐ Veterano Espacial', desc: 'Completou 100 missões', cor: '#C0C0C0' },
            { nome: '💰 Magnata Cósmico', desc: 'Acumulou 1.000.000 Orbs', cor: '#FFD700' },
            { nome: '🛸 Caçador de Naves', desc: 'Realizou 50 ataques', cor: '#FF6347' },
            { nome: '👑 Lenda Galáctica', desc: 'Top 10 do ranking', cor: '#9B59B6' }
        ];
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏅 Suas Medalhas Espaciais')
            .setDescription('Conquistas que você já desbloqueou!')
            .setThumbnail(message.author.displayAvatarURL());
        
        badges.forEach(badge => {
            embed.addFields({
                name: `${badge.nome}`,
                value: `📝 ${badge.desc}`,
                inline: true
            });
        });
        
        embed.setFooter({ text: 'Complete desafios para ganhar mais medalhas!' });
        await message.reply({ embeds: [embed] });
    }
};