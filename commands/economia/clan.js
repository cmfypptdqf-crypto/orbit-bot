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

// Cooldown para saque semanal (7 dias)
const saqueCooldowns = new Map();

function checkSaqueCooldown(clanId) {
    const lastSaque = saqueCooldowns.get(clanId);
    if (!lastSaque) return { available: true, remaining: 0 };
    
    const cooldownTime = 7 * 24 * 60 * 60 * 1000; // 7 dias
    const elapsed = Date.now() - lastSaque;
    
    if (elapsed >= cooldownTime) {
        saqueCooldowns.delete(clanId);
        return { available: true, remaining: 0 };
    }
    
    const remaining = cooldownTime - elapsed;
    const dias = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    return { available: false, remaining, formatted: `${dias} dias` };
}

function setSaqueCooldown(clanId) {
    saqueCooldowns.set(clanId, Date.now());
}

// Função para gerar barra de progresso
function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
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
        if (!db.convites) db.convites = {};
        
        // ========== COMANDO: CRIAR ==========
        if (subcmd === 'criar') {
            const nome = args.slice(1).join(' ');
            if (!nome) return message.reply('❌ Use: `bt!clan criar <nome>`');
            if (nome.length > 20) return message.reply('❌ Nome muito longo!');
            if (db.usuarios[userId].clan) return message.reply('❌ Você já está em um clã!');
            
            const preco = 50000;
            if ((db.usuarios[userId].carteira || 0) < preco) {
                return message.reply(`❌ Criar um clã custa ${preco.toLocaleString()} Orbs!`);
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
                recursos: 0,
                ultimoSaque: 0,
                createdAt: Date.now()
            };
            db.usuarios[userId].carteira -= preco;
            db.usuarios[userId].clan = clanId;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🚀 Clã Criado com Sucesso!')
                .setDescription(`✅ **${nome}** foi criado!`)
                .addFields(
                    { name: '👑 Líder', value: message.author.username, inline: true },
                    { name: '💰 Custo', value: `${preco.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🚀 Star Federation • Use bt!clan info para ver seu clã' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: INFO ==========
        else if (subcmd === 'info') {
            let clanId = db.usuarios[userId]?.clan;
            if (args[1]) {
                const clanPorNome = Object.values(db.clans).find(c => c.nome.toLowerCase() === args.slice(1).join(' ').toLowerCase());
                if (clanPorNome) clanId = clanPorNome.id;
            }
            if (!clanId) return message.reply('❌ Você não está em nenhum clã!');
            
            const clan = db.clans[clanId];
            const membrosLista = [];
            let riquezaTotal = 0;
            let poderTotal = 0;
            
            for (const id of clan.membros) {
                try {
                    const user = await client.users.fetch(id);
                    const userData = db.usuarios[id] || { total_missoes: 0, carteira: 0, banco: 0 };
                    const userTotal = (userData.carteira || 0) + (userData.banco || 0);
                    riquezaTotal += userTotal;
                    poderTotal += userData.total_missoes || 0;
                    membrosLista.push(`${id === clan.dono ? '👑' : '👤'} ${user.username} (💰 ${userTotal.toLocaleString()} Orbs)`);
                } catch (e) { continue; }
            }
            
            // ========== PROGRESSO DO CLÃ ==========
            const xpNecessario = clan.level * 1000;
            const xpAtual = clan.xp || 0;
            const progresso = Math.min(100, Math.floor((xpAtual / xpNecessario) * 100));
            const barraProgresso = gerarBarraProgresso(progresso, 20);
            const xpFaltante = xpNecessario - xpAtual;
            
            // Verificar cooldown do saque
            const saqueCooldown = checkSaqueCooldown(clanId);
            const podeSacar = saqueCooldown.available;
            const tempoParaSaque = saqueCooldown.formatted;
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🚀 Star Federation: ${clan.nome}`)
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${clan.level}`, inline: true },
                    { name: '👥 Membros', value: `${clan.membros.length}/50`, inline: true },
                    { name: '💰 Recursos do Clã', value: `${(clan.recursos || 0).toLocaleString()} Orbs`, inline: true },
                    { name: '💎 Riqueza Total', value: `${riquezaTotal.toLocaleString()} Orbs`, inline: true },
                    { name: '⚔️ Poder Total', value: `${recalcularPoderClan(clanId, db).toLocaleString()}`, inline: true },
                    { 
                        name: '📈 PROGRESSO DO CLÃ', 
                        value: `${barraProgresso} **${progresso}%**\n📊 XP: ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()}\n🎯 Faltam: **${xpFaltante.toLocaleString()} XP** para o próximo nível!`, 
                        inline: false 
                    }
                );
            
            // Mostrar informações de saque (apenas para o líder)
            if (clan.dono === userId) {
                embed.addFields({
                    name: '💰 SAQUE DE RECURSOS',
                    value: `📦 Você pode sacar **30% dos recursos** do clã por semana!\n${podeSacar ? '✅ **DISPONÍVEL!** Use `bt!clan sacar`' : `⏰ Próximo saque disponível em **${tempoParaSaque}**`}`,
                    inline: false
                });
            }
            
            // Lista de membros (máximo 10)
            if (membrosLista.length > 0) {
                embed.addFields({ 
                    name: '📋 MEMBROS', 
                    value: membrosLista.slice(0, 10).join('\n') + (membrosLista.length > 10 ? `\n... e ${membrosLista.length - 10} outros` : ''), 
                    inline: false 
                });
            }
            
            embed.setFooter({ text: '🚀 Star Federation • Use bt!clan doar <valor> para doar recursos' });
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: CONVIDAR ==========
        else if (subcmd === 'convidar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan convidar @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode se convidar!');
            if (user.bot) return message.reply('❌ Não pode convidar bots!');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode convidar!');
            if (clan.membros.length >= 50) return message.reply('❌ Clã lotado!');
            if (db.usuarios[user.id]?.clan) return message.reply('❌ Usuário já está em um clã!');
            
            db.convites[user.id] = { clanId: clanId, expires: Date.now() + 300000 };
            saveDB(db);
            
            await message.reply(`✅ Convite enviado para ${user}! Use \`bt!clan entrar\` para aceitar. (Expira em 5 minutos)`);
        }
        
        // ========== COMANDO: ENTRAR ==========
        else if (subcmd === 'entrar') {
            if (!db.convites[userId]) return message.reply('❌ Nenhum convite pendente!');
            
            const convite = db.convites[userId];
            if (convite.expires < Date.now()) {
                delete db.convites[userId];
                return message.reply('❌ Convite expirado!');
            }
            
            const clan = db.clans[convite.clanId];
            if (!clan) return message.reply('❌ Clã não encontrado!');
            if (db.usuarios[userId]?.clan) return message.reply('❌ Você já está em um clã!');
            
            clan.membros.push(userId);
            db.usuarios[userId].clan = convite.clanId;
            delete db.convites[userId];
            recalcularPoderClan(convite.clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Você entrou no clã **${clan.nome}**! Bem-vindo(a), comandante!`);
        }
        
        // ========== COMANDO: SAIR ==========
        else if (subcmd === 'sair') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono === userId) {
                return message.reply('❌ Você é o líder! Para sair, primeiro transfira a liderança com `bt!clan transferir @usuario` ou delete o clã com `bt!clan deletar`');
            }
            
            clan.membros = clan.membros.filter(id => id !== userId);
            delete db.usuarios[userId].clan;
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            await message.reply(`✅ Você saiu do clã **${clan.nome}**!`);
        }
        
        // ========== COMANDO: TRANSFERIR ==========
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
        
        // ========== COMANDO: DELETAR ==========
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
        
        // ========== COMANDO: DOAR ==========
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
            
            // Ganhar XP para o clã (cada 1000 doados = 1 XP)
            const xpGanho = Math.floor(quantia / 1000);
            db.clans[clanId].xp = (db.clans[clanId].xp || 0) + xpGanho;
            
            // Verificar level up
            const xpNecessario = db.clans[clanId].level * 1000;
            let levelUpMessage = '';
            if (db.clans[clanId].xp >= xpNecessario) {
                db.clans[clanId].level++;
                db.clans[clanId].xp -= xpNecessario;
                levelUpMessage = `\n🎉 **${db.clans[clanId].nome}** subiu para o nível ${db.clans[clanId].level}!`;
            }
            
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎁 Doação ao Clã!')
                .setDescription(`${message.author} doou **${quantia.toLocaleString()} Orbs** para o clã!${levelUpMessage}`)
                .addFields(
                    { name: '💰 Recursos do Clã', value: `${db.clans[clanId].recursos.toLocaleString()} Orbs`, inline: true },
                    { name: '📊 XP do Clã', value: `${db.clans[clanId].xp.toLocaleString()}/${db.clans[clanId].level * 1000}`, inline: true }
                )
                .setFooter({ text: '🚀 Star Federation • Cada doação ajuda o clã a evoluir!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: SACAR (LÍDER RETIRA 30% DOS RECURSOS) ==========
        else if (subcmd === 'sacar') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode sacar recursos do clã!');
            
            const cooldownCheck = checkSaqueCooldown(clanId);
            if (!cooldownCheck.available) {
                return message.reply(`⏰ Você já sacou recursos esta semana! Próximo saque disponível em **${cooldownCheck.formatted}**.`);
            }
            
            if (!clan.recursos || clan.recursos <= 0) {
                return message.reply('❌ O clã não tem recursos disponíveis para saque! Peça para os membros doarem.');
            }
            
            // Calcular 30% dos recursos
            const valorSaque = Math.floor(clan.recursos * 0.3);
            
            if (valorSaque <= 0) {
                return message.reply('❌ Valor mínimo de saque é 1 Orb!');
            }
            
            // Transferir recursos para o líder
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + valorSaque;
            clan.recursos -= valorSaque;
            
            // Registrar saque
            setSaqueCooldown(clanId);
            clan.ultimoSaque = Date.now();
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('💰 Saque de Recursos do Clã')
                .setDescription(`📦 **${message.author.username}** sacou recursos do clã!`)
                .addFields(
                    { name: '📊 Percentual Sacado', value: `30% dos recursos`, inline: true },
                    { name: '💰 Valor Sacado', value: `${valorSaque.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Seu Novo Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                    { name: '🏦 Recursos Restantes', value: `${clan.recursos.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '⏰ Próximo saque disponível em 7 dias!' });
            
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
                
                const xpNecessario = clan.level * 1000;
                const progresso = Math.min(99, Math.floor(((clan.xp || 0) / xpNecessario) * 100));
                
                embed.addFields({
                    name: `${medalha}${clan.nome}`,
                    value: `📊 Nível ${clan.level} | 👥 ${clan.membros.length} membros | 📈 ${progresso}% para próximo nível`,
                    inline: false
                });
            }
            
            embed.setFooter({ text: '🚀 Star Federation • Suba no ranking com seu clã!' });
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🚀 Star Federation - Sistema de Clãs')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!clan criar <nome>`', value: 'Cria um novo clã (custa 50.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!clan info`', value: 'Mostra informações do clã', inline: false },
                    { name: '👥 `bt!clan convidar @user`', value: 'Convida um usuário para o clã (apenas líder)', inline: false },
                    { name: '✅ `bt!clan entrar`', value: 'Aceita um convite para um clã', inline: false },
                    { name: '🚪 `bt!clan sair`', value: 'Sai do clã atual', inline: false },
                    { name: '👑 `bt!clan transferir @user`', value: 'Transfere a liderança (apenas líder)', inline: false },
                    { name: '💀 `bt!clan deletar`', value: 'Deleta o clã (apenas líder)', inline: false },
                    { name: '🎁 `bt!clan doar <valor>`', value: 'Doe Orbs para o clã', inline: false },
                    { name: '💰 `bt!clan sacar`', value: 'Líder saca 30% dos recursos (1x por semana)', inline: false },
                    { name: '🏆 `bt!clan ranking`', value: 'Ranking de clãs', inline: false }
                )
                .setFooter({ text: '🚀 Star Federation • União entre exploradores!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};