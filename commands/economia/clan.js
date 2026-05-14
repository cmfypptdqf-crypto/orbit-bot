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
        
        // Comando: criar
        if (subcmd === 'criar') {
            const nome = args.slice(1).join(' ');
            if (!nome) return message.reply('❌ Use: `bt!clan criar <nome>`');
            
            if (nome.length > 20) return message.reply('❌ O nome do clã deve ter no máximo 20 caracteres!');
            
            const db = getDB();
            
            // Inicializar estruturas se não existirem
            if (!db.usuarios[message.author.id]) {
                db.usuarios[message.author.id] = { carteira: 0, banco: 0, inventario: {} };
            }
            if (!db.clans) db.clans = {};
            
            // Verificar se o usuário já está em um clã
            if (db.usuarios[message.author.id].clan) {
                return message.reply('❌ Você já está em um clã! Saia primeiro usando `!clan sair`');
            }
            
            // Verificar se já existe clã com esse nome
            const clanExistente = Object.values(db.clans).find(c => c.nome.toLowerCase() === nome.toLowerCase());
            if (clanExistente) return message.reply('❌ Já existe um clã com este nome!');
            
            const preco = 50000;
            if ((db.usuarios[message.author.id]?.carteira || 0) < preco) {
                return message.reply(`❌ Criar um clã custa ${preco.toLocaleString()} Orbs! Você tem apenas ${db.usuarios[message.author.id].carteira.toLocaleString()} Orbs.`);
            }
            
            const clanId = Date.now().toString();
            db.clans[clanId] = {
                id: clanId,
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
            const db = getDB();
            let clanId = args[1] ? args[1] : db.usuarios[message.author.id]?.clan;
            
            // Se não encontrou clã do usuário, tenta buscar pelo nome
            if (!clanId && args[1]) {
                const clanPorNome = Object.values(db.clans || {}).find(c => c.nome.toLowerCase() === args[1].toLowerCase());
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
                    { name: '⭐ XP do Clã', value: `${clan.xp} / ${clan.level * 1000}`, inline: true },
                    { name: '📋 Membros', value: membrosLista.join('\n') || 'Nenhum membro', inline: false }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: convidar
        else if (subcmd === 'convidar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan convidar @usuario`');
            
            if (user.id === message.author.id) return message.reply('❌ Você não pode se convidar!');
            if (user.bot) return message.reply('❌ Não pode convidar bots!');
            
            const db = getDB();
            const clanId = db.usuarios[message.author.id]?.clan;
            
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== message.author.id) return message.reply('❌ Apenas o líder pode convidar membros!');
            
            if (clan.membros.length >= 50) return message.reply('❌ Seu clã já atingiu o limite de 50 membros!');
            
            if (db.usuarios[user.id]?.clan) return message.reply('❌ Este usuário já está em um clã!');
            
            // Salvar convite (simplificado - você pode melhorar com sistema de convites)
            if (!db.convites) db.convites = {};
            db.convites[user.id] = { clanId: clanId, expires: Date.now() + 300000 };
            saveDB(db);
            
            await message.reply(`✅ Convite enviado para ${user}! Use \`bt!clan entrar\` para aceitar.`);
        }
        
        // Comando: entrar
        else if (subcmd === 'entrar') {
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.convites || !db.convites[userId]) return message.reply('❌ Você não tem nenhum convite pendente!');
            
            const convite = db.convites[userId];
            if (convite.expires < Date.now()) {
                delete db.convites[userId];
                return message.reply('❌ Seu convite expirou!');
            }
            
            const clan = db.clans[convite.clanId];
            if (!clan) return message.reply('❌ Clã não encontrado!');
            
            if (db.usuarios[userId]?.clan) return message.reply('❌ Você já está em um clã!');
            
            clan.membros.push(userId);
            db.usuarios[userId].clan = convite.clanId;
            delete db.convites[userId];
            saveDB(db);
            
            await message.reply(`✅ Você entrou no clã **${clan.nome}**! Bem-vindo(a)!`);
        }
        
        // Comando: sair
        else if (subcmd === 'sair') {
            const db = getDB();
            const userId = message.author.id;
            const clanId = db.usuarios[userId]?.clan;
            
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (!clan) return message.reply('❌ Clã não encontrado!');
            
            if (clan.dono === userId) {
                return message.reply('❌ Você é o líder! Para sair, primeiro transfira a liderança com `bt!clan transferir @usuario` ou delete o clã com `!clan deletar`');
            }
            
            clan.membros = clan.membros.filter(id => id !== userId);
            delete db.usuarios[userId].clan;
            saveDB(db);
            
            await message.reply(`✅ Você saiu do clã **${clan.nome}**!`);
        }
        
        // Comando: deletar
        else if (subcmd === 'deletar') {
            const db = getDB();
            const userId = message.author.id;
            const clanId = db.usuarios[userId]?.clan;
            
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode deletar o clã!');
            
            // Remover clan de todos os membros
            for (const membroId of clan.membros) {
                if (db.usuarios[membroId]) {
                    delete db.usuarios[membroId].clan;
                }
            }
            
            delete db.clans[clanId];
            saveDB(db);
            
            await message.reply(`✅ Clã **${clan.nome}** foi deletado!`);
        }
        
        // Comando: transferir
        else if (subcmd === 'transferir') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan transferir @usuario`');
            
            const db = getDB();
            const userId = message.author.id;
            const clanId = db.usuarios[userId]?.clan;
            
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode transferir o clã!');
            
            if (!clan.membros.includes(user.id)) return message.reply('❌ Este usuário não está no seu clã!');
            
            clan.dono = user.id;
            saveDB(db);
            
            await message.reply(`✅ A liderança do clã **${clan.nome}** foi transferida para ${user}!`);
        }
        
        // Comando: top
        else if (subcmd === 'top') {
            const db = getDB();
            if (!db.clans) return message.reply('📊 Nenhum clã foi criado ainda!');
            
            const ranking = Object.values(db.clans)
                .sort((a, b) => b.level - a.level || b.membros.length - a.membros.length)
                .slice(0, 10);
            
            if (ranking.length === 0) return message.reply('📊 Nenhum clã encontrado!');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏆 Ranking de Clãs')
                .setDescription('Os clãs mais poderosos da galáxia!');
            
            for (let i = 0; i < ranking.length; i++) {
                const clan = ranking[i];
                let medalha = '';
                if (i === 0) medalha = '👑 ';
                else if (i === 1) medalha = '🥈 ';
                else if (i === 2) medalha = '🥉 ';
                
                embed.addFields({
                    name: `${medalha}#${i + 1} - ${clan.nome}`,
                    value: `📊 Nível ${clan.level} | 👥 ${clan.membros.length} membros`,
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: ajuda (padrão)
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🚀 Sistema de Clãs Espaciais')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!clan criar <nome>`', value: 'Cria um novo clã (custa 50.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!clan info [@clã]`', value: 'Mostra informações do clã', inline: false },
                    { name: '👥 `bt!clan convidar @user`', value: 'Convida um usuário para o clã (apenas líder)', inline: false },
                    { name: '✅ `bt!clan entrar`', value: 'Aceita um convite para um clã', inline: false },
                    { name: '🚪 `bt!clan sair`', value: 'Sai do clã atual', inline: false },
                    { name: '👑 `bt!clan transferir @user`', value: 'Transfere a liderança (apenas líder)', inline: false },
                    { name: '💀 `bt!clan deletar`', value: 'Deleta o clã (apenas líder)', inline: false },
                    { name: '🏆 `bt!clan top`', value: 'Mostra o ranking de clãs', inline: false }
                )
                .setFooter({ text: 'Use bt! <comando> para mais informações' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};