// commands/economia/cacaniquel.js
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
    name: 'cacaniquel',
    aliases: ['slot', 'roleta', 'girar', 'cassino'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        // Verificar se o usuário tem o item Caça-Níquel
        const inventario = db.usuarios[userId].inventario || {};
        const qtdCaçaNiquel = inventario['13'] || 0;
        
        if (qtdCaçaNiquel === 0) {
            return message.reply('❌ Você não possui um **Caça-Níquel**! Compre um no `bt!mercadogalactico` (ID 13)');
        }
        
        // Símbolos do caça-níquel
        const simbolos = ['🍒', '🍋', '🍊', '💎', '⭐', '7️⃣', '💰', '🪐'];
        
        // Sortear 3 símbolos
        const resultado = [
            simbolos[Math.floor(Math.random() * simbolos.length)],
            simbolos[Math.floor(Math.random() * simbolos.length)],
            simbolos[Math.floor(Math.random() * simbolos.length)]
        ];
        
        // Calcular prêmio
        let premio = 0;
        let mensagem = '';
        
        // Verificar combinações
        if (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
            // Três iguais
            if (resultado[0] === '7️⃣') {
                premio = 10000;
                mensagem = '🎉🎉🎉 **JACKPOT!** Três 7️⃣! Você ganhou 10.000 Orbs! 🎉🎉🎉';
            } else if (resultado[0] === '💰') {
                premio = 5000;
                mensagem = '💰💰💰 **TESOURO!** Três 💰! Você ganhou 5.000 Orbs! 💰💰💰';
            } else if (resultado[0] === '💎') {
                premio = 3000;
                mensagem = '💎💎💎 **RARO!** Três 💎! Você ganhou 3.000 Orbs! 💎💎💎';
            } else {
                premio = 1000;
                mensagem = `🎰 Parabéns! Três ${resultado[0]}! Você ganhou 1.000 Orbs!`;
            }
        } else if (resultado[0] === resultado[1] || resultado[1] === resultado[2] || resultado[0] === resultado[2]) {
            // Dois iguais
            premio = 200;
            mensagem = `🎰 Dois ${resultado[1]}! Você ganhou 200 Orbs!`;
        } else {
            // Nada
            premio = 0;
            mensagem = `😞 Nada dessa vez! Tente novamente!`;
        }
        
        // Consumir 1 Caça-Níquel
        db.usuarios[userId].inventario['13']--;
        if (db.usuarios[userId].inventario['13'] <= 0) {
            delete db.usuarios[userId].inventario['13'];
        }
        
        // Adicionar prêmio
        if (premio > 0) {
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + premio;
        }
        
        saveDB(db);
        
        // Criar embed com o resultado
        const embed = new EmbedBuilder()
            .setColor(premio > 0 ? 0x00FF00 : 0xFF0000)
            .setTitle('🎰 Caça-Níquel Galáctico')
            .setDescription(`\`\`\`\n   ${resultado[0]} | ${resultado[1]} | ${resultado[2]}   \n\`\`\``)
            .addFields(
                { name: '🎲 Resultado', value: mensagem, inline: false }
            );
        
        if (premio > 0) {
            embed.addFields({ name: '💰 Prêmio', value: `+${premio.toLocaleString()} Orbs`, inline: true });
        }
        
        embed.addFields(
            { name: '🎰 Caça-Níqueis restantes', value: `${db.usuarios[userId].inventario['13'] || 0}`, inline: true },
            { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
        );
        
        await message.reply({ embeds: [embed] });
    }
};