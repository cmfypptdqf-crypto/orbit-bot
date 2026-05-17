// commands/rpg/classeOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../utilidades/xpSystem.js');

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

const classesOrbitais = {
    'guerreiro': { nome: '⚔️ Guerreiro Orbital', bonus: { ataque: 1.20, defesa: 1.10 }, preco: 10000, nivelMin: 10, cor: '#E74C3C' },
    'mago': { nome: '🔮 Mago Cósmico', bonus: { xp: 1.20, critico: 1.10 }, preco: 10000, nivelMin: 10, cor: '#9B59B6' },
    'arqueiro': { nome: '🏹 Arqueiro Estelar', bonus: { precisao: 1.15, velocidade: 1.15 }, preco: 10000, nivelMin: 10, cor: '#2ECC71' },
    'assassino': { nome: '🗡️ Assassino Orbital', bonus: { roubo: 1.25, critico: 1.20 }, preco: 15000, nivelMin: 20, cor: '#34495E' },
    'paladino': { nome: '🛡️ Paladino Estelar', bonus: { defesa: 1.30, cura: 1.20 }, preco: 15000, nivelMin: 20, cor: '#F1C40F' }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'classeorbital',
    aliases: ['classe', 'class', 'classeorbital'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, classe: null };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        // Adicionar XP por usar o comando
        const xpGanho = 5;
        const resultadoXP = adicionarXP(userId, xpGanho, 'classeorbital');
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Classes Orbitais Disponíveis')
                .setDescription('Use `bt!classeorbital escolher <classe>` para se tornar um herói orbital!')
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true });
            
            for (const [id, classe] of Object.entries(classesOrbitais)) {
                const liberado = nivel >= classe.nivelMin;
                embed.addFields({
                    name: classe.nome,
                    value: `💰 Custo: ${classe.preco.toLocaleString()} Orbs | 🎯 Nível Orbital ${classe.nivelMin}+${liberado ? ' ✅' : ' 🔒'}\n✨ Bônus: ${Object.entries(classe.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join(', ')}`,
                    inline: false
                });
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'escolher') {
            const classeId = args[1];
            if (!classeId || !classesOrbitais[classeId]) return message.reply('❌ Classe orbital inválida! Use `bt!classeorbital listar`');
            
            const classe = classesOrbitais[classeId];
            if (nivel < classe.nivelMin) return message.reply(`❌ Você precisa ser nível orbital ${classe.nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < classe.preco) return message.reply(`❌ Você precisa de ${classe.preco.toLocaleString()} Orbs orbitais!`);
            
            db.usuarios[userId].carteira -= classe.preco;
            db.usuarios[userId].classe = classeId;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(classe.cor)
                .setTitle('✅ Classe Orbital Escolhida!')
                .setDescription(`Você agora é um **${classe.nome}**!`)
                .addFields(
                    { name: '✨ Bônus Orbitais Ativos', value: Object.entries(classe.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join('\n'), inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'info') {
            const classeId = db.usuarios[userId].classe;
            if (!classeId) return message.reply('❌ Você não tem uma classe orbital! Use `bt!classeorbital escolher <classe>`');
            
            const classe = classesOrbitais[classeId];
            const embed = new EmbedBuilder()
                .setColor(classe.cor)
                .setTitle(`📊 Classe Orbital de ${message.author.username}`)
                .setDescription(`🎭 **${classe.nome}**`)
                .addFields(
                    { name: '✨ Bônus Orbitais Ativos', value: Object.entries(classe.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join('\n'), inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Sistema de Classes Orbitais**\n`bt!classeorbital listar` - Ver classes\n`bt!classeorbital escolher <classe>` - Escolher classe\n`bt!classeorbital info` - Sua classe orbital');
        }
    }
};