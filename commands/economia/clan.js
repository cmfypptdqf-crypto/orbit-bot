// commands/economia/clan.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, clans: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'clan',
    description: 'Sistema de Clãs Espaciais',
    aliases: ['guild', 'equipe'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        let db = getDB(); // ← db definido AQUI
        
        if (!db.clans) db.clans = {};
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0 };
            saveDB(db);
        }
        
        // Comando: criar
        if (subcmd === 'criar') {
            const nome = args.slice(1).join(' ');
            if (!nome) return message.reply('❌ Use: `bt!clan criar <nome>`');
            if (nome.length > 20) return message.reply('❌ O nome do clã deve ter no máximo 20 caracteres!');
            
            if (db.usuarios[userId].clan) {
                return message.reply('❌ Você já está em um clã! Saia primeiro usando `bt!clan sair`');
            }
            
            const clanExistente = Object.values(db.clans).find(c => c.nome.toLowerCase() === nome.toLowerCase());
            if (clanExistente) return message.reply('❌ Já existe um clã com este nome!');
            
            const preco = 50000;
            if ((db.usuarios[userId].carteira || 0) < preco) {
                return message.reply(`❌ Criar um clã custa ${preco.toLocaleString()} Orbs! Você tem apenas ${db.usuarios[userId].carteira.toLocaleString()} Orbs.`);
            }
            
            const clanId = Date.now().toString();
            db.clans[clanId] = {
                id: clanId,
                nome: nome,
                dono: userId,
                membros: [userId],
                level: 1,
                xp: 0,
                poder: 0,
                galaxiaAtual: null,
                conquistas: [],
                recursos: 0,
                createdAt: Date.now()
            };
            
            db.usuarios[userId].carteira -= preco;
            db.usuarios[userId].clan = clanId;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🚀 Clã Criado com Sucesso!')
                .setDescription(`Clã **${nome}** foi criado!`)
                .addFields(
                    { name: '👑 Líder', value: message.author.username, inline: true },
                    { name: '💰 Custo', value: `${preco.toLocaleString()} Orbs`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: info
        else if (subcmd === 'info') {
            let clanId = db.usuarios[userId]?.clan;
            
            if (args[1]) {
                const clanPorNome = Object.values(db.clans).find(c => c.nome.toLowerCase() === args.slice(1).join(' ').toLowerCase());
                if (clanPorNome) clanId = clanPorNome.id;
            }
            
            if (!clanId) return message.reply('❌ Você não está em nenhum clã! Use `bt!clan criar <nome>` para criar um.');
            
            const clan = db.clans[clanId];
            if (!clan) return message.reply('❌ Clã não encontrado!');
            
            const membrosLista = [];
            for (const id of clan.membros) {
                try {
                    const user = await client.users.fetch(id);
                    const isLider = id === clan.dono ? '👑' : '👤';
                    membrosLista.push(`${isLider} ${user.username}`);
                } catch (e) {
                    membrosLista.push(`${id === clan.dono ? '👑' : '👤'} Usuário Desconhecido`);
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🚀 Clã: ${clan.nome}`)
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${clan.level}`, inline: true },
                    { name: '👥 Membros', value: `${clan.membros.length}/50`, inline: true },
                    { name: '📅 Criado em', value: `<t:${Math.floor(clan.createdAt / 1000)}:D>`, inline: true },
                    { name: '📋 Membros', value: membrosLista.join('\n') || 'Nenhum membro', inline: false }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: sair
        else if (subcmd === 'sair') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (!clan) return message.reply('❌ Clã não encontrado!');
            
            if (clan.dono === userId) {
                return message.reply('❌ Você é o líder! Para sair, primeiro transfira a liderança com `bt!clan transferir @usuario` ou delete o clã com `bt!clan deletar`');
            }
            
            clan.membros = clan.membros.filter(id => id !== userId);
            delete db.usuarios[userId].clan;
            saveDB(db);
            
            await message.reply(`✅ Você saiu do clã **${clan.nome}**!`);
        }
        
        // Comando: transferir
        else if (subcmd === 'transferir') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan transferir @usuario`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode transferir o clã!');
            if (!clan.membros.includes(user.id)) return message.reply('❌ Este usuário não está no seu clã!');
            
            clan.dono = user.id;
            saveDB(db);
            
            await message.reply(`✅ A liderança do clã **${clan.nome}** foi transferida para ${user}!`);
        }
        
        // Comando: deletar
        else if (subcmd === 'deletar') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode deletar o clã!');
            
            for (const membroId of clan.membros) {
                if (db.usuarios[membroId]) {
                    delete db.usuarios[membroId].clan;
                }
            }
            
            delete db.clans[clanId];
            saveDB(db);
            
            await message.reply(`✅ Clã **${clan.nome}** foi deletado!`);
        }
        
        // Comando: ajuda
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🚀 Sistema de Clãs Espaciais')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!clan criar <nome>`', value: 'Cria um novo clã (custa 50.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!clan info`', value: 'Mostra informações do clã', inline: false },
                    { name: '🚪 `bt!clan sair`', value: 'Sai do clã atual', inline: false },
                    { name: '👑 `bt!clan transferir @user`', value: 'Transfere a liderança', inline: false },
                    { name: '💀 `bt!clan deletar`', value: 'Deleta o clã (apenas líder)', inline: false }
                )
                .setFooter({ text: 'Use bt!clan <comando> para mais informações' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};