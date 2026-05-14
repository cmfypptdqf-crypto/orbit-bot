// commands/conquistas/temporada.js
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

module.exports = {
    name: 'temporada',
    aliases: ['season', 'passe'],
    
    async executePrefix(message, args, client) {
        const temporadaAtual = {
            numero: 3,
            nome: '🌌 Cósmica',
            inicio: '01/01/2025',
            fim: '31/03/2025',
            recompensas: [
                { nivel: 10, recompensa: '500 Orbs' },
                { nivel: 20, recompensa: '⭐ Título de Temporada' },
                { nivel: 30, recompensa: '📦 2 Nebula Crates' },
                { nivel: 40, recompensa: '⭐ Orbit Prime Bronze' },
                { nivel: 50, recompensa: '💎 Cristal Cósmico' }
            ]
        };
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏆 Passe de Temporada - ${temporadaAtual.nome}`)
            .setDescription(`📅 ${temporadaAtual.inicio} até ${temporadaAtual.fim}`)
            .addFields(
                { name: '🎯 Níveis e Recompensas', value: temporadaAtual.recompensas.map(r => `Nível ${r.nivel}: ${r.recompensa}`).join('\n'), inline: false },
                { name: '💡 Como ganhar XP?', value: 'Complete missões, ataques e eventos para subir de nível!', inline: false }
            )
            .setFooter({ text: '🎯 Suba de nível na Temporada e ganhe recompensas exclusivas!' });
        
        await message.reply({ embeds: [embed] });
    }
};