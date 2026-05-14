// commands/economia/titulo.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularNivel } = require('../utilidades/levelSystem.js');

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

// Lista de títulos disponíveis
const titulos = {
    '1': { nome: '🌱 Recruta Estelar', preco: 1000, nivelMin: 1, descricao: 'Inicie sua jornada espacial' },
    '2': { nome: '⚔️ Guerreiro Cósmico', preco: 5000, nivelMin: 10, descricao: 'Prove seu valor em batalhas' },
    '3': { nome: '👑 Lorde das Estrelas', preco: 10000, nivelMin: 25, descricao: 'Domine os sistemas estelares' },
    '4': { nome: '🐉 Dragão Galáctico', preco: 50000, nivelMin: 50, descricao: 'Temido por toda galáxia' },
    '5': { nome: '✨ Divindade Espacial', preco: 100000, nivelMin: 100, descricao: 'Um deus entre os mortais' }
};

module.exports = {
    name: 'titulo',
    description: 'Sistema de Títulos',
    aliases: ['title', 'título'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        let db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, titulos: [], tituloAtivo: null };
            saveDB(db);
        }
        
        const totalOrbs = (db.usuarios[userId].carteira || 0) + (db.usuarios[userId].banco || 0);
        const nivelUsuario = calcularNivel(totalOrbs);
        
        // ========== COMANDO: LISTAR ==========
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🏷️ Títulos Disponíveis')
                .setDescription('Use `bt!titulo comprar <id>` para adquirir um título!\nUse `bt!titulo equipar <id>` para equipar.')
                .setFooter({ text: `Seu nível atual: ${nivelUsuario}` });
            
            for (const [id, titulo] of Object.entries(titulos)) {
                const liberado = nivelUsuario >= titulo.nivelMin;
                const possui = db.usuarios[userId].titulos?.includes(id);
                let status = '';
                
                if (possui) status = '✅ ADQUIRIDO';
                else if (liberado) status = '🟢 DISPONÍVEL';
                else status = `🔒 NÍVEL ${titulo.nivelMin}+`;
                
                embed.addFields({
                    name: `${id} - ${titulo.nome}`,
                    value: `💰 ${titulo.preco.toLocaleString()} Orbs | 🎯 Nível ${titulo.nivelMin}\n📝 ${titulo.descricao}\n${status}`,
                    inline: false
                });
            }
            
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: COMPRAR ==========
        if (subcmd === 'comprar') {
            const id = args[1];
            if (!id || !titulos[id]) return message.reply('❌ ID inválido! Use `bt!titulo listar`');
            
            const titulo = titulos[id];
            
            // Verificar nível
            if (nivelUsuario < titulo.nivelMin) {
                return message.reply(`❌ Você precisa ser nível ${titulo.nivelMin} para comprar este título! Seu nível atual é ${nivelUsuario}.`);
            }
            
            // Verificar dinheiro
            if ((db.usuarios[userId].carteira || 0) < titulo.preco) {
                return message.reply(`❌ Você precisa de ${titulo.preco.toLocaleString()} Orbs! Você tem ${db.usuarios[userId].carteira.toLocaleString()} Orbs.`);
            }
            
            // Verificar se já possui
            if (db.usuarios[userId].titulos?.includes(id)) {
                return message.reply('❌ Você já possui este título!');
            }
            
            // Realizar compra
            db.usuarios[userId].carteira -= titulo.preco;
            if (!db.usuarios[userId].titulos) db.usuarios[userId].titulos = [];
            db.usuarios[userId].titulos.push(id);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Título Adquirido!')
                .setDescription(`🎉 Parabéns! Você adquiriu o título **${titulo.nome}**!`)
                .addFields(
                    { name: '💰 Custo', value: `${titulo.preco.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Saldo restante', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                    { name: '📝 Descrição', value: titulo.descricao, inline: false }
                )
                .setFooter({ text: 'Use bt!titulo equipar ' + id + ' para equipá-lo' });
            
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: MEUS ==========
        if (subcmd === 'meus') {
            const meusTitulos = db.usuarios[userId].titulos || [];
            const tituloAtivo = db.usuarios[userId].tituloAtivo;
            
            if (meusTitulos.length === 0) {
                return message.reply('📭 Você ainda não possui nenhum título! Use `bt!titulo listar` para ver os disponíveis.');
            }
            
            const listaTitulos = meusTitulos.map(id => {
                const t = titulos[id];
                const ativo = tituloAtivo === id ? ' ✅ **ATIVO**' : '';
                return `**${t.nome}**${ativo}`;
            }).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`🏷️ Títulos de ${message.author.username}`)
                .setThumbnail(message.author.displayAvatarURL())
                .addFields(
                    { name: '📜 Seus Títulos', value: listaTitulos, inline: false },
                    { name: '💡 Dica', value: 'Use `bt!titulo equipar <id>` para equipar um título\nUse `bt!titulo remover` para remover o título atual', inline: false }
                );
            
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: EQUIPAR ==========
        if (subcmd === 'equipar') {
            const id = args[1];
            if (!id) return message.reply('❌ Use: `bt!titulo equipar <id>`');
            
            if (!db.usuarios[userId].titulos?.includes(id)) {
                return message.reply('❌ Você não possui este título! Use `bt!titulo comprar` primeiro.');
            }
            
            db.usuarios[userId].tituloAtivo = id;
            saveDB(db);
            
            const titulo = titulos[id];
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Título Equipado!')
                .setDescription(`🎭 Agora você está usando o título **${titulo.nome}**!`)
                .addFields(
                    { name: '📝 Descrição', value: titulo.descricao, inline: false }
                );
            
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: REMOVER ==========
        if (subcmd === 'remover') {
            if (!db.usuarios[userId].tituloAtivo) {
                return message.reply('❌ Você não tem nenhum título equipado!');
            }
            
            const tituloAntigo = titulos[db.usuarios[userId].tituloAtivo];
            db.usuarios[userId].tituloAtivo = null;
            saveDB(db);
            
            return await message.reply(`✅ Você removeu o título **${tituloAntigo.nome}**!`);
        }
        
        // ========== COMANDO: INFO (ver título equipado) ==========
        if (subcmd === 'info') {
            const tituloAtivo = db.usuarios[userId].tituloAtivo;
            
            if (!tituloAtivo) {
                return message.reply('📭 Você não tem nenhum título equipado! Use `bt!titulo equipar <id>` para equipar um.');
            }
            
            const titulo = titulos[tituloAtivo];
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🏷️ Título Atual de ${message.author.username}`)
                .setDescription(`🎭 **${titulo.nome}**`)
                .addFields(
                    { name: '📝 Descrição', value: titulo.descricao, inline: false },
                    { name: '📊 Nível Necessário', value: `${titulo.nivelMin}`, inline: true },
                    { name: '💰 Preço Original', value: `${titulo.preco.toLocaleString()} Orbs`, inline: true }
                );
            
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO: AJUDA (padrão) ==========
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏷️ Sistema de Títulos')
            .setDescription('Comandos disponíveis:')
            .addFields(
                { name: '📋 `bt!titulo listar`', value: 'Mostra todos os títulos disponíveis', inline: false },
                { name: '👤 `bt!titulo meus`', value: 'Mostra seus títulos adquiridos', inline: false },
                { name: '💰 `bt!titulo comprar <id>`', value: 'Compra um título (ex: `bt!titulo comprar 1`)', inline: false },
                { name: '⚙️ `bt!titulo equipar <id>`', value: 'Equipa um título que você possui', inline: false },
                { name: '❌ `bt!titulo remover`', value: 'Remove o título atualmente equipado', inline: false },
                { name: 'ℹ️ `bt!titulo info`', value: 'Mostra informações do seu título atual', inline: false }
            )
            .setFooter({ text: `📊 Seu nível atual: ${nivelUsuario} • Títulos ajudam a personalizar seu perfil!` });
        
        await message.reply({ embeds: [embed] });
    }
};