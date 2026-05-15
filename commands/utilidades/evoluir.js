// commands/rpg/evoluir.js
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

const evolucoes = {
    '1': { nome: '🌟 Estagiário', reqMissoes: 10, reqOrbs: 0, bonus: 1.05, nivel: 10 },
    '2': { nome: '⚔️ Guerreiro', reqMissoes: 50, reqOrbs: 10000, bonus: 1.10, nivel: 25 },
    '3': { nome: '🛡️ Cavaleiro', reqMissoes: 100, reqOrbs: 50000, bonus: 1.15, nivel: 50 },
    '4': { nome: '👑 Lorde', reqMissoes: 200, reqOrbs: 100000, bonus: 1.20, nivel: 75 },
    '5': { nome: '✨ Divindade', reqMissoes: 500, reqOrbs: 500000, bonus: 1.30, nivel: 100 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'evoluir',
    aliases: ['evolucao', 'upgrade'],
    
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
        const proximaEvolucao = evolucoes[evolucaoAtual + 1];
        
        if (subcmd === 'status') {
            const atual = evolucoes[evolucaoAtual];
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`📊 Evolução de ${message.author.username}`)
                .setDescription(`🎯 Evolução Atual: **${atual.nome}** (+${Math.round((atual.bonus - 1) * 100)}% em tudo)`)
                .addFields(
                    { name: '📈 Bônus Ativo', value: `✨ +${Math.round((atual.bonus - 1) * 100)}% em todos ganhos`, inline: true }
                );
            
            if (proximaEvolucao) {
                embed.addFields({
                    name: '🎯 Próxima Evolução',
                    value: `**${proximaEvolucao.nome}**\n📊 Requer: Nível ${proximaEvolucao.nivel} | ${proximaEvolucao.reqMissoes} missões | ${proximaEvolucao.reqOrbs.toLocaleString()} Orbs`,
                    inline: false
                });
            } else {
                embed.addFields({ name: '🏆 Máximo Alcançado!', value: 'Parabéns! Você atingiu a evolução máxima!', inline: false });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'realizar') {
            if (!proximaEvolucao) return message.reply('❌ Você já atingiu a evolução máxima!');
            
            if (nivel < proximaEvolucao.nivel) return message.reply(`❌ Você precisa ser nível ${proximaEvolucao.nivel}!`);
            if (missoes < proximaEvolucao.reqMissoes) return message.reply(`❌ Você precisa completar ${proximaEvolucao.reqMissoes} missões! (Atualmente: ${missoes})`);
            if ((db.usuarios[userId].carteira || 0) < proximaEvolucao.reqOrbs) return message.reply(`❌ Você precisa de ${proximaEvolucao.reqOrbs.toLocaleString()} Orbs!`);
            
            db.usuarios[userId].carteira -= proximaEvolucao.reqOrbs;
            db.usuarios[userId].evolucao = evolucaoAtual + 1;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 EVOLUÇÃO REALIZADA!')
                .setDescription(`Parabéns! Você evoluiu para **${proximaEvolucao.nome}**!`)
                .addFields(
                    { name: '✨ Novo Bônus', value: `+${Math.round((proximaEvolucao.bonus - 1) * 100)}% em todos ganhos`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🌟 **Sistema de Evolução**\n`bt!evoluir status` - Ver status\n`bt!evoluir realizar` - Realizar evolução');
        }
    }
};