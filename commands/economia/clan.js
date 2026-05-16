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
    
    const cooldownTime = 7 * 24 * 60 * 60 * 1000;
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

// Função para pegar nome da galáxia
function getGalaxiaNome(galaxiaId) {
    const galaxias = {
        'via_lactea': '🌌 Via Láctea',
        'andromeda': '🌀 Andrômeda',
        'triangulo': '🔺 Galáxia do Triângulo',
        'olho_negro': '👁️ Olho Negro',
        'sombreiro': '🎩 Galáxia do Sombreiro',
        'centaurus': '⚡ Centaurus A',
        'rosquinha': '🍩 Galáxia do Anel'
    };
    return galaxias[galaxiaId] || 'Desconhecida';
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
                galaxiaAtual: null,
                conquistas: [],
                ultimoSaque: 0,
                emGuerra: false,
                guerraContra: null,
                guerraExpira: null,
                danoGuerra: 0,
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
            
            const xpNecessario = clan.level * 1000;
            const xpAtual = clan.xp || 0;
            const progresso = Math.min(100, Math.floor((xpAtual / xpNecessario) * 100));
            const barraProgresso = gerarBarraProgresso(progresso, 20);
            const xpFaltante = xpNecessario - xpAtual;
            
            const saqueCooldown = checkSaqueCooldown(clanId);
            const podeSacar = saqueCooldown.available;
            const tempoParaSaque = saqueCooldown.formatted;
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle(`🚀 Star Federation: ${clan.nome}`)
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '👑 Líder', value: `<@${clan.dono}>`, inline: true },
                    { name: '📊 Nível', value: `${clan.level}`, inline: true },
                    { name: '👥 Membros', value: `${clan.membros.length}/50`, inline: true },
                    { name: '💰 Recursos do Clã', value: `${(clan.recursos || 0).toLocaleString()} Orbs`, inline: true },
                    { name: '🌌 Galáxia Dominada', value: getGalaxiaNome(clan.galaxiaAtual) || '❌ Nenhuma', inline: true },
                    { name: '💎 Riqueza Total', value: `${riquezaTotal.toLocaleString()} Orbs`, inline: true },
                    { name: '⚔️ Poder Total', value: `${recalcularPoderClan(clanId, db).toLocaleString()}`, inline: true },
                    { 
                        name: '📈 PROGRESSO DO CLÃ', 
                        value: `${barraProgresso} **${progresso}%**\n📊 XP: ${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()}\n🎯 Faltam: **${xpFaltante.toLocaleString()} XP** para o próximo nível!`, 
                        inline: false 
                    }
                );
            
            if (clan.emGuerra && clan.guerraExpira > Date.now()) {
                const inimigo = db.clans[clan.guerraContra];
                embed.addFields({
                    name: '⚔️ EM GUERRA!',
                    value: `Contra: **${inimigo?.nome || 'Desconhecido'}**\n⏰ Termina: <t:${Math.floor(clan.guerraExpira / 1000)}:R>`,
                    inline: false
                });
            }
            
            if (clan.dono === userId) {
                embed.addFields({
                    name: '💰 SAQUE DE RECURSOS',
                    value: `📦 Você pode sacar **30% dos recursos** do clã por semana!\n${podeSacar ? '✅ **DISPONÍVEL!** Use `bt!clan sacar`' : `⏰ Próximo saque disponível em **${tempoParaSaque}**`}`,
                    inline: false
                });
            }
            
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
        
        // ========== COMANDO: EXPULSAR ==========
        else if (subcmd === 'expulsar') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!clan expulsar @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode se expulsar! Use `bt!clan sair`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode expulsar membros!');
            
            if (!clan.membros.includes(user.id)) return message.reply('❌ Este usuário não está no seu clã!');
            
            const carteiraUsuario = db.usuarios[user.id]?.carteira || 0;
            const multa = Math.floor(carteiraUsuario * 0.1);
            
            clan.membros = clan.membros.filter(id => id !== user.id);
            delete db.usuarios[user.id].clan;
            
            if (multa > 0) {
                db.usuarios[user.id].carteira = carteiraUsuario - multa;
            }
            
            recalcularPoderClan(clanId, db);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('👢 Membro Expulso!')
                .setDescription(`**${user.username}** foi expulso do clã **${clan.nome}**!`)
                .addFields(
                    { name: '💰 Multa Aplicada', value: `${multa.toLocaleString()} Orbs`, inline: true },
                    { name: '👑 Expulso por', value: message.author.username, inline: true }
                )
                .setFooter({ text: '🚀 Star Federation • Expulsão registrada' });
            
            await message.reply({ embeds: [embed] });
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
            
            const xpGanho = Math.floor(quantia / 1000);
            db.clans[clanId].xp = (db.clans[clanId].xp || 0) + xpGanho;
            
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
        
        // ========== COMANDO: SACAR ==========
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
            
            const valorSaque = Math.floor(clan.recursos * 0.3);
            
            if (valorSaque <= 0) {
                return message.reply('❌ Valor mínimo de saque é 1 Orb!');
            }
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + valorSaque;
            clan.recursos -= valorSaque;
            
            setSaqueCooldown(clanId);
            clan.ultimoSaque = Date.now();
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
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
        
        // ========== COMANDO: GUERRA ==========
        else if (subcmd === 'guerra') {
            const clanAlvoNome = args.slice(1).join(' ');
            if (!clanAlvoNome) return message.reply('❌ Use: `bt!clan guerra <nome_do_clã>`');
            
            const clanAtacanteId = db.usuarios[userId]?.clan;
            if (!clanAtacanteId) return message.reply('❌ Você não está em um clã!');
            
            const clanAtacante = db.clans[clanAtacanteId];
            if (clanAtacante.dono !== userId) return message.reply('❌ Apenas o líder pode declarar guerra!');
            
            const clanDefensor = Object.values(db.clans).find(c => 
                c.nome.toLowerCase() === clanAlvoNome.toLowerCase() && c.id !== clanAtacanteId
            );
            
            if (!clanDefensor) return message.reply('❌ Clã não encontrado!');
            if (clanAtacante.nome === clanDefensor.nome) return message.reply('❌ Você não pode declarar guerra contra si mesmo!');
            
            if (clanAtacante.emGuerra && clanAtacante.guerraExpira > Date.now()) {
                return message.reply(`❌ Seu clã já está em guerra! Aguarde o fim da guerra atual.`);
            }
            
            const poderAtacante = recalcularPoderClan(clanAtacanteId, db);
            const poderDefensor = recalcularPoderClan(clanDefensor.id, db);
            const territorioEmDisputa = clanDefensor.galaxiaAtual || clanAtacante.galaxiaAtual || 'via_lactea';
            const guerraExpira = Date.now() + (60 * 60 * 1000);
            
            clanAtacante.emGuerra = true;
            clanAtacante.guerraContra = clanDefensor.id;
            clanAtacante.guerraExpira = guerraExpira;
            clanAtacante.danoGuerra = 0;
            clanDefensor.emGuerra = true;
            clanDefensor.guerraContra = clanAtacanteId;
            clanDefensor.guerraExpira = guerraExpira;
            clanDefensor.danoGuerra = 0;
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('⚔️ GUERRA DECLARADA!')
                .setDescription(`**${clanAtacante.nome}** declarou guerra contra **${clanDefensor.nome}**!`)
                .addFields(
                    { name: '🌌 Território em Disputa', value: `${getGalaxiaNome(territorioEmDisputa)}`, inline: false },
                    { name: '⚔️ Poder do Atacante', value: `${poderAtacante.toLocaleString()}`, inline: true },
                    { name: '🛡️ Poder do Defensor', value: `${poderDefensor.toLocaleString()}`, inline: true },
                    { name: '⏰ A guerra termina em', value: `<t:${Math.floor(guerraExpira / 1000)}:R>`, inline: false }
                )
                .setFooter({ text: '⚔️ Use bt!clan atacar para lutar durante a guerra!' });
            
            await message.reply({ embeds: [embed] });
            
            setTimeout(async () => {
                const dbFinal = getDB();
                const atacanteFinal = dbFinal.clans[clanAtacanteId];
                const defensorFinal = dbFinal.clans[clanDefensor.id];
                
                if (!atacanteFinal || !defensorFinal) return;
                if (atacanteFinal.guerraExpira > Date.now()) return;
                
                const poderAtacanteFinal = recalcularPoderClan(clanAtacanteId, dbFinal);
                const poderDefensorFinal = recalcularPoderClan(clanDefensor.id, dbFinal);
                const atacanteVenceu = poderAtacanteFinal > poderDefensorFinal;
                
                if (atacanteVenceu) {
                    const recursosTransferidos = Math.floor((defensorFinal.recursos || 0) * 0.2);
                    defensorFinal.recursos = (defensorFinal.recursos || 0) - recursosTransferidos;
                    atacanteFinal.recursos = (atacanteFinal.recursos || 0) + recursosTransferidos;
                    
                    if (defensorFinal.galaxiaAtual) {
                        atacanteFinal.galaxiaAtual = defensorFinal.galaxiaAtual;
                        defensorFinal.galaxiaAtual = null;
                        atacanteFinal.conquistas.push(`⚔️ Conquistou ${getGalaxiaNome(defensorFinal.galaxiaAtual)} de ${defensorFinal.nome} em guerra`);
                    }
                    
                    const resultadoEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🏆 VITÓRIA NA GUERRA!')
                        .setDescription(`**${atacanteFinal.nome}** venceu a guerra contra **${defensorFinal.nome}**!`)
                        .addFields(
                            { name: '💰 Recursos Conquistados', value: `${recursosTransferidos.toLocaleString()} Orbs`, inline: true },
                            { name: '🌌 Território Conquistado', value: getGalaxiaNome(atacanteFinal.galaxiaAtual) || 'Nenhum', inline: true }
                        );
                    
                    await message.channel.send({ embeds: [resultadoEmbed] });
                } else {
                    const recursosTransferidos = Math.floor((atacanteFinal.recursos || 0) * 0.2);
                    atacanteFinal.recursos = (atacanteFinal.recursos || 0) - recursosTransferidos;
                    defensorFinal.recursos = (defensorFinal.recursos || 0) + recursosTransferidos;
                    
                    const resultadoEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('💀 DERROTA NA GUERRA!')
                        .setDescription(`**${atacanteFinal.nome}** perdeu a guerra para **${defensorFinal.nome}**!`)
                        .addFields(
                            { name: '💰 Recursos Perdidos', value: `${recursosTransferidos.toLocaleString()} Orbs`, inline: true }
                        );
                    
                    await message.channel.send({ embeds: [resultadoEmbed] });
                }
                
                atacanteFinal.emGuerra = false;
                atacanteFinal.guerraContra = null;
                atacanteFinal.guerraExpira = null;
                defensorFinal.emGuerra = false;
                defensorFinal.guerraContra = null;
                defensorFinal.guerraExpira = null;
                
                recalcularPoderClan(clanAtacanteId, dbFinal);
                recalcularPoderClan(clanDefensor.id, dbFinal);
                saveDB(dbFinal);
                
            }, 60 * 60 * 1000);
        }
        
        // ========== COMANDO: ATACAR ==========
        else if (subcmd === 'atacar') {
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (!clan.emGuerra || clan.guerraExpira < Date.now()) {
                return message.reply('❌ Seu clã não está em guerra no momento! Use `bt!clan guerra <clã>` para declarar guerra.');
            }
            
            const clanInimigo = db.clans[clan.guerraContra];
            if (!clanInimigo) return message.reply('❌ Clã inimigo não encontrado!');
            
            const ultimoAtaque = db.usuarios[userId].ultimoAtaqueGuerra || 0;
            if (Date.now() - ultimoAtaque < 600000) {
                const restante = Math.ceil((600000 - (Date.now() - ultimoAtaque)) / 60000);
                return message.reply(`⏰ Você já atacou recentemente! Aguarde **${restante} minutos** para atacar novamente.`);
            }
            
            const userPower = (db.usuarios[userId].total_missoes || 0) + Math.floor((db.usuarios[userId].carteira || 0) / 10000);
            const dano = Math.floor(Math.random() * (userPower + 100)) + 50;
            
            db.usuarios[userId].ultimoAtaqueGuerra = Date.now();
            
            if (!clan.danoGuerra) clan.danoGuerra = 0;
            clan.danoGuerra += dano;
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('⚔️ ATAQUE REALIZADO!')
                .setDescription(`**${message.author.username}** atacou o clã **${clanInimigo.nome}**!`)
                .addFields(
                    { name: '💥 Dano Causado', value: `${dano} de dano`, inline: true },
                    { name: '📊 Dano Total do Clã', value: `${clan.danoGuerra}`, inline: true }
                )
                .setFooter({ text: '⚔️ Continue atacando para vencer a guerra!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: CONQUISTAR ==========
        else if (subcmd === 'conquistar') {
            const nomeGalaxia = args.slice(1).join(' ');
            let galaxiaId = null;
            
            const galaxiasLista = {
                'via_lactea': '🌌 Via Láctea',
                'andromeda': '🌀 Andrômeda',
                'triangulo': '🔺 Galáxia do Triângulo',
                'olho_negro': '👁️ Olho Negro',
                'sombreiro': '🎩 Galáxia do Sombreiro',
                'centaurus': '⚡ Centaurus A',
                'rosquinha': '🍩 Galáxia do Anel'
            };
            
            for (const [id, nome] of Object.entries(galaxiasLista)) {
                if (nome.toLowerCase().includes(nomeGalaxia.toLowerCase())) {
                    galaxiaId = id;
                    break;
                }
            }
            
            if (!galaxiaId) return message.reply('❌ Galáxia não encontrada! Use `bt!galaxia listar`');
            
            const clanId = db.usuarios[userId]?.clan;
            if (!clanId) return message.reply('❌ Você não está em um clã!');
            
            const clan = db.clans[clanId];
            if (clan.dono !== userId) return message.reply('❌ Apenas o líder pode conquistar galáxias!');
            
            const donoAtual = Object.values(db.clans).find(c => c.galaxiaAtual === galaxiaId);
            
            if (donoAtual && donoAtual.id !== clanId) {
                return message.reply(`⚠️ A ${galaxiasLista[galaxiaId]} já é dominada por **${donoAtual.nome}**!\nUse \`bt!clan guerra ${donoAtual.nome}\` para declarar guerra e tomar a galáxia!`);
            }
            
            const defesaBase = { via_lactea: 1000, andromeda: 5000, triangulo: 3000, olho_negro: 10000, sombreiro: 15000, centaurus: 25000, rosquinha: 50000 }[galaxiaId] || 5000;
            const poderClan = recalcularPoderClan(clanId, db);
            
            if (poderClan < defesaBase) {
                return message.reply(`❌ Seu clã precisa de **${defesaBase.toLocaleString()}** de poder para conquistar ${galaxiasLista[galaxiaId]}!`);
            }
            
            clan.galaxiaAtual = galaxiaId;
            if (!clan.conquistas) clan.conquistas = [];
            clan.conquistas.push(`🌌 Conquistou ${galaxiasLista[galaxiaId]} em ${new Date().toLocaleDateString()}`);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🌌 GALÁXIA CONQUISTADA!')
                .setDescription(`**${clan.nome}** conquistou a ${galaxiasLista[galaxiaId]}!`)
                .addFields(
                    { name: '✨ Bônus Ativados', value: `🎯 Todos os membros ganham bônus em todas atividades!`, inline: false }
                )
                .setFooter({ text: '🚀 Star Federation • Protejam sua galáxia de outros clãs!' });
            
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
                const galaxia = getGalaxiaNome(clan.galaxiaAtual);
                
                embed.addFields({
                    name: `${medalha}${clan.nome}`,
                    value: `📊 Nível ${clan.level} | 👥 ${clan.membros.length} membros | ${galaxia ? `🌌 ${galaxia}` : ''} | 📈 ${progresso}%`,
                    inline: false
                });
            }
            
            embed.setFooter({ text: '🚀 Star Federation • Suba no ranking com seu clã!' });
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🚀 Star Federation - Sistema de Clãs')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!clan criar <nome>`', value: 'Cria um novo clã (custa 50.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!clan info`', value: 'Mostra informações do clã', inline: false },
                    { name: '👥 `bt!clan convidar @user`', value: 'Convida um usuário para o clã (apenas líder)', inline: false },
                    { name: '✅ `bt!clan entrar`', value: 'Aceita um convite para um clã', inline: false },
                    { name: '🚪 `bt!clan sair`', value: 'Sai do clã atual', inline: false },
                    { name: '👢 `bt!clan expulsar @user`', value: 'Expulsa um membro (apenas líder)', inline: false },
                    { name: '👑 `bt!clan transferir @user`', value: 'Transfere a liderança (apenas líder)', inline: false },
                    { name: '💀 `bt!clan deletar`', value: 'Deleta o clã (apenas líder)', inline: false },
                    { name: '🎁 `bt!clan doar <valor>`', value: 'Doe Orbs para o clã', inline: false },
                    { name: '💰 `bt!clan sacar`', value: 'Líder saca 30% dos recursos (1x por semana)', inline: false },
                    { name: '⚔️ `bt!clan guerra <clã>`', value: 'Declara guerra contra outro clã', inline: false },
                    { name: '⚔️ `bt!clan atacar`', value: 'Ataca durante uma guerra', inline: false },
                    { name: '🌌 `bt!clan conquistar <galáxia>`', value: 'Conquista uma galáxia para o clã', inline: false },
                    { name: '🏆 `bt!clan ranking`', value: 'Ranking de clãs', inline: false }
                )
                .setFooter({ text: '🚀 Star Federation • União entre exploradores!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};