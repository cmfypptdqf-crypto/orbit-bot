const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'work',
    aliases: ['trabalhar'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        const guildId = message.guild.id;
        const now = Date.now();
        const cooldown = 3600000; // 1 hora
        
        const lastWork = db[`work_${userId}_${guildId}`];
        
        if (lastWork && now - lastWork < cooldown) {
            const remaining = new Date(cooldown - (now - lastWork));
            const minutes = remaining.getUTCMinutes();
            return message.reply(`⏰ Você já trabalhou recentemente! Volte em ${minutes} minutos.`);
        }
        
        const trabalhos = [
            { nome: '💻 Programador', ganho: 200 },
            { nome: '🍕 Entregador de Pizza', ganho: 150 },
            { nome: '📚 Professor', ganho: 180 },
            { nome: '🏪 Vendedor', ganho: 120 },
            { nome: '🎨 Designer', ganho: 220 },
            { nome: '🔧 Mecânico', ganho: 160 }
        ];
        
        const trabalho = trabalhos[Math.floor(Math.random() * trabalhos.length)];
        const ganho = trabalho.ganho + Math.floor(Math.random() * 100);
        
        // Atualizar carteira
        const walletKey = `carteira_${userId}_${guildId}`;
        db[walletKey] = (db[walletKey] || 0) + ganho;
        db[`work_${userId}_${guildId}`] = now;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setTitle('💼 Trabalho Concluído!')
            .setDescription(`Você trabalhou como **${trabalho.nome}** e ganhou **${ganho} moedas**!`)
            .setFooter({ text: `Use ${client.prefix}daily para bônus diário` });
        
        await message.reply({ embeds: [embed] });
    }
};