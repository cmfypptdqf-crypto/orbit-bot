// commands/rpg/level.js
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
    name: 'level',
    aliases: ['lvl', 'nivel'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0, level: 1 };
        }
        
        const xpTotal = db.usuarios[userId].xpTotal || 0;
        const level = calcularNivel(xpTotal);
        const xpNecessario = level * 1000;
        const xpAtual = xpTotal % xpNecessario;
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        
        const barra = gerarBarraProgresso(progresso, 20);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`📊 Nível de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`${barra}\n📈 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP (${progresso}%)`)
            .addFields(
                { name: '🏆 Nível Atual', value: `${level}`, inline: true },
                { name: '⭐ XP Total', value: `${xpTotal.toLocaleString()}`, inline: true },
                { name: '🎯 Próximo Nível', value: `${level + 1} (faltam ${(xpNecessario - xpAtual).toLocaleString()} XP)`, inline: true }
            )
            .setFooter({ text: '✨ Stellar XP • Evolua através das estrelas' });
        
        await message.reply({ embeds: [embed] });
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    return `🟩`.repeat(preenchido) + `⬜`.repeat(tamanho - preenchido);
}