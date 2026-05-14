// commands/economia/titulo.js
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const titulos = {
    '1': { nome: '🌱 Recruta Estelar', preco: 1000, nivelMin: 0 },
    '2': { nome: '⚔️ Guerreiro Cósmico', preco: 5000, nivelMin: 10 },
    '3': { nome: '👑 Lorde das Estrelas', preco: 10000, nivelMin: 25 },
    '4': { nome: '🐉 Dragão Galáctico', preco: 50000, nivelMin: 50 },
    '5': { nome: '✨ Divindade Espacial', preco: 100000, nivelMin: 100 }
};

module.exports = {
    name: 'titulo',
    description: 'Escolha um título para seu perfil',
    aliases: ['title', 'título'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏷️ Títulos Disponíveis')
                .setDescription('Use `!titulo comprar <id>` para adquirir um título!');
            
            for (const [id, titulo] of Object.entries(titulos)) {
                embed.addFields({
                    name: `${id} - ${titulo.nome}`,
                    value: `💰 ${titulo.preco} Orbs | 🎯 Nível ${titulo.nivelMin}+`,
                    inline: false
                });
            }
            
            return await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'comprar') {
            const id = args[1];
            if (!id || !titulos[id]) return message.reply('❌ ID inválido! Use `!titulo listar`');
            
            const titulo = titulos[id];
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, titulos: [], tituloAtivo: null };
            
            if ((db.usuarios[userId].carteira || 0) < titulo.preco) {
                return message.reply(`❌ Você precisa de ${titulo.preco} Orbs!`);
            }
            
            if (db.usuarios[userId].titulos?.includes(id)) {
                return message.reply('❌ Você já possui este título!');
            }
            
            db.usuarios[userId].carteira -= titulo.preco;
            if (!db.usuarios[userId].titulos) db.usuarios[userId].titulos = [];
            db.usuarios[userId].titulos.push(id);
            
            saveDB(db);
            
            await message.reply(`✅ Você adquiriu o título **${titulo.nome}**! Use \`!titulo equipar ${id}\` para usá-lo.`);
        }
        
        if (subcmd === 'equipar') {
            const id = args[1];
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.usuarios[userId]?.titulos?.includes(id)) {
                return message.reply('❌ Você não possui este título!');
            }
            
            db.usuarios[userId].tituloAtivo = id;
            saveDB(db);
            
            await message.reply(`✅ Agora você está usando o título **${titulos[id].nome}**!`);
        }
    }
};