
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

module.exports = {
    name: 'balance',
    aliases: ['bal', 'saldo', 'carteira'],

    async executePrefix(message, args, client) {

        const db = getDB();

        // Usuário mencionado ou autor da mensagem
        const user = message.mentions.users.first() || message.author;
        const userId = user.id;

        // Cria conta caso não exista
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = {
                carteira: 0,
                banco: 0,
                inventario: {}
            };

            saveDB(db);
        }

        const carteira = db.usuarios[userId].carteira || 0;
        const banco = db.usuarios[userId].banco || 0;
        const total = carteira + banco;

        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`💰 Saldo de ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '💵 Baú',
                    value: `${carteira.toLocaleString()} orbs`,
                    inline: true
                },
                {
                    name: '🏦 Céu',
                    value: `${banco.toLocaleString()} orbs`,
                    inline: true
                },
                {
                    name: '📊 Total',
                    value: `${total.toLocaleString()} orbs`,
                    inline: true
                }
            )
            .setFooter({
                text: '🌍 Economia global - compartilhada em todos servidores'
            })
            .setTimestamp();

        await message.reply({
            embeds: [embed]
        });
    }
};