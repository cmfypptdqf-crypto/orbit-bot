// commands/economia/clan.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { recalcularPoderClan } = require('../utilidades/clanUtils.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, clans: {}, convites: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'clan',
    aliases: ['guild', 'equipe', 'starfed'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        let db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        if (!db.clans) db.clans = {};
        
        if (subcmd === 'criar') {
            const nome = args.slice(1).join(' ');
            if (!nome) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!starfed criar <nome>`');
            if (nome.length > 20) return message.reply('<:emoji_47:1504081397373997076> Nome muito longo!');
            if (db.usuarios[userId].clan) return message.reply('<:emoji_47:1504081397373997076> Você já está em uma Star Federation!');
            
            const preco = 50000;
            if ((db.usuarios[userId].carteira || 0) < preco) {
                return message.reply(`<:emoji_47:1504081397373997076> Criar uma Star Federation custa ${preco.toLocaleString()} Orbs!`);
            }
            
            const clanId = Date.now().toString();
            db.clans[clanId] = {
                id: clanId, nome: nome, dono: userId, membros: [userId],
                level: 1, xp: 0, poder: 0, recursos: 0, createdAt: Date.now()
            };
            db.usuarios[userId].carteira -= preco;
            db.usuarios[userId].clan = clanId;
            saveDB(db);
            
            await message.reply(`✅ **Star Federation: ${nome}** criada com sucesso!`);
        }
        
        else if (subcmd === 'info') {
            let clanId = db.usuarios[userId]?.clan;
            if (args[1]) {
                const clanPorNome = Object.values(db.clans).find(c => c.nome.toLowerCase() === args.slice(1).join(' ').toLowerCase());
                if (clanPorNome) clanId = clanPorNome.id;
            }
            if (!clanId) return message.reply('<:emoji_47:1504081397373997076> Você não está em nenhuma Star Federation!');
            
            const clan = db.clans[clanId];
            const membrosLista = [];
            for (const id of clan.membros) {
                try {
                    const user = await client.users.fetch(id);
                    membrosLista.push(`${id === clan.dono ? '👑' : '👤'} ${user.username}`);
                } catch (e) { continue; }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B).setTitle(`🚀 Star Federation: ${clan.nome}`)
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${clan.level}`, inline: true },
                    { name: '👥 Membros', value: `${clan.membros.length}/50`, inline: true },
                    { name: '⚔️ Poder', value: `${recalcularPoderClan(clanId, db).toLocaleString()}`, inline: true },
                    { name: '💰 Recursos', value: `${(clan.recursos || 0).toLocaleString()} Orbs`, inline: true },
                    { name: '📋 Membros', value: membrosLista.join('\n'), inline: false }
                )
                .setFooter({ text: '🚀 Star Federation • União entre exploradores' });
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'convidar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!starfed convidar @usuario`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('<:emoji_47:1504081397373997076> Você não está em uma Star Federation!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('<:emoji_47:1504081397373997076> Apenas o líder pode convidar!');
            if (clan.membros.length >= 50) return message.reply('<:emoji_47:1504081397373997076> Star Federation lotada!');
            if (db.usuarios[user.id]?.clan) return message.reply('<:emoji_47:1504081397373997076> Usuário já está em uma Star Federation!');
            
            if (!db.convites) db.convites = {};
            db.convites[user.id] = { clanId: clanId, expires: Date.now() + 300000 };
            saveDB(db);
            
            await message.reply(`✅ Convite enviado para ${user}! Use \`bt!starfed entrar\` para aceitar.`);
        }
        
        else if (subcmd === 'entrar') {
            if (!db.convites || !db.convites[userId]) return message.reply('<:emoji_47:1504081397373997076> Nenhum convite pendente!');
            
            const convite = db.convites[userId];
            if (convite.expires < Date.now()) {
                delete db.convites[userId];
                return message.reply('<:emoji_47:1504081397373997076> Convite expirado!');
            }
            
            const clan = db.clans[convite.clanId];
            if (!clan) return message.reply('<:emoji_47:1504081397373997076> Star Federation não encontrada!');
            
            clan.membros.push(userId);
            db.usuarios[userId].clan = convite.clanId;
            delete db.convites[userId];
            recalcularPoderClan(convite.clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Você entrou na **Star Federation: ${clan.nome}**!`);
        }
        
        else if (subcmd === 'sair') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('<:emoji_47:1504081397373997076> Você não está em uma Star Federation!');
            
            const clan = db.clans[clanId];
            if (clan.dono === userId) {
                return message.reply('<:emoji_47:1504081397373997076> Líder não pode sair! Transfira a liderança primeiro.');
            }
            
            clan.membros = clan.membros.filter(id => id !== userId);
            delete db.usuarios[userId].clan;
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Você saiu da **Star Federation: ${clan.nome}**!`);
        }
        
        else if (subcmd === 'transferir') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!starfed transferir @usuario`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('<:emoji_47:1504081397373997076> Você não está em uma Star Federation!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('<:emoji_47:1504081397373997076> Apenas o líder pode transferir!');
            if (!clan.membros.includes(user.id)) return message.reply('<:emoji_47:1504081397373997076> Usuário não está na Star Federation!');
            
            clan.dono = user.id;
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Liderança transferida para ${user}!`);
        }
        
        else if (subcmd === 'deletar') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('<:emoji_47:1504081397373997076> Você não está em uma Star Federation!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('<:emoji_47:1504081397373997076> Apenas o líder pode deletar a Star Federation!');
            
            for (const membroId of clan.membros) {
                if (db.usuarios[membroId]) delete db.usuarios[membroId].clan;
            }
            delete db.clans[clanId];
            saveDB(db);
            
            await message.reply(`✅ **Star Federation: ${clan.nome}** foi deletada!`);
        }
        
        else if (subcmd === 'doar') {
            const quantia = parseInt(args[1]);
            if (!quantia || quantia <= 0) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!starfed doar <quantia>`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('<:emoji_47:1504081397373997076> Você não está em uma Star Federation!');
            if ((db.usuarios[userId].carteira || 0) < quantia) {
                return message.reply(`<:emoji_47:1504081397373997076> Você não tem ${quantia.toLocaleString()} Orbs!`);
            }
            
            db.usuarios[userId].carteira -= quantia;
            db.clans[clanId].recursos = (db.clans[clanId].recursos || 0) + quantia;
            
            const xpGanho = Math.floor(quantia / 1000);
            db.clans[clanId].xp = (db.clans[clanId].xp || 0) + xpGanho;
            
            const xpNecessario = db.clans[clanId].level * 1000;
            if (db.clans[clanId].xp >= xpNecessario) {
                db.clans[clanId].level++;
                db.clans[clanId].xp -= xpNecessario;
                await message.reply(`🎉 **${db.clans[clanId].nome}** subiu para o nível ${db.clans[clanId].level}!`);
            }
            
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Você doou ${quantia.toLocaleString()} Orbs para a **Star Federation**!`);
        }
        
        else if (subcmd === 'ranking') {
            const ranking = Object.values(db.clans).sort((a, b) => b.level - a.level).slice(0, 10);
            if (ranking.length === 0) return message.reply('📊 Nenhuma Star Federation foi criada ainda!');
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B).setTitle('🏆 Ranking Star Federation');
            
            for (let i = 0; i < ranking.length; i++) {
                const clan = ranking[i];
                embed.addFields({
                    name: `${i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} ${clan.nome}`,
                    value: `📊 Nível ${clan.level} | 👥 ${clan.membros.length} membros`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🚀 Star Federation')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!starfed criar <nome>`', value: 'Cria uma Star Federation (50.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!starfed info`', value: 'Info da Star Federation', inline: false },
                    { name: '👥 `bt!starfed convidar @user`', value: 'Convidar (líder)', inline: false },
                    { name: '✅ `bt!starfed entrar`', value: 'Aceitar convite', inline: false },
                    { name: '🚪 `bt!starfed sair`', value: 'Sair da Star Federation', inline: false },
                    { name: '👑 `bt!starfed transferir @user`', value: 'Transferir liderança', inline: false },
                    { name: '💀 `bt!starfed deletar`', value: 'Deletar Star Federation', inline: false },
                    { name: '🎁 `bt!starfed doar <valor>`', value: 'Doar Orbs', inline: false },
                    { name: '🏆 `bt!starfed ranking`', value: 'Ranking', inline: false }
                )
                .setFooter({ text: '🚀 Star Federation • União entre exploradores' });
            await message.reply({ embeds: [embed] });
        }
    }
};