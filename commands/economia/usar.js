// commands/economia/usar.js
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

// Configuração dos itens consumíveis e seus efeitos
const itensConsumiveis = {
    '13': { 
        nome: '🎰 Caça-Níquel', 
        tipo: 'consumivel',
        descricao: 'Gire o caça-níquel para ganhar prêmios instantâneos',
        aoUsar: async (userId, db, client, message) => {
            const simbolos = ['🍒', '🍋', '🍊', '💎', '⭐', '7️⃣', '💰', '🪐'];
            const resultado = [
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)],
                simbolos[Math.floor(Math.random() * simbolos.length)]
            ];
            
            let premio = 0;
            let mensagem = '';
            
            if (resultado[0] === resultado[1] && resultado[1] === resultado[2]) {
                if (resultado[0] === '7️⃣') { premio = 10000; mensagem = '🎉🎉🎉 JACKPOT! Três 7️⃣!'; }
                else if (resultado[0] === '💰') { premio = 5000; mensagem = '💰💰💰 TESOURO! Três 💰!'; }
                else if (resultado[0] === '💎') { premio = 3000; mensagem = '💎💎💎 TRÊS DIAMANTES!'; }
                else { premio = 1000; mensagem = `🎰 Três ${resultado[0]}!`; }
            } else if (resultado[0] === resultado[1] || resultado[1] === resultado[2] || resultado[0] === resultado[2]) {
                premio = 200;
                mensagem = `🎰 Dois ${resultado[1]}!`;
            } else {
                premio = 0;
                mensagem = `😞 Nada dessa vez!`;
            }
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + premio;
            saveDB(db);
            
            return { 
                sucesso: true, 
                mensagem: `${mensagem}\n\`\`\`\n   ${resultado[0]} | ${resultado[1]} | ${resultado[2]}   \n\`\`\`\n💰 Você ganhou **${premio.toLocaleString()} Orbs**!` 
            };
        }
    },
    '11': { 
        nome: '🍀 Amuleto da Sorte', 
        tipo: 'consumivel',
        descricao: 'Dobra sua sorte por 1 hora (eventos positivos +100%)',
        aoUsar: async (userId, db, client, message) => {
            if (!db.usuarios[userId].boosts) db.usuarios[userId].boosts = {};
            db.usuarios[userId].boosts.sorte = { ativo: true, expira: Date.now() + 3600000, bonus: 2.0 };
            saveDB(db);
            return { sucesso: true, mensagem: '🍀 Amuleto ativado! Sua sorte está em dobro por 1 hora!' };
        }
    },
    '12': { 
        nome: '📈 Ação da Bolsa', 
        tipo: 'consumivel',
        descricao: '+50% em todos os ganhos por 30 minutos',
        aoUsar: async (userId, db, client, message) => {
            if (!db.usuarios[userId].boosts) db.usuarios[userId].boosts = {};
            db.usuarios[userId].boosts.ganhos = { ativo: true, expira: Date.now() + 1800000, bonus: 1.5 };
            saveDB(db);
            return { sucesso: true, mensagem: '📈 Ação ativada! +50% em todos ganhos por 30 minutos!' };
        }
    },
    '14': { 
        nome: '🚀 Nave Hiperespacial', 
        tipo: 'consumivel',
        descricao: 'Teletransporta você para o topo do ranking (ganha 10.000 Orbs instantâneos)',
        aoUsar: async (userId, db, client, message) => {
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + 10000;
            saveDB(db);
            return { sucesso: true, mensagem: '🚀 Nave Hiperespacial ativada! Você ganhou **10.000 Orbs** instantâneos!' };
        }
    },
    '15': { 
        nome: '💎 Cristal Cósmico', 
        tipo: 'consumivel',
        descricao: 'Revela um tesouro escondido (ganha 5.000 a 25.000 Orbs)',
        aoUsar: async (userId, db, client, message) => {
            const tesouro = Math.floor(Math.random() * (25000 - 5000 + 1) + 5000);
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + tesouro;
            saveDB(db);
            return { sucesso: true, mensagem: `💎 O Cristal Cósmico revelou um tesouro! Você ganhou **${tesouro.toLocaleString()} Orbs**!` };
        }
    }
};

