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
    description: 'Domine galáxias para ganhar bônus no clã',
    aliases: ['galaxias', 'dominio', 'territorio', 'universo'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        let db = getDB();
        
        // Verificar se usuário tem um clã
        const clanId = db.usuarios[userId]?.clan;
        if (!clanId) {
            if (subcmd === 'info' || subcmd === 'listar') {
                // Permitir ver lista mesmo sem clã
            } else if (subcmd !== 'listar' && subcmd !== 'ranking') {
                return message.reply('❌ Você precisa estar em um clã para usar este comando!\nUse `bt!clan criar <nome>` para criar um clã.');
            }
        }
        
        const clan = clanId ? db.clans[clanId] : null;
        const isLider = clan ? clan.dono === userId : false;
        
        // ========== COMANDO: LISTAR ==========
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🌌 Galáxias Disponíveis')
                .setDescription('Domine uma galáxia para ganhar bônus para todo o clã!\nUse `bt!galaxia conquistar <nome>` para atacar.')
                .setThumbnail(message.guild.iconURL());
            
            for (const [id, galaxia] of Object.entries(galaxias)) {
                const donoAtual = Object.values(db.clans).find(c => c.galaxiaAtual === id);
                const status = donoAtual ? `🔴 Dominada por **${donoAtual.nome}**` : '🟢 Disponível';
                
                embed.addFields({
                    name: `${galaxia.nome}`,
                    value: `📊 **${galaxia.dificuldade}**\n🛡️ Defesa: ${galaxia.defesa.toLocaleString()}\n✨ Bônus: +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs\n${status}`,
                    inline: false
                });
            }
            
            embed.setFooter({ text: '🌌 Orbit • Quanto maior a dificuldade, maior o bônus!' });
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: INFO ==========
        else if (subcmd === 'info') {
            if (!clan) return message.reply('❌ Você não está em nenhum clã!');
            
            if (!clan.galaxiaAtual) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle(`🌌 ${clan.nome}`)
                    .setDescription('❌ Seu clã ainda não domina nenhuma galáxia!')
                    .addFields(
                        { name: '💡 Como conquistar?', value: 'Use `bt!galaxia conquistar <nome>` para atacar uma galáxia!' }
                    );
                return await message.reply({ embeds: [embed] });
            }
            
            const galaxia = galaxias[clan.galaxiaAtual];
            
            const embed = new EmbedBuilder()
                .setColor(galaxia.cor)
                .setTitle(`🌌 ${galaxia.nome}`)
                .setDescription(`Dominada por **${clan.nome}**`)
                .setThumbnail(message.guild.iconURL())
                .addFields(
                    { name: '📊 Domínio', value: `${clan.poder || 0}%`, inline: true },
                    { name: '🛡️ Defesa Atual', value: `${Math.max(0, galaxia.defesa - (clan.poder || 0) * 100).toLocaleString()}`, inline: true },
                    { name: '💰 Recursos do Clã', value: `${(clan.recursos || 0).toLocaleString()} Orbs`, inline: true },
                    { name: '✨ Bônus Ativos', value: `💰 +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs\n🚀 +${Math.round((galaxia.bonus.missoes - 1) * 100)}% XP Missões\n⚔️ +${Math.round((galaxia.bonus.ataque - 1) * 100)}% Dano Ataque`, inline: false },
                    { name: '🏆 Conquistas', value: clan.conquistas?.slice(-3).join('\n') || 'Nenhuma ainda', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Defendam sua galáxia de outros clãs!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: CONQUISTAR ==========
        else if (subcmd === 'conquistar') {
            if (!clan) return message.reply('❌ Você não está em nenhum clã!');
            if (!isLider) return message.reply('❌ Apenas o líder do clã pode conquistar galáxias!');
            
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
            const donoAtual = Object.values(db.clans).find(c => c.galaxiaAtual === galaxiaId);
            
            if (donoAtual && donoAtual.id !== clanId) {
                return message.reply(`❌ A ${galaxia.nome} já está dominada por **${donoAtual.nome}**! Use \`bt!galaxia guerra\` para atacar!`);
            }
            
            // Calcular poder do clã
            const poderClan = calcularPoderClan(clan, db);
            
            if (poderClan < galaxia.defesa) {
                return message.reply(`❌ Seu clã precisa de **${galaxia.defesa.toLocaleString()}** de poder para conquistar ${galaxia.nome}! Poder atual: ${poderClan.toLocaleString()}`);
            }
            
            // Conquistar galáxia
            clan.galaxiaAtual = galaxiaId;
            clan.poder = 0;
            if (!clan.conquistas) clan.conquistas = [];
            clan.conquistas.push(`🌌 Conquistou ${galaxia.nome} em ${new Date().toLocaleDateString()}`);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 CONQUISTA ESPACIAL!')
                .setDescription(`**${clan.nome}** conquistou a ${galaxia.nome}!`)
                .addFields(
                    { name: '✨ Bônus Ativados', value: `💰 +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs\n🚀 +${Math.round((galaxia.bonus.missoes - 1) * 100)}% XP Missões`, inline: true },
                    { name: '🏆 Poder usado', value: `${poderClan.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Defendam sua galáxia de outros servidores!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: BONUS ==========
        else if (subcmd === 'bonus') {
            if (!clan) return message.reply('❌ Você não está em nenhum clã!');
            
            if (!clan.galaxiaAtual) {
                return message.reply('❌ Seu clã não domina nenhuma galáxia! Use `bt!galaxia conquistar` para dominar uma.');
            }
            
            const galaxia = galaxias[clan.galaxiaAtual];
            
            const embed = new EmbedBuilder()
                .setColor(galaxia.cor)
                .setTitle(`✨ Bônus do Clã: ${clan.nome}`)
                .setDescription(`Graças a ${galaxia.nome}, todo o clã ganha bônus!`)
                .addFields(
                    { name: '💰 Bônus de Orbs', value: `+${Math.round((galaxia.bonus.carteira - 1) * 100)}% em todos ganhos`, inline: false },
                    { name: '🚀 Bônus de Missões', value: `+${Math.round((galaxia.bonus.missoes - 1) * 100)}% XP em missões`, inline: false },
                    { name: '⚔️ Bônus de Ataque', value: `+${Math.round((galaxia.bonus.ataque - 1) * 100)}% dano em ataques`, inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Protejam sua galáxia de outros clãs!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: RANKING ==========
        else if (subcmd === 'ranking') {
            const ranking = Object.values(db.clans)
                .filter(c => c.galaxiaAtual)
                .sort((a, b) => {
                    const galaxiaA = galaxias[a.galaxiaAtual];
                    const galaxiaB = galaxias[b.galaxiaAtual];
                    return (galaxiaB?.defesa || 0) - (galaxiaA?.defesa || 0);
                })
                .slice(0, 10);
            
            if (ranking.length === 0) {
                return message.reply('📊 Nenhum clã domina uma galáxia ainda!');
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏆 Ranking de Dominação Galáctica')
                .setDescription('Clãs que dominam as galáxias mais poderosas!');
            
            for (let i = 0; i < ranking.length; i++) {
                const c = ranking[i];
                const galaxia = galaxias[c.galaxiaAtual];
                let medalha = '';
                if (i === 0) medalha = '👑 ';
                else if (i === 1) medalha = '🥈 ';
                else if (i === 2) medalha = '🥉 ';
                else medalha = `${i + 1}. `;
                
                embed.addFields({
                    name: `${medalha}${c.nome}`,
                    value: `🌌 ${galaxia.nome} | 📊 Nível ${c.level} | 👥 ${c.membros.length} membros`,
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🌌 Sistema de Dominação Galáctica')
                .setDescription('Domine galáxias para ganhar bônus para seu clã!')
                .addFields(
                    { name: '📋 `bt!galaxia listar`', value: 'Mostra todas as galáxias disponíveis', inline: false },
                    { name: 'ℹ️ `bt!galaxia info`', value: 'Mostra informações da sua galáxia', inline: false },
                    { name: '🎯 `bt!galaxia conquistar <nome>`', value: 'Tenta conquistar uma galáxia (apenas líder)', inline: false },
                    { name: '✨ `bt!galaxia bonus`', value: 'Mostra os bônus ativos do clã', inline: false },
                    { name: '🏆 `bt!galaxia ranking`', value: 'Ranking de dominação galáctica', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Quanto maior a galáxia, maior o bônus!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

// Função para calcular poder do clã
function calcularPoderClan(clan, db) {
    let poder = clan.poder || 0;
    poder += clan.membros.length * 100;
    poder += clan.level * 500;
    poder += (clan.recursos || 0) / 1000;
    
    if (clan.galaxiaAtual) {
        const galaxia = galaxias[clan.galaxiaAtual];
        if (galaxia) poder += galaxia.defesa / 10;
    }
    
    return Math.floor(poder);
}