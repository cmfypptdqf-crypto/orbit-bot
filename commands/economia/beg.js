// commands/economia/beg.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkCooldown, setCooldown } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent } = require('../utilidades/orbitAI.js');

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
        
        const cooldownCheck = checkCooldown(userId, 'beg');
        if (!cooldownCheck.available) {
            const fraseCooldown = getRandomFrase('cooldown');
            return message.reply(`${fraseCooldown}\n⏰ Aguarde mais **${cooldownCheck.formatted}** para pedir novamente!`);
        }
        
        const eventos = [
            { texto: '👽 Um alienígena ficou com pena de você', ganho: [200, 400], cor: 0x9B59B6 },
            { texto: '🚀 Um viajante espacial jogou Orbs para você', ganho: [150, 300], cor: 0x3498DB },
            { texto: '🛸 Uma nave desconhecida dropou suprimentos', ganho: [100, 250], cor: 0x00FF00 },
            { texto: '💫 Uma estrela cadente deixou Orbs para você', ganho: [180, 350], cor: 0xF1C40F }
        ];
        
        const evento = eventos[Math.floor(Math.random() * eventos.length)];
        const ganho = Math.floor(Math.random() * (evento.ganho[1] - evento.ganho[0] + 1) + evento.ganho[0]);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
        
        const eventoCosmico = checkRandomEvent();
        let eventoResultado = null;
        
        if (eventoCosmico) {
            eventoResultado = await processEvent(eventoCosmico, userId, db, client);
        }
        
        saveDB(db);
        setCooldown(userId, 'beg');
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        const embed = new EmbedBuilder()
            .setColor(evento.cor)
            .setTitle(`🎭 ${fraseSucesso}`)
            .setDescription(evento.texto)
            .addFields(
                { name: '✨ Você recebeu', value: `**+${ganho.toLocaleString()} Orbs**`, inline: true },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Próximo pedido em 5 minutos' })
            .setTimestamp();
        
        if (eventoResultado) {
            embed.addFields(
                { name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false },
                { name: '✨ Efeito', value: eventoResultado.efeito || 'Neutro', inline: true }
            );
        }
        
        await message.reply({ embeds: [embed] });
    }
};