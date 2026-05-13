const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'trabalhar',
    aliases: ['work', 'job'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `work_${userId}`;
        const lastWork = cooldowns.get(cooldownKey);
        
        if (lastWork && Date.now() - lastWork < 3600000) {
            const remaining = Math.ceil((3600000 - (Date.now() - lastWork)) / 60000);
            return message.reply(`⏰ Você precisa esperar **${remaining} minutos** para trabalhar novamente!`);
        }
        
        const trabalhos = [
            { nome: '💻 Programador', ganho: [80, 200] },
            { nome: '👨‍🍳 Chef de cozinha', ganho: [60, 150] },
            { nome: '🚛 Entregador', ganho: [50, 120] },
            { nome: '👨‍🏫 Professor', ganho: [70, 180] },
            { nome: '🎨 Artista', ganho: [40, 300] },
            { nome: '🔧 Mecânico', ganho: [65, 160] },
            { nome: '💊 Médico', ganho: [100, 250] }
        ];
        
        const trabalho = trabalhos[Math.floor(Math.random() * trabalhos.length)];
        const ganho = Math.floor(Math.random() * (trabalho.ganho[1] - trabalho.ganho[0] + 1) + trabalho.ganho[0]);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
        saveDB(db);
        
        cooldowns.set(cooldownKey, Date.now());
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('💼 Trabalho realizado!')
            .setDescription(`Você trabalhou como **${trabalho.nome}** e ganhou **${ganho.toLocaleString()} orbs**!`)
            .addFields(
                { name: '💰 Novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} orbs`, inline: true }
            )
            .setFooter({ text: 'Volte daqui 1 hora para trabalhar novamente' });
        
        await message.reply({ embeds: [embed] });
    }
};