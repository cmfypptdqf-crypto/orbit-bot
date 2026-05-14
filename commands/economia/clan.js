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
    aliases: ['guild', 'equipe'],
    
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
            if (!nome) return message.reply('❌ Use: `bt!clan criar <nome>`');
            if (nome.length > 20) return message.reply('❌ Nome muito longo!');
            if (db.usuarios[userId].clan) return message.reply('❌ Você já está em um clã!');
            
            const preco = 50000;
            if ((db.usuarios[userId].carteira || 0) < preco) {
                return message.reply(`❌ Criar clã custa ${preco.toLocaleString()} Orbs!`);
            }
            
            const clanId = Date.now().toString();
            db.clans[clanId] = {
                id: clanId, nome: nome, dono: userId, membros: [userId],
                level: 1, xp: 0, poder: 0, recursos: 0, createdAt: Date.now()
            };
            db.usuarios[userId].carteira -= preco;
            db.usuarios[userId].clan = clanId;
            saveDB(db);
            
            await message.reply(`✅ Clã **${nome}** criado com sucesso!`);
        }
        
        else if (subcmd === 'info') {
            let clanId = db.usuarios[userId]?.clan;
            if (args[1]) {
                const clanPorNome = Object.values(db.clans).find(c => c.nome.toLowerCase() === args.slice(1).join(' ').toLowerCase());
                if (clanPorNome) clanId = clanPorNome.id;
            }
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            const membrosLista = [];
            for (const id of clan.membros) {
                try {
                    const user = await client.users.fetch(id);
                    membrosLista.push(`${id === clan.dono ? '👑' : '👤'} ${user.username}`);
                } catch (e) { continue; }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700).setTitle(`🚀 Clã: ${clan.nome}`)
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${clan.level}`, inline: true },
                    { name: '👥 Membros', value: `${clan.membros.length}/50`, inline: true },
                    { name: '⚔️ Poder', value: `${recalcularPoderClan(clanId, db).toLocaleString()}`, inline: true },
                    { name: '💰 Recursos', value: `${(clan.recursos || 0).toLocaleString()} Orbs`, inline: true },
                    { name: '📋 Membros', value: membrosLista.join('\n'), inline: false }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'convidar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan convidar @usuario`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode convidar!');
            if (clan.membros.length >= 50) return message.reply('❌ Clã lotado!');
            if (db.usuarios[user.id]?.clan) return message.reply('❌ Usuário já está em um clã!');
            
            if (!db.convites) db.convites = {};
            db.convites[user.id] = { clanId: clanId, expires: Date.now() + 300000 };
            saveDB(db);
            
            await message.reply(`✅ Convite enviado para ${user}! Use \`bt!clan entrar\` para aceitar.`);
        }
        
        else if (subcmd === 'entrar') {
            if (!db.convites || !db.convites[userId]) return message.reply('❌ Nenhum convite pendente!');
            
            const convite = db.convites[userId];
            if (convite.expires < Date.now()) {
                delete db.convites[userId];
                return message.reply('❌ Convite expirado!');
            }
            
            const clan = db.clans[convite.clanId];
            if (!clan) return message.reply('❌ Clã não encontrado!');
            
            clan.membros.push(userId);
            db.usuarios[userId].clan = convite.clanId;
            delete db.convites[userId];
            recalcularPoderClan(convite.clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Você entrou no clã **${clan.nome}**!`);
        }
        
        else if (subcmd === 'sair') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono === userId) {
                return message.reply('❌ Líder não pode sair! Transfira a liderança primeiro.');
            }
            
            clan.membros = clan.membros.filter(id => id !== userId);
            delete db.usuarios[userId].clan;
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Você saiu do clã **${clan.nome}**!`);
        }
        
        else if (subcmd === 'transferir') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan transferir @usuario`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode transferir!');
            if (!clan.membros.includes(user.id)) return message.reply('❌ Usuário não está no clã!');
            
            clan.dono = user.id;
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Liderança transferida para ${user}!`);
        }
        
        else if (subcmd === 'deletar') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode deletar o clã!');
            
            for (const membroId of clan.membros) {
                if (db.usuarios[membroId]) delete db.usuarios[membroId].clan;
            }
            delete db.clans[clanId];
            saveDB(db);
            
            await message.reply(`✅ Clã **${clan.nome}** foi deletado!`);
        }
        
        else if (subcmd === 'doar') {
            const quantia = parseInt(args[1]);
            if (!quantia || quantia <= 0) return message.reply('❌ Use: `bt!clan doar <quantia>`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            if ((db.usuarios[userId].carteira || 0) < quantia) {
                return message.reply(`❌ Você não tem ${quantia.toLocaleString()} Orbs!`);
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
            
            await message.reply(`✅ Você doou ${quantia.toLocaleString()} Orbs para o clã!`);
        }
        
        else if (subcmd === 'ranking') {
            const ranking = Object.values(db.clans).sort((a, b) => b.level - a.level).slice(0, 10);
            if (ranking.length === 0) return message.reply('📊 Nenhum clã foi criado ainda!');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700).setTitle('🏆 Ranking de Clãs');
            
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
                .setColor(0xFFD700)
                .setTitle('🚀 Sistema de Clãs')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!clan criar <nome>`', value: 'Cria um clã (50.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!clan info`', value: 'Info do clã', inline: false },
                    { name: '👥 `bt!clan convidar @user`', value: 'Convidar (líder)', inline: false },
                    { name: '✅ `bt!clan entrar`', value: 'Aceitar convite', inline: false },
                    { name: '🚪 `bt!clan sair`', value: 'Sair do clã', inline: false },
                    { name: '👑 `bt!clan transferir @user`', value: 'Transferir liderança', inline: false },
                    { name: '💀 `bt!clan deletar`', value: 'Deletar clã', inline: false },
                    { name: '🎁 `bt!clan doar <valor>`', value: 'Doar Orbs', inline: false },
                    { name: '🏆 `bt!clan ranking`', value: 'Ranking', inline: false }
                );
            await message.reply({ embeds: [embed] });
        }
    }
};