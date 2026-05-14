// commands/economia/craft.js
const recipes = {
    '🚀 Nave Hiperespacial': {
        ingredientes: { '1': 2, '2': 1 }, // 2 telescópios + 1 nave
        resultado: { id: '14', nome: '🚀 Nave Hiperespacial', bonus: 2.0 },
        custo: 5000
    },
    '💎 Cristal Cósmico': {
        ingredientes: { '3': 3, '11': 1 }, // 3 anéis + 1 amuleto
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
                .setTitle('🔧 Receitas de Crafting');
            
            for (const [nome, recipe] of Object.entries(recipes)) {
                const ingredientes = Object.entries(recipe.ingredientes)
                    .map(([id, qtd]) => `Item ${id} x${qtd}`)
                    .join(', ');
                
                embed.addFields({
                    name: nome,
                    value: `📦 Ingredientes: ${ingredientes}\n💰 Custo: ${recipe.custo} Orbs\n✨ Resultado: ${recipe.resultado.nome}`,
                    inline: false
                });
            }
            
            return await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'fazer') {
            const nomeReceita = args.slice(1).join(' ');
            const recipe = recipes[nomeReceita];
            
            if (!recipe) return message.reply('❌ Receita não encontrada! Use `!craft receitas`');
            
            const db = getDB();
            const userId = message.author.id;
            const inventario = db.usuarios[userId]?.inventario || {};
            
            // Verificar ingredientes
            for (const [id, qtd] of Object.entries(recipe.ingredientes)) {
                if ((inventario[id] || 0) < qtd) {
                    return message.reply(`❌ Faltam ${qtd}x do item ${id}`);
                }
            }
            
            if ((db.usuarios[userId]?.carteira || 0) < recipe.custo) {
                return message.reply(`❌ Faltam ${recipe.custo} Orbs para craftar!`);
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
            
            saveDB(db);
            
            await message.reply(`✅ Você craftou **${recipe.resultado.nome}** com sucesso!`);
        }
    }
};