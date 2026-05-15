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
    'guerreiro': { nome: '⚔️ Guerreiro', bonus: { ataque: 1.20, defesa: 1.10 }, preco: 10000, nivelMin: 10, cor: '#E74C3C' },
    'mago': { nome: '🔮 Mago', bonus: { xp: 1.20, critico: 1.10 }, preco: 10000, nivelMin: 10, cor: '#9B59B6' },
    'arqueiro': { nome: '🏹 Arqueiro', bonus: { precisao: 1.15, velocidade: 1.15 }, preco: 10000, nivelMin: 10, cor: '#2ECC71' },
    'assassino': { nome: '🗡️ Assassino', bonus: { roubo: 1.25, critico: 1.20 }, preco: 15000, nivelMin: 20, cor: '#34495E' },
    'paladino': { nome: '🛡️ Paladino', bonus: { defesa: 1.30, cura: 1.20 }, preco: 15000, nivelMin: 20, cor: '#F1C40F' }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'classe',
    aliases: ['class', 'classe'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, classe: null };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Classes Disponíveis')
                .setDescription('Use `bt!classe escolher <classe>` para se tornar um herói!');
            
            for (const [id, classe] of Object.entries(classes)) {
                const liberado = nivel >= classe.nivelMin;
                embed.addFields({
                    name: classe.nome,
                    value: `💰 Custo: ${classe.preco.toLocaleString()} Orbs | 🎯 Nível ${classe.nivelMin}+${liberado ? ' ✅' : ' 🔒'}\n✨ Bônus: ${Object.entries(classe.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join(', ')}`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'escolher') {
            const classeId = args[1];
            if (!classeId || !classes[classeId]) return message.reply('❌ Classe inválida! Use `bt!classe listar`');
            
            const classe = classes[classeId];
            if (nivel < classe.nivelMin) return message.reply(`❌ Você precisa ser nível ${classe.nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < classe.preco) return message.reply(`❌ Você precisa de ${classe.preco.toLocaleString()} Orbs!`);
            
            db.usuarios[userId].carteira -= classe.preco;
            db.usuarios[userId].classe = classeId;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(classe.cor)
                .setTitle('✅ Classe Escolhida!')
                .setDescription(`Você agora é um **${classe.nome}**!`)
                .addFields(
                    { name: '✨ Bônus Ativos', value: Object.entries(classe.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join('\n'), inline: false }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'info') {
            const classeId = db.usuarios[userId].classe;
            if (!classeId) return message.reply('❌ Você não tem uma classe! Use `bt!classe escolher <classe>`');
            
            const classe = classes[classeId];
            const embed = new EmbedBuilder()
                .setColor(classe.cor)
                .setTitle(`📊 Classe de ${message.author.username}`)
                .setDescription(`🎭 **${classe.nome}**`)
                .addFields(
                    { name: '✨ Bônus Ativos', value: Object.entries(classe.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join('\n'), inline: false }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Sistema de Classes**\n`bt!classe listar` - Ver classes\n`bt!classe escolher <classe>` - Escolher classe\n`bt!classe info` - Sua classe');
        }
    }
};