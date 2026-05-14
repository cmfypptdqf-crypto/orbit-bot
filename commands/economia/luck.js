const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
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
        const cooldownKey = `luck_${userId}`;
        const lastLuck = cooldowns.get(cooldownKey);
        
        if (lastLuck && Date.now() - lastLuck < 3600000) {
            const remaining = Math.ceil((3600000 - (Date.now() - lastLuck)) / 60000);
            return message.reply(`⏰ Você já usou sua sorte hoje! Volte em **${remaining} minutos**.`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const eventos = [
            { nome: '💰 Tesouro Cósmico', ganho: [5000, 20000], cor: 0xFFD700, chance: 0.05 },
            { nome: '🎰 Caça-Níquel Galáctico', ganho: [1000, 5000], cor: 0x00FF00, chance: 0.15 },
            { nome: '🍀 Sorte Alienígena', ganho: [500, 1500], cor: 0x3498DB, chance: 0.30 },
            { nome: '⭐ Estrela da Sorte', ganho: [200, 800], cor: 0xF1C40F, chance: 0.35 },
            { nome: '😅 Quase nada', ganho: [10, 100], cor: 0x808080, chance: 0.10 },
            { nome: '💀 Má Sorte', ganho: [-500, -50], cor: 0xFF0000, chance: 0.05 }
        ];
        
        // Verificar item Amuleto da Sorte
        const inventario = db.usuarios[userId].inventario || {};
        const temAmuleto = inventario['11'] > 0;
        
        let eventoEscolhido;
        if (temAmuleto) {
            // Dobra chance de eventos positivos
            const positivos = eventos.filter(e => e.ganho[0] > 0);
            eventoEscolhido = positivos[Math.floor(Math.random() * positivos.length)];
        } else {
            // Seleção normal ponderada
            const roll = Math.random();
            let acumulado = 0;
            for (const evento of eventos) {
                acumulado += evento.chance;
                if (roll <= acumulado) {
                    eventoEscolhido = evento;
                    break;
                }
            }
        }
        
        const ganho = Math.floor(Math.random() * (eventoEscolhido.ganho[1] - eventoEscolhido.ganho[0] + 1) + eventoEscolhido.ganho[0]);
        
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
        
        if (temAmuleto) {
            embed.addFields({ name: '🍀 Amuleto da Sorte', value: 'Ativo! Eventos positivos garantidos!', inline: false });
            // Consumir o amuleto? ou mantém? Decida aqui
            // inventario['11']--;
        }
        
        saveDB(db);
        cooldowns.set(cooldownKey, Date.now());
        
        embed.setFooter({ text: 'Volte amanhã para testar sua sorte novamente!' });
        
        await message.reply({ embeds: [embed] });
    }
};