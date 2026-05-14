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
    name: 'roubar',
    aliases: ['rob', 'steal'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!roubar @usuario`');
        
        if (user.id === message.author.id) {
            return message.reply('❌ Você não pode roubar a si mesmo!');
        }
        
        if (user.bot) {
            return message.reply('❌ Você não pode roubar um bot!');
        }
        
        const userId = message.author.id;
        const targetId = user.id;
        
        // Cooldown de 30 minutos
        const cooldownKey = `rob_${userId}`;
        const lastRob = cooldowns.get(cooldownKey);
        
        if (lastRob && Date.now() - lastRob < 1800000) {
            const remaining = Math.ceil((1800000 - (Date.now() - lastRob)) / 60000);
            return message.reply(`⏰ Aguarde **${remaining} minutos** para roubar novamente.`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        if (!db.usuarios[targetId]) {
            db.usuarios[targetId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const vitimaCarteira = db.usuarios[targetId].carteira || 0;
        
        if (vitimaCarteira <= 0) {
            return message.reply(`❌ ${user.username} está pobre demais para ser roubado!`);
        }
        
        // 40% de chance de sucesso
        const sucesso = Math.random() < 0.4;
        
        if (sucesso) {
            // Rouba entre 10% e 30% do dinheiro
            const percentual = Math.random() * (0.3 - 0.1) + 0.1;
            let valorRoubado = Math.floor(vitimaCarteira * percentual);
            valorRoubado = Math.max(50, Math.min(valorRoubado, 3000));
            
            db.usuarios[userId].carteira += valorRoubado;
            db.usuarios[targetId].carteira -= valorRoubado;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💰 Roubo realizado com sucesso!')
                .setDescription(`Você roubou **${valorRoubado.toLocaleString()} orbs** de ${user.username}`)
                .addFields(
                    { name: 'Seu novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} orbs`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        } else {
            // Falhou - perde dinheiro
            const perda = Math.floor(Math.random() * 200) + 50;
            const perdaReal = Math.min(perda, db.usuarios[userId].carteira || 0);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - perdaReal;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('😞 Roubo falhou!')
                .setDescription(`Você foi pego tentando roubar ${user.username}`)
                .addFields(
                    { name: 'Multa paga', value: `${perdaReal.toLocaleString()} orbs`, inline: true },
                    { name: 'Seu novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} orbs`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        cooldowns.set(cooldownKey, Date.now());
    }
};