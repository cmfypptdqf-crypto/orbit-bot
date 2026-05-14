// commands/conquistas/badges.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const todasBadges = [
    { id: '1', nome: '🚀 Explorador Iniciante', desc: 'Complete 10 missões', requisito: (data) => (data.total_missoes || 0) >= 10, xp: 100 },
    { id: '2', nome: '⭐ Veterano Espacial', desc: 'Complete 100 missões', requisito: (data) => (data.total_missoes || 0) >= 100, xp: 500 },
    { id: '3', nome: '💰 Magnata Cósmico', desc: 'Acumule 1.000.000 Orbs', requisito: (data) => ((data.carteira || 0) + (data.banco || 0)) >= 1000000, xp: 1000 },
    { id: '4', nome: '🛸 Caçador de Naves', desc: 'Realize 50 ataques', requisito: (data) => (data.total_ataques || 0) >= 50, xp: 500 },
    { id: '5', nome: '👑 Lenda Galáctica', desc: 'Fique no Top 10 do ranking', requisito: (data) => (data.ranking || 0) <= 10, xp: 2000 }
];

module.exports = {
    name: 'badges',
    aliases: ['medalhas', 'conquistas', 'badge'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = {};
        }
        
        const conquistadas = todasBadges.filter(b => b.requisito(db.usuarios[userId]));
        const pendentes = todasBadges.filter(b => !b.requisito(db.usuarios[userId]));
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏆 Conquistas de ${message.author.username}`)
            .setDescription(`📊 Progresso: ${conquistadas.length}/${todasBadges.length}`)
            .setThumbnail(message.author.displayAvatarURL());
        
        if (conquistadas.length > 0) {
            embed.addFields({ name: '✅ CONQUISTADAS', value: conquistadas.map(b => `**${b.nome}**\n📝 ${b.desc}`).join('\n\n'), inline: false });
        }
        
        if (pendentes.length > 0) {
            embed.addFields({ name: '🔒 PRÓXIMAS', value: pendentes.map(b => `**${b.nome}**\n📝 ${b.desc}`).join('\n\n'), inline: false });
        }
        
        embed.setFooter({ text: 'Complete desafios para ganhar XP e conquistas!' });
        await message.reply({ embeds: [embed] });
    }
};