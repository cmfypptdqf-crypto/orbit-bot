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
    name: 'beg',
    aliases: ['pedir', 'mendigar', 'esmolar'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `beg_${userId}`;
        const lastBeg = cooldowns.get(cooldownKey);
        
        // Cooldown de 5 minutos
        if (lastBeg && Date.now() - lastBeg < 300000) {
            const remaining = Math.ceil((300000 - (Date.now() - lastBeg)) / 60000);
            return message.reply(`⏰ Você já pediu Orbs recentemente! Volte em **${remaining} minutos**.`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        // Eventos positivos
        const eventosPositivos = [
            { texto: '👽 Um alienígena ficou com pena de você', ganho: [200, 400], cor: 0x9B59B6 },
            { texto: '🚀 Um viajante espacial jogou Orbs para você', ganho: [150, 300], cor: 0x3498DB },
            { texto: '🛸 Uma nave desconhecida dropou suprimentos', ganho: [100, 250], cor: 0x00FF00 },
            { texto: '💫 Uma estrela cadente deixou Orbs para você', ganho: [180, 350], cor: 0xF1C40F },
            { texto: '🌙 A Estação Espacial te enviou um auxílio', ganho: [250, 500], cor: 0xE67E22 },
            { texto: '🧙 O Mestre Cósmico abençoou você', ganho: [300, 600], cor: 0x8E44AD },
            { texto: '🪐 Saturno alinhou os planetas a seu favor', ganho: [220, 450], cor: 0xFF9800 }
        ];
        
        // Eventos negativos (azar ao pedir)
        const eventosNegativos = [
            { texto: '👮 A Patrulha Galáctica te multou por perturbação', perda: [50, 150], cor: 0xFF0000 },
            { texto: '💀 Um caçador de recompensas te roubou', perda: [30, 100], cor: 0xFF0000 },
            { texto: '🌑 Um buraco negro sugou suas Orbs', perda: [80, 200], cor: 0xFF0000 },
            { texto: '🤖 Robôs de segurança te expulsaram do mercado', perda: [40, 120], cor: 0xFF0000 },
            { texto: '🦠 Uma criatura cósmica comeu suas Orbs', perda: [60, 180], cor: 0xFF0000 }
        ];
        
        // 80% chance de evento positivo, 20% negativo
        const ePositivo = Math.random() < 0.8;
        
        let embed;
        
        if (ePositivo) {
            const evento = eventosPositivos[Math.floor(Math.random() * eventosPositivos.length)];
            const ganho = Math.floor(Math.random() * (evento.ganho[1] - evento.ganho[0] + 1) + evento.ganho[0]);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
            saveDB(db);
            
            embed = new EmbedBuilder()
                .setColor(evento.cor)
                .setTitle('🎭 Esmola Espacial')
                .setDescription(`${evento.texto}`)
                .addFields(
                    { name: '✨ Você recebeu', value: `**+${ganho} Orbs**`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
        } else {
            const evento = eventosNegativos[Math.floor(Math.random() * eventosNegativos.length)];
            const perda = Math.floor(Math.random() * (evento.perda[1] - evento.perda[0] + 1) + evento.perda[0]);
            const perdaReal = Math.min(perda, db.usuarios[userId].carteira || 0);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - perdaReal;
            saveDB(db);
            
            embed = new EmbedBuilder()
                .setColor(evento.cor)
                .setTitle('😭 Azar Espacial')
                .setDescription(`${evento.texto}`)
                .addFields(
                    { name: '💸 Você perdeu', value: `**-${perdaReal} Orbs**`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
        }
        
        cooldowns.set(cooldownKey, Date.now());
        
        embed.setFooter({ text: 'Volte daqui 5 minutos para pedir novamente' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};