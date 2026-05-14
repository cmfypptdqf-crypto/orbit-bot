// commands/economia/sortudo.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

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
    name: 'sortudo',
    aliases: ['sorte', 'luck', 'evento', 'girar'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // VERIFICAR COOLDOWN
        const cooldownCheck = cooldownsManager.check(userId, 'sortudo');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde **${cooldownCheck.formatted}** para testar sua sorte novamente!`);
        }
        
        const eventos = [
            { nome: '💰 Tesouro Cósmico', ganho: [5000, 20000], cor: 0xFFD700, chance: 0.05 },
            { nome: '🎰 Caça-Níquel Galáctico', ganho: [1000, 5000], cor: 0x00FF00, chance: 0.15 },
            { nome: '🍀 Sorte Alienígena', ganho: [500, 1500], cor: 0x3498DB, chance: 0.30 },
            { nome: '⭐ Estrela da Sorte', ganho: [200, 800], cor: 0xF1C40F, chance: 0.35 },
            { nome: '😅 Quase nada', ganho: [10, 100], cor: 0x808080, chance: 0.10 },
            { nome: '💀 Má Sorte', ganho: [-500, -50], cor: 0xFF0000, chance: 0.05 }
        ];
        
        // Seleção normal ponderada
        const roll = Math.random();
        let acumulado = 0;
        let eventoEscolhido = eventos[0];
        
        for (const evento of eventos) {
            acumulado += evento.chance;
            if (roll <= acumulado) {
                eventoEscolhido = evento;
                break;
            }
        }
        
        const ganho = Math.floor(Math.random() * (eventoEscolhido.ganho[1] - eventoEscolhido.ganho[0] + 1) + eventoEscolhido.ganho[0]);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        let embed;
        
        if (ganho > 0) {
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
            embed = new EmbedBuilder()
                .setColor(eventoEscolhido.cor)
                .setTitle('🍀 Evento de Sorte!')
                .setDescription(`✨ **${eventoEscolhido.nome}**`)
                .addFields(
                    { name: '🎉 Você ganhou', value: `**+${ganho.toLocaleString()} Orbs**`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
        } else {
            const perdaReal = Math.min(Math.abs(ganho), db.usuarios[userId].carteira || 0);
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - perdaReal;
            embed = new EmbedBuilder()
                .setColor(eventoEscolhido.cor)
                .setTitle('😭 Evento de Azar!')
                .setDescription(`💀 **${eventoEscolhido.nome}**`)
                .addFields(
                    { name: '💸 Você perdeu', value: `**-${perdaReal.toLocaleString()} Orbs**`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
        }
        
        saveDB(db);
        
        // REGISTRAR COOLDOWN
        cooldownsManager.set(userId, 'sortudo');
        
        embed.setFooter({ text: 'Use bt!cooldowns para ver todos os tempos' });
        
        await message.reply({ embeds: [embed] });
    }
};