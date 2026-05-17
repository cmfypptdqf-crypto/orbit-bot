// commands/rpg/aliancaOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, aliancas: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const niveisAlianca = {
    1: { bonus: 1.02, maxMembros: 5, custo: 10000 },
    2: { bonus: 1.04, maxMembros: 10, custo: 20000 },
    3: { bonus: 1.06, maxMembros: 15, custo: 40000 },
    4: { bonus: 1.08, maxMembros: 20, custo: 80000 },
    5: { bonus: 1.10, maxMembros: 25, custo: 160000 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'alianca',
    aliases: ['ally', 'alliance', 'aliancaorbital'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0 };
        }
        if (!db.aliancas) db.aliancas = {};
        
        const xpGanho = 10;
        const resultadoXP = adicionarXP(userId, xpGanho, 'alianca');
        
        if (subcmd === 'criar') {
            const nome = args.slice(1).join(' ');
            if (!nome) return message.reply('❌ Use: `bt!alianca criar <nome>`');
            if (db.usuarios[userId].alianca) return message.reply('❌ Você já está em uma aliança orbital!');
            if (Object.values(db.aliancas).find(a => a.nome === nome)) return message.reply('❌ Já existe uma aliança orbital com este nome!');
            
            const custo = 10000;
            if ((db.usuarios[userId].carteira || 0) < custo) return message.reply(`❌ Criar uma aliança orbital custa ${custo.toLocaleString()} Orbs!`);
            
            const aliancaId = Date.now().toString();
            db.aliancas[aliancaId] = {
                id: aliancaId,
                nome: nome,
                dono: userId,
                membros: [userId],
                level: 1,
                xp: 0,
                createdAt: Date.now()
            };
            db.usuarios[userId].carteira -= custo;
            db.usuarios[userId].alianca = aliancaId;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🤝 Aliança Orbital Criada!')
                .setDescription(`✅ Aliança **${nome}** criada com sucesso!`)
                .addFields(
                    { name: '👑 Líder Orbital', value: message.author.username, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'info') {
            const aliancaId = db.usuarios[userId]?.alianca || args[1];
            if (!aliancaId || !db.aliancas[aliancaId]) return message.reply('❌ Aliança orbital não encontrada!');
            
            const alianca = db.aliancas[aliancaId];
            const nivelInfo = niveisAlianca[alianca.level];
            const membrosLista = [];
            
            for (const id of alianca.membros) {
                try {
                    const user = await client.users.fetch(id);
                    membrosLista.push(`${id === alianca.dono ? '👑' : '👤'} ${user.username}`);
                } catch (e) {}
            }
            
            const xpNecessario = alianca.level * 1000;
            const progresso = Math.min(99, Math.floor((alianca.xp / xpNecessario) * 100));
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🤝 Aliança Orbital: ${alianca.nome}`)
                .addFields(
                    { name: '👑 Líder', value: `<@${alianca.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${alianca.level}`, inline: true },
                    { name: '👥 Membros', value: `${alianca.membros.length}/${nivelInfo.maxMembros}`, inline: true },
                    { name: '✨ Bônus Orbital', value: `+${Math.round((nivelInfo.bonus - 1) * 100)}% em tudo`, inline: true },
                    { name: '📈 Progresso', value: `${progresso}% para próximo nível`, inline: true },
                    { name: '📋 Membros', value: membrosLista.join('\n') || 'Nenhum', inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'convidar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!alianca convidar @user`');
            
            const aliancaId = db.usuarios[userId]?.alianca;
            if (!aliancaId) return message.reply('❌ Você não está em uma aliança orbital!');
            
            const alianca = db.aliancas[aliancaId];
            if (alianca.dono !== userId) return message.reply('❌ Apenas o líder orbital pode convidar!');
            if (db.usuarios[user.id]?.alianca) return message.reply('❌ Usuário já está em uma aliança orbital!');
            
            if (!db.convitesAlianca) db.convitesAlianca = {};
            db.convitesAlianca[user.id] = { aliancaId, expires: Date.now() + 300000 };
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Convite Orbital Enviado!')
                .setDescription(`Convite orbital enviado para ${user}! Use \`bt!alianca entrar\` para aceitar.`)
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'entrar') {
            if (!db.convitesAlianca || !db.convitesAlianca[userId]) return message.reply('❌ Nenhum convite orbital pendente!');
            
            const convite = db.convitesAlianca[userId];
            const alianca = db.aliancas[convite.aliancaId];
            if (!alianca) return message.reply('❌ Aliança orbital não encontrada!');
            
            alianca.membros.push(userId);
            db.usuarios[userId].alianca = convite.aliancaId;
            delete db.convitesAlianca[userId];
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Bem-vindo à Aliança Orbital!')
                .setDescription(`Você entrou na aliança **${alianca.nome}**!`)
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'sair') {
            const aliancaId = db.usuarios[userId]?.alianca;
            if (!aliancaId) return message.reply('❌ Você não está em uma aliança orbital!');
            
            const alianca = db.aliancas[aliancaId];
            if (alianca.dono === userId) return message.reply('❌ Você é o líder orbital! Use `bt!alianca deletar` ou transfira a liderança.');
            
            alianca.membros = alianca.membros.filter(id => id !== userId);
            delete db.usuarios[userId].alianca;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🚪 Você saiu da aliança orbital!')
                .setDescription(`✅ Você saiu da aliança **${alianca.nome}**!`)
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🤝 **Sistema de Aliança Orbital**\n`bt!alianca criar <nome>` - Criar aliança\n`bt!alianca info [id]` - Info\n`bt!alianca convidar @user` - Convidar\n`bt!alianca entrar` - Aceitar convite\n`bt!alianca sair` - Sair');
        }
    }
};