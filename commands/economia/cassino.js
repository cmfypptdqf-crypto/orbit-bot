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
    aliases: ['roleta', 'caçaniquel', 'crate'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        
        if (subcmd === 'abrir') {
            const amount = parseInt(args[1]) || 2000;
            if (isNaN(amount) || amount < 2000) return message.reply('❌ Uma **Nebula Crate** custa 2.000 Orbs! Use `bt!crate abrir`');
            
            const db = getDB();
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0 };
            if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('❌ Saldo insuficiente para abrir uma **Nebula Crate**!');
            
            const premios = [
                { nome: '🔭 Telescópio Avançado', qtd: 1, valor: 500, raridade: 'Comum' },
                { nome: '🚀 Nave Explorer', qtd: 1, valor: 800, raridade: 'Comum' },
                { nome: '💍 Anel Cósmico', qtd: 1, valor: 2000, raridade: 'Raro' },
                { nome: '🛡️ Escudo Energético', qtd: 1, valor: 1500, raridade: 'Raro' },
                { nome: '🍀 Amuleto da Sorte', qtd: 1, valor: 5000, raridade: 'Épico' },
                { nome: '⭐ Orbit Prime Bronze', qtd: 1, valor: 10000, raridade: 'Especial' },
                { nome: '5000 Orbs', qtd: 5000, valor: 5000, raridade: 'Épico', isMoney: true },
                { nome: '10000 Orbs', qtd: 10000, valor: 10000, raridade: 'Lendário', isMoney: true }
            ];
            
            const premio = premios[Math.floor(Math.random() * premios.length)];
            db.usuarios[userId].carteira -= amount;
            
            if (premio.isMoney) {
                db.usuarios[userId].carteira += premio.qtd;
                saveDB(db);
                await message.reply(`📦 **Nebula Crate** aberta!\n✨ Parabéns! Você encontrou **${premio.qtd.toLocaleString()} Orbs**!`);
            } else {
                if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
                const itemId = { '🔭 Telescópio Avançado': '1', '🚀 Nave Explorer': '2', '💍 Anel Cósmico': '3', '🛡️ Escudo Energético': '4', '🍀 Amuleto da Sorte': '11', '⭐ Orbit Prime Bronze': '7' }[premio.nome] || '1';
                db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + premio.qtd;
                saveDB(db);
                await message.reply(`📦 **Nebula Crate** aberta!\n✨ Parabéns! Você encontrou **${premio.nome}**!`);
            }
        }
        
        else if (subcmd === 'roleta') {
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
                await message.reply(`🎡 Roleta Galáctica caiu em **${resultado}**!\n🎉 Você ganhou ${ganho.toLocaleString()} Orbs!`);
            } else {
                db.usuarios[userId].carteira -= amount;
                saveDB(db);
                await message.reply(`🎡 Roleta Galáctica caiu em **${resultado}**!\n😞 Você perdeu ${amount.toLocaleString()} Orbs!`);
            }
        }
        
        else {
            await message.reply('📦 **Nebula Crate** - Sistema de Caixas\n`bt!crate abrir` - Abrir uma Nebula Crate (2.000 Orbs)\n`bt!crate roleta <valor> <cor>` - Roleta Galáctica');
        }
    }
};