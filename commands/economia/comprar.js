// commands/economia/comprar.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomFrase } = require('../utilidades/orbitAI.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Lista de itens da loja (MESMA do mercadogalactico.js)
const itensLoja = {
    // Itens normais
    '1': { nome: '🔭 Telescópio Avançado', preco: 500, tipo: 'search', bonus: 1.05, raridade: 'Comum' },
    '2': { nome: '🚀 Nave Explorer', preco: 800, tipo: 'missao', bonus: 1.10, raridade: 'Comum' },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, tipo: 'all', bonus: 1.15, raridade: 'Raro' },
    '4': { nome: '🛡️ Escudo Energético', preco: 1500, tipo: 'protecao', duracao: 1, raridade: 'Raro' },
    '5': { nome: '👻 Capa da Invisibilidade', preco: 3000, tipo: 'pirataria', bonus: 1.20, raridade: 'Épico' },
    '6': { nome: '🚨 Alarme Anti-Roubo', preco: 1000, tipo: 'alarme', bonus: 0.7, raridade: 'Raro' },
    
    // Itens VIP
    '7': { nome: '⭐ VIP Bronze', preco: 10000, tipo: 'vip', tier: 'bronze', mult: 1.2, dias: 7, raridade: 'Especial' },
    '8': { nome: '⭐ VIP Prata', preco: 25000, tipo: 'vip', tier: 'prata', mult: 1.5, dias: 15, raridade: 'Especial' },
    '9': { nome: '⭐ VIP Ouro', preco: 50000, tipo: 'vip', tier: 'ouro', mult: 2.0, dias: 30, raridade: 'Especial' },
    '10': { nome: '⭐ VIP Diamante', preco: 100000, tipo: 'vip', tier: 'diamante', mult: 3.0, dias: 60, raridade: 'Especial' },
    
    // Itens de evento
    '11': { nome: '🍀 Amuleto da Sorte', preco: 5000, tipo: 'sorte', bonus: 2, raridade: 'Épico' },
    '12': { nome: '📈 Ação da Bolsa', preco: 3000, tipo: 'boost', usos: 5, bonus: 1.5, raridade: 'Raro' },
    '13': { nome: '🎰 Caça-Níquel', preco: 2000, tipo: 'slot', raridade: 'Comum' },
    '14': { nome: '🚀 Nave Hiperespacial', preco: 50000, tipo: 'colecionavel', raridade: 'Lendário' },
    '15': { nome: '💎 Cristal Cósmico', preco: 100000, tipo: 'colecionavel', raridade: 'Lendário' }
};

module.exports = {
    name: 'comprar',
    aliases: ['buy', 'adquirir', 'compraritem'],
    
    async executePrefix(message, args, client) {
        const itemId = args[0];
        const quantidade = parseInt(args[1]) || 1;
        
        // ========== VALIDAÇÕES ==========
        if (!itemId) {
            return message.reply('❌ Use: `bt!comprar <id> [quantidade]`\nExemplo: `bt!comprar 1`\nUse `bt!mercadogalactico` para ver os itens disponíveis.');
        }
        
        if (!itensLoja[itemId]) {
            const idsDisponiveis = Object.keys(itensLoja).join(', ');
            return message.reply(`❌ ID inválido! IDs disponíveis: ${idsDisponiveis}\nUse \`bt!mercadogalactico\` para ver os itens.`);
        }
        
        if (quantidade < 1) {
            return message.reply('❌ Quantidade inválida! Digite um número positivo.');
        }
        
        const item = itensLoja[itemId];
        const precoTotal = item.preco * quantidade;
        
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        
        // ========== VERIFICAR DINHEIRO ==========
        if (carteira < precoTotal) {
            const falta = precoTotal - carteira;
            return message.reply(`❌ Você precisa de **${precoTotal.toLocaleString()} Orbs** para comprar ${quantidade}x ${item.nome}!\n💸 Faltam **${falta.toLocaleString()} Orbs**.\n💰 Seu saldo: ${carteira.toLocaleString()} Orbs`);
        }
        
        // ========== PROCESSAR COMPRA ==========
        db.usuarios[userId].carteira = carteira - precoTotal;
        
        // ========== ITENS VIP (ATIVAÇÃO ESPECIAL) ==========
        if (item.tipo === 'vip') {
            const agora = Date.now();
            const expira = agora + (item.dias * 86400000);
            
            if (!db.vip_list) db.vip_list = {};
            
            // Verificar se já tem VIP ativo
            if (db.vip_list[userId] && db.vip_list[userId].expira > agora) {
                const tempoRestante = Math.ceil((db.vip_list[userId].expira - agora) / 86400000);
                return message.reply(`❌ Você já possui VIP ativo! Expira em ${tempoRestante} dias.\nUse primeiro o VIP atual antes de comprar outro.`);
            }
            
            db.vip_list[userId] = {
                tier: item.tier,
                expira: expira,
                multiplicador: item.mult
            };
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ VIP Ativado!')
                .setDescription(`🎉 Parabéns! Agora você é **VIP ${item.tier.toUpperCase()}** por ${item.dias} dias!`)
                .addFields(
                    { name: '✨ Multiplicador', value: `${item.mult}x em todos ganhos`, inline: true },
                    { name: '⏰ Expira em', value: `<t:${Math.floor(expira / 1000)}:R>`, inline: true },
                    { name: '💰 Saldo restante', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Aproveite seus benefícios VIP!' });
            
            saveDB(db);
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== ITENS NORMAIS (ADICIONAR AO INVENTÁRIO) ==========
        if (!db.usuarios[userId].inventario) {
            db.usuarios[userId].inventario = {};
        }
        
        db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + quantidade;
        saveDB(db);
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        // ========== MENSAGEM DE SUCESSO ==========
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`✅ ${fraseSucesso}`)
            .setDescription(`📦 Você adquiriu **${quantidade}x ${item.nome}**!`)
            .addFields(
                { name: '💰 Preço pago', value: `${precoTotal.toLocaleString()} Orbs`, inline: true },
                { name: '💵 Saldo restante', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                { name: '🎒 Item no inventário', value: `${db.usuarios[userId].inventario[itemId]}x ${item.nome}`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Use bt!mochila para ver seus itens' })
            .setTimestamp();
        
        // Adicionar informação de raridade
        const raridadeIcon = {
            'Comum': '⚪', 'Raro': '🔵', 'Épico': '🟣', 'Lendário': '🟠', 'Especial': '⭐'
        }[item.raridade] || '⬜';
        
        embed.addFields({ name: '🏷️ Raridade', value: `${raridadeIcon} ${item.raridade}`, inline: true });
        
        await message.reply({ embeds: [embed] });
    }
};