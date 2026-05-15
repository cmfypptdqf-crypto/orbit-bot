// commands/rpg/level.js
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

const recompensasNivel = {
    10: { orbs: 5000, titulo: '🌟 Aprendiz' },
    25: { orbs: 10000, titulo: '⚔️ Guerreiro' },
    50: { orbs: 25000, titulo: '🛡️ Cavaleiro' },
    75: { orbs: 50000, titulo: '👑 Lorde' },
    100: { orbs: 100000, titulo: '✨ Divindade' }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'level',
    aliases: ['lvl', 'nivel'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0, recompensasColetadas: [] };
        }
        
        const xpTotal = db.usuarios[userId].xpTotal || 0;
        const nivel = calcularNivel(xpTotal);
        const xpNecessario = nivel * 1000;
        const xpAtual = xpTotal % xpNecessario;
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        const barra = gerarBarraProgresso(progresso, 20);
        
        if (subcmd === 'recompensa') {
            const recompensa = recompensasNivel[nivel];
            if (!recompensa) return message.reply(`❌ Nenhuma recompensa disponível para o nível ${nivel}!`);
            if (db.usuarios[userId].recompensasColetadas?.includes(nivel)) return message.reply(`❌ Você já coletou a recompensa do nível ${nivel}!`);
            
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
                .setTitle('🎁 Recompensa de Nível!')
                .setDescription(`Parabéns por atingir o nível ${nivel}!`)
                .addFields(
                    { name: '💰 Orbs', value: `+${recompensa.orbs.toLocaleString()} Orbs`, inline: true },
                    { name: '🏷️ Título', value: recompensa.titulo, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'bonus') {
            const proximoBonus = Object.keys(recompensasNivel).find(n => parseInt(n) > nivel);
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`✨ Bônus de Nível - ${message.author.username}`)
                .setDescription(`📊 Nível atual: **${nivel}**\n🎯 Próximo bônus no nível: **${proximoBonus || '100'}**`)
                .addFields(
                    { name: '🎁 Recompensas Futuras', value: Object.entries(recompensasNivel).map(([n, r]) => `Nível ${n}: ${r.orbs.toLocaleString()} Orbs + Título "${r.titulo}"`).join('\n'), inline: false }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`📊 Nível de ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`${barra} **${progresso}%**\n📊 ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} XP`)
                .addFields(
                    { name: '⭐ XP Total', value: `${xpTotal.toLocaleString()}`, inline: true },
                    { name: '🏆 Nível', value: `${nivel}`, inline: true },
                    { name: '🎯 Próximo Nível', value: `${nivel + 1} (faltam ${(xpNecessario - xpAtual).toLocaleString()} XP)`, inline: true }
                )
                .setFooter({ text: 'Use bt!level recompensa para coletar bônus de nível!' });
            await message.reply({ embeds: [embed] });
        }
    }
};

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    return `🟩`.repeat(preenchido) + `⬜`.repeat(tamanho - preenchido);
}