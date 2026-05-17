// commands/social/reputacaoOrbital.js
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

const reputacaoCooldowns = new Map();

module.exports = {
    name: 'reputacao',
    aliases: ['rep', 'karma', 'reputacaoorbital'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { reputacao: 0 };
        }
        
        // Adicionar XP por usar o comando
        const xpGanho = 5;
        const resultadoXP = adicionarXP(userId, xpGanho, 'reputacao');
        
        // ========== DAR REPUTAÇÃO ==========
        if (subcmd === 'dar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!reputacao dar @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode dar reputação orbital a si mesmo!');
            if (user.bot) return message.reply('❌ Não pode dar reputação a um drone orbital!');
            
            const lastRep = reputacaoCooldowns.get(userId);
            if (lastRep && Date.now() - lastRep < 86400000) {
                const remaining = Math.ceil((86400000 - (Date.now() - lastRep)) / 3600000);
                return message.reply(`⏰ Você já deu reputação orbital hoje! Aguarde ${remaining} horas para a próxima.`);
            }
            
            if (!db.usuarios[user.id]) db.usuarios[user.id] = { reputacao: 0 };
            db.usuarios[user.id].reputacao = (db.usuarios[user.id].reputacao || 0) + 1;
            saveDB(db);
            
            reputacaoCooldowns.set(userId, Date.now());
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Reputação Orbital!')
                .setDescription(`✨ ${message.author} deu +1 reputação orbital para ${user.username}!`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • A reputação orbital é um reflexo da sua conexão estelar!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== VER REPUTAÇÃO ==========
        else if (subcmd === 'ver') {
            let user = message.author;
            if (args[1]) {
                const mention = message.mentions.users.first();
                if (mention) user = mention;
            }
            
            const rep = db.usuarios[user.id]?.reputacao || 0;
            
            let nivelOrbital = '';
            if (rep >= 100) nivelOrbital = '👑 Lenda Orbital';
            else if (rep >= 50) nivelOrbital = '🌟 Respeitado Orbital';
            else if (rep >= 10) nivelOrbital = '👍 Confiável Orbital';
            else nivelOrbital = '🌱 Novato Orbital';
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`⭐ Reputação Orbital de ${user.username}`)
                .setDescription(`📊 **${rep} pontos orbitais**\n🏆 Nível: ${nivelOrbital}`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • A reputação orbital mostra sua conexão com a comunidade!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== TOP ==========
        else if (subcmd === 'top') {
            const ranking = Object.entries(db.usuarios)
                .map(([id, data]) => ({ id, rep: data.reputacao || 0 }))
                .sort((a, b) => b.rep - a.rep)
                .slice(0, 10);
            
            if (ranking.length === 0) return message.reply('📊 Nenhuma reputação orbital registrada ainda!');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏆 Ranking Orbital de Reputação')
                .setDescription('Os exploradores mais respeitados da galáxia!')
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                );
            
            for (let i = 0; i < ranking.length; i++) {
                try {
                    const user = await client.users.fetch(ranking[i].id);
                    let medalha = '';
                    if (i === 0) medalha = '👑 ';
                    else if (i === 1) medalha = '🥈 ';
                    else if (i === 2) medalha = '🥉 ';
                    else medalha = `${i + 1}. `;
                    
                    embed.addFields({
                        name: `${medalha}${user.username}`,
                        value: `⭐ Reputação Orbital: ${ranking[i].rep}`,
                        inline: false
                    });
                } catch (e) { continue; }
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Reputação Orbital - Sistema de Karma')
                .setDescription('Comandos orbitais disponíveis:')
                .addFields(
                    { name: '🎁 `bt!reputacao dar @user`', value: 'Dá +1 reputação orbital para alguém (1x por dia)', inline: false },
                    { name: '👁️ `bt!reputacao ver [@user]`', value: 'Mostra a reputação orbital de um usuário', inline: false },
                    { name: '🏆 `bt!reputacao top`', value: 'Ranking orbital de reputação', inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (comando orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • A reputação orbital é um reflexo da sua conexão estelar!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};