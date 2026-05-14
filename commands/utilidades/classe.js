// commands/rpg/classe.js
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

const classes = {
    'guerreiro': { nome: '⚔️ Guerreiro', bonus: { ataque: 1.2, defesa: 1.1 }, preco: 10000, nivelMin: 10 },
    'mago': { nome: '🔮 Mago', bonus: { xp: 1.2, sorte: 1.1 }, preco: 10000, nivelMin: 10 },
    'arqueiro': { nome: '🏹 Arqueiro', bonus: { precisao: 1.2, velocidade: 1.1 }, preco: 10000, nivelMin: 10 },
    'assassino': { nome: '🗡️ Assassino', bonus: { critico: 1.3, esquiva: 1.1 }, preco: 15000, nivelMin: 20 },
    'paladino': { nome: '🛡️ Paladino', bonus: { defesa: 1.3, cura: 1.2 }, preco: 15000, nivelMin: 20 },
    'necromante': { nome: '💀 Necromante', bonus: { vida: 1.2, ataque: 1.15 }, preco: 20000, nivelMin: 30 },
    'druida': { nome: '🌿 Druida', bonus: { natureza: 1.2, sorte: 1.2 }, preco: 20000, nivelMin: 30 }
};

module.exports = {
    name: 'classe',
    aliases: ['class', 'classe'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { classe: null, xpTotal: 0 };
        }
        
        const level = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Classes Disponíveis')
                .setDescription('Use `bt!classe escolher <classe>` para se tornar um herói!');
            
            for (const [id, classe] of Object.entries(classes)) {
                const liberado = level >= classe.nivelMin;
                embed.addFields({
                    name: classe.nome,
                    value: `💰 Custo: ${classe.preco.toLocaleString()} Orbs | 🎯 Nível ${classe.nivelMin}+${liberado ? ' ✅' : ' 🔒'}`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'escolher') {
            const classeId = args[1];
            if (!classeId || !classes[classeId]) return message.reply('❌ Classe inválida!');
            
            const classe = classes[classeId];
            if (level < classe.nivelMin) return message.reply(`❌ Você precisa ser nível ${classe.nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < classe.preco) return message.reply(`❌ Você precisa de ${classe.preco.toLocaleString()} Orbs!`);
            
            db.usuarios[userId].carteira -= classe.preco;
            db.usuarios[userId].classe = classeId;
            saveDB(db);
            
            await message.reply(`✅ Você agora é um **${classe.nome}**! Seus bônus estão ativos!`);
        }
        
        else if (subcmd === 'info') {
            const classeId = db.usuarios[userId].classe;
            if (!classeId) return message.reply('❌ Você não tem uma classe! Use `bt!classe escolher <classe>`');
            
            const classe = classes[classeId];
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`📊 Classe de ${message.author.username}`)
                .setDescription(`🎭 **${classe.nome}**`)
                .addFields({ name: '✨ Bônus', value: Object.entries(classe.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join('\n'), inline: false });
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Sistema de Classes**\n`bt!classe listar` - Ver classes\n`bt!classe escolher <classe>` - Escolher classe\n`bt!classe info` - Sua classe');
        }
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}