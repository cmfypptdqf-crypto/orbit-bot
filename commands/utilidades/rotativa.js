// commands/economia/ofertasOrbitais.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

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

const ofertasOrbitais = [
    { id: 1, nome: '🔭 Telescópio Orbital', precoBase: 500, desconto: 0.3, tipo: 'item', itemId: '1' },
    { id: 2, nome: '🚀 Nave Explorer', precoBase: 800, desconto: 0.2, tipo: 'item', itemId: '2' },
    { id: 3, nome: '💍 Anel Cósmico', precoBase: 2000, desconto: 0.15, tipo: 'item', itemId: '3' },
    { id: 4, nome: '🍀 Amuleto Orbital', precoBase: 5000, desconto: 0.1, tipo: 'item', itemId: '11' },
    { id: 5, nome: '📦 Pacote Orbital (5x)', precoBase: 9000, desconto: 0.2, tipo: 'pacote', qtd: 5, itemId: '13' }
];

let ofertasAtuais = [...ofertasOrbitais];
let ultimaAtualizacao = Date.now();

function atualizarOfertas() {
    if (Date.now() - ultimaAtualizacao > 86400000) {
        ofertasAtuais = [...ofertasOrbitais.map(item => ({ ...item, preco: Math.floor(item.precoBase * (1 - item.desconto)) }))];
        ultimaAtualizacao = Date.now();
    }
}

module.exports = {
    name: 'ofertas',
    aliases: ['ofertasorbitais', 'lojarotativa', 'dailyoffer'],
    
    async executePrefix(message, args, client) {
        atualizarOfertas();
        
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, inventario: {} };
        }
        
        const xpGanho = 5;
        const resultadoXP = adicionarXP(userId, xpGanho, 'ofertas');
        
        if (subcmd === 'comprar') {
            const id = parseInt(args[1]);
            const oferta = ofertasAtuais.find(o => o.id === id);
            if (!oferta) return message.reply('❌ Oferta orbital não encontrada! Use `bt!ofertas` para ver as ofertas.');
            
            if ((db.usuarios[userId].carteira || 0) < oferta.preco) {
                return message.reply(`❌ Você precisa de ${oferta.preco.toLocaleString()} Orbs orbitais!`);
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
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🛒 Oferta Orbital Adquirida!')
                .setDescription(`✅ Você comprou **${oferta.nome}** por **${oferta.preco.toLocaleString()} Orbs**! (Desconto orbital de ${Math.round(oferta.desconto * 100)}%)`)
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 Ofertas Orbitais Diárias')
                .setDescription('Use `bt!ofertas comprar <id>` para adquirir!')
                .setFooter({ text: '🌌 Orbit • Ofertas são atualizadas diariamente!' })
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true });
            
            for (const oferta of ofertasAtuais) {
                embed.addFields({
                    name: `${oferta.id} - ${oferta.nome}`,
                    value: `💰 Preço: ~~${oferta.precoBase.toLocaleString()}~~ → **${oferta.preco.toLocaleString()} Orbs**\n🎯 Desconto: ${Math.round(oferta.desconto * 100)}%`,
                    inline: false
                });
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};