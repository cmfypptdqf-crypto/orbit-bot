// commands/rpg/nivelOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel, getTituloPorNivel, xpParaProximoNivel, xpAtualNoNivel } = require('../utilidades/xpSystem.js');
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

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}

const recompensasNivel = {
    10: { orbs: 5000, titulo: '🌟 Aprendiz Orbital' },
    25: { orbs: 10000, titulo: '⚔️ Guerreiro Estelar' },
    50: { orbs: 25000, titulo: '🛡️ Cavaleiro Orbital' },
    75: { orbs: 50000, titulo: '👑 Lorde Cósmico' },
    100: { orbs: 100000, titulo: '✨ Divindade Orbital' }
};

module.exports = {
    name: 'nivelorbital',
    aliases: ['level', 'lvl', 'nivel', 'stellular'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0, recompensasColetadas: [] };
        }
        
        const xpTotal = db.usuarios[userId].xpTotal || 0;
        const nivel = calcularNivel(xpTotal);
        const xpNecessario = xpParaProximoNivel(nivel);
        const xpAtual = xpAtualNoNivel(xpTotal, nivel);
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        const barra = gerarBarraProgresso(progresso, 20);
        const titulo = getTituloPorNivel(nivel);
        
        // Adicionar XP por consultar nível
        const xpGanho = 3;
        const resultadoXP = adicionarXP(userId, xpGanho, 'nivelorbital');
        
        if (subcmd === 'recompensa') {
            const recompensa = recompensasNivel[nivel];
            if (!recompensa) return message.reply(`❌ Nenhuma recompensa orbital disponível para o nível ${nivel}!`);
            if (db.usuarios[userId].recompensasColetadas?.includes(nivel)) return message.reply(`❌ Você já coletou a recompensa orbital do nível ${nivel}!`);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + recompensa.orbs;
            if (!db.usuarios[userId].recompensasColetadas) db.usuarios[userId].recompensasColetadas = [];
            db.usuarios[userId].recompensasColetadas.push(nivel);
            
            if (!db.usuarios[userId].titulos) db.usuarios[userId].titulos = [];
            if (!db.usuarios[userId].titulos.includes(recompensa.titulo)) {
                db.usuarios[userId].titulos.push(recompensa.titulo);
            }
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎁 Recompensa Orbital de Nível!')
                .setDescription(`Parabéns por atingir o nível orbital ${nivel}!`)
                .addFields(
                    { name: '💰 Orbs Orbitais', value: `+${recompensa.orbs.toLocaleString()} Orbs`, inline: true },
                    { name: '🏷️ Título Orbital', value: recompensa.titulo, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`📊 Nível Orbital de ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`${barra} **${progresso}%**\n📊 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} Stellar XP`)
                .addFields(
                    { name: '⭐ Stellar XP Total', value: `${xpTotal.toLocaleString()}`, inline: true },
                    { name: '🏆 Nível Orbital', value: `${nivel} - ${titulo}`, inline: true },
                    { name: '🎯 Próximo Nível', value: `${nivel + 1} (faltam ${(xpNecessario - xpAtual).toLocaleString()} Stellar XP)`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '✨ Orbit • Use bt!nivelorbital recompensa para coletar bônus de nível!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};