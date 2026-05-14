// commands/fun/meme.js
const { EmbedBuilder } = require('discord.js');

const memes = [
    'https://i.imgur.com/7L7Bq0E.jpeg',
    'https://i.imgur.com/DKzFJcX.jpeg',
    'https://i.imgur.com/Q4K7bJX.jpeg'
];

module.exports = {
    name: 'meme',
    aliases: ['memes', 'risada'],
    
    async executePrefix(message, args, client) {
        const meme = memes[Math.floor(Math.random() * memes.length)];
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('😂 Meme Espacial')
            .setImage(meme)
            .setFooter({ text: '🌌 Orbit • Rir é o melhor remédio!' });
        
        await message.reply({ embeds: [embed] });
    }
};