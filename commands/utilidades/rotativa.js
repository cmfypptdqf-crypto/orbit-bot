// commands/rpg/lojarotativa.js
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

const lojaRotativa = [
    { id: 1, nome: '🔭 Telescópio Avançado', precoBase: 500, desconto: 0.3, tipo: 'item', itemId: '1' },
    { id: 2, nome: '🚀 Nave Explorer', precoBase: 800, desconto: 0.2, tipo: 'item', itemId: '2' },
    { id: 3, nome: '💍 Anel Cósmico', precoBase: 2000, desconto: 0.15, tipo: 'item', itemId: '3' },
    { id: 4, nome: '🍀 Amuleto da Sorte', precoBase: 5000, desconto: 0.1, tipo: 'item', itemId: '11' },
    { id: 5, nome: '📦 Pacote de 5 Caixas', precoBase: 9000, desconto: 0.2, tipo: 'pacote', qtd: 5, itemId: '13' }
];

let lojaAtual = [...lojaRotativa];
let ultimaAtualizacao = Date.now();

function atualizarLoja() {
    if (Date.now() - ultimaAtualizacao > 86400000) { // 24 horas
        lojaAtual = [...lojaRotativa.map(item => ({ ...item, preco: Math.floor(item.precoBase * (1 - item.desconto)) }))];
        ultimaAtualizacao = Date.now();
    }
}

module.exports = {
    name: 'lojarotativa',
    aliases: ['lojarot', 'dailyoffer'],
    
    async executePrefix(message, args, client) {
        atualizarLoja();
        
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, inventario: {} };
        }
        
        if (subcmd === 'comprar') {
            const id = parseInt(args[1]);
            const oferta = lojaAtual.find(o => o.id === id);
            if (!oferta) return message.reply('❌ Oferta não encontrada! Use `bt!lojarotativa` para ver as ofertas.');
            
            if ((db.usuarios[userId].carteira || 0) < oferta.preco) {
                return message.reply(`❌ Você precisa de ${oferta.preco.toLocaleString()} Orbs!`);
            }
            
            db.usuarios[userId].carteira -= oferta.preco;
            
            if (oferta.tipo === 'pacote') {
                for (let i = 0; i < oferta.qtd; i++) {
                    if (!db.usuarios[userId].inventario[oferta.itemId]) db.usuarios[userId].inventario[oferta.itemId] = 0;
                    db.usuarios[userId].inventario[oferta.itemId]++;
                }
            } else {
                if (!db.usuarios[userId].inventario[oferta.itemId]) db.usuarios[userId].inventario[oferta.itemId] = 0;
                db.usuarios[userId].inventario[oferta.itemId] += oferta.tipo === 'pacote' ? oferta.qtd : 1;
            }
            
            saveDB(db);
            
            await message.reply(`✅ Você comprou **${oferta.nome}** por **${oferta.preco.toLocaleString()} Orbs**! (Desconto de ${Math.round(oferta.desconto * 100)}%)`);
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 Ofertas Diárias')
                .setDescription('Use `bt!lojarotativa comprar <id>` para adquirir!')
                .setFooter({ text: 'Ofertas são atualizadas diariamente!' });
            
            for (const oferta of lojaAtual) {
                embed.addFields({
                    name: `${oferta.id} - ${oferta.nome}`,
                    value: `💰 Preço: ~~${oferta.precoBase.toLocaleString()}~~ → **${oferta.preco.toLocaleString()} Orbs**\n🎯 Desconto: ${Math.round(oferta.desconto * 100)}%`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
    }
};