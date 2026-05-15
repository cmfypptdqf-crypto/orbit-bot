// commands/rpg/pvp.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const battles = new Map(); // Armazenar batalhas ativas

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, pvp: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

function getClasseInfo(classe) {
    const classes = {
        guerreiro: {
            nome: '⚔️ Guerreiro',
            hpBonus: 50,
            atkBonus: 15,
            defBonus: 10,
            critBonus: 5,
            evasaoBonus: 5,
            habilidades: ['Golpe Poderoso', 'Defesa Total', 'Grito de Guerra']
        },
        mago: {
            nome: '🔮 Mago',
            hpBonus: 20,
            atkBonus: 25,
            defBonus: 5,
            critBonus: 15,
            evasaoBonus: 10,
            habilidades: ['Bola de Fogo', 'Escudo Arcano', 'Teleporte']
        },
        arqueiro: {
            nome: '🏹 Arqueiro',
            hpBonus: 30,
            atkBonus: 20,
            defBonus: 5,
            critBonus: 10,
            evasaoBonus: 20,
            habilidades: ['Chuva de Flechas', 'Tiro Preciso', 'Esquiva Rápida']
        },
        assassino: {
            nome: '🗡️ Assassino',
            hpBonus: 25,
            atkBonus: 22,
            defBonus: 0,
            critBonus: 25,
            evasaoBonus: 25,
            habilidades: ['Golpe nas Sombras', 'Veneno Mortal', 'Finta']
        },
        paladino: {
            nome: '🛡️ Paladino',
            hpBonus: 80,
            atkBonus: 10,
            defBonus: 25,
            critBonus: 0,
            evasaoBonus: 0,
            habilidades: ['Golpe Sagrado', 'Escudo Divino', 'Cura Leve']
        }
    };
    return classes[classe] || classes.guerreiro;
}

function calcularStats(jogador, db, classeInfo) {
    const nivel = calcularNivel(db.usuarios[jogador.id]?.xpTotal || 0);
    const vitorias = db.usuarios[jogador.id]?.pvpVitorias || 0;
    const equipamento = db.usuarios[jogador.id]?.equipamentos || {};
    
    const hpBase = 100 + (nivel * 10) + classeInfo.hpBonus;
    const atkBase = 20 + (nivel * 3) + classeInfo.atkBonus + (equipamento.arma?.atk || 0);
    const defBase = 10 + (nivel * 2) + classeInfo.defBonus + (equipamento.armadura?.def || 0);
    const critBase = classeInfo.critBonus + (equipamento.arma?.crit || 0);
    const evasaoBase = classeInfo.evasaoBonus + (equipamento.armadura?.evasao || 0);
    
    return {
        hp: hpBase,
        hpMax: hpBase,
        atk: atkBase,
        def: defBase,
        crit: Math.min(50, critBase),
        evasao: Math.min(50, evasaoBase),
        nivel,
        vitorias,
        classe: classeInfo.nome
    };
}

function calcularDano(atk, def, crit, evasao, habilidade = null) {
    let dano = Math.max(1, atk - (def * 0.5));
    
    // Modificadores de habilidade
    if (habilidade) {
        switch(habilidade) {
            case 'Golpe Poderoso': dano *= 1.5; break;
            case 'Golpe Sagrado': dano *= 1.6; break;
            case 'Golpe nas Sombras': dano *= 1.4; break;
            case 'Bola de Fogo': dano *= 1.5; break;
            case 'Chuva de Flechas': dano *= 1.3; break;
            case 'Tiro Preciso': dano *= 1.4; break;
        }
    }
    
    // Crítico
    const isCrit = Math.random() * 100 < crit;
    if (isCrit) dano *= 2;
    
    return {
        dano: Math.floor(dano),
        isCrit
    };
}

