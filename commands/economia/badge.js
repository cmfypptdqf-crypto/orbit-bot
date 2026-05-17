// commands/economia/medalhaOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const todasBadges = [
    { id: '1', nome: '🚀 Explorador Orbital', desc: 'Complete 10 missões', requisito: (data) => (data.total_missoes || 0) >= 10 },
    { id: '2', nome: '⭐ Veterano Estelar', desc: 'Complete 100 missões', requisito: (data) => (data.total_missoes || 0) >= 100 },
    { id: '3', nome: '💰 Magnata Cósmico', desc: 'Acumule 1.000.000 Orbs', requisito: (data) => ((data.carteira || 0) + (data.banco || 0)) >= 1000000 },
    { id: '4', nome: '🛸 Caçador de Naves', desc: 'Realize 50 ataques', requisito: (data) => (data.total_ataques || 0) >= 50 },
    { id: '5', nome: '👑 Lenda Galáctica', desc: 'Top 10 do ranking', requisito: (data) => (data.ranking || 0) <= 10 }
];

module.exports = {
    name: 'medalhas',
    aliases: ['badge', 'medalha', 'conquistas', 'badgesorbital'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = {};
        }
        
        // Adicionar XP por ver medalhas
        const xpGanho = 5;
        const resultadoXP = adicionarXP(userId, xpGanho, 'medalhas');
        
        const conquistadas = todasBadges.filter(b => b.requisito(db.usuarios[userId]));
        const pendentes = todasBadges.filter(b => !b.requisito(db.usuarios[userId]));
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏅 Medalhas Orbitais de ${message.author.username}`)
            .setDescription(`📊 Progresso Orbital: ${conquistadas.length}/${todasBadges.length}`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
            );
        
        if (conquistadas.length > 0) {
            embed.addFields({ name: '✅ MEDALHAS CONQUISTADAS', value: conquistadas.map(b => `**${b.nome}**\n📝 ${b.desc}`).join('\n\n'), inline: false });
        }
        
        if (pendentes.length > 0) {
            embed.addFields({ name: '🔒 PRÓXIMAS MEDALHAS', value: pendentes.map(b => `**${b.nome}**\n📝 ${b.desc}`).join('\n\n'), inline: false });
        }
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        embed.setFooter({ text: '🌌 Orbit • Complete desafios orbitais para ganhar medalhas estelares!' });
        await message.reply({ embeds: [embed] });
    }
};