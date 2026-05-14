// commands/economia/sacar.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomFrase } = require('../utilidades/orbitAI.js');

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
    name: 'sacar',
    aliases: ['saque', 'withdraw', 'retirar'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            saveDB(db);
        }
        
        let carteira = db.usuarios[userId].carteira || 0;
        let banco = db.usuarios[userId].banco || 0;
        
        if (!amount) {
            const fraseErro = getRandomFrase('erro');
            return message.reply(`${fraseErro}\n❌ Use: \`bt!sacar <valor>\` ou \`bt!sacar all\``);
        }
        
        // Processar valor
        if (amount.toLowerCase() === 'all') {
            amount = banco;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) {
                const fraseErro = getRandomFrase('erro');
                return message.reply(`${fraseErro}\n❌ Digite um número válido!`);
            }
        }
        
        // Validações
        if (amount <= 0) {
            return message.reply('❌ Digite um valor positivo!');
        }
        
        if (amount > banco) {
            return message.reply(`❌ Você só tem ${banco.toLocaleString()} Orbs na Estação!`);
        }
        
        // Realizar saque
        db.usuarios[userId].banco = banco - amount;
        db.usuarios[userId].carteira = carteira + amount;
        saveDB(db);
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle(`💸 ${fraseSucesso}`)
            .setDescription(`📡 Você sacou **${amount.toLocaleString()} Orbs** da Estação Espacial!`)
            .addFields(
                { 
                    name: '💵 Núcleo (Carteira)',
                    value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`,
                    inline: true
                },
                { 
                    name: '🏦 Estação (Banco)',
                    value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`,
                    inline: true
                },
                { 
                    name: '📊 Patrimônio Total',
                    value: `${(db.usuarios[userId].carteira + db.usuarios[userId].banco).toLocaleString()} Orbs`,
                    inline: true
                }
            )
            .setFooter({ text: '🌌 Orbit • Use seus Orbs sabiamente, comandante!' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};