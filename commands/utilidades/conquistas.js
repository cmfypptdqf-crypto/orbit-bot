// commands/conquistas/conquistas.js
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

const conquistas = [
    { nome: '💰 Primeiro Milhão', desc: 'Acumule 1.000.000 Orbs', recompensa: '1000 XP', icone: '💰' },
    { nome: '🎯 100 Missões', desc: 'Complete 100 missões', recompensa: '500 XP', icone: '🎯' },
    { nome: '⚔️ Mestre dos Ataques', desc: 'Realize 100 ataques', recompensa: '500 XP', icone: '⚔️' },
    { nome: '👑 Lendário', desc: 'Atinga nível 50', recompensa: '2000 XP', icone: '👑' }
];

module.exports = {
    name: 'conquistas',
    aliases: ['achievements', 'conquista'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = {};
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        const totalOrbs = (db.usuarios[userId].carteira || 0) + (db.usuarios[userId].banco || 0);
        const missoes = db.usuarios[userId].total_missoes || 0;
        const ataques = db.usuarios[userId].total_ataques || 0;
        
        const conquistasObtidas = [];
        const conquistasPendentes = [];
        
        if (totalOrbs >= 1000000) conquistasObtidas.push(conquistas[0]);
        else conquistasPendentes.push(conquistas[0]);
        
        if (missoes >= 100) conquistasObtidas.push(conquistas[1]);
        else conquistasPendentes.push(conquistas[1]);
        
        if (ataques >= 100) conquistasObtidas.push(conquistas[2]);
        else conquistasPendentes.push(conquistas[2]);
        
        if (nivel >= 50) conquistasObtidas.push(conquistas[3]);
        else conquistasPendentes.push(conquistas[3]);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏆 Conquistas de ${message.author.username}`)
            .setDescription(`📊 Progresso: ${conquistasObtidas.length}/${conquistas.length}`)
            .setThumbnail(message.author.displayAvatarURL());
        
        if (conquistasObtidas.length > 0) {
            embed.addFields({ name: '✅ CONQUISTADAS', value: conquistasObtidas.map(c => `${c.icone} **${c.nome}**\n📝 ${c.desc}\n🎁 ${c.recompensa}`).join('\n\n'), inline: false });
        }
        
        if (conquistasPendentes.length > 0) {
            embed.addFields({ name: '🔒 PRÓXIMAS', value: conquistasPendentes.map(c => `${c.icone} **${c.nome}**\n📝 ${c.desc}\n🎁 ${c.recompensa}`).join('\n\n'), inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}