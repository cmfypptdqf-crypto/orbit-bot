// commands/rpg/skills.js
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

const skills = {
    'forca': { nome: '💪 Força', desc: 'Aumenta dano em ataques', preco: 1000, nivelMin: 5 },
    'agilidade': { nome: '⚡ Agilidade', desc: 'Aumenta chance de esquiva', preco: 1000, nivelMin: 5 },
    'inteligencia': { nome: '🧠 Inteligência', desc: 'Aumenta XP ganho', preco: 1000, nivelMin: 5 },
    'sorte': { nome: '🍀 Sorte', desc: 'Aumenta chance de eventos positivos', preco: 2000, nivelMin: 10 },
    'lideranca': { nome: '👑 Liderança', desc: 'Bônus para o clã', preco: 5000, nivelMin: 20 }
};

module.exports = {
    name: 'skills',
    aliases: ['habilidades', 'skill'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { skills: {}, xpTotal: 0 };
        }
        
        const level = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Habilidades Disponíveis')
                .setDescription('Use `bt!skills comprar <habilidade>` para adquirir');
            
            for (const [id, skill] of Object.entries(skills)) {
                const liberado = level >= skill.nivelMin;
                embed.addFields({
                    name: skill.nome,
                    value: `📝 ${skill.desc}\n💰 ${skill.preco} Orbs | 🎯 Nível ${skill.nivelMin}+${liberado ? ' ✅' : ' 🔒'}`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            const skillId = args[1];
            if (!skillId || !skills[skillId]) return message.reply('❌ Habilidade inválida!');
            
            const skill = skills[skillId];
            if (level < skill.nivelMin) return message.reply(`❌ Você precisa ser nível ${skill.nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < skill.preco) return message.reply(`❌ Você precisa de ${skill.preco} Orbs!`);
            if (db.usuarios[userId].skills?.[skillId]) return message.reply('❌ Você já possui esta habilidade!');
            
            db.usuarios[userId].carteira -= skill.preco;
            if (!db.usuarios[userId].skills) db.usuarios[userId].skills = {};
            db.usuarios[userId].skills[skillId] = true;
            saveDB(db);
            
            await message.reply(`✅ Você adquiriu a habilidade **${skill.nome}**!`);
        }
        
        else if (subcmd === 'meus') {
            const userSkills = db.usuarios[userId].skills || {};
            const lista = Object.keys(userSkills).map(id => skills[id].nome).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`⭐ Habilidades de ${message.author.username}`)
                .setDescription(lista || 'Nenhuma habilidade adquirida ainda.');
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Habilidades**\n`bt!skills listar` - Ver habilidades\n`bt!skills comprar <id>` - Comprar\n`bt!skills meus` - Suas habilidades');
        }
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}