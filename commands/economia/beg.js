// commands/economia/beg.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cooldownsManager = require('../../utils/cooldownsManager.js');

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

module.exports = {
    name: 'beg',
    aliases: ['pedir', 'mendigar', 'esmolar'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // VERIFICAR COOLDOWN
        const cooldownCheck = cooldownsManager.check(userId, 'beg');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde **${cooldownCheck.formatted}** para pedir novamente!`);
        }
        
        const eventos = [
            { texto: '👽 Um alienígena ficou com pena de você', ganho: [200, 400], cor: 0x9B59B6 },
            { texto: '🚀 Um viajante espacial jogou Orbs para você', ganho: [150, 300], cor: 0x3498DB },
            { texto: '🛸 Uma nave desconhecida dropou suprimentos', ganho: [100, 250], cor: 0x00FF00 },
            { texto: '💫 Uma estrela cadente deixou Orbs para você', ganho: [180, 350], cor: 0xF1C40F },
            { texto: '🌙 A Estação Espacial te enviou um auxílio', ganho: [250, 500], cor: 0xE67E22 },
            { texto: '🧙 O Mestre Cósmico abençoou você', ganho: [300, 600], cor: 0x8E44AD },
            { texto: '🪐 Saturno alinhou os planetas a seu favor', ganho: [220, 450], cor: 0xFF9800 }
        ];
        
        const evento = eventos[Math.floor(Math.random() * eventos.length)];
        const ganho = Math.floor(Math.random() * (evento.ganho[1] - evento.ganho[0] + 1) + evento.ganho[0]);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
        saveDB(db);
        
        // REGISTRAR COOLDOWN
        cooldownsManager.set(userId, 'beg');
        
        const embed = new EmbedBuilder()
            .setColor(evento.cor)
            .setTitle('🎭 Esmola Espacial')
            .setDescription(evento.texto)
            .addFields(
                { name: '✨ Você recebeu', value: `**+${ganho} Orbs**`, inline: true },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: 'Use bt!cooldowns para ver todos os tempos' });
        
        await message.reply({ embeds: [embed] });
    }
};