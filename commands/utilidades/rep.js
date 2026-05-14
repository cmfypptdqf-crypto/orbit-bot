// commands/social/reputacao.js
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

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const reputacaoCooldowns = new Map();

module.exports = {
    name: 'reputacao',
    aliases: ['rep', 'karma'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { reputacao: 0 };
        }
        
        if (subcmd === 'dar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!reputacao dar @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode dar reputação a si mesmo!');
            
            const lastRep = reputacaoCooldowns.get(userId);
            if (lastRep && Date.now() - lastRep < 86400000) {
                const remaining = Math.ceil((86400000 - (Date.now() - lastRep)) / 3600000);
                return message.reply(`⏰ Você já deu reputação hoje! Aguarde ${remaining} horas.`);
            }
            
            if (!db.usuarios[user.id]) db.usuarios[user.id] = { reputacao: 0 };
            db.usuarios[user.id].reputacao = (db.usuarios[user.id].reputacao || 0) + 1;
            saveDB(db);
            
            reputacaoCooldowns.set(userId, Date.now());
            
            await message.reply(`⭐ ${message.author} deu +1 reputação para ${user.username}!`);
        }
        
        else if (subcmd === 'ver') {
            let user = message.author;
            if (args[1]) {
                const mention = message.mentions.users.first();
                if (mention) user = mention;
            }
            
            const rep = db.usuarios[user.id]?.reputacao || 0;
            const nivel = rep >= 100 ? '👑 Lendário' : rep >= 50 ? '🌟 Respeitado' : rep >= 10 ? '👍 Confiável' : '🌱 Novato';
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`⭐ Reputação de ${user.username}`)
                .setDescription(`📊 **${rep} pontos**\n🏆 Nível: ${nivel}`)
                .setThumbnail(user.displayAvatarURL());
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Sistema de Reputação**\n`bt!reputacao dar @user` - Dar reputação (1x/dia)\n`bt!reputacao ver @user` - Ver reputação');
        }
    }
};