// commands/economia/cassino.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
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

// Cooldowns específicos para o cassino (5 horas)
const casinoCooldowns = new Map();

function checkCasinoCooldown(userId) {
    const lastUse = casinoCooldowns.get(userId);
    if (!lastUse) return { available: true, remaining: 0 };
    
    const cooldownTime = 5 * 60 * 60 * 1000; // 5 horas em milissegundos
    const elapsed = Date.now() - lastUse;
    
    if (elapsed >= cooldownTime) {
        casinoCooldowns.delete(userId);
        return { available: true, remaining: 0 };
    }
    
    const remaining = cooldownTime - elapsed;
    const horas = Math.ceil(remaining / 3600000);
    const minutos = Math.ceil(remaining / 60000);
    
    let formatted = '';
    if (horas >= 1) {
        formatted = `${horas} hora(s)`;
    } else {
        formatted = `${minutos} minutos`;
    }
    
    return { available: false, remaining, formatted };
}

function setCasinoCooldown(userId) {
    casinoCooldowns.set(userId, Date.now());
}

// Função para verificar boosts ativos
function getBoostMultiplier(userId, db) {
    let multiplier = 1.0;
    if (db.usuarios[userId]?.boosts?.ganhos && db.usuarios[userId].boosts.ganhos.expira > Date.now()) {
        multiplier *= db.usuarios[userId].boosts.ganhos.bonus;
    }
    return multiplier;
}

// Função para ganhar XP aleatório entre 50 e 300
function ganharXPaleatorio() {
    return Math.floor(Math.random() * (300 - 50 + 1) + 50);
}

