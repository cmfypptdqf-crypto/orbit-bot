const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'roletar',
    aliases: ['roleta', 'roulette'],
    
    async executePrefix(message, args, client) {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount <= 0) return message.reply('❌ Aposte um valor válido! Ex: `!roletar 100`');
        
        const cores = ['🔴 Vermelho', '⚫ Preto', '🟢 Verde'];
        const multiplicadores = { '🔴 Vermelho': 2, '⚫ Preto': 2, '🟢 Verde': 14 };
        
        const corEscolhida = args[1]?.toLowerCase();
        let corValida = null;
        
        if (corEscolhida === 'vermelho' || corEscolhida === 'red') corValida = '🔴 Vermelho';
        else if (corEscolhida === 'preto' || corEscolhida === 'black') corValida = '⚫ Preto';
        else if (corEscolhida === 'verde' || corEscolhida === 'green') corValida = '🟢 Verde';
        
        if (!corValida) {
            return message.reply('❌ Escolha uma cor: `vermelho`, `preto` ou `verde`! Ex: `!roletar 100 vermelho`');
        }
        
        const userId = message.author.id;
        const guildId = message.guild.id;
        const walletKey = `carteira_${userId}_${guildId}`;
        
        const db = getDB();
        const carteira = db[walletKey] || 0;
        
        if (carteira < amount) {
            return message.reply(`❌ Você só tem ${carteira} moedas na carteira!`);
        }
        
        const resultado = cores[Math.floor(Math.random() * cores.length)];
        const ganhou = resultado === corValida;
        const multiplicador = multiplicadores[resultado];
        
        if (ganhou) {
            const ganho = amount * multiplicador;
            db[walletKey] = carteira + ganho;
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎰 Roleta - VOCÊ GANHOU!')
                .setDescription(`Caiu em **${resultado}**!`)
                .addFields(
                    { name: '💰 Ganho', value: `${ganho} moedas (x${multiplicador})`, inline: true },
                    { name: '💵 Novo saldo', value: `${db[walletKey]} moedas`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        } else {
            db[walletKey] = carteira - amount;
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🎰 Roleta - VOCÊ PERDEU!')
                .setDescription(`Caiu em **${resultado}**, você apostou em ${corValida}.`)
                .addFields(
                    { name: '💰 Perda', value: `${amount} moedas`, inline: true },
                    { name: '💵 Novo saldo', value: `${db[walletKey]} moedas`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        saveDB(db);
    }
};