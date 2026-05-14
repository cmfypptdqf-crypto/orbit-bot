// commands/economia/craft.js
const { EmbedBuilder } = require('discord.js'); // ← ADICIONAR
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

const recipes = {
    'Nave Hiperespacial': {  // ← REMOVI O EMOJI do nome da receita
        ingredientes: { '1': 2, '2': 1 },
        resultado: { id: '14', nome: '🚀 Nave Hiperespacial', bonus: 2.0 },
        custo: 5000
    },
    'Cristal Cósmico': {  // ← REMOVI O EMOJI do nome da receita
        ingredientes: { '3': 3, '11': 1 },
        resultado: { id: '15', nome: '💎 Cristal Cósmico', bonus: 3.0 },
        custo: 10000
    }
};

module.exports = {
    name: 'craft',
    description: 'Fabrique itens poderosos',
    aliases: ['fabricar'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'receitas') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔧 Receitas de Crafting')
                .setDescription('Use `bt!craft fazer <nome>` para fabricar um item');
            
            for (const [nome, recipe] of Object.entries(recipes)) {
                const ingredientes = Object.entries(recipe.ingredientes)
                    .map(([id, qtd]) => {
                        const nomesItens = {
                            '1': '🔭 Telescópio',
                            '2': '🚀 Nave Explorer',
                            '3': '💍 Anel Cósmico',
                            '11': '🍀 Amuleto da Sorte'
                        };
                        return `${nomesItens[id] || `Item ${id}`} x${qtd}`;
                    })
                    .join(', ');
                
                embed.addFields({
                    name: `✨ ${recipe.resultado.nome}`,
                    value: `📦 Ingredientes: ${ingredientes}\n💰 Custo: ${recipe.custo.toLocaleString()} Orbs`,
                    inline: false
                });
            }
            
            return await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'fazer') {
            const nomeReceita = args.slice(1).join(' ');
            
            // Buscar receita (case insensitive)
            const recipeKey = Object.keys(recipes).find(key => 
                key.toLowerCase() === nomeReceita.toLowerCase()
            );
            
            const recipe = recipes[recipeKey];
            
            if (!recipe) {
                return message.reply('❌ Receita não encontrada! Use `bt!craft receitas` para ver as receitas disponíveis.');
            }
            
            const db = getDB();
            const userId = message.author.id;
            
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            const inventario = db.usuarios[userId].inventario || {};
            
            // Verificar ingredientes
            for (const [id, qtd] of Object.entries(recipe.ingredientes)) {
                if ((inventario[id] || 0) < qtd) {
                    const nomesItens = {
                        '1': '🔭 Telescópio',
                        '2': '🚀 Nave Explorer',
                        '3': '💍 Anel Cósmico',
                        '11': '🍀 Amuleto da Sorte'
                    };
                    return message.reply(`❌ Faltam ${qtd}x do item ${nomesItens[id] || `ID ${id}`}`);
                }
            }
            
            if ((db.usuarios[userId].carteira || 0) < recipe.custo) {
                return message.reply(`❌ Faltam ${recipe.custo.toLocaleString()} Orbs para craftar!`);
            }
            
            // Consumir ingredientes
            for (const [id, qtd] of Object.entries(recipe.ingredientes)) {
                inventario[id] -= qtd;
                if (inventario[id] <= 0) delete inventario[id];
            }
            
            db.usuarios[userId].carteira -= recipe.custo;
            
            // Adicionar item craftado
            if (!inventario[recipe.resultado.id]) inventario[recipe.resultado.id] = 0;
            inventario[recipe.resultado.id]++;
            
            db.usuarios[userId].inventario = inventario;
            saveDB(db);
            
            // Mensagem de sucesso
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Craft realizado com sucesso!')
                .setDescription(`Você craftou **${recipe.resultado.nome}**!`)
                .addFields(
                    { name: '✨ Bônus', value: `${recipe.resultado.bonus}x em atividades`, inline: true },
                    { name: '💰 Custo', value: `${recipe.custo.toLocaleString()} Orbs`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        if (!subcmd) {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔧 Sistema de Crafting')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '📋 `bt!craft receitas`', value: 'Mostra todas as receitas disponíveis', inline: false },
                    { name: '⚙️ `bt!craft fazer <nome>`', value: 'Fabricar um item (ex: `bt!craft fazer Nave Hiperespacial`)', inline: false }
                );
            
            await message.reply({ embeds: [embed] });
        }
    }
};