// Itens de proteção (consumíveis com uso automático)
const itensProtecao = {
    '4': { 
        nome: '🛡️ Escudo Energético', 
        tipo: 'protecao',
        descricao: 'Protege contra 1 roubo (usado automaticamente)',
        aoUsar: async (userId, db, client, message) => {
            if (!db.usuarios[userId].protecao) db.usuarios[userId].protecao = 0;
            db.usuarios[userId].protecao += 1;
            saveDB(db);
            return { sucesso: true, mensagem: '🛡️ Escudo ativado! Você está protegido contra 1 ataque.' };
        }
    },
    '5': { 
        nome: '👻 Capa da Invisibilidade', 
        tipo: 'consumivel',
        descricao: 'Garante 100% de sucesso no próximo roubo',
        aoUsar: async (userId, db, client, message) => {
            if (!db.usuarios[userId].garantiaRoubo) db.usuarios[userId].garantiaRoubo = 0;
            db.usuarios[userId].garantiaRoubo += 1;
            saveDB(db);
            return { sucesso: true, mensagem: '👻 Capa ativada! Seu próximo roubo será garantido!' };
        }
    },
    '6': { 
        nome: '🚨 Alarme Anti-Roubo', 
        tipo: 'consumivel',
        descricao: 'Bloqueia 1 tentativa de roubo contra você',
        aoUsar: async (userId, db, client, message) => {
            if (!db.usuarios[userId].alarme) db.usuarios[userId].alarme = 0;
            db.usuarios[userId].alarme += 1;
            saveDB(db);
            return { sucesso: true, mensagem: '🚨 Alarme ativado! Você está protegido contra 1 tentativa de roubo.' };
        }
    }
};

// Combinar todos os itens
const todosItens = { ...itensConsumiveis, ...itensProtecao };

// Itens de bônus temporário
const itensBonus = {
    '7': { nome: '⭐ VIP Bronze', tipo: 'vip_temp', dias: 7, mult: 1.2 },
    '8': { nome: '⭐ VIP Prata', tipo: 'vip_temp', dias: 15, mult: 1.5 },
    '9': { nome: '⭐ VIP Ouro', tipo: 'vip_temp', dias: 30, mult: 2.0 },
    '10': { nome: '⭐ VIP Diamante', tipo: 'vip_temp', dias: 60, mult: 3.0 }
};

module.exports = {
    name: 'usar',
    aliases: ['use', 'consumir', 'ativar'],
    
    async executePrefix(message, args, client) {
        const itemId = args[0];
        
        if (!itemId) {
            return message.reply('❌ Use: `bt!usar <id_do_item>`\nExemplo: `bt!usar 13` (para usar um Caça-Níquel)\nUse `bt!mochila` para ver seus itens.');
        }
        
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const inventario = db.usuarios[userId].inventario || {};
        
        // Verificar se o item existe no inventário
        if (!inventario[itemId] || inventario[itemId] <= 0) {
            return message.reply(`❌ Você não possui o item de ID **${itemId}**!\nUse \`bt!mochila\` para ver seus itens.`);
        }
        
        // Verificar se é item VIP
        if (itensBonus[itemId]) {
            const vipItem = itensBonus[itemId];
            
            // Verificar se já tem VIP ativo
            if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
                return message.reply(`❌ Você já possui **Orbit Prime** ativo! Espere expirar para usar outro.`);
            }
            
            const agora = Date.now();
            const expira = agora + (vipItem.dias * 86400000);
            
            if (!db.vip_list) db.vip_list = {};
            db.vip_list[userId] = {
                tier: itemId === '7' ? 'bronze' : itemId === '8' ? 'prata' : itemId === '9' ? 'ouro' : 'diamante',
                expira: expira,
                multiplicador: vipItem.mult
            };
            
            // Remover do inventário
            inventario[itemId]--;
            if (inventario[itemId] <= 0) delete inventario[itemId];
            db.usuarios[userId].inventario = inventario;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Orbit Prime Ativado!')
                .setDescription(`✨ **${vipItem.nome}** utilizado com sucesso!`)
                .addFields(
                    { name: '🎯 Tier', value: vipItem.nome, inline: true },
                    { name: '✨ Multiplicador', value: `${vipItem.mult}x`, inline: true },
                    { name: '⏰ Duração', value: `${vipItem.dias} dias`, inline: true }
                )
                .setFooter({ text: 'Aproveite seus benefícios Orbit Prime!' });
            
            return await message.reply({ embeds: [embed] });
        }
        
        // Verificar se o item existe na configuração
        const item = todosItens[itemId];
        if (!item) {
            return message.reply(`❌ Item ID **${itemId}** não pode ser usado!\nItens que podem ser usados: 4, 5, 6, 11, 12, 13, 14, 15`);
        }
        
        // Usar o item e aplicar efeito
        const resultado = await item.aoUsar(userId, db, client, message);
        
        if (resultado.sucesso) {
            // Remover 1 unidade do inventário
            inventario[itemId]--;
            if (inventario[itemId] <= 0) delete inventario[itemId];
            db.usuarios[userId].inventario = inventario;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`📦 ${item.nome}`)
                .setDescription(resultado.mensagem)
                .addFields(
                    { name: '📊 Restante no inventário', value: `${inventario[itemId] || 0}x`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Item consumido com sucesso!' });
            
            await message.reply({ embeds: [embed] });
        } else {
            await message.reply(`❌ Falha ao usar ${item.nome}: ${resultado.mensagem}`);
        }
    }
};