async function criarBatalha(message, alvo, aposta, db) {
    const desafiante = message.author;
    const classeDesafiante = db.usuarios[desafiante.id]?.classe || 'guerreiro';
    const classeAlvo = db.usuarios[alvo.id]?.classe || 'guerreiro';
    
    const statsDesafiante = calcularStats(desafiante, db, getClasseInfo(classeDesafiante));
    const statsAlvo = calcularStats(alvo, db, getClasseInfo(classeAlvo));
    
    const battleId = `${desafiante.id}-${alvo.id}-${Date.now()}`;
    const battle = {
        id: battleId,
        desafiante: {
            id: desafiante.id,
            username: desafiante.username,
            stats: statsDesafiante,
            hpAtual: statsDesafiante.hp,
            ultimoAtaque: null
        },
        adversario: {
            id: alvo.id,
            username: alvo.username,
            stats: statsAlvo,
            hpAtual: statsAlvo.hp,
            ultimoAtaque: null
        },
        aposta,
        turno: desafiante.id, // Quem começa
        turnoNumero: 1,
        habilidadesUsadas: [],
        status: 'aguardando'
    };
    
    battles.set(battleId, battle);
    return battle;
}

function getHabilidadesButton(classe, battleId, isDesafiante) {
    const classeInfo = getClasseInfo(classe);
    const row = new ActionRowBuilder();
    
    const habilidades = classeInfo.habilidades.map((hab, index) => 
        new ButtonBuilder()
            .setCustomId(`pvp_habilidade_${battleId}_${isDesafiante ? 'desafiante' : 'adversario'}_${index}`)
            .setLabel(hab)
            .setStyle(ButtonStyle.Primary)
    );
    
    row.addComponents(...habilidades);
    
    const atkBasico = new ButtonBuilder()
        .setCustomId(`pvp_atk_${battleId}_${isDesafiante ? 'desafiante' : 'adversario'}`)
        .setLabel('⚔️ Ataque Normal')
        .setStyle(ButtonStyle.Success);
    
    const desistir = new ButtonBuilder()
        .setCustomId(`pvp_desistir_${battleId}_${isDesafiante ? 'desafiante' : 'adversario'}`)
        .setLabel('🏳️ Desistir')
        .setStyle(ButtonStyle.Danger);
    
    const components = [row, new ActionRowBuilder().addComponents(atkBasico, desistir)];
    return components;
}

