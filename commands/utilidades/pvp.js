// commands/rpg/pvp.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, pvp: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'pvp',
    aliases: ['batalha', 'fight'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0, pvpVitorias: 0, pvpDerrotas: 0 };
        }
        
        if (!db.pvp) db.pvp = {};
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'desafiar') {
            const alvo = message.mentions.users.first();
            if (!alvo) return message.reply('❌ Use: `bt!pvp desafiar @usuario`');
            if (alvo.id === userId) return message.reply('❌ Você não pode desafiar a si mesmo!');
            if (db.pvp[userId]) return message.reply('❌ Você já tem um desafio pendente!');
            
            const alvoNivel = calcularNivel(db.usuarios[alvo.id]?.xpTotal || 0);
            const aposta = parseInt(args[2]) || 1000;
            
            if (aposta < 100) return message.reply('❌ Aposta mínima é 100 Orbs!');
            if ((db.usuarios[userId].carteira || 0) < aposta) return message.reply(`❌ Você não tem ${aposta.toLocaleString()} Orbs para apostar!`);
            
            db.pvp[alvo.id] = {
                desafiante: userId,
                apostado: aposta,
                expires: Date.now() + 60000
            };
            saveDB(db);
            
            await message.reply(`⚔️ **${message.author.username}** desafiou **${alvo.username}** para uma batalha!\n💰 Aposta: ${aposta.toLocaleString()} Orbs\n⏰ Use \`bt!pvp aceitar\` para aceitar (expira em 1 minuto)!`);
        }
        
        else if (subcmd === 'aceitar') {
            const desafio = db.pvp[userId];
            if (!desafio) return message.reply('❌ Você não tem nenhum desafio pendente!');
            if (desafio.expires < Date.now()) {
                delete db.pvp[userId];
                return message.reply('❌ O desafio expirou!');
            }
            
            const desafiante = await client.users.fetch(desafio.desafiante);
            const aposta = desafio.apostado;
            
            if ((db.usuarios[userId].carteira || 0) < aposta) {
                delete db.pvp[userId];
                return message.reply(`❌ Você não tem ${aposta.toLocaleString()} Orbs para aceitar o desafio!`);
            }
            
            // Batalha
            const poderDesafiante = nivel + Math.floor((db.usuarios[desafio.desafiante].total_missoes || 0) / 10);
            const poderAlvo = nivel + Math.floor((db.usuarios[userId].total_missoes || 0) / 10);
            
            const vitoriaDesafiante = poderDesafiante > poderAlvo;
            const vencedor = vitoriaDesafiante ? desafiante : message.author;
            const perdedor = vitoriaDesafiante ? message.author : desafiante;
            
            db.usuarios[vencedor.id].carteira += aposta;
            db.usuarios[perdedor.id].carteira -= aposta;
            db.usuarios[vencedor.id].pvpVitorias = (db.usuarios[vencedor.id].pvpVitorias || 0) + 1;
            db.usuarios[perdedor.id].pvpDerrotas = (db.usuarios[perdedor.id].pvpDerrotas || 0) + 1;
            
            delete db.pvp[userId];
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(vitoriaDesafiante ? 0x00FF00 : 0xFF0000)
                .setTitle('⚔️ RESULTADO DA BATALHA!')
                .setDescription(`🏆 **${vencedor.username}** venceu a batalha!\n💀 ${perdedor.username} foi derrotado!`)
                .addFields(
                    { name: '💰 Aposta', value: `${aposta.toLocaleString()} Orbs`, inline: true },
                    { name: '🎉 Vencedor', value: vencedor.username, inline: true },
                    { name: '🏅 Vitórias PvP', value: `${db.usuarios[vencedor.id].pvpVitorias}`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'rank') {
            const ranking = Object.entries(db.usuarios)
                .map(([id, data]) => ({ id, vitorias: data.pvpVitorias || 0, nome: id }))
                .sort((a, b) => b.vitorias - a.vitorias)
                .slice(0, 10);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏆 Ranking PvP')
                .setDescription('Os maiores guerreiros do universo!');
            
            for (let i = 0; i < ranking.length; i++) {
                try {
                    const user = await client.users.fetch(ranking[i].id);
                    embed.addFields({
                        name: `${i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} ${user.username}`,
                        value: `🏆 Vitórias: ${ranking[i].vitorias}`,
                        inline: false
                    });
                } catch (e) {}
            }
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⚔️ **Sistema PvP**\n`bt!pvp desafiar @user [aposta]` - Desafiar alguém\n`bt!pvp aceitar` - Aceitar desafio\n`bt!pvp rank` - Ranking PvP');
        }
    }
};