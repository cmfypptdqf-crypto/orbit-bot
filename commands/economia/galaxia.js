// commands/economia/galaxia.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, clans: {}, galaxias: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Lista de galáxias disponíveis
const galaxias = {
    'via_lactea': {
        nome: '🌌 Via Láctea',
        descricao: 'A galáxia onde tudo começou. Lar de muitos sistemas solares.',
        bonus: { carteira: 1.05, missoes: 1.05, ataque: 1.03 },
        dificuldade: 'Fácil',
        defesa: 1000,
        cor: '#3498DB'
    },
    'andromeda': {
        nome: '🌀 Andrômeda',
        descricao: 'Nossa vizinha gigante. Rica em recursos e perigos.',
        bonus: { carteira: 1.10, missoes: 1.08, ataque: 1.05 },
        dificuldade: 'Médio',
        defesa: 5000,
        cor: '#9B59B6'
    },
    'triangulo': {
        nome: '🔺 Galáxia do Triângulo',
        descricao: 'Pequena mas poderosa. Escondida entre gigantes.',
        bonus: { carteira: 1.08, missoes: 1.10, ataque: 1.07 },
        dificuldade: 'Médio',
        defesa: 3000,
        cor: '#2ECC71'
    },
    'olho_negro': {
        nome: '👁️ Olho Negro',
        descricao: 'Galáxia misteriosa com um núcleo escuro.',
        bonus: { carteira: 1.12, missoes: 1.12, ataque: 1.10 },
        dificuldade: 'Difícil',
        defesa: 10000,
        cor: '#E67E22'
    },
    'sombreiro': {
        nome: '🎩 Galáxia do Sombreiro',
        descricao: 'Tem a forma de um chapéu mexicano. Muito cobiçada.',
        bonus: { carteira: 1.15, missoes: 1.15, ataque: 1.12 },
        dificuldade: 'Difícil',
        defesa: 15000,
        cor: '#F1C40F'
    },
    'centaurus': {
        nome: '⚡ Centaurus A',
        descricao: 'Galáxia ativa com buraco negro supermassivo.',
        bonus: { carteira: 1.20, missoes: 1.18, ataque: 1.15 },
        dificuldade: 'Épico',
        defesa: 25000,
        cor: '#E74C3C'
    },
    'rosquinha': {
        nome: '🍩 Galáxia do Anel',
        descricao: 'Rara galáxia em formato de anel. Tesouro espacial.',
        bonus: { carteira: 1.25, missoes: 1.22, ataque: 1.20 },
        dificuldade: 'Lendário',
        defesa: 50000,
        cor: '#FFD700'
    }
};

