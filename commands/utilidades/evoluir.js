// commands/rpg/evolucaoOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

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

const evolucoesOrbitais = {
    '1': { nome: '🌟 Estagiário Orbital', reqMissoes: 10, reqOrbs: 0, bonus: 1.05, nivel: 10 },
    '2': { nome: '⚔️ Guerreiro Estelar', reqMissoes: 50, reqOrbs: 10000, bonus: 1.10, nivel: 25 },
    '3': { nome: '🛡️ Cavaleiro Orbital', reqMissoes: 100, reqOrbs: 50000, bonus: 1.15, nivel: 50 },
    '4': { nome: '👑 Lorde Cósmico', reqMissoes: 200, reqOrbs: 100000, bonus: 1.20, nivel: 75 },
    '5': { nome: '✨ Divindade Orbital', reqMissoes: 500, reqOrbs: 500000, bonus: 1.30, nivel: 100 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'evolucao',
    aliases: ['evoluir', 'evolucaoorbital', 'upgrade'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, total_missoes: 0, evolucao: 1 };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        const missoes = db.usuarios[userId].total_missoes || 0;
        const evolucaoAtual = db.usuarios[userId].evolucao || 1;
        const proximaEvolucao = evolucoesOrbitais[evolucaoAtual + 1];
        
        const xpGanho = 15;
        const resultadoXP = adicionarXP(userId, xpGanho, 'evolucao');
        
        if (subcmd === 'status') {
            const atual = evolucoesOrbitais[evolucaoAtual];
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`📊 Evolução Orbital de ${message.author.username}`)
                .setDescription(`🎯 Evolução Atual: **${atual.nome}** (+${Math.round((atual.bonus - 1) * 100)}% orbital)`)
                .addFields(
                    { name: '📈 Bônus Orbital Ativo', value: `✨ +${Math.round((atual.bonus - 1) * 100)}% em todos ganhos`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (proximaEvolucao) {
                embed.addFields({
                    name: '🎯 Próxima Evolução Orbital',
                    value: `**${proximaEvolucao.nome}**\n📊 Requer: Nível ${proximaEvolucao.nivel} | ${proximaEvolucao.reqMissoes} missões | ${proximaEvolucao.reqOrbs.toLocaleString()} Orbs`,
                    inline: false
                });
            } else {
                embed.addFields({ name: '🏆 Máximo Orbital Alcançado!', value: 'Parabéns! Você atingiu a evolução orbital máxima!', inline: false });
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'realizar') {
            if (!proximaEvolucao) return message.reply('❌ Você já atingiu a evolução orbital máxima!');
            
            if (nivel < proximaEvolucao.nivel) return message.reply(`❌ Você precisa ser nível orbital ${proximaEvolucao.nivel}!`);
            if (missoes < proximaEvolucao.reqMissoes) return message.reply(`❌ Você precisa completar ${proximaEvolucao.reqMissoes} missões orbitais! (Atualmente: ${missoes})`);
            if ((db.usuarios[userId].carteira || 0) < proximaEvolucao.reqOrbs) return message.reply(`❌ Você precisa de ${proximaEvolucao.reqOrbs.toLocaleString()} Orbs orbitais!`);
            
            db.usuarios[userId].carteira -= proximaEvolucao.reqOrbs;
            db.usuarios[userId].evolucao = evolucaoAtual + 1;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 EVOLUÇÃO ORBITAL REALIZADA!')
                .setDescription(`Parabéns! Você evoluiu para **${proximaEvolucao.nome}**!`)
                .addFields(
                    { name: '✨ Novo Bônus Orbital', value: `+${Math.round((proximaEvolucao.bonus - 1) * 100)}% em todos ganhos`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🌟 **Sistema de Evolução Orbital**\n`bt!evolucao status` - Ver status orbital\n`bt!evolucao realizar` - Realizar evolução orbital');
        }
    }
};