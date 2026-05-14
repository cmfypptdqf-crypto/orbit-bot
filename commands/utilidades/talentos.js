// commands/rpg/talentos.js
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

const talentos = {
    '1': { nome: '💪 Força Bruta', desc: '+10% dano em ataques', custo: 5, nivelMin: 10, bonus: { ataque: 1.1 } },
    '2': { nome: '⚡ Velocidade', desc: '+10% chance de ataque duplo', custo: 5, nivelMin: 10, bonus: { velocidade: 1.1 } },
    '3': { nome: '🛡️ Escudo Mental', desc: '-10% dano recebido', custo: 5, nivelMin: 15, bonus: { defesa: 0.9 } },
    '4': { nome: '🍀 Sorte Divina', desc: '+15% chance de eventos positivos', custo: 10, nivelMin: 20, bonus: { sorte: 1.15 } },
    '5': { nome: '👑 Liderança', desc: '+5% bônus para o clã', custo: 10, nivelMin: 25, bonus: { lideranca: 1.05 } }
};

module.exports = {
    name: 'talentos',
    aliases: ['talento', 'pericias'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { talentos: [], pontosTalento: 0, xpTotal: 0 };
        }
        
        const level = calcularNivel(db.usuarios[userId].xpTotal || 0);
        const pontos = db.usuarios[userId].pontosTalento || Math.floor(level / 5);
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Talentos Disponíveis')
                .setDescription(`🎯 Pontos de Talento: ${pontos}\nUse \`bt!talentos aprender <id>\` para aprender`);
            
            for (const [id, tal] of Object.entries(talentos)) {
                const liberado = level >= tal.nivelMin;
                embed.addFields({
                    name: tal.nome,
                    value: `📝 ${tal.desc}\n💰 Custo: ${tal.custo} pontos | 🎯 Nível ${tal.nivelMin}+${liberado ? ' ✅' : ' 🔒'}`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'aprender') {
            const id = args[1];
            if (!id || !talentos[id]) return message.reply('❌ Talento inválido!');
            
            const tal = talentos[id];
            if (level < tal.nivelMin) return message.reply(`❌ Você precisa ser nível ${tal.nivelMin}!`);
            if (pontos < tal.custo) return message.reply(`❌ Você precisa de ${tal.custo} pontos de talento!`);
            if (db.usuarios[userId].talentos?.includes(id)) return message.reply('❌ Você já possui este talento!');
            
            db.usuarios[userId].pontosTalento = pontos - tal.custo;
            if (!db.usuarios[userId].talentos) db.usuarios[userId].talentos = [];
            db.usuarios[userId].talentos.push(id);
            saveDB(db);
            
            await message.reply(`✅ Você aprendeu o talento **${tal.nome}**!`);
        }
        
        else if (subcmd === 'meus') {
            const meusTalentos = (db.usuarios[userId].talentos || []).map(id => talentos[id].nome).join('\n');
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`⭐ Talentos de ${message.author.username}`)
                .setDescription(meusTalentos || 'Nenhum talento aprendido ainda.')
                .addFields({ name: '🎯 Pontos Restantes', value: `${pontos}`, inline: true });
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Sistema de Talentos**\n`bt!talentos listar` - Ver talentos\n`bt!talentos aprender <id>` - Aprender\n`bt!talentos meus` - Seus talentos');
        }
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}