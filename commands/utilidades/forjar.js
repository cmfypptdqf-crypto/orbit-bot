// commands/rpg/forja.js
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

const melhorias = {
    '1': { nivel: 1, custo: 1000, chance: 0.50, bonus: 1.05 },
    '2': { nivel: 2, custo: 2000, chance: 0.40, bonus: 1.10 },
    '3': { nivel: 3, custo: 4000, chance: 0.30, bonus: 1.15 },
    '4': { nivel: 4, custo: 8000, chance: 0.20, bonus: 1.20 },
    '5': { nivel: 5, custo: 16000, chance: 0.10, bonus: 1.25 }
};

const itensForjaveis = {
    '1': { nome: '⚔️ Espada Cósmica', tipo: 'arma' },
    '2': { nome: '🛡️ Escudo Estelar', tipo: 'escudo' },
    '3': { nome: '💍 Anel do Dragão', tipo: 'acessorio' }
};

module.exports = {
    name: 'forja',
    aliases: ['forjar', 'upgradeitem'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, itensMelhorados: {} };
        }
        
        if (subcmd === 'lista') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔧 Itens Forjáveis')
                .setDescription('Use `bt!forja melhorar <item_id> <nivel>` para melhorar um item!');
            
            for (const [id, item] of Object.entries(itensForjaveis)) {
                const nivelAtual = db.usuarios[userId].itensMelhorados?.[id] || 0;
                const proximo = melhorias[nivelAtual + 1];
                embed.addFields({
                    name: `${id} - ${item.nome}`,
                    value: `📊 Nível atual: +${nivelAtual}\n💰 Próximo upgrade: ${proximo?.custo || 'Máximo'} Orbs | 🎯 Chance: ${proximo ? Math.round(proximo.chance * 100) : 0}%`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'melhorar') {
            const itemId = args[1];
            const nivelDesejado = parseInt(args[2]) || 1;
            
            if (!itemId || !itensForjaveis[itemId]) return message.reply('❌ Item inválido! Use `bt!forja lista`');
            
            const nivelAtual = db.usuarios[userId].itensMelhorados?.[itemId] || 0;
            const melhoria = melhorias[nivelDesejado];
            
            if (!melhoria) return message.reply('❌ Nível inválido! Máximo nível 5');
            if (nivelDesejado <= nivelAtual) return message.reply('❌ Este item já tem nível igual ou superior!');
            if ((db.usuarios[userId].carteira || 0) < melhoria.custo) return message.reply(`❌ Você precisa de ${melhoria.custo.toLocaleString()} Orbs!`);
            
            const sucesso = Math.random() < melhoria.chance;
            
            db.usuarios[userId].carteira -= melhoria.custo;
            
            if (sucesso) {
                if (!db.usuarios[userId].itensMelhorados) db.usuarios[userId].itensMelhorados = {};
                db.usuarios[userId].itensMelhorados[itemId] = nivelDesejado;
                saveDB(db);
                
                await message.reply(`✅ **${itensForjaveis[itemId].nome}** melhorado para +${nivelDesejado}!`);
            } else {
                saveDB(db);
                await message.reply(`❌ Falha ao melhorar **${itensForjaveis[itemId].nome}**! Você perdeu ${melhoria.custo.toLocaleString()} Orbs.`);
            }
        }
        
        else if (subcmd === 'info') {
            const itemId = args[1];
            if (!itemId || !itensForjaveis[itemId]) return message.reply('❌ Item inválido!');
            
            const nivelAtual = db.usuarios[userId].itensMelhorados?.[itemId] || 0;
            const bonus = nivelAtual > 0 ? melhorias[nivelAtual].bonus : 1.0;
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🔧 ${itensForjaveis[itemId].nome}`)
                .addFields(
                    { name: '📊 Nível', value: `+${nivelAtual}`, inline: true },
                    { name: '✨ Bônus Ativo', value: `+${Math.round((bonus - 1) * 100)}%`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🔧 **Sistema de Forja**\n`bt!forja lista` - Ver itens\n`bt!forja melhorar <id> <nivel>` - Melhorar item\n`bt!forja info <id>` - Info do item');
        }
    }
};