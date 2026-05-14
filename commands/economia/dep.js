// commands/economia/depositar.js
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
    name: 'depositar',
    aliases: ['dep', 'guardar', 'estacao'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            saveDB(db);
        }
        
        const walletKey = `carteira_${userId}`;
        const bankKey = `banco_${userId}`;
        
        // Usar a nova estrutura (sem guildId)
        let carteira = db.usuarios[userId].carteira || 0;
        let banco = db.usuarios[userId].banco || 0;
        
        if (!amount) {
            const fraseErro = getRandomFrase('erro');
            return message.reply(`${fraseErro}\n❌ Use: \`bt!depositar <valor>\` ou \`bt!depositar all\``);
        }
        
        // Processar valor
        if (amount.toLowerCase() === 'all') {
            amount = carteira;
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
        
        if (amount > carteira) {
            return message.reply(`❌ Você só tem ${carteira.toLocaleString()} Orbs na carteira!`);
        }
        
        // Realizar depósito
        db.usuarios[userId].carteira = carteira - amount;
        db.usuarios[userId].banco = banco + amount;
        saveDB(db);
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`🏦 ${fraseSucesso}`)
            .setDescription(`📡 Você transferiu **${amount.toLocaleString()} Orbs** para a Estação Espacial!`)
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
            .setFooter({ text: '🌌 Orbit • Seus Orbs estão seguros na Estação!' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};