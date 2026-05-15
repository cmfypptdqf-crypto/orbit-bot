// commands/economia/galaxia.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { recalcularPoderClan } = require('../utilidades/clanUtils.js');

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

const galaxias = {
    'via_lactea': { nome: '🌌 Via Láctea', bonus: { carteira: 1.05 }, defesa: 1000, dificuldade: 'Fácil', cor: '#3498DB' },
    'andromeda': { nome: '🌀 Andrômeda', bonus: { carteira: 1.10 }, defesa: 5000, dificuldade: 'Médio', cor: '#9B59B6' },
    'triangulo': { nome: '🔺 Triângulo', bonus: { carteira: 1.08 }, defesa: 3000, dificuldade: 'Médio', cor: '#2ECC71' },
    'olho_negro': { nome: '👁️ Olho Negro', bonus: { carteira: 1.12 }, defesa: 10000, dificuldade: 'Difícil', cor: '#E67E22' },
    'sombreiro': { nome: '🎩 Sombreiro', bonus: { carteira: 1.15 }, defesa: 15000, dificuldade: 'Difícil', cor: '#F1C40F' },
    'centaurus': { nome: '⚡ Centaurus A', bonus: { carteira: 1.20 }, defesa: 25000, dificuldade: 'Épico', cor: '#E74C3C' },
    'rosquinha': { nome: '🍩 Galáxia do Anel', bonus: { carteira: 1.25 }, defesa: 50000, dificuldade: 'Lendário', cor: '#FFD700' }
};

module.exports = {
    name: 'galaxia',
    aliases: ['galaxias', 'cosmic'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        let db = getDB();
        
        const clanId = db.usuarios[userId]?.clan;
        const clan = clanId ? db.clans[clanId] : null;
        const isLider = clan ? clan.dono === userId : false;
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🌌 Cosmic Dominion')
                .setDescription('Domine uma galáxia para ganhar bônus para sua **Star Federation**!\nUse `bt!cosmic conquistar <nome>` para atacar.')
                .setThumbnail(message.guild.iconURL());
            
            for (const [id, g] of Object.entries(galaxias)) {
                const dono = Object.values(db.clans).find(c => c.galaxiaAtual === id);
                embed.addFields({
                    name: `${g.nome}`,
                    value: `📊 **${g.dificuldade}**\n🛡️ Defesa: ${g.defesa.toLocaleString()}\n✨ Bônus: +${Math.round((g.bonus.carteira - 1) * 100)}% Orbs\n${dono ? `🔴 Dominada por ${dono.nome}` : '🟢 Disponível'}`,
                    inline: false
                });
            }
            embed.setFooter({ text: '🌌 Cosmic Dominion • Domine territórios e ganhe bônus' });
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'conquistar') {
            if (!clan) return message.reply('❌ Você precisa estar em uma **Star Federation**!');
            if (!isLider) return message.reply('❌ Apenas o líder pode conquistar!');
            
            const nomeGalaxia = args.slice(1).join(' ');
            let galaxiaId = null;
            for (const [id, g] of Object.entries(galaxias)) {
                if (g.nome.toLowerCase().includes(nomeGalaxia.toLowerCase())) galaxiaId = id;
            }
            if (!galaxiaId) return message.reply('❌ Galáxia não encontrada!');
            
            const galaxia = galaxias[galaxiaId];
            const donoAtual = Object.values(db.clans).find(c => c.galaxiaAtual === galaxiaId);
            if (donoAtual && donoAtual.id !== clanId) {
                return message.reply(`❌ ${galaxia.nome} já é dominada por ${donoAtual.nome}!`);
            }
            
            const poderClan = recalcularPoderClan(clanId, db);
            if (poderClan < galaxia.defesa) {
                return message.reply(`❌ Poder insuficiente! Sua **Star Federation** precisa de ${galaxia.defesa.toLocaleString()} de poder!`);
            }
            
            clan.galaxiaAtual = galaxiaId;
            if (!clan.conquistas) clan.conquistas = [];
            clan.conquistas.push(`🌌 Conquistou ${galaxia.nome} em ${new Date().toLocaleDateString()}`);
            saveDB(db);
            
            await message.reply(`✅ **${clan.nome}** conquistou a ${galaxia.nome}! Agora todos os membros ganham +${Math.round((galaxia.bonus.carteira - 1) * 100)}% Orbs!`);
        }
        
        else if (subcmd === 'bonus') {
            if (!clan) return message.reply('❌ Você não está em uma Star Federation!');
            if (!clan.galaxiaAtual) return message.reply('❌ Sua Star Federation não domina nenhuma galáxia!');
            
            const galaxia = galaxias[clan.galaxiaAtual];
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle(`✨ Cosmic Dominion - Bônus da ${clan.nome}`)
                .setDescription(`Graças a ${galaxia.nome}, sua **Star Federation** ganha:`)
                .addFields({ name: '💰 Bônus de Orbs', value: `+${Math.round((galaxia.bonus.carteira - 1) * 100)}% em todos os ganhos`, inline: false })
                .setFooter({ text: '🌌 Cosmic Dominion • Domine territórios e ganhe bônus' });
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'ranking') {
            const ranking = Object.values(db.clans).filter(c => c.galaxiaAtual).sort((a, b) => {
                const ga = galaxias[a.galaxiaAtual];
                const gb = galaxias[b.galaxiaAtual];
                return (gb?.defesa || 0) - (ga?.defesa || 0);
            }).slice(0, 10);
            
            if (ranking.length === 0) return message.reply('📊 Nenhuma Star Federation domina uma galáxia!');
            
            const embed = new EmbedBuilder().setColor(0x00008B).setTitle('🏆 Ranking Cosmic Dominion');
            for (let i = 0; i < ranking.length; i++) {
                const c = ranking[i];
                const g = galaxias[c.galaxiaAtual];
                embed.addFields({ name: `${i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} ${c.nome}`, value: `🌌 ${g.nome} | Nível ${c.level}`, inline: false });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🌌 Cosmic Dominion')
                .setDescription('Comandos: `listar`, `conquistar`, `bonus`, `ranking`')
                .setFooter({ text: '🌌 Cosmic Dominion • Domine territórios e ganhe bônus' });
            await message.reply({ embeds: [embed] });
        }
    }
};