// commands/social/uniaoOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, casamentos: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'uniao',
    aliases: ['casar', 'marry', 'uniaoorbital', 'casamento'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.casamentos) db.casamentos = {};
        
        // Adicionar XP por usar o comando
        const xpGanho = 10;
        const resultadoXP = adicionarXP(userId, xpGanho, 'uniao');
        
        // ========== PEDIR ==========
        if (subcmd === 'pedir') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!uniao pedir @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode se unir orbitalmente a si mesmo!');
            if (user.bot) return message.reply('❌ Não pode se unir a um drone orbital!');
            if (db.casamentos[userId] || db.casamentos[user.id]) return message.reply('❌ Um de vocês já está em uma união orbital!');
            
            if (!db.propostas) db.propostas = {};
            db.propostas[user.id] = { from: userId, expires: Date.now() + 60000 };
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF69B4)
                .setTitle('💫 Pedido de União Orbital!')
                .setDescription(`💕 ${message.author} pediu ${user} em união orbital! 💕`)
                .addFields(
                    { name: '⏰ Expira em', value: '1 minuto orbital', inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: `${user.username}, use bt!uniao aceitar para aceitar a união orbital!` });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== ACEITAR ==========
        else if (subcmd === 'aceitar') {
            if (!db.propostas || !db.propostas[userId]) return message.reply('❌ Nenhum pedido de união orbital pendente!');
            
            const proposta = db.propostas[userId];
            if (proposta.expires < Date.now()) {
                delete db.propostas[userId];
                return message.reply('❌ O pedido de união orbital expirou!');
            }
            
            db.casamentos[proposta.from] = { parceiro: userId, data: Date.now() };
            db.casamentos[userId] = { parceiro: proposta.from, data: Date.now() };
            delete db.propostas[userId];
            
            // Bônus para os recém-unidos
            db.usuarios[proposta.from].carteira = (db.usuarios[proposta.from].carteira || 0) + 5000;
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + 5000;
            
            saveDB(db);
            
            const parceiro = await client.users.fetch(proposta.from);
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('💍 União Orbital Realizada!')
                .setDescription(`💕 ${message.author} e ${parceiro.username} agora estão unidos orbitalmente! 🎉`)
                .addFields(
                    { name: '🎁 Bônus de União', value: `+5.000 Orbs para cada!`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Que o amor orbital dure para sempre!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== DIVORCIAR ==========
        else if (subcmd === 'divorciar') {
            if (!db.casamentos[userId]) return message.reply('❌ Você não está em uma união orbital!');
            
            const parceiroId = db.casamentos[userId].parceiro;
            delete db.casamentos[userId];
            delete db.casamentos[parceiroId];
            
            const custo = 10000;
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - custo;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('💔 União Orbital Dissolvida!')
                .setDescription(`💔 Divórcio orbital realizado! Você pagou ${custo.toLocaleString()} Orbs de multa orbital.`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • As órbitas se separaram...' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== INFO ==========
        else if (subcmd === 'info') {
            if (!db.casamentos[userId]) return message.reply('❌ Você não está em uma união orbital!');
            
            const parceiroId = db.casamentos[userId].parceiro;
            const parceiro = await client.users.fetch(parceiroId);
            const dataCasamento = db.casamentos[userId].data;
            
            const embed = new EmbedBuilder()
                .setColor(0xFF69B4)
                .setTitle(`💍 União Orbital de ${message.author.username}`)
                .setDescription(`💑 Parceiro(a) orbital: **${parceiro.username}**\n📅 Unidos orbitalmente desde: <t:${Math.floor(dataCasamento / 1000)}:D>`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Que o amor orbital dure para sempre!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFF69B4)
                .setTitle('💫 União Orbital - Sistema de Casamento')
                .setDescription('Comandos orbitais disponíveis:')
                .addFields(
                    { name: '💍 `bt!uniao pedir @user`', value: 'Pede alguém em união orbital', inline: false },
                    { name: '✅ `bt!uniao aceitar`', value: 'Aceita um pedido de união orbital', inline: false },
                    { name: '💔 `bt!uniao divorciar`', value: 'Dissolve a união orbital (custa 10.000 Orbs)', inline: false },
                    { name: 'ℹ️ `bt!uniao info`', value: 'Mostra informações da sua união orbital', inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (comando orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • O amor orbital está nas estrelas!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};