module.exports = {
    name: 'pvp',
    aliases: ['batalha', 'fight'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { 
                xpTotal: 0, 
                pvpVitorias: 0, 
                pvpDerrotas: 0,
                classe: 'guerreiro',
                carteira: 5000
            };
            saveDB(db);
        }
        
        if (!db.pvp) db.pvp = {};
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        const classeAtual = db.usuarios[userId].classe || 'guerreiro';
        
        if (subcmd === 'classe') {
            const novaClasse = args[1]?.toLowerCase();
            const classes = ['guerreiro', 'mago', 'arqueiro', 'assassino', 'paladino'];
            
            if (!novaClasse || !classes.includes(novaClasse)) {
                const embed = new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle('📚 Classes Disponíveis')
                    .setDescription('Escolha sua classe para batalhas PvP!')
                    .addFields(
                        { name: '⚔️ Guerreiro', value: 'HP: +50 | ATK: +15 | DEF: +10', inline: true },
                        { name: '🔮 Mago', value: 'ATK: +25 | CRIT: +15%', inline: true },
                        { name: '🏹 Arqueiro', value: 'ATK: +20 | EVASÃO: +20%', inline: true },
                        { name: '🗡️ Assassino', value: 'CRIT: +25% | EVASÃO: +25%', inline: true },
                        { name: '🛡️ Paladino', value: 'HP: +80 | DEF: +25', inline: true }
                    )
                    .setFooter({ text: 'Use: bt!pvp classe <nome>' });
                return message.reply({ embeds: [embed] });
            }
            
            db.usuarios[userId].classe = novaClasse;
            saveDB(db);
            
            const classeInfo = getClasseInfo(novaClasse);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Classe Alterada!')
                .setDescription(`Você agora é um(a) ${classeInfo.nome}!`)
                .addFields(
                    { name: '❤️ HP Bônus', value: `+${classeInfo.hpBonus}`, inline: true },
                    { name: '⚔️ ATK Bônus', value: `+${classeInfo.atkBonus}`, inline: true },
                    { name: '🛡️ DEF Bônus', value: `+${classeInfo.defBonus}`, inline: true },
                    { name: '✨ CRIT Bônus', value: `+${classeInfo.critBonus}%`, inline: true },
                    { name: '💨 EVASÃO Bônus', value: `+${classeInfo.evasaoBonus}%`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'desafiar') {
            const alvo = message.mentions.users.first();
            if (!alvo) return message.reply('❌ Use: `bt!pvp desafiar @usuario [aposta]`');
            if (alvo.id === userId) return message.reply('❌ Você não pode desafiar a si mesmo!');
            if (db.pvp[userId]) return message.reply('❌ Você já tem um desafio pendente!');
            
            // Verificar se já está em batalha
            for (const battle of battles.values()) {
                if (battle.desafiante.id === userId || battle.adversario.id === userId) {
                    return message.reply('❌ Você já está em uma batalha!');
                }
            }
            
            const aposta = parseInt(args[2]) || 1000;
            
            if (aposta < 100) return message.reply('❌ Aposta mínima é 100 Orbs!');
            if ((db.usuarios[userId].carteira || 0) < aposta) {
                return message.reply(`❌ Você não tem ${aposta.toLocaleString()} Orbs para apostar!`);
            }
            
            // Criar desafio
            db.pvp[alvo.id] = {
                desafiante: userId,
                apostado: aposta,
                expires: Date.now() + 60000
            };
            saveDB(db);
            
            const classeDesafiante = getClasseInfo(db.usuarios[userId].classe || 'guerreiro');
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⚔️ DESAFIO PVP!')
                .setDescription(`**${message.author.username}** desafiou **${alvo.username}** para uma batalha!`)
                .addFields(
                    { name: '💰 Aposta', value: `${aposta.toLocaleString()} Orbs`, inline: true },
                    { name: '📊 Nível do Desafiante', value: `${nivel}`, inline: true },
                    { name: '🎭 Classe', value: classeDesafiante.nome, inline: true },
                    { name: '⏰ Expira em', value: '1 minuto', inline: true }
                )
                .setFooter({ text: 'Use bt!pvp aceitar para aceitar o desafio!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'aceitar') {
            const desafio = db.pvp[userId];
            if (!desafio) return message.reply('❌ Você não tem nenhum desafio pendente!');
            if (desafio.expires < Date.now()) {
                delete db.pvp[userId];
                saveDB(db);
                return message.reply('❌ O desafio expirou!');
            }
            
            const desafiante = await client.users.fetch(desafio.desafiante);
            const aposta = desafio.apostado;
            
            // Verificar se pode aceitar
            for (const battle of battles.values()) {
                if (battle.desafiante.id === userId || battle.adversario.id === userId) {
                    return message.reply('❌ Você já está em uma batalha!');
                }
            }
            
            if ((db.usuarios[userId].carteira || 0) < aposta) {
                delete db.pvp[userId];
                saveDB(db);
                return message.reply(`❌ Você não tem ${aposta.toLocaleString()} Orbs para aceitar o desafio!`);
            }
            
            // Criar batalha
            const battle = await criarBatalha(message, desafiante, aposta, db);
            
            // Remover desafio
            delete db.pvp[userId];
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('⚔️ BATALHA INICIADA!')
                .setDescription(`**${desafiante.username}** vs **${message.author.username}**`)
                .addFields(
                    { name: '💰 Aposta', value: `${aposta.toLocaleString()} Orbs`, inline: true },
                    { name: '🎭 Classe do Desafiante', value: battle.desafiante.stats.classe, inline: true },
                    { name: '🎭 Classe do Adversário', value: battle.adversario.stats.classe, inline: true }
                )
                .setFooter({ text: `${battle.desafiante.username} começa atacando!` });
            
            const msg = await message.reply({ embeds: [embed] });
            
            // Criar collector para batalha
            const collector = msg.createMessageComponentCollector({ time: 300000 });
            
            collector.on('collect', async (interaction) => {
                if (!interaction.customId.startsWith('pvp_')) return;
                
                const [_, action, battleId, side, habIndex] = interaction.customId.split('_');
                const currentBattle = battles.get(battleId);
                
                if (!currentBattle) {
                    return interaction.reply({ content: '❌ Batalha não encontrada!', ephemeral: true });
                }
                
                // Verificar turno
                const isDesafianteTurn = currentBattle.turno === currentBattle.desafiante.id;
                const isDesafianteSide = side === 'desafiante';
                
                if ((isDesafianteTurn && !isDesafianteSide) || (!isDesafianteTurn && isDesafianteSide)) {
                    return interaction.reply({ content: '❌ Não é seu turno!', ephemeral: true });
                }
                
                const attacker = isDesafianteTurn ? currentBattle.desafiante : currentBattle.adversario;
                const defender = isDesafianteTurn ? currentBattle.adversario : currentBattle.desafiante;
                
                if (action === 'desistir') {
                    // Processar desistência
                    const vencedor = defender;
                    const perdedor = attacker;
                    
                    // Transferir aposta
                    db.usuarios[vencedor.id].carteira = (db.usuarios[vencedor.id].carteira || 0) + currentBattle.aposta;
                    db.usuarios[perdedor.id].carteira = (db.usuarios[perdedor.id].carteira || 0) - currentBattle.aposta;
                    db.usuarios[vencedor.id].pvpVitorias = (db.usuarios[vencedor.id].pvpVitorias || 0) + 1;
                    db.usuarios[perdedor.id].pvpDerrotas = (db.usuarios[perdedor.id].pvpDerrotas || 0) + 1;
                    
                    // XP para vencedor
                    const xpGanho = 50 + currentBattle.aposta / 100;
                    db.usuarios[vencedor.id].xpTotal = (db.usuarios[vencedor.id].xpTotal || 0) + xpGanho;
                    
                    saveDB(db);
                    battles.delete(battleId);
                    
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('🏳️ BATALHA ENCERRADA!')
                        .setDescription(`${perdedor.username} desistiu da batalha!`)
                        .addFields(
                            { name: '🏆 Vencedor', value: vencedor.username, inline: true },
                            { name: '💰 Prêmio', value: `${currentBattle.aposta.toLocaleString()} Orbs`, inline: true },
                            { name: '✨ XP Ganho', value: `${Math.floor(xpGanho)}`, inline: true }
                        );
                    
                    await interaction.update({ embeds: [embed], components: [] });
                    return;
                }
                
                let danoCalculado;
                let habilidadeUsada = null;
                
                if (action === 'atk') {
                    danoCalculado = calcularDano(attacker.stats.atk, defender.stats.def, attacker.stats.crit, defender.stats.evasao);
                } else if (action === 'habilidade') {
                    const habIndexNum = parseInt(habIndex);
                    const classeInfo = getClasseInfo(isDesafianteTurn ? db.usuarios[attacker.id]?.classe : db.usuarios[attacker.id]?.classe);
                    habilidadeUsada = classeInfo.habilidades[habIndexNum];
                    
                    if (currentBattle.habilidadesUsadas.includes(`${attacker.id}_${habilidadeUsada}`)) {
                        return interaction.reply({ content: '❌ Você já usou essa habilidade nesta batalha!', ephemeral: true });
                    }
                    
                    danoCalculado = calcularDano(attacker.stats.atk, defender.stats.def, attacker.stats.crit, defender.stats.evasao, habilidadeUsada);
                    currentBattle.habilidadesUsadas.push(`${attacker.id}_${habilidadeUsada}`);
                }
                
                // Verificar evasão
                const evadiu = Math.random() * 100 < defender.stats.evasao;
                
                if (evadiu) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFFFF00)
                        .setTitle('💨 EVASÃO!')
                        .setDescription(`${defender.username} desviou do ataque de ${attacker.username}!`);
                    
                    await interaction.update({ embeds: [embed] });
                } else {
                    defender.hpAtual -= danoCalculado.dano;
                    
                    const embed = new EmbedBuilder()
                        .setColor(danoCalculado.isCrit ? 0xFF0000 : 0xFFA500)
                        .setTitle(habilidadeUsada ? `✨ ${habilidadeUsada}!` : '⚔️ ATAQUE!')
                        .setDescription(`${attacker.username} atacou ${defender.username} e causou **${danoCalculado.dano}** de dano!${danoCalculado.isCrit ? ' **CRÍTICO!**' : ''}`)
                        .addFields(
                            { name: '❤️ HP do Defensor', value: `${Math.max(0, defender.hpAtual)}/${defender.stats.hpMax}`, inline: true }
                        );
                    
                    await interaction.update({ embeds: [embed] });
                }
                
                // Verificar fim de batalha
                if (defender.hpAtual <= 0) {
                    const vencedor = attacker;
                    const perdedor = defender;
                    
                    // Transferir aposta
                    db.usuarios[vencedor.id].carteira = (db.usuarios[vencedor.id].carteira || 0) + currentBattle.aposta;
                    db.usuarios[perdedor.id].carteira = (db.usuarios[perdedor.id].carteira || 0) - currentBattle.aposta;
                    db.usuarios[vencedor.id].pvpVitorias = (db.usuarios[vencedor.id].pvpVitorias || 0) + 1;
                    db.usuarios[perdedor.id].pvpDerrotas = (db.usuarios[perdedor.id].pvpDerrotas || 0) + 1;
                    
                    // XP para vencedor
                    const xpGanho = 100 + currentBattle.aposta / 100;
                    db.usuarios[vencedor.id].xpTotal = (db.usuarios[vencedor.id].xpTotal || 0) + xpGanho;
                    
                    saveDB(db);
                    battles.delete(battleId);
                    
                    const finalEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🏆 VITÓRIA!')
                        .setDescription(`${vencedor.username} venceu a batalha!`)
                        .addFields(
                            { name: '💰 Prêmio', value: `${currentBattle.aposta.toLocaleString()} Orbs`, inline: true },
                            { name: '✨ XP Ganho', value: `${Math.floor(xpGanho)}`, inline: true },
                            { name: '🏅 Total de Vitórias', value: `${db.usuarios[vencedor.id].pvpVitorias}`, inline: true }
                        );
                    
                    await interaction.followUp({ embeds: [finalEmbed] });
                    return;
                }
                
                // Mudar turno
                currentBattle.turno = currentBattle.turno === currentBattle.desafiante.id ? currentBattle.adversario.id : currentBattle.desafiante.id;
                currentBattle.turnoNumero++;
                battles.set(battleId, currentBattle);
                
                // Atualizar botões
                const nextAttacker = currentBattle.turno === currentBattle.desafiante.id ? currentBattle.desafiante : currentBattle.adversario;
                const nextAttackerClasse = db.usuarios[nextAttacker.id]?.classe || 'guerreiro';
                const nextSide = currentBattle.turno === currentBattle.desafiante.id ? 'desafiante' : 'adversario';
                
                const components = getHabilidadesButton(nextAttackerClasse, battleId, nextSide === 'desafiante');
                
                const turnEmbed = new EmbedBuilder()
                    .setColor(0x9B59B6)
                    .setTitle(`⚔️ Turno ${currentBattle.turnoNumero}`)
                    .setDescription(`🎭 **${nextAttacker.username}** é sua vez de atacar!`)
                    .addFields(
                        { name: '❤️ Desafiante HP', value: `${currentBattle.desafiante.hpAtual}/${currentBattle.desafiante.stats.hpMax}`, inline: true },
                        { name: '❤️ Adversário HP', value: `${currentBattle.adversario.hpAtual}/${currentBattle.adversario.stats.hpMax}`, inline: true }
                    );
                
                await interaction.followUp({ embeds: [turnEmbed], components });
            });
            
            // Enviar botões para o primeiro turno
            const components = getHabilidadesButton(db.usuarios[desafiante.id]?.classe || 'guerreiro', battle.id, true);
            await msg.edit({ components });
        }
        
        else if (subcmd === 'rank') {
            const ranking = Object.entries(db.usuarios)
                .map(([id, data]) => ({ 
                    id, 
                    vitorias: data.pvpVitorias || 0,
                    derrotas: data.pvpDerrotas || 0,
                    classe: data.classe || 'guerreiro'
                }))
                .sort((a, b) => b.vitorias - a.vitorias)
                .slice(0, 10);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏆 Ranking PvP - Gladiadores')
                .setDescription('Os maiores guerreiros do universo!');
            
            for (let i = 0; i < ranking.length; i++) {
                try {
                    const user = await client.users.fetch(ranking[i].id);
                    const classeInfo = getClasseInfo(ranking[i].classe);
                    const winRate = ranking[i].vitorias + ranking[i].derrotas > 0 
                        ? ((ranking[i].vitorias / (ranking[i].vitorias + ranking[i].derrotas)) * 100).toFixed(1)
                        : 0;
                    
                    embed.addFields({
                        name: `${i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} ${user.username}`,
                        value: `🏆 Vitórias: ${ranking[i].vitorias} | 📊 Winrate: ${winRate}%\n🎭 Classe: ${classeInfo.nome}`,
                        inline: false
                    });
                } catch (e) {}
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'stats') {
            const stats = calcularStats(message.author, db, getClasseInfo(classeAtual));
            const winRate = (stats.vitorias / (stats.vitorias + (db.usuarios[userId].pvpDerrotas || 0)) * 100).toFixed(1);
            
            const embed = new EmbedBuilder()
                .setColor(0x00CED1)
                .setTitle(`📊 Estatísticas PvP - ${message.author.username}`)
                .addFields(
                    { name: '🎭 Classe', value: stats.classe, inline: true },
                    { name: '📊 Nível', value: `${stats.nivel}`, inline: true },
                    { name: '🏆 Vitórias', value: `${stats.vitorias}`, inline: true },
                    { name: '💀 Derrotas', value: `${db.usuarios[userId].pvpDerrotas || 0}`, inline: true },
                    { name: '📈 Winrate', value: `${winRate}%`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '❤️ HP', value: `${stats.hp}/${stats.hpMax}`, inline: true },
                    { name: '⚔️ Ataque', value: `${stats.atk}`, inline: true },
                    { name: '🛡️ Defesa', value: `${stats.def}`, inline: true },
                    { name: '✨ Crítico', value: `${stats.crit}%`, inline: true },
                    { name: '💨 Evasão', value: `${stats.evasao}%`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('⚔️ SISTEMA PVP AVANÇADO')
                .setDescription('Entre em batalhas épicas com sistema de turnos, classes e habilidades!')
                .addFields(
                    { name: '🎭 Classes', value: '`bt!pvp classe` - Ver/alterar sua classe', inline: false },
                    { name: '⚔️ Desafiar', value: '`bt!pvp desafiar @user [aposta]` - Desafiar alguém', inline: true },
                    { name: '✅ Aceitar', value: '`bt!pvp aceitar` - Aceitar desafio pendente', inline: true },
                    { name: '🏆 Ranking', value: '`bt!pvp rank` - Ver ranking PvP', inline: true },
                    { name: '📊 Stats', value: '`bt!pvp stats` - Suas estatísticas', inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: '🎮 Como jogar', value: 'Use botões para escolher ataques normais ou habilidades especiais durante a batalha!', inline: false }
                )
                .setFooter({ text: 'Sistema por turnos | Classes únicas | Críticos e Evasão' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};