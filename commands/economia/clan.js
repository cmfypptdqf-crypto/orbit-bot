// commands/economia/clan.js
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'clan',
    description: 'Sistema de Clãs Espaciais',
    aliases: ['guild', 'equipe'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'criar') {
            const nome = args.slice(1).join(' ');
            if (!nome) return message.reply('❌ Digite um nome para seu clã!');
            
            const db = getDB();
            if (!db.clans) db.clans = {};
            
            // Verificar se já existe clã com esse nome
            const clanExistente = Object.values(db.clans).find(c => c.nome === nome);
            if (clanExistente) return message.reply('❌ Já existe um clã com este nome!');
            
            const preco = 50000;
            if ((db.usuarios[message.author.id]?.carteira || 0) < preco) {
                return message.reply(`❌ Criar um clã custa ${preco} Orbs!`);
            }
            
            const clanId = Date.now().toString();
            db.clans[clanId] = {
                nome: nome,
                dono: message.author.id,
                membros: [message.author.id],
                level: 1,
                xp: 0,
                createdAt: Date.now()
            };
            
            db.usuarios[message.author.id].carteira -= preco;
            db.usuarios[message.author.id].clan = clanId;
            saveDB(db);
            
            await message.reply(`✅ Clã **${nome}** criado com sucesso! Você é o líder!`);
        }
        
        if (subcmd === 'info') {
            const db = getDB();
            const clanId = db.usuarios[message.author.id]?.clan;
            
            if (!clanId || !db.clans[clanId]) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            const membros = await Promise.all(clan.membros.map(async id => {
                const user = await client.users.fetch(id);
                return user.username;
            }));
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🚀 Clã: ${clan.nome}`)
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${clan.level}`, inline: true },
                    { name: '👥 Membros', value: membros.join(', '), inline: false }
                );
            
            await message.reply({ embeds: [embed] });
        }
    }
};