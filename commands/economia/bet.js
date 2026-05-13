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
    name: 'apostar',
    aliases: ['gamble', 'bet', 'jogar'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        let carteira = db[`carteira_${userId}_${guildId}`] || 0;
        
        if (!amount) {
            return message.reply(`❌ Use: ${client.prefix}apostar <valor> ou ${client.prefix}apostar all\nValores mínimos e máximos: 100 - ${Math.floor(carteira * 0.5)}`);
        }
        
        if (amount.toLowerCase() === 'all') {
            amount = carteira;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('❌ Digite um número válido!');
        }
        
        const minBet = 100;
        const maxBet = Math.floor(carteira * 0.5);
        
        if (amount < minBet) return message.reply(`❌ Aposta mínima: **${minBet} moedas**`);
        if (amount > maxBet) return message.reply(`❌ Você pode apostar no máximo **${maxBet} moedas** (50% da sua carteira)`);
        if (amount > carteira) return message.reply(`❌ Você só tem ${carteira} moedas!`);
        
        // Sistema de aposta
        const random = Math.random();
        let multiplicador = 0;
        let resultado = '';
        let cor = 0xFF0000;
        
        if (random < 0.05) { // 5% - JACKPOT
            multiplicador = 5;
            resultado = '🎰 **JACKPOT!** 🎰';
            cor = 0xFFD700;
        } else if (random < 0.15) { // 10% - GRANDE
            multiplicador = 3;
            resultado = '🎉 **GRANDE PRÊMIO!** 🎉';
            cor = 0xFFA500;
        } else if (random < 0.35) { // 20% - MÉDIO
            multiplicador = 1.5;
            resultado = '🎈 **VOCÊ GANHOU!** 🎈';
            cor = 0x00FF00;
        } else if (random < 0.55) { // 20% - PEQUENO
            multiplicador = 1.2;
            resultado = '🍀 **GANHOU UM POUCO!** 🍀';
            cor = 0x00AAFF;
        } else { // 45% - PERDEU
            multiplicador = 0;
            resultado = '💀 **VOCÊ PERDEU!** 💀';
            cor = 0xFF0000;
        }
        
        let ganho = 0;
        let novoSaldo = carteira;
        
        if (multiplicador > 0) {
            ganho = Math.floor(amount * multiplicador);
            novoSaldo = carteira + ganho;
            db[`carteira_${userId}_${guildId}`] = novoSaldo;
        } else {
            ganho = -amount;
            novoSaldo = carteira - amount;
            db[`carteira_${userId}_${guildId}`] = novoSaldo;
        }
        
        saveDB(db);
        
        // Efeitos visuais
        const slots = ['🍒', '🍋', '🍊', '🍉', '🔔', '💎', '7️⃣'];
        const slot1 = slots[Math.floor(Math.random() * slots.length)];
        const slot2 = slots[Math.floor(Math.random() * slots.length)];
        const slot3 = slots[Math.floor(Math.random() * slots.length)];
        
        const embed = new EmbedBuilder()
            .setColor(cor)
            .setTitle('🎰 ROÇADA DA SORTE 🎰')
            .setDescription(`┌───┬───┬───┐\n│ ${slot1} │ ${slot2} │ ${slot3} │\n└───┴───┴───┘`)
            .addFields(
                { name: '📊 Resultado', value: resultado, inline: false },
                { name: '💰 Aposta', value: `${amount} moedas`, inline: true },
                { name: '🎯 Multiplicador', value: multiplicador > 0 ? `${multiplicador}x` : '0x', inline: true },
                { name: '💸 Ganho/Perda', value: ganho > 0 ? `+${ganho}` : `${ganho}`, inline: true },
                { name: '💵 Saldo atual', value: `${novoSaldo} moedas`, inline: false }
            )
            .setFooter({ text: `Use ${client.prefix}balance para ver seu saldo` });
        
        await message.reply({ embeds: [embed] });
        
        // Estatísticas de aposta
        const statsKey = `gamble_stats_${userId}_${guildId}`;
        if (!db[statsKey]) {
            db[statsKey] = { wins: 0, losses: 0, totalBet: 0 };
        }
        
        if (multiplicador > 0) {
            db[statsKey].wins++;
        } else {
            db[statsKey].losses++;
        }
        db[statsKey].totalBet += amount;
        saveDB(db);
    }
};