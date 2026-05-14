// commands/economia/background.js
const fs = require('fs');
const path = require('path');

const backgrounds = {
    '1': { nome: '🌌 Espaço Profundo', preco: 5000, url: 'https://i.imgur.com/7L7Bq0E.jpeg' },
    '2': { nome: '🪐 Anéis de Saturno', preco: 10000, url: 'https://i.imgur.com/DKzFJcX.jpeg' },
    '3': { nome: '💀 Nebulosa Vermelha', preco: 20000, url: 'https://i.imgur.com/Q4K7bJX.jpeg' },
    '4': { nome: '👽 Base Alienígena', preco: 50000, url: 'https://i.imgur.com/8YQqXzM.jpeg' }
};

module.exports = {
    name: 'background',
    description: 'Mude o fundo do seu perfil',
    aliases: ['bg', 'fundo'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎨 Fundos Disponíveis')
                .setDescription('Use `!background comprar <id>` para adquirir um fundo!');
            
            for (const [id, bg] of Object.entries(backgrounds)) {
                embed.addFields({
                    name: `${id} - ${bg.nome}`,
                    value: `💰 ${bg.preco} Orbs`,
                    inline: true
                });
            }
            
            return await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'comprar') {
            const id = args[1];
            const db = getDB();
            const userId = message.author.id;
            
            if (!backgrounds[id]) return message.reply('❌ ID inválido!');
            
            if ((db.usuarios[userId]?.carteira || 0) < backgrounds[id].preco) {
                return message.reply(`❌ Você precisa de ${backgrounds[id].preco} Orbs!`);
            }
            
            db.usuarios[userId].carteira -= backgrounds[id].preco;
            if (!db.usuarios[userId].backgrounds) db.usuarios[userId].backgrounds = [];
            db.usuarios[userId].backgrounds.push(id);
            
            saveDB(db);
            await message.reply(`✅ Fundo **${backgrounds[id].nome}** adquirido! Use \`!background equipar ${id}\` para ativar.`);
        }
    }
};