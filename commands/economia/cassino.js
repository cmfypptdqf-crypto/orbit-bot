// commands/economia/nebulosaCassino.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { adicionarXP, calcularXPporGanho } = require('../utilidades/xpSystem.js');

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

function getBoostMultiplier(userId, db) {
    let multiplier = 1.0;
    if (db.usuarios[userId]?.boosts?.ganhos && db.usuarios[userId].boosts.ganhos.expira > Date.now()) {
        multiplier *= db.usuarios[userId].boosts.ganhos.bonus;
    }
    return multiplier;
}

const casinoCooldowns = new Map();

function checkCasinoCooldown(userId) {
    const lastUse = casinoCooldowns.get(userId);
    if (!lastUse) return { available: true, remaining: 0 };
    const cooldownTime = 5 * 60 * 60 * 1000;
    const elapsed = Date.now() - lastUse;
    if (elapsed >= cooldownTime) {
        casinoCooldowns.delete(userId);
        return { available: true, remaining: 0 };
    }
    const remaining = cooldownTime - elapsed;
    const horas = Math.ceil(remaining / 3600000);
    return { available: false, remaining, formatted: `${horas} hora(s)` };
}

function setCasinoCooldown(userId) {
    casinoCooldowns.set(userId, Date.now());
}

module.exports = {
    name: 'nebulosa',
    aliases: ['cassino', 'roleta', 'caçaniquel', 'crate', 'cassinoorbital'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        
        const cooldownCheck = checkCasinoCooldown(userId);
        if (!cooldownCheck.available) {
            return message.reply(`⏰ **Nebulosa Cassino** em recarga orbital! Aguarde **${cooldownCheck.formatted}** para jogar novamente!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, xpTotal: 0 };
        
        if (subcmd === 'roleta') {
            const amount = parseInt(args[1]);
            const cor = args[2]?.toLowerCase();
            if (isNaN(amount) || amount <= 0) return message.reply('❌ Aposte um valor orbital!');
            if (!['vermelho', 'preto', 'verde'].includes(cor)) return message.reply('❌ Escolha uma cor orbital: vermelho, preto ou verde');
            if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('❌ Saldo orbital insuficiente!');
            
            const roleta = [...Array(18).fill('vermelho'), ...Array(18).fill('preto'), 'verde'];
            const resultado = roleta[Math.floor(Math.random() * roleta.length)];
            const multiplicador = cor === 'verde' ? 14 : 2;
            const ganhou = cor === resultado;
            
            if (ganhou) {
                let ganho = amount * multiplicador;
                const bonusInfo = calcularBonusTotal(userId, 'carteira');
                const boostMultiplier = getBoostMultiplier(userId, db);
                ganho = Math.floor(ganho * bonusInfo.bonus * boostMultiplier);
                
                db.usuarios[userId].carteira += ganho;
                const xpGanho = calcularXPporGanho(ganho);
                const resultadoXP = adicionarXP(userId, xpGanho, 'nebulosa_roleta');
                
                saveDB(db);
                setCasinoCooldown(userId);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00BFFF)
                    .setTitle('🎡 Nebulosa Roleta')
                    .setDescription(`🎲 A roleta orbital caiu em **${resultado}**! 🌟 **VOCÊ GANHOU!**`)
                    .addFields(
                        { name: '💰 Aposta Orbital', value: `${amount.toLocaleString()} Orbs`, inline: true },
                        { name: '🎯 Multiplicador', value: `${multiplicador}x`, inline: true },
                        { name: '✨ Bônus Orbitais', value: bonusInfo.texto, inline: true },
                        { name: '📈 Boost Orbital', value: boostMultiplier > 1 ? `+${Math.round((boostMultiplier - 1) * 100)}%` : 'Nenhum', inline: true },
                        { name: '🎁 Ganho Orbital', value: `+${ganho.toLocaleString()} Orbs`, inline: true },
                        { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                        { name: '💎 Saldo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                    )
                    .setFooter({ text: '🌌 Nebulosa Cassino • Próxima jogada em 5 horas' });
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                await message.reply({ embeds: [embed] });
            } else {
                db.usuarios[userId].carteira -= amount;
                saveDB(db);
                setCasinoCooldown(userId);
                
                await message.reply(`🎡 **Nebulosa Roleta** caiu em **${resultado}**!\n😞 Você perdeu ${amount.toLocaleString()} Orbs orbitais!`);
            }
        }
        
        else if (subcmd === 'crate') {
            const amount = 2000;
            if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('❌ Saldo orbital insuficiente para abrir uma **Nebula Crate**!');
            
            const premios = [
                { nome: '🔭 Telescópio Orbital', qtd: 1, valor: 500, raridade: 'Comum' },
                { nome: '🚀 Nave Explorer', qtd: 1, valor: 800, raridade: 'Comum' },
                { nome: '💍 Anel Cósmico', qtd: 1, valor: 2000, raridade: 'Raro' },
                { nome: '5000 Orbs', qtd: 5000, valor: 5000, raridade: 'Épico', isMoney: true },
                { nome: '10000 Orbs', qtd: 10000, valor: 10000, raridade: 'Lendário', isMoney: true }
            ];
            
            const premio = premios[Math.floor(Math.random() * premios.length)];
            db.usuarios[userId].carteira -= amount;
            
            let mensagem = '';
            if (premio.isMoney) {
                db.usuarios[userId].carteira += premio.qtd;
                mensagem = `📦 **Nebula Crate** aberta!\n✨ Parabéns! Você encontrou **${premio.qtd.toLocaleString()} Orbs**!`;
            } else {
                if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
                const itemId = { '🔭 Telescópio Orbital': '1', '🚀 Nave Explorer': '2', '💍 Anel Cósmico': '3' }[premio.nome] || '1';
                db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + premio.qtd;
                mensagem = `📦 **Nebula Crate** aberta!\n✨ Parabéns! Você encontrou **${premio.nome}**!`;
            }
            
            const xpGanho = calcularXPporGanho(premio.valor || premio.qtd);
            const resultadoXP = adicionarXP(userId, xpGanho, 'nebulosa_crate');
            
            saveDB(db);
            setCasinoCooldown(userId);
            
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('📦 Nebula Crate')
                .setDescription(mensagem)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                    { name: '💎 Raridade Orbital', value: premio.raridade, inline: true },
                    { name: '💎 Saldo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🎰 Próxima Nebula Crate disponível em 5 horas!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('🎰 Nebulosa Cassino - Sistema Orbital')
                .setDescription('🌟 **Jogos orbitais disponíveis** (cooldown de 5 horas entre jogadas)')
                .addFields(
                    { name: '🎡 `bt!nebulosa roleta <valor> <cor>`', value: 'Jogue na Roleta Orbital\n🟥 vermelho (2x) | ⚫ preto (2x) | 🟢 verde (14x)', inline: false },
                    { name: '📦 `bt!nebulosa crate`', value: 'Abra uma Nebula Crate (2.000 Orbs)\n🎁 Ganhe itens ou Orbs orbitais!', inline: false },
                    { name: '⏰ Cooldown Orbital', value: '⏱️ **5 horas** entre cada jogada (roleta ou crate)', inline: false }
                )
                .setFooter({ text: '🌌 Nebulosa Cassino • Jogue com responsabilidade orbital!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};