// commands/economia/titulo.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel } = require('../utilidades/levelSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
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
    name: 'titulo',
    aliases: ['title', 'título'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, titulos: [], tituloAtivo: null, xpTotal: 0 };
        }
        
        const nivelUsuario = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏷️ Títulos Disponíveis')
                .setDescription('Use `bt!titulo comprar <id>` para adquirir um título!');
            
            for (const [id, titulo] of Object.entries(titulos)) {
                const liberado = nivelUsuario >= titulo.nivelMin;
                embed.addFields({
                    name: `${id} - ${titulo.nome}`,
                    value: `💰 ${titulo.preco.toLocaleString()} Orbs | ${liberado ? '🟢 Disponível' : `🔒 Stellar XP Nível ${titulo.nivelMin}+`}`,
                    inline: false
                });
            }
            return await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'comprar') {
            const id = args[1];
            if (!id || !titulos[id]) return message.reply('❌ ID inválido!');
            
            const titulo = titulos[id];
            if (nivelUsuario < titulo.nivelMin) {
                return message.reply(`❌ Você precisa ser Stellar XP nível ${titulo.nivelMin}!`);
            }
            if ((db.usuarios[userId].carteira || 0) < titulo.preco) {
                return message.reply(`❌ Você precisa de ${titulo.preco.toLocaleString()} Orbs!`);
            }
            if (db.usuarios[userId].titulos?.includes(id)) {
                return message.reply('❌ Você já possui este título!');
            }
            
            db.usuarios[userId].carteira -= titulo.preco;
            if (!db.usuarios[userId].titulos) db.usuarios[userId].titulos = [];
            db.usuarios[userId].titulos.push(id);
            saveDB(db);
            
            await message.reply(`✅ Você adquiriu o título **${titulo.nome}**! Use \`bt!titulo equipar ${id}\` para usá-lo.`);
        }
        
        if (subcmd === 'meus') {
            const meusTitulos = db.usuarios[userId].titulos || [];
            const tituloAtivo = db.usuarios[userId].tituloAtivo;
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`🏷️ Títulos de ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL());
            
            if (meusTitulos.length === 0) {
                embed.setDescription('Você ainda não possui nenhum título!');
            } else {
                const lista = meusTitulos.map(id => {
                    const t = titulos[id];
                    return `**${t.nome}**${tituloAtivo === id ? ' ✅ ATIVO' : ''}`;
                }).join('\n');
                embed.addFields({ name: '📜 Seus Títulos', value: lista, inline: false });
            }
            await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'equipar') {
            const id = args[1];
            if (!db.usuarios[userId]?.titulos?.includes(id)) {
                return message.reply('❌ Você não possui este título!');
            }
            db.usuarios[userId].tituloAtivo = id;
            saveDB(db);
            await message.reply(`✅ Agora você está usando o título **${titulos[id].nome}**!`);
        }
        
        if (!subcmd) {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏷️ Sistema de Títulos')
                .setDescription('Comandos: `listar`, `meus`, `comprar <id>`, `equipar <id>`');
            await message.reply({ embeds: [embed] });
        }
    }
};