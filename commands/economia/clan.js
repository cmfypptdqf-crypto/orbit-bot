// commands/economia/clan.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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

// Lista de galáxias para bônus
const galaxias = {
    'via_lactea': { nome: '🌌 Via Láctea', bonus: { carteira: 1.05, missoes: 1.05 }, defesa: 1000 },
    'andromeda': { nome: '🌀 Andrômeda', bonus: { carteira: 1.10, missoes: 1.08 }, defesa: 5000 },
    'triangulo': { nome: '🔺 Triângulo', bonus: { carteira: 1.08, missoes: 1.10 }, defesa: 3000 },
    'olho_negro': { nome: '👁️ Olho Negro', bonus: { carteira: 1.12, missoes: 1.12 }, defesa: 10000 },
    'sombreiro': { nome: '🎩 Sombreiro', bonus: { carteira: 1.15, missoes: 1.15 }, defesa: 15000 },
    'centaurus': { nome: '⚡ Centaurus A', bonus: { carteira: 1.20, missoes: 1.18 }, defesa: 25000 },
    'rosquinha': { nome: '🍩 Galáxia do Anel', bonus: { carteira: 1.25, missoes: 1.22 }, defesa: 50000 }
};

module.exports = {
    name: 'clan',
    description: 'Sistema de Clãs Espaciais',
    aliases: ['guild', 'equipe', 'clã'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        let db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0 };
            saveDB(db);
        }
        
        if (!db.clans) db.clans = {};
        if (!db.convites) db.convites = {};
        
        // ========== COMANDO: CRIAR ==========
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
                    { name: '💰 Custo', value: `${preco.toLocaleString()} Orbs`, inline: true },
                    { name: '💡 Dica', value: 'Use `bt!clan info` para ver seu clã!', inline: false }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: INFO ==========
        else if (subcmd === 'info') {
            let clanId = null;
            
            if (args[1]) {
                const clanPorNome = Object.values(db.clans).find(c => c.nome.toLowerCase() === args.slice(1).join(' ').toLowerCase());
                if (clanPorNome) clanId = clanPorNome.id;
            } else {
                clanId = db.usuarios[userId]?.clan;
            }
            
            if (!clanId) return message.reply('❌ Você não está em nenhum clã! Use `bt!clan criar <nome>` para criar um.');
            
            const clan = db.clans[clanId];
            if (!clan) return message.reply('❌ Clã não encontrado!');
            
            // Buscar informações dos membros
            const membrosLista = [];
            let poderTotal = 0;
            let riquezaTotal = 0;
            
            for (const id of clan.membros) {
                try {
                    const user = await client.users.fetch(id);
                    const isLider = id === clan.dono ? '👑' : '👤';
                    const userData = db.usuarios[id] || { total_missoes: 0, carteira: 0, banco: 0 };
                    const userTotal = (userData.carteira || 0) + (userData.banco || 0);
                    poderTotal += userData.total_missoes || 0;
                    riquezaTotal += userTotal;
                    membrosLista.push(`${isLider} ${user.username} (💰 ${userTotal.toLocaleString()} Orbs)`);
                } catch (e) {
                    membrosLista.push(`${id === clan.dono ? '👑' : '👤'} Usuário Desconhecido`);
                }
            }
            
            const galaxiaAtual = clan.galaxiaAtual ? galaxias[clan.galaxiaAtual] : null;
            const bonusTexto = galaxiaAtual 
                ? `💰 +${Math.round((galaxiaAtual.bonus.carteira - 1) * 100)}% Orbs\n🚀 +${Math.round((galaxiaAtual.bonus.missoes - 1) * 100)}% XP`
                : 'Nenhuma galáxia dominada';
            
            const xpNecessario = clan.level * 1000;
            const barraXP = gerarBarraProgresso(clan.xp, xpNecessario, 15);
            
            const embed = new EmbedBuilder()
                .setColor(galaxiaAtual?.cor || 0xFFD700)
                .setTitle(`🚀 Clã: ${clan.nome}`)
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${clan.level}`, inline: true },
                    { name: '👥 Membros', value: `${clan.membros.length}/50`, inline: true },
                    { name: '💰 Riqueza do Clã', value: `${riquezaTotal.toLocaleString()} Orbs`, inline: true },
                    { name: '⚔️ Poder Total', value: `${poderTotal.toLocaleString()}`, inline: true },
                    { name: '📅 Criado em', value: `<t:${Math.floor(clan.createdAt / 1000)}:D>`, inline: true },
                    { name: '📊 Progresso do Clã', value: `${barraXP}\n📈 ${clan.xp.toLocaleString()} / ${xpNecessario.toLocaleString()} XP`, inline: false },
                    { name: '🌌 Galáxia Dominada', value: galaxiaAtual ? galaxiaAtual.nome : '❌ Nenhuma', inline: false },
                    { name: '✨ Bônus Ativos', value: bonusTexto, inline: false },
                    { name: '📋 Membros', value: membrosLista.slice(0, 15).join('\n') || 'Nenhum membro', inline: false }
                );
            
            if (membrosLista.length > 15) {
                embed.setFooter({ text: `+ ${membrosLista.length - 15} outros membros` });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: CONVIDAR ==========
        else if (subcmd === 'convidar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan convidar @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode se convidar!');
            if (user.bot) return message.reply('❌ Não pode convidar bots!');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode convidar membros!');
            if (clan.membros.length >= 50) return message.reply('❌ Seu clã já atingiu o limite de 50 membros!');
            if (db.usuarios[user.id]?.clan) return message.reply('❌ Este usuário já está em um clã!');
            
            db.convites[user.id] = { clanId: clanId, expires: Date.now() + 300000 };
            saveDB(db);
            
            await message.reply(`✅ Convite enviado para ${user}! Use \`bt!clan entrar\` para aceitar. O convite expira em 5 minutos.`);
        }
        
        // ========== COMANDO: ENTRAR ==========
        else if (subcmd === 'entrar') {
            if (!db.convites[userId]) return message.reply('❌ Você não tem nenhum convite pendente!');
            
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
            
            await message.reply(`✅ Você entrou no clã **${clan.nome}**! Bem-vindo(a), comandante!`);
        }
        
        // ========== COMANDO: SAIR ==========
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
            
            await message.reply(`✅ Você saiu do clã **${clan.nome}**! Esperamos vê-lo novamente.`);
        }
        
        // ========== COMANDO: TRANSFERIR ==========
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
        
        // ========== COMANDO: DELETAR ==========
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
        
        // ========== COMANDO: DOAR ==========
        else if (subcmd === 'doar') {
            const quantia = parseInt(args[1]);
            if (!quantia || quantia <= 0) return message.reply('❌ Use: `bt!clan doar <quantia>`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            if ((db.usuarios[userId].carteira || 0) < quantia) {
                return message.reply(`❌ Você não tem ${quantia.toLocaleString()} Orbs para doar!`);
            }
            
            db.usuarios[userId].carteira -= quantia;
            db.clans[clanId].recursos += quantia;
            
            // Ganhar XP para o clã (cada 1000 doados = 1 XP)
            const xpGanho = Math.floor(quantia / 1000);
            db.clans[clanId].xp += xpGanho;
            
            // Verificar level up
            const xpNecessario = db.clans[clanId].level * 1000;
            if (db.clans[clanId].xp >= xpNecessario) {
                db.clans[clanId].level++;
                db.clans[clanId].xp -= xpNecessario;
                await message.channel.send(`🎉 **${db.clans[clanId].nome}** subiu para o nível ${db.clans[clanId].level}!`);
            }
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎁 Doação ao Clã!')
                .setDescription(`${message.author} doou **${quantia.toLocaleString()} Orbs** para o clã!`)
                .addFields(
                    { name: '💰 Recursos do Clã', value: `${db.clans[clanId].recursos.toLocaleString()} Orbs`, inline: true },
                    { name: '📊 XP do Clã', value: `${db.clans[clanId].xp}/${db.clans[clanId].level * 1000}`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: RANKING ==========
        else if (subcmd === 'ranking') {
            const ranking = Object.values(db.clans)
                .sort((a, b) => b.level - a.level || b.membros.length - a.membros.length)
                .slice(0, 10);
            
            if (ranking.length === 0) return message.reply('📊 Nenhum clã foi criado ainda!');
            
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
                else medalha = `${i + 1}. `;
                
                const galaxia = clan.galaxiaAtual ? galaxias[clan.galaxiaAtual] : null;
                embed.addFields({
                    name: `${medalha}${clan.nome}`,
                    value: `📊 Nível ${clan.level} | 👥 ${clan.membros.length} membros | 🌌 ${galaxia?.nome || 'Sem galáxia'}`,
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🚀 Sistema de Clãs Espaciais')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!clan criar <nome>`', value: 'Cria um novo clã (custa 50.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!clan info [nome]`', value: 'Mostra informações do clã', inline: false },
                    { name: '👥 `bt!clan convidar @user`', value: 'Convida um usuário para o clã (apenas líder)', inline: false },
                    { name: '✅ `bt!clan entrar`', value: 'Aceita um convite para um clã', inline: false },
                    { name: '🚪 `bt!clan sair`', value: 'Sai do clã atual', inline: false },
                    { name: '👑 `bt!clan transferir @user`', value: 'Transfere a liderança (apenas líder)', inline: false },
                    { name: '💀 `bt!clan deletar`', value: 'Deleta o clã (apenas líder)', inline: false },
                    { name: '🎁 `bt!clan doar <valor>`', value: 'Doe Orbs para o clã', inline: false },
                    { name: '🏆 `bt!clan ranking`', value: 'Ranking de clãs', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Domine galáxias com seu clã!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

function gerarBarraProgresso(atual, maximo, tamanho = 15) {
    const percentual = Math.min(100, (atual / maximo) * 100);
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}