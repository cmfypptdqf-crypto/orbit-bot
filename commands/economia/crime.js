// commands/economia/pirataria.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent, getComandoFrase } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');
const { recalcularPoderClan } = require('../utilidades/clanUtils.js');

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
    name: 'pirataria',
    aliases: ['roubar', 'crime', 'pirata'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!pirataria @usuario`');
        if (user.id === message.author.id) return message.reply('<:emoji_47:1504081397373997076> Não pode atacar a si mesmo!');
        if (user.bot) return message.reply('<:emoji_47:1504081397373997076> Não pode roubar um bot!');
        
        const userId = message.author.id;
        const targetId = user.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'pirataria');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde mais **${cooldownCheck.formatted}** para outro ataque!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        if (!db.usuarios[targetId]) db.usuarios[targetId] = { carteira: 0, banco: 0, inventario: {} };
        
        const vitimaOrbs = db.usuarios[targetId].carteira || 0;
        if (vitimaOrbs <= 0) return message.reply(`<:emoji_47:1504081397373997076> ${user.username} está sem Orbs!`);
        
        const bonusAtaque = calcularBonusTotal(userId, 'ataque');
        let chanceSucesso = Math.min(0.7, 0.4 * bonusAtaque.bonus);
        const sucesso = Math.random() < chanceSucesso;
        
        cooldownsManager.set(userId, 'pirataria');
        
        if (sucesso) {
            const percentual = Math.random() * 0.25 + 0.1;
            let valorRoubado = Math.min(5000, Math.max(50, Math.floor(vitimaOrbs * percentual)));
            
            db.usuarios[userId].carteira += valorRoubado;
            db.usuarios[targetId].carteira -= valorRoubado;
            db.usuarios[userId].total_ataques = (db.usuarios[userId].total_ataques || 0) + 1;
            db.usuarios[userId].vitorias = (db.usuarios[userId].vitorias || 0) + 1;
            
            if (db.usuarios[userId].clan) recalcularPoderClan(db.usuarios[userId].clan, db);
            if (db.usuarios[targetId].clan) recalcularPoderClan(db.usuarios[targetId].clan, db);
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`☄️ ${getComandoFrase('pirataria')}`)
                .setDescription(`📡 Você saqueou **${valorRoubado.toLocaleString()} Orbs** de ${user.username}!`)
                .addFields(
                    { name: '🎯 Chance', value: `${Math.round(chanceSucesso * 100)}%`, inline: true },
                    { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '☄️ Ataque realizado com sucesso!' });
            await message.reply({ embeds: [embed] });
        } else {
            const perda = Math.min(db.usuarios[userId].carteira || 0, Math.floor(Math.random() * 200) + 50);
            db.usuarios[userId].carteira -= perda;
            db.usuarios[userId].total_ataques = (db.usuarios[userId].total_ataques || 0) + 1;
            
            if (db.usuarios[userId].clan) recalcularPoderClan(db.usuarios[userId].clan, db);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`🚨 Ataque Falhou!`)
                .setDescription(`Você foi capturado ao tentar atacar ${user.username}!`)
                .addFields(
                    { name: '💰 Multa', value: `${perda.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '☄️ Tente novamente em 30 minutos' });
            await message.reply({ embeds: [embed] });
        }
    }
};