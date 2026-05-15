// commands/social/casar.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
    name: 'casar',
    aliases: ['marry', 'casamento'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.casamentos) db.casamentos = {};
        
        if (subcmd === 'pedir') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!casar pedir @usuario`');
            if (user.id === userId) return message.reply('❌ Você não pode casar consigo mesmo!');
            if (user.bot) return message.reply('❌ Não pode casar com bots!');
            if (db.casamentos[userId] || db.casamentos[user.id]) return message.reply('❌ Um de vocês já está casado!');
            
            if (!db.propostas) db.propostas = {};
            db.propostas[user.id] = { from: userId, expires: Date.now() + 60000 };
            saveDB(db);
            
            await message.reply(`💍 ${message.author} pediu ${user} em casamento!\n${user}, use \`bt!casar aceitar\` para aceitar.`);
        }
        
        else if (subcmd === 'aceitar') {
            if (!db.propostas || !db.propostas[userId]) return message.reply('❌ Nenhum pedido de casamento pendente!');
            
            const proposta = db.propostas[userId];
            if (proposta.expires < Date.now()) {
                delete db.propostas[userId];
                return message.reply('❌ O pedido expirou!');
            }
            
            db.casamentos[proposta.from] = { parceiro: userId, data: Date.now() };
            db.casamentos[userId] = { parceiro: proposta.from, data: Date.now() };
            delete db.propostas[userId];
            saveDB(db);
            
            const parceiro = await client.users.fetch(proposta.from);
            await message.reply(`💍 ${message.author} e ${parceiro.username} agora são marido e mulher! 🎉`);
        }
        
        else if (subcmd === 'divorciar') {
            if (!db.casamentos[userId]) return message.reply('❌ Você não está casado!');
            
            const parceiroId = db.casamentos[userId].parceiro;
            delete db.casamentos[userId];
            delete db.casamentos[parceiroId];
            
            const custo = 10000;
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - custo;
            saveDB(db);
            
            await message.reply(`💔 Divórcio realizado! Você pagou ${custo.toLocaleString()} Orbs de multa.`);
        }
        
        else if (subcmd === 'info') {
            if (!db.casamentos[userId]) return message.reply('❌ Você não está casado!');
            
            const parceiroId = db.casamentos[userId].parceiro;
            const parceiro = await client.users.fetch(parceiroId);
            const dataCasamento = db.casamentos[userId].data;
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle(`💍 Casamento de ${message.author.username}`)
                .setDescription(`💑 Parceiro(a): **${parceiro.username}**\n📅 Casados desde: <t:${Math.floor(dataCasamento / 1000)}:D>`)
                .setFooter({ text: '💕 Que o amor interestelar dure para sempre!' });
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('💍 **Sistema de Casamento**\n`bt!casar pedir @user`\n`bt!casar aceitar`\n`bt!casar divorciar`\n`bt!casar info`');
        }
    }
};