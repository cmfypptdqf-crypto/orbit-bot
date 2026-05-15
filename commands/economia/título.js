// commands/conquistas/titulos.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const titulos = {
    '1': { nome: '🌱 Recruta Estelar', preco: 1000, nivelMin: 1 },
    '2': { nome: '⚔️ Guerreiro Cósmico', preco: 5000, nivelMin: 10 },
    '3': { nome: '👑 Lorde das Estrelas', preco: 10000, nivelMin: 25 },
    '4': { nome: '🐉 Dragão Galáctico', preco: 50000, nivelMin: 50 },
    '5': { nome: '✨ Divindade Espacial', preco: 100000, nivelMin: 100 }
};

module.exports = {
    name: 'titulos',
    aliases: ['title', 'título'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, titulos: [], tituloAtivo: null, xpTotal: 0 };
        }
        
        const nivelUsuario = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🏷️ Títulos Disponíveis')
                .setDescription('Use `bt!titulos comprar <id>` para adquirir um título!');
            
            for (const [id, titulo] of Object.entries(titulos)) {
                const liberado = nivelUsuario >= titulo.nivelMin;
                embed.addFields({
                    name: `${id} - ${titulo.nome}`,
                    value: `💰 ${titulo.preco.toLocaleString()} Orbs | ${liberado ? '🟢 Disponível' : `🔒 Nível ${titulo.nivelMin}+`}`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            const id = args[1];
            if (!id || !titulos[id]) return message.reply('❌ ID inválido!');
            
            const titulo = titulos[id];
            if (nivelUsuario < titulo.nivelMin) return message.reply(`❌ Você precisa ser nível ${titulo.nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < titulo.preco) return message.reply(`❌ Você precisa de ${titulo.preco.toLocaleString()} Orbs!`);
            if (db.usuarios[userId].titulos?.includes(id)) return message.reply('❌ Você já possui este título!');
            
            db.usuarios[userId].carteira -= titulo.preco;
            if (!db.usuarios[userId].titulos) db.usuarios[userId].titulos = [];
            db.usuarios[userId].titulos.push(id);
            saveDB(db);
            
            await message.reply(`✅ Você adquiriu o título **${titulo.nome}**! Use \`bt!titulos equipar ${id}\` para usá-lo.`);
        }
        
        else if (subcmd === 'equipar') {
            const id = args[1];
            if (!db.usuarios[userId]?.titulos?.includes(id)) return message.reply('❌ Você não possui este título!');
            db.usuarios[userId].tituloAtivo = id;
            saveDB(db);
            await message.reply(`✅ Agora você está usando o título **${titulos[id].nome}**!`);
        }
        
        else if (subcmd === 'meus') {
            const meusTitulos = db.usuarios[userId].titulos || [];
            const tituloAtivo = db.usuarios[userId].tituloAtivo;
            const lista = meusTitulos.map(id => `**${titulos[id].nome}**${tituloAtivo === id ? ' ✅ ATIVO' : ''}`).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle(`🏷️ Títulos de ${message.author.username}`)
                .setDescription(lista || 'Nenhum título ainda');
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🏷️ **Sistema de Títulos**\n`bt!titulos listar`\n`bt!titulos comprar <id>`\n`bt!titulos equipar <id>`\n`bt!titulos meus`');
        }
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}