// commands/economia/pirataria.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal, checkCooldown, setCooldown } = require('../../utilidades/galaxiaBonus.js');

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
        if (!user) return message.reply('❌ Use: `bt!pirataria @usuario`');
        if (user.id === message.author.id) return message.reply('❌ Você não pode atacar sua própria nave!');
        if (user.bot) return message.reply('❌ Não pode roubar um drone!');
        
        const userId = message.author.id;
        const targetId = user.id;
        
        // ========== VERIFICAR COOLDOWN ==========
        const cooldownCheck = checkCooldown(userId, 'pirataria');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ **Aguarde mais ${cooldownCheck.formatted}** para outro ataque pirata!`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        if (!db.usuarios[targetId]) {
            db.usuarios[targetId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const vitimaOrbs = db.usuarios[targetId].carteira || 0;
        
        if (vitimaOrbs <= 0) {
            return message.reply(`❌ ${user.username} está sem Orbs para serem saqueados!`);
        }
        
        // Chance base + bônus do clã para ataque
        const bonusAtaque = calcularBonusTotal(userId, 'ataque');
        let chanceSucesso = 0.4 * bonusAtaque.bonus;
        chanceSucesso = Math.min(0.7, chanceSucesso);
        
        const sucesso = Math.random() < chanceSucesso;
        
        // ========== REGISTRAR COOLDOWN ==========
        setCooldown(userId, 'pirataria');
        
        if (sucesso) {
            const percentual = Math.random() * (0.3 - 0.1) + 0.1;
            let valorRoubado = Math.floor(vitimaOrbs * percentual);
            valorRoubado = Math.max(50, Math.min(valorRoubado, 5000));
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + valorRoubado;
            db.usuarios[targetId].carteira = (db.usuarios[targetId].carteira || 0) - valorRoubado;
            db.usuarios[userId].total_ataques = (db.usuarios[userId].total_ataques || 0) + 1;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('☄️ Ataque Pirata Bem Sucedido!')
                .setDescription(`Você saqueou **${valorRoubado.toLocaleString()} Orbs** da nave de ${user.username}`)
                .addFields(
                    { name: '🎯 Chance com bônus', value: `${Math.round(chanceSucesso * 100)}%`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                    { name: '✨ Bônus aplicado', value: bonusAtaque.texto || 'Nenhum', inline: false }
                )
                .setFooter({ text: '⏰ Próximo ataque disponível em 30 minutos!' });
            
            await message.reply({ embeds: [embed] });
        } else {
            const perda = Math.floor(Math.random() * 200) + 50;
            const perdaReal = Math.min(perda, db.usuarios[userId].carteira || 0);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - perdaReal;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🚨 Ataque Falhou!')
                .setDescription(`Você foi capturado pela Patrulha Galáctica ao tentar atacar ${user.username}`)
                .addFields(
                    { name: '💰 Multa paga', value: `${perdaReal.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '⏰ Próximo ataque disponível em 30 minutos!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};