module.exports = {
    name: 'cassino',
    aliases: ['roleta', 'caçaniquel', 'crate'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        
        // ========== VERIFICAR COOLDOWN GERAL DO CASSINO (5 HORAS) ==========
        const cooldownCheck = checkCasinoCooldown(userId);
        if (!cooldownCheck.available) {
            return message.reply(`⏰ **Cassino em recarga!** Aguarde mais **${cooldownCheck.formatted}** para jogar novamente.`);
        }
        
        if (subcmd === 'abrir') {
            const amount = parseInt(args[1]) || 2000;
            if (isNaN(amount) || amount < 2000) return message.reply('<:emoji_47:1504081397373997076> Uma **Nebula Crate** custa 2.000 Orbs! Use `bt!crate abrir`');
            
            const db = getDB();
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, xpTotal: 0 };
            if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('<:emoji_47:1504081397373997076> Saldo insuficiente para abrir uma **Nebula Crate**!');
            
            const premios = [
                { nome: '🔭 Telescópio Avançado', qtd: 1, valor: 500, raridade: 'Comum' },
                { nome: '🚀 Nave Explorer', qtd: 1, valor: 800, raridade: 'Comum' },
                { nome: '💍 Anel Cósmico', qtd: 1, valor: 2000, raridade: 'Raro' },
                { nome: '🛡️ Escudo Energético', qtd: 1, valor: 1500, raridade: 'Raro' },
                { nome: '🍀 Amuleto da Sorte', qtd: 1, valor: 5000, raridade: 'Épico' },
                { nome: '⭐ Orbit Prime Bronze', qtd: 1, valor: 10000, raridade: 'Especial' },
                { nome: '5000 Orbs', qtd: 5000, valor: 5000, raridade: 'Épico', isMoney: true },
                { nome: '10000 Orbs', qtd: 10000, valor: 10000, raridade: 'Lendário', isMoney: true }
            ];
            
            // Aplicar boost de sorte (Amuleto da Sorte)
            const hasSorteBoost = db.usuarios[userId]?.boosts?.sorte && db.usuarios[userId].boosts.sorte.expira > Date.now();
            let premio;
            
            if (hasSorteBoost) {
                // Com boost, chances melhores
                const sortePremios = [
                    ...premios.filter(p => p.raridade === 'Raro' || p.raridade === 'Épico' || p.raridade === 'Lendário'),
                    ...premios
                ];
                premio = sortePremios[Math.floor(Math.random() * sortePremios.length)];
            } else {
                premio = premios[Math.floor(Math.random() * premios.length)];
            }
            
            db.usuarios[userId].carteira -= amount;
            
            let mensagem = '';
            let xpGanho = ganharXPaleatorio(); // XP aleatório entre 50-300
            
            if (premio.isMoney) {
                db.usuarios[userId].carteira += premio.qtd;
                mensagem = `📦 **Nebula Crate** aberta!\n✨ Parabéns! Você encontrou **${premio.qtd.toLocaleString()} Orbs**!`;
            } else {
                if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
                const itemId = { '🔭 Telescópio Avançado': '1', '🚀 Nave Explorer': '2', '💍 Anel Cósmico': '3', '🛡️ Escudo Energético': '4', '🍀 Amuleto da Sorte': '11', '⭐ Orbit Prime Bronze': '7' }[premio.nome] || '1';
                db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + premio.qtd;
                mensagem = `📦 **Nebula Crate** aberta!\n✨ Parabéns! Você encontrou **${premio.nome}**!`;
            }
            
            // Adicionar XP (sempre ganha, nunca perde)
            const resultadoXP = adicionarXP(userId, xpGanho, 'cassino_crate');
            
            saveDB(db);
            setCasinoCooldown(userId);
            
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('📦 Nebula Crate')
                .setDescription(mensagem)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                    { name: '💎 Raridade', value: premio.raridade, inline: true },
                    { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🎰 Próxima caixa disponível em 5 horas!' });
            
            if (hasSorteBoost) {
                embed.addFields({ name: '🍀 Amuleto da Sorte', value: 'Ativo! Suas chances foram melhoradas!', inline: false });
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'roleta') {
            const amount = parseInt(args[1]);
            const cor = args[2]?.toLowerCase();
            if (isNaN(amount) || amount <= 0) return message.reply('<:emoji_47:1504081397373997076> Aposte um valor!');
            if (!['vermelho', 'preto', 'verde'].includes(cor)) return message.reply('<:emoji_47:1504081397373997076> Escolha: vermelho, preto ou verde');
            
            const db = getDB();
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, xpTotal: 0 };
            if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('<:emoji_47:1504081397373997076> Saldo insuficiente!');
            
            // Aplicar boost de sorte
            const hasSorteBoost = db.usuarios[userId]?.boosts?.sorte && db.usuarios[userId].boosts.sorte.expira > Date.now();
            
            // Roleta: 18 vermelho, 18 preto, 1 verde (total 37)
            const roleta = [
                ...Array(18).fill('vermelho'),
                ...Array(18).fill('preto'),
                'verde'
            ];
            
            const resultado = roleta[Math.floor(Math.random() * roleta.length)];
            let multiplicador = cor === 'verde' ? 14 : 2;
            
            // Se tiver boost de sorte e escolheu vermelho/preto, chance ligeiramente maior
            let ganhou = cor === resultado;
            if (hasSorteBoost && (cor === 'vermelho' || cor === 'preto') && !ganhou) {
                // Segunda chance com boost
                const segundaChance = Math.random() < 0.3;
                if (segundaChance) {
                    ganhou = true;
                    multiplicador = 1.5;
                }
            }
            
            // Aplicar boost de ganhos
            const boostMultiplier = getBoostMultiplier(userId, db);
            
            // XP aleatório entre 50 e 300 (sempre ganha)
            const xpGanho = ganharXPaleatorio();
            
            if (ganhou) {
                let ganho = amount * multiplicador;
                ganho = Math.floor(ganho * boostMultiplier);
                
                db.usuarios[userId].carteira += ganho;
                
                // Adicionar XP (sempre ganha, nunca perde)
                const resultadoXP = adicionarXP(userId, xpGanho, 'cassino_roleta');
                
                saveDB(db);
                setCasinoCooldown(userId);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🎡 Roleta Galáctica')
                    .setDescription(`🎲 A roleta caiu em **${resultado}**!\n🎉 **VOCÊ GANHOU!**`)
                    .addFields(
                        { name: '💰 Valor Apostado', value: `${amount.toLocaleString()} Orbs`, inline: true },
                        { name: '🎯 Multiplicador', value: `${multiplicador}x`, inline: true },
                        { name: '🎁 Ganho', value: `+${ganho.toLocaleString()} Orbs`, inline: true },
                        { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                        { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                    )
                    .setFooter({ text: '🎰 Próxima jogada disponível em 5 horas!' });
                
                if (boostMultiplier > 1) {
                    embed.addFields({ name: '📈 Boost Ativo', value: `+${Math.round((boostMultiplier - 1) * 100)}%`, inline: true });
                }
                
                if (hasSorteBoost) {
                    embed.addFields({ name: '🍀 Amuleto da Sorte', value: 'Ativo! Sua sorte foi renovada!', inline: false });
                }
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
            } else {
                db.usuarios[userId].carteira -= amount;
                
                // NÃO perde XP! Apenas ganha XP normal (50-300)
                const resultadoXP = adicionarXP(userId, xpGanho, 'cassino_roleta_perdeu');
                
                saveDB(db);
                setCasinoCooldown(userId);
                
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🎡 Roleta Galáctica')
                    .setDescription(`🎲 A roleta caiu em **${resultado}**!\n😞 **VOCÊ PERDEU!**`)
                    .addFields(
                        { name: '💰 Valor Apostado', value: `${amount.toLocaleString()} Orbs`, inline: true },
                        { name: '💸 Perda', value: `-${amount.toLocaleString()} Orbs`, inline: true },
                        { name: '⭐ Stellar XP', value: `+${xpGanho} XP (participação)`, inline: true },
                        { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                    )
                    .setFooter({ text: '🎰 Próxima jogada disponível em 5 horas!' });
                
                if (hasSorteBoost) {
                    embed.addFields({ name: '🍀 Amuleto da Sorte', value: 'Ativo, mas a sorte não estava ao seu favor desta vez...', inline: false });
                }
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
            }
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('📦 Nebula Crate - Sistema de Cassino')
                .setDescription('🎰 **Jogos disponíveis** (cooldown de 5 horas entre jogadas)')
                .addFields(
                    { name: '📦 `bt!crate abrir`', value: 'Abre uma Nebula Crate (2.000 Orbs)\n🎁 Ganhe itens ou Orbs!', inline: false },
                    { name: '🎡 `bt!crate roleta <valor> <cor>`', value: 'Jogue na Roleta Galáctica\n🟥 vermelho (2x) | ⚫ preto (2x) | 🟢 verde (14x)', inline: false },
                    { name: '⏰ Cooldown', value: '⏱️ **5 horas** entre cada jogada (caixa ou roleta)', inline: false },
                    { name: '✨ Boosts', value: '🍀 Amuleto da Sorte: melhores chances\n📈 Ação da Bolsa: +50% nos ganhos', inline: false },
                    { name: '⭐ XP', value: '🎯 Sempre ganha entre **50 a 300 XP** por jogada!', inline: false }
                )
                .setFooter({ text: '🎰 Nebula Crate • Jogue com responsabilidade!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};