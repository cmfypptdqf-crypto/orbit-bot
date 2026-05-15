// commands/rpg/passe.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, passe: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const recompensasPasse = {
    5: { gratis: 500, pago: 1000 },
    10: { gratis: '📦 Caixa Comum', pado: '📦 Caixa Rara' },
    15: { gratis: 1000, pado: 2000 },
    20: { gratis: '🔭 Telescópio', pado: '🚀 Nave Explorer' },
    25: { gratis: 2000, pado: 5000 },
    30: { gratis: '🎰 Caça-Níquel', pado: '⭐ VIP Bronze 7d' }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'passe',
    aliases: ['battlepass', 'seasonpass'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0, passeNivel: 1, passeXP: 0, passePremium: false, passeRecompensas: [] };
        }
        
        const nivelPasse = db.usuarios[userId].passeNivel || 1;
        const xpPasse = db.usuarios[userId].passeXP || 0;
        const xpNecessario = nivelPasse * 100;
        const progresso = Math.min(99, Math.floor((xpPasse / xpNecessario) * 100));
        
        if (subcmd === 'info') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🎫 Passe de Batalha - Temporada 1`)
                .setDescription(`📊 Nível: **${nivelPasse}**\n📈 Progresso: ${progresso}% para próximo nível`)
                .addFields({
                    name: '✨ Bônus Ativos',
                    value: db.usuarios[userId].passePremium ? '⭐ Passe Premium ATIVO\n🎁 Recompensas extras disponíveis!' : '❌ Passe Premium inativo\n💎 Compre com `bt!passe comprar`',
                    inline: false
                });
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            if (db.usuarios[userId].passePremium) return message.reply('❌ Você já possui o Passe Premium!');
            
            const preco = 50000;
            if ((db.usuarios[userId].carteira || 0) < preco) return message.reply(`❌ Você precisa de ${preco.toLocaleString()} Orbs!`);
            
            db.usuarios[userId].carteira -= preco;
            db.usuarios[userId].passePremium = true;
            saveDB(db);
            
            await message.reply(`✅ Passe Premium adquirido! Agora você tem direito a recompensas extras!`);
        }
        
        else if (subcmd === 'recompensa') {
            const nivel = parseInt(args[1]);
            const recompensa = recompensasPasse[nivel];
            if (!recompensa) return message.reply('❌ Nível inválido!');
            if (nivel > nivelPasse) return message.reply(`❌ Você ainda não atingiu o nível ${nivel}!`);
            if (db.usuarios[userId].passeRecompensas?.includes(nivel)) return message.reply('❌ Você já coletou esta recompensa!');
            
            let recompensaRecebida = recompensa.gratis;
            if (db.usuarios[userId].passePremium) {
                recompensaRecebida = `${recompensa.gratis} + ${recompensa.pago}`;
                if (typeof recompensa.pago === 'number') {
                    db.usuarios[userId].carteira += recompensa.pago;
                }
            }
            
            if (typeof recompensa.gratis === 'number') {
                db.usuarios[userId].carteira += recompensa.gratis;
            }
            
            if (!db.usuarios[userId].passeRecompensas) db.usuarios[userId].passeRecompensas = [];
            db.usuarios[userId].passeRecompensas.push(nivel);
            saveDB(db);
            
            await message.reply(`✅ Recompensa do nível ${nivel} coletada!\n🎁 Você recebeu: ${recompensaRecebida}`);
        }
        
        else {
            await message.reply('🎫 **Passe de Batalha**\n`bt!passe info` - Ver status\n`bt!passe comprar` - Comprar Passe Premium (50.000 Orbs)\n`bt!passe recompensa <nivel>` - Coletar recompensa');
        }
    }
};