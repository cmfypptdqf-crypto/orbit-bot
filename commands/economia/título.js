// commands/economia/titulo.js
const { EmbedBuilder } = require('discord.js'); // ← ADICIONAR ESTA LINHA
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
        
        // Comando: listar
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏷️ Títulos Disponíveis')
                .setDescription('Use `!titulo comprar <id>` para adquirir um título!');
            
            for (const [id, titulo] of Object.entries(titulos)) {
                embed.addFields({
                    name: `${id} - ${titulo.nome}`,
                    value: `💰 ${titulo.preco.toLocaleString()} Orbs | 🎯 Nível ${titulo.nivelMin}+`,
                    inline: false
                });
            }
            
            embed.setFooter({ text: 'Você também pode usar !titulo meus para ver seus títulos' });
            
            return await message.reply({ embeds: [embed] });
        }
        
        // Comando: meus (mostrar títulos do usuário)
        if (subcmd === 'meus') {
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, titulos: [], tituloAtivo: null };
                saveDB(db);
            }
            
            const meusTitulos = db.usuarios[userId].titulos || [];
            const tituloAtivo = db.usuarios[userId].tituloAtivo;
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`🏷️ Títulos de ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL());
            
            if (meusTitulos.length === 0) {
                embed.setDescription('Você ainda não possui nenhum título! Use `!titulo listar` para ver os disponíveis.');
            } else {
                const listaTitulos = meusTitulos.map(id => {
                    const titulo = titulos[id];
                    const ativo = tituloAtivo === id ? ' ✅ ATIVO' : '';
                    return `**${titulo.nome}**${ativo}`;
                }).join('\n');
                
                embed.addFields({
                    name: '📜 Seus Títulos',
                    value: listaTitulos,
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: comprar
        if (subcmd === 'comprar') {
            const id = args[1];
            if (!id || !titulos[id]) return message.reply('❌ ID inválido! Use `!titulo listar`');
            
            const titulo = titulos[id];
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, titulos: [], tituloAtivo: null };
            }
            
            // Verificar nível (precisa de sistema de nível)
            const nivel = db.usuarios[userId].nivel || 1;
            if (nivel < titulo.nivelMin) {
                return message.reply(`❌ Você precisa ser nível ${titulo.nivelMin} para comprar este título! Seu nível atual é ${nivel}.`);
            }
            
            if ((db.usuarios[userId].carteira || 0) < titulo.preco) {
                return message.reply(`❌ Você precisa de ${titulo.preco.toLocaleString()} Orbs! Você tem ${db.usuarios[userId].carteira.toLocaleString()} Orbs.`);
            }
            
            if (db.usuarios[userId].titulos?.includes(id)) {
                return message.reply('❌ Você já possui este título!');
            }
            
            db.usuarios[userId].carteira -= titulo.preco;
            if (!db.usuarios[userId].titulos) db.usuarios[userId].titulos = [];
            db.usuarios[userId].titulos.push(id);
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Título Adquirido!')
                .setDescription(`Você adquiriu o título **${titulo.nome}**!`)
                .addFields(
                    { name: '💰 Custo', value: `${titulo.preco.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Saldo restante', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: 'Use !titulo equipar ' + id + ' para equipá-lo' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: equipar
        if (subcmd === 'equipar') {
            const id = args[1];
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, titulos: [], tituloAtivo: null };
            }
            
            if (!db.usuarios[userId]?.titulos?.includes(id)) {
                return message.reply('❌ Você não possui este título! Use `!titulo comprar` primeiro.');
            }
            
            db.usuarios[userId].tituloAtivo = id;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Título Equipado!')
                .setDescription(`Agora você está usando o título **${titulos[id].nome}**!`)
                .addFields(
                    { name: '🏷️ Título Ativo', value: titulos[id].nome, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: remover (remover título ativo)
        if (subcmd === 'remover') {
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.usuarios[userId]?.tituloAtivo) {
                return message.reply('❌ Você não tem nenhum título equipado!');
            }
            
            const tituloAntigo = titulos[db.usuarios[userId].tituloAtivo];
            db.usuarios[userId].tituloAtivo = null;
            saveDB(db);
            
            await message.reply(`✅ Você removeu o título **${tituloAntigo.nome}**!`);
        }
        
        // Comando padrão (ajuda)
        if (!subcmd) {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏷️ Sistema de Títulos')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `!titulo listar`', value: 'Mostra todos os títulos disponíveis para compra', inline: false },
                    { name: '👤 `!titulo meus`', value: 'Mostra seus títulos adquiridos', inline: false },
                    { name: '💰 `!titulo comprar <id>`', value: 'Compra um título (ex: `!titulo comprar 1`)', inline: false },
                    { name: '⚙️ `!titulo equipar <id>`', value: 'Equipa um título que você possui', inline: false },
                    { name: '❌ `!titulo remover`', value: 'Remove o título atualmente equipado', inline: false }
                )
                .setFooter({ text: 'Títulos aparecem no seu perfil!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};