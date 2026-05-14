// commands/economia/cassino.js
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
    name: 'cassino',
    aliases: ['roleta', 'caçaniquel'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        
        if (subcmd === 'roleta') {
            const amount = parseInt(args[1]);
            const cor = args[2]?.toLowerCase();
            if (isNaN(amount) || amount <= 0) return message.reply('❌ Aposte um valor!');
            if (!['vermelho', 'preto', 'verde'].includes(cor)) return message.reply('❌ Escolha: vermelho, preto ou verde');
            
            const db = getDB();
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0 };
            if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('❌ Saldo insuficiente!');
            
            const resultado = ['vermelho', 'preto', 'verde'][Math.floor(Math.random() * 3)];
            const multiplicador = cor === 'verde' ? 14 : 2;
            const ganhou = cor === resultado;
            
            if (ganhou) {
                const ganho = amount * multiplicador;
                db.usuarios[userId].carteira += ganho;
                saveDB(db);
                await message.reply(`🎉 Caiu em ${resultado}! Você ganhou ${ganho.toLocaleString()} Orbs!`);
            } else {
                db.usuarios[userId].carteira -= amount;
                saveDB(db);
                await message.reply(`😞 Caiu em ${resultado}! Você perdeu ${amount.toLocaleString()} Orbs!`);
            }
        }
        
        else if (subcmd === 'caçaniquel') {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) return message.reply('❌ Aposte um valor!');
            
            const db = getDB();
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0 };
            if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('❌ Saldo insuficiente!');
            
            const simbolos = ['🍒', '🍋', '🍊', '💎', '⭐', '7️⃣'];
            const resultado = [simbolos[Math.floor(Math.random() * 6)], simbolos[Math.floor(Math.random() * 6)], simbolos[Math.floor(Math.random() * 6)]];
            
            let premio = 0;
            if (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
                if (resultado[0] === '7️⃣') premio = amount * 10;
                else if (resultado[0] === '💎') premio = amount * 5;
                else premio = amount * 3;
            } else if (resultado[0] === resultado[1] || resultado[1] === resultado[2] || resultado[0] === resultado[2]) {
                premio = amount * 2;
            }
            
            const ganho = premio - amount;
            db.usuarios[userId].carteira += ganho;
            saveDB(db);
            
            await message.reply(`🎰 ${resultado.join(' | ')}\n${premio > 0 ? `🎉 Você ganhou ${premio.toLocaleString()} Orbs!` : `😞 Você perdeu ${amount.toLocaleString()} Orbs!`}`);
        }
        
        else {
            await message.reply('🎰 **Cassino Galáctico**\n`bt!cassino roleta <valor> <cor>`\n`bt!cassino caçaniquel <valor>`');
        }
    }
};