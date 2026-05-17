// commands/rpg/passeOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

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
    10: { gratis: '📦 Caixa Orbital', pago: '📦 Caixa Rara Orbital' },
    15: { gratis: 1000, pago: 2000 },
    20: { gratis: '🔭 Telescópio', pago: '🚀 Nave Explorer' },
    25: { gratis: 2000, pago: 5000 },
    30: { gratis: '🎰 Caça-Níquel', pago: '⭐ Orbit Prime Bronze 7d' }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'passe',
    aliases: ['battlepass', 'seasonpass', 'passeorbital'],
    
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
        
        const xpGanho = 10;
        const resultadoXP = adicionarXP(userId, xpGanho, 'passe');
        
        if (subcmd === 'info') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🎫 Passe Orbital - Temporada 1`)
                .setDescription(`📊 Nível: **${nivelPasse}**\n📈 Progresso: ${progresso}% para próximo nível`)
                .addFields(
                    { name: '✨ Bônus Orbitais', value: db.usuarios[userId].passePremium ? '⭐ Passe Premium ATIVO\n🎁 Recompensas extras disponíveis!' : '❌ Passe Premium inativo\n💎 Compre com `bt!passe comprar`', inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            if (db.usuarios[userId].passePremium) return message.reply('❌ Você já possui o Passe Orbital Premium!');
            
            const preco = 50000;
            if ((db.usuarios[userId].carteira || 0) < preco) return message.reply(`❌ Você precisa de ${preco.toLocaleString()} Orbs orbitais!`);
            
            db.usuarios[userId].carteira -= preco;
            db.usuarios[userId].passePremium = true;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Passe Orbital Premium Adquirido!')
                .setDescription(`🎉 Agora você tem direito a recompensas extras orbitais!`)
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'recompensa') {
            const nivel = parseInt(args[1]);
            const recompensa = recompensasPasse[nivel];
            if (!recompensa) return message.reply('❌ Nível orbital inválido!');
            if (nivel > nivelPasse) return message.reply(`❌ Você ainda não atingiu o nível orbital ${nivel}!`);
            if (db.usuarios[userId].passeRecompensas?.includes(nivel)) return message.reply('❌ Você já coletou esta recompensa orbital!');
            
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
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎁 Recompensa Orbital Coletada!')
                .setDescription(`✅ Recompensa do nível orbital ${nivel} coletada!\n🎁 Você recebeu: ${recompensaRecebida}`)
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🎫 **Passe Orbital**\n`bt!passe info` - Ver status\n`bt!passe comprar` - Comprar Passe Premium (50.000 Orbs)\n`bt!passe recompensa <nivel>` - Coletar recompensa orbital');
        }
    }
};