module.exports = {
    name: 'galaxia',
    description: 'Domine galáxias para ganhar bônus no servidor',
    aliases: ['galaxias', 'dominio', 'territorio'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const guildId = message.guild.id;
        const guildName = message.guild.name;
        const db = getDB();
        
        if (!db.galaxias) db.galaxias = {};
        if (!db.galaxias[guildId]) {
            db.galaxias[guildId] = {
                nome: guildName,
                galaxiaAtual: null,
                poder: 0,
                conquistas: [],
                recursos: 0,
                defesa: 0,
                dono: message.guild.ownerId,
                membrosAtacantes: []
            };
            saveDB(db);
        }
        
        const guildData = db.galaxias[guildId];
        
        // Comando: listar
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🌌 Galáxias Disponíveis')
                .setDescription('Domine uma galáxia para ganhar bônus no servidor!')
                .setThumbnail(message.guild.iconURL());
            
            for (const [id, galaxia] of Object.entries(galaxias)) {
                const dominada = Object.values(db.galaxias).find(g => g.galaxiaAtual === id);
                const status = dominada ? `🔴 Dominada por ${dominada.nome}` : '🟢 Disponível';
                
                embed.addFields({
                    name: `${galaxia.nome}`,
                    value: `📊 **${galaxia.dificuldade}**\n🛡️ Defesa: ${galaxia.defesa.toLocaleString()}\n✨ Bônus: +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs\n${status}`,
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: info
        else if (subcmd === 'info') {
            if (!guildData.galaxiaAtual) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(`🌌 ${guildName}`)
                    .setDescription('❌ Este servidor ainda não domina nenhuma galáxia!')
                    .addFields(
                        { name: '💡 Como conquistar?', value: 'Use `bt!galaxia conquistar <nome>` para atacar uma galáxia!' }
                    );
                return await message.reply({ embeds: [embed] });
            }
            
            const galaxia = galaxias[guildData.galaxiaAtual];
            const poderTotal = calcularPoderServidor(message.guild, db);
            
            const embed = new EmbedBuilder()
                .setColor(galaxia.cor)
                .setTitle(`🌌 ${galaxia.nome}`)
                .setDescription(`Dominada por **${guildName}**`)
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '📊 Nível de Domínio', value: `${guildData.poder}%`, inline: true },
                    { name: '🛡️ Defesa Atual', value: `${Math.max(0, galaxia.defesa - guildData.poder * 100).toLocaleString()}`, inline: true },
                    { name: '💰 Recursos', value: `${guildData.recursos.toLocaleString()} Orbs`, inline: true },
                    { name: '✨ Bônus Ativos', value: `💰 +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs\n🚀 +${Math.round((galaxia.bonus.missoes - 1) * 100)}% XP Missões\n⚔️ +${Math.round((galaxia.bonus.ataque - 1) * 100)}% Dano Ataque`, inline: false },
                    { name: '🎯 Poder do Servidor', value: `${poderTotal.toLocaleString()}`, inline: true },
                    { name: '🏆 Conquistas', value: guildData.conquistas.length > 0 ? guildData.conquistas.join('\n') : 'Nenhuma ainda', inline: false }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: conquistar
        else if (subcmd === 'conquistar') {
            const nomeGalaxia = args.slice(1).join(' ');
            let galaxiaId = null;
            
            for (const [id, g] of Object.entries(galaxias)) {
                if (g.nome.toLowerCase().includes(nomeGalaxia.toLowerCase())) {
                    galaxiaId = id;
                    break;
                }
            }
            
            if (!galaxiaId) return message.reply('❌ Galáxia não encontrada! Use `bt!galaxia listar`');
            
            const galaxia = galaxias[galaxiaId];
            
            // Verificar se já está dominada
            const donoAtual = Object.entries(db.galaxias).find(([_, g]) => g.galaxiaAtual === galaxiaId);
            
            if (donoAtual && donoAtual[0] !== guildId) {
                return message.reply(`❌ A ${galaxia.nome} já está dominada por **${donoAtual[1].nome}**! Use \`bt!galaxia guerra ${galaxiaId}\` para atacar!`);
            }
            
            // Calcular poder do servidor
            const poderTotal = calcularPoderServidor(message.guild, db);
            
            if (poderTotal < galaxia.defesa) {
                return message.reply(`❌ Seu servidor precisa de **${galaxia.defesa.toLocaleString()}** de poder para conquistar ${galaxia.nome}! Poder atual: ${poderTotal.toLocaleString()}`);
            }
            
            // Conquistar galáxia
            guildData.galaxiaAtual = galaxiaId;
            guildData.poder = 0;
            guildData.recursos = 0;
            guildData.conquistas.push(`🌌 Conquistou ${galaxia.nome} em ${new Date().toLocaleDateString()}`);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 CONQUISTA ESPACIAL!')
                .setDescription(`**${guildName}** conquistou a ${galaxia.nome}!`)
                .addFields(
                    { name: '✨ Bônus Ativados', value: `💰 +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs\n🚀 +${Math.round((galaxia.bonus.missoes - 1) * 100)}% XP Missões`, inline: true },
                    { name: '🏆 Poder usado', value: `${poderTotal.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: 'Defendam sua galáxia de outros servidores!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: guerra
        else if (subcmd === 'guerra') {
            const nomeGalaxia = args.slice(1).join(' ');
            let galaxiaId = null;
            
            for (const [id, g] of Object.entries(galaxias)) {
                if (g.nome.toLowerCase().includes(nomeGalaxia.toLowerCase())) {
                    galaxiaId = id;
                    break;
                }
            }
            
            if (!galaxiaId) return message.reply('❌ Galáxia não encontrada!');
            
            const donoAtual = Object.entries(db.galaxias).find(([_, g]) => g.galaxiaAtual === galaxiaId);
            
            if (!donoAtual) {
                return message.reply(`❌ A ${galaxias[galaxiaId].nome} não está dominada! Use \`bt!galaxia conquistar\` primeiro.`);
            }
            
            if (donoAtual[0] === guildId) {
                return message.reply(`❌ Seu servidor já domina a ${galaxias[galaxiaId].nome}!`);
            }
            
            const galaxia = galaxias[galaxiaId];
            const servidorAtacante = message.guild;
            const servidorDefensorId = donoAtual[0];
            const servidorDefensor = client.guilds.cache.get(servidorDefensorId);
            
            const poderAtacante = calcularPoderServidor(servidorAtacante, db);
            const poderDefensor = calcularPoderServidor(servidorDefensor, db) + (galaxia.defesa * 0.2);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚔️ DECLARAÇÃO DE GUERRA!')
                .setDescription(`**${servidorAtacante.name}** declarou guerra a **${servidorDefensor?.name || 'Servidor Desconhecido'}** pela ${galaxia.nome}!`)
                .addFields(
                    { name: '⚔️ Poder Atacante', value: `${poderAtacante.toLocaleString()}`, inline: true },
                    { name: '🛡️ Poder Defensor', value: `${poderDefensor.toLocaleString()}`, inline: true },
                    { name: '📊 Chance de Vitória', value: `${Math.min(95, Math.round((poderAtacante / poderDefensor) * 50 + 10))}%`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
            
            // Simular batalha após 5 segundos
            setTimeout(async () => {
                const vitoriaAtacante = poderAtacante > poderDefensor;
                const dbAtual = getDB();
                const guildAtual = dbAtual.galaxias[guildId];
                const guildDefensor = dbAtual.galaxias[servidorDefensorId];
                
                if (vitoriaAtacante && guildDefensor && guildDefensor.galaxiaAtual === galaxiaId) {
                    // Atacante vence
                    guildAtual.galaxiaAtual = galaxiaId;
                    guildDefensor.galaxiaAtual = null;
                    guildAtual.conquistas.push(`⚔️ Tomou ${galaxia.nome} de ${servidorDefensor?.name || 'desconhecido'} em ${new Date().toLocaleDateString()}`);
                    saveDB(dbAtual);
                    
                    const resultadoEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🏆 VITÓRIA NA GUERRA!')
                        .setDescription(`**${servidorAtacante.name}** conquistou a ${galaxia.nome}!`)
                        .addFields(
                            { name: '🔥 Poder usado', value: `${poderAtacante.toLocaleString()}`, inline: true },
                            { name: '✨ Bônus adquiridos', value: `💰 +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs`, inline: true }
                        );
                    
                    await message.channel.send({ embeds: [resultadoEmbed] });
                } else {
                    // Defensor vence
                    const resultadoEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('💀 DERROTA NA GUERRA!')
                        .setDescription(`**${servidorAtacante.name}** falhou em conquistar a ${galaxia.nome}!`)
                        .addFields(
                            { name: '🛡️ Defensores', value: `${servidorDefensor?.name || 'Servidor Desconhecido'}`, inline: true }
                        );
                    
                    await message.channel.send({ embeds: [resultadoEmbed] });
                }
            }, 5000);
        }
        
        // Comando: bonus (ver bônus ativos)
        else if (subcmd === 'bonus') {
            if (!guildData.galaxiaAtual) {
                return message.reply('❌ Seu servidor não domina nenhuma galáxia! Use `bt!galaxia conquistar`');
            }
            
            const galaxia = galaxias[guildData.galaxiaAtual];
            
            const embed = new EmbedBuilder()
                .setColor(galaxia.cor)
                .setTitle(`✨ Bônus da ${galaxia.nome}`)
                .setDescription(`Bônus ativos para **${guildName}**:`)
                .addFields(
                    { name: '💰 Bônus de Orbs', value: `+${Math.round((galaxia.bonus.carteira - 1) * 100)}% em todos ganhos`, inline: false },
                    { name: '🚀 Bônus de Missões', value: `+${Math.round((galaxia.bonus.missoes - 1) * 100)}% XP em missões`, inline: false },
                    { name: '⚔️ Bônus de Ataque', value: `+${Math.round((galaxia.bonus.ataque - 1) * 100)}% dano em ataques`, inline: false }
                )
                .setFooter({ text: 'Mantenha sua galáxia para continuar com os bônus!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: ranking
        else if (subcmd === 'ranking') {
            const ranking = Object.entries(db.galaxias)
                .filter(([_, data]) => data.galaxiaAtual)
                .map(([id, data]) => ({
                    nome: data.nome,
                    galaxia: galaxias[data.galaxiaAtual]?.nome || 'Desconhecida',
                    poder: data.poder,
                    recursos: data.recursos
                }))
                .sort((a, b) => b.poder - a.poder)
                .slice(0, 10);
            
            if (ranking.length === 0) {
                return message.reply('📊 Nenhum servidor domina uma galáxia ainda!');
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏆 Ranking de Dominação Galáctica')
                .setDescription('Servidores mais poderosos do universo!');
            
            for (let i = 0; i < ranking.length; i++) {
                const r = ranking[i];
                let medalha = '';
                if (i === 0) medalha = '👑 ';
                else if (i === 1) medalha = '🥈 ';
                else if (i === 2) medalha = '🥉 ';
                else medalha = `${i + 1}. `;
                
                embed.addFields({
                    name: `${medalha}${r.nome}`,
                    value: `🌌 ${r.galaxia} | 📊 Poder: ${r.poder}%`,
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: investir (melhorar domínio)
        else if (subcmd === 'investir') {
            const quantia = parseInt(args[1]);
            
            if (!guildData.galaxiaAtual) {
                return message.reply('❌ Seu servidor não domina nenhuma galáxia!');
            }
            
            if (!quantia || quantia <= 0) {
                return message.reply('❌ Use: `bt!galaxia investir <quantia>`');
            }
            
            // Verificar se o usuário tem permissão (admin)
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Apenas administradores podem investir recursos do servidor!');
            }
            
            const dbAtual = getDB();
            const guildAtual = dbAtual.galaxias[guildId];
            
            if (guildAtual.recursos < quantia) {
                return message.reply(`❌ O servidor só tem ${guildAtual.recursos.toLocaleString()} recursos!`);
            }
            
            guildAtual.recursos -= quantia;
            guildAtual.poder += Math.floor(quantia / 1000);
            saveDB(dbAtual);
            
            await message.reply(`✅ Servidor investiu ${quantia.toLocaleString()} recursos! Poder de domínio aumentou para ${guildAtual.poder}%`);
        }
        
        // Comando: ajuda
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🌌 Sistema de Dominação Galáctica')
                .setDescription('Domine galáxias para ganhar bônus no servidor!')
                .addFields(
                    { name: '📋 `bt!galaxia listar`', value: 'Mostra todas as galáxias disponíveis', inline: false },
                    { name: '🎯 `bt!galaxia conquistar <nome>`', value: 'Tenta conquistar uma galáxia', inline: false },
                    { name: 'ℹ️ `bt!galaxia info`', value: 'Mostra informações da sua galáxia', inline: false },
                    { name: '⚔️ `bt!galaxia guerra <nome>`', value: 'Declara guerra para tomar uma galáxia', inline: false },
                    { name: '✨ `bt!galaxia bonus`', value: 'Mostra os bônus ativos', inline: false },
                    { name: '🏆 `bt!galaxia ranking`', value: 'Ranking de servidores', inline: false },
                    { name: '💰 `bt!galaxia investir <valor>`', value: 'Investe recursos para fortalecer domínio', inline: false }
                )
                .setFooter({ text: 'Cada galáxia oferece bônus únicos para o servidor!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

// Função para calcular poder do servidor
function calcularPoderServidor(guild, db) {
    let poder = 0;
    const guildData = db.galaxias?.[guild.id];
    
    if (guildData) {
        poder += guildData.poder || 0;
        poder += Math.floor(guild.memberCount * 10);
        
        if (guildData.galaxiaAtual) {
            const galaxia = galaxias[guildData.galaxiaAtual];
            if (galaxia) poder += galaxia.defesa / 100;
        }
    }
    
    return Math.floor(poder);
}