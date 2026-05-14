// commands/economia/cassino.js
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
    name: 'cassino',
    aliases: ['roleta', 'caçaniquel', 'slot', 'girar'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        
        if (subcmd === 'roleta') {
            const amount = parseInt(args[1]);
            const cor = args[2]?.toLowerCase();
            
            if (isNaN(amount) || amount <= 0) return message.reply('❌ Aposte um valor válido! Ex: `bt!cassino roleta 100 vermelho`');
            
            const coresValidas = ['vermelho', 'preto', 'verde'];
            if (!cor || !coresValidas.includes(cor)) {
                return message.reply('❌ Escolha uma cor: `vermelho`, `preto` ou `verde`!');
            }
            
            const db = getDB();
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            const carteira = db.usuarios[userId].carteira || 0;
            if (carteira < amount) {
                return message.reply(`❌ Você só tem ${carteira.toLocaleString()} Orbs!`);
            }
            
            const resultados = ['🔴 Vermelho', '⚫ Preto', '🟢 Verde'];
            const multiplicadores = { 'vermelho': 2, 'preto': 2, 'verde': 14 };
            const resultado = resultados[Math.floor(Math.random() * resultados.length)];
            const corResultado = resultado === '🔴 Vermelho' ? 'vermelho' : resultado === '⚫ Preto' ? 'preto' : 'verde';
            const ganhou = cor === corResultado;
            
            let ganho = 0;
            if (ganhou) {
                ganho = amount * multiplicadores[cor];
                db.usuarios[userId].carteira = carteira + ganho;
            } else {
                db.usuarios[userId].carteira = carteira - amount;
            }
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(ganhou ? 0x00FF00 : 0xFF0000)
                .setTitle(ganhou ? '🎉 VOCÊ GANHOU!' : '😞 VOCÊ PERDEU!')
                .setDescription(`📡 Resultado: ${resultado}`)
                .addFields(
                    { name: '💰 Aposta', value: `${amount.toLocaleString()} Orbs`, inline: true },
                    { name: '🎯 Sua escolha', value: cor, inline: true },
                    { name: ganhou ? '🎁 Prêmio' : '💸 Perda', value: ganhou ? `+${ganho.toLocaleString()} Orbs` : `-${amount.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Roleta Galáctica' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'caçaniquel') {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) return message.reply('❌ Aposte um valor válido! Ex: `bt!cassino caçaniquel 100`');
            
            const db = getDB();
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            const carteira = db.usuarios[userId].carteira || 0;
            if (carteira < amount) {
                return message.reply(`❌ Você só tem ${carteira.toLocaleString()} Orbs!`);
            }
            
            const simbolos = ['🍒', '🍋', '🍊', '💎', '⭐', '7️⃣', '💰', '🪐'];
            const resultado = [
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)]
            ];
            
            let premio = 0;
            let mensagem = '';
            
            if (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
                if (resultado[0] === '7️⃣') { premio = amount * 10; mensagem = '🎉🎉🎉 JACKPOT! Três 7️⃣!'; }
                else if (resultado[0] === '💰') { premio = amount * 5; mensagem = '💰💰💰 TESOURO! Três 💰!'; }
                else if (resultado[0] === '💎') { premio = amount * 3; mensagem = '💎💎💎 TRÊS DIAMANTES!'; }
                else { premio = amount * 2; mensagem = `🎰 Três ${resultado[0]}!`; }
            } else if (resultado[0] === resultado[1] || resultado[1] === resultado[2] || resultado[0] === resultado[2]) {
                premio = amount * 1.5;
                mensagem = `🎰 Dois ${resultado[1]}!`;
            } else {
                premio = 0;
                mensagem = `😞 Nada dessa vez!`;
            }
            
            const ganho = Math.floor(premio);
            db.usuarios[userId].carteira = carteira - amount + ganho;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(ganho > 0 ? 0x00FF00 : 0xFF0000)
                .setTitle('🎰 Caça-Níquel Galáctico')
                .setDescription(`\`\`\`\n   ${resultado[0]} | ${resultado[1]} | ${resultado[2]}   \n\`\`\``)
                .addFields(
                    { name: '🎲 Resultado', value: mensagem, inline: false },
                    { name: '💰 Aposta', value: `${amount.toLocaleString()} Orbs`, inline: true },
                    { name: ganho > 0 ? '🎁 Prêmio' : '💸 Perda', value: ganho > 0 ? `+${ganho.toLocaleString()} Orbs` : `-${amount.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Caça-Níquel Interestelar' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎰 Cassino Galáctico')
                .setDescription('Jogos disponíveis:')
                .addFields(
                    { name: '🎲 Roleta', value: '`bt!cassino roleta <valor> <cor>`\nCores: vermelho (2x), preto (2x), verde (14x)', inline: false },
                    { name: '🎰 Caça-Níquel', value: '`bt!cassino caçaniquel <valor>`\nCombinações especiais dão prêmios multiplicados!', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Jogue com responsabilidade!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};