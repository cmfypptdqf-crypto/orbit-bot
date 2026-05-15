// commands/economia/craft.js
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

const receitas = {
    'Nave Hiperespacial': { ingredientes: { '1': 2, '2': 1 }, resultado: { id: '14', nome: '🚀 Nave Hiperespacial' }, custo: 5000, descricao: 'Uma nave extremamente rápida capaz de viajar entre galáxias.' },
    'Cristal Cósmico': { ingredientes: { '3': 3, '11': 1 }, resultado: { id: '15', nome: '💎 Cristal Cósmico' }, custo: 10000, descricao: 'Um cristal de energia pura que amplifica seus ganhos.' }
};

const nomesItens = { '1': '🔭 Telescópio', '2': '🚀 Nave Explorer', '3': '💍 Anel Cósmico', '11': '🍀 Amuleto da Sorte' };

module.exports = {
    name: 'craft',
    aliases: ['fabricar'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'receitas') {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🔧 Sistema de Crafting')
                .setDescription('Fabrique itens poderosos na **Galaxy Store**!');
            
            for (const [nome, recipe] of Object.entries(receitas)) {
                const ingredientes = Object.entries(recipe.ingredientes).map(([id, qtd]) => `${nomesItens[id]} x${qtd}`).join(', ');
                embed.addFields({ name: `✨ ${recipe.resultado.nome}`, value: `📦 Ingredientes: ${ingredientes}\n💰 Custo: ${recipe.custo.toLocaleString()} Orbs\n📝 ${recipe.descricao}`, inline: false });
            }
            embed.setFooter({ text: 'Use bt!craft fazer <nome> para fabricar' });
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'fazer') {
            const nome = args.slice(1).join(' ');
            const recipe = Object.values(receitas).find(r => r.resultado.nome.toLowerCase().includes(nome.toLowerCase()));
            if (!recipe) return message.reply('<:emoji_47:1504081397373997076> Receita não encontrada! Use `bt!craft receitas`');
            
            const db = getDB();
            const userId = message.author.id;
            const inventario = db.usuarios[userId]?.inventario || {};
            
            for (const [id, qtd] of Object.entries(recipe.ingredientes)) {
                if ((inventario[id] || 0) < qtd) return message.reply(`<:emoji_47:1504081397373997076> Faltam ${qtd}x de ${nomesItens[id]}!`);
            }
            if ((db.usuarios[userId]?.carteira || 0) < recipe.custo) return message.reply(`<:emoji_47:1504081397373997076> Faltam ${recipe.custo.toLocaleString()} Orbs!`);
            
            for (const [id, qtd] of Object.entries(recipe.ingredientes)) {
                inventario[id] -= qtd;
                if (inventario[id] <= 0) delete inventario[id];
            }
            db.usuarios[userId].carteira -= recipe.custo;
            if (!inventario[recipe.resultado.id]) inventario[recipe.resultado.id] = 0;
            inventario[recipe.resultado.id]++;
            db.usuarios[userId].inventario = inventario;
            saveDB(db);
            
            await message.reply(`✅ Você craftou **${recipe.resultado.nome}** com sucesso! O item foi adicionado à sua mochila.`);
        }
        
        else {
            await message.reply('🔧 **Crafting**\n`bt!craft receitas` - Ver todas as receitas\n`bt!craft fazer <nome>` - Fabricar um item');
        }
    }
};