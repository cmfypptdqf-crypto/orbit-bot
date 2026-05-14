const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'search',
    aliases: ['procurar', 'buscar', 'explorar', 'sondar'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `search_${userId}`;
        const lastSearch = cooldowns.get(cooldownKey);
        
        if (lastSearch && Date.now() - lastSearch < 600000) {
            const remaining = Math.ceil((600000 - (Date.now() - lastSearch)) / 60000);
            return message.reply(`⏰ Seu scanner ainda está recarregando! Volte em **${remaining} minutos**.`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        // Locais com possibilidade de perda
        const locais = [
            { nome: '🗑️ Lixo Espacial', ganho: [100, 400}, perda: [50, 150], chancePerda: 0.2, cor: 0x808080 },
            { nome: '🚀 Nave Abandonada', ganho: [500, 1800], perda: [200, 600], chancePerda: 0.15, cor: 0x9B59B6 },
            { nome: '🕳️ Crateras de Marte', ganho: [200, 600], perda: [100, 300], chancePerda: 0.25, cor: 0xE67E22 },
            { nome: '💥 Estação Destruída', ganho: [300, 1200], perda: [150, 500], chancePerda: 0.3, cor: 0xFF0000 },
            { nome: '🪐 Anéis de Saturno', ganho: [400, 1500], perda: [180, 450], chancePerda: 0.1, cor: 0xF1C40F },
            { nome: '🌑 Base Lunar', ganho: [250, 800], perda: [120, 350], chancePerda: 0.2, cor: 0x3498DB },
            { nome: '☄️ Asteroide Rico', ganho: [600, 2000], perda: [300, 800], chancePerda: 0.35, cor: 0x00FF00 },
            { nome: '🛸 Disco Voador', ganho: [800, 2500], perda: [400, 1000], chancePerda: 0.25, cor: 0x8E44AD },
            { nome: '🌊 Oceanos de Europa', ganho: [150, 500], perda: [80, 200], chancePerda: 0.15, cor: 0x1ABC9C },
            { nome: '🏛️ Ruínas Alienígenas', ganho: [1000, 3000], perda: [500, 1500], chancePerda: 0.4, cor: 0xFFD700 }
        ];
        
        const local = locais[Math.floor(Math.random() * locais.length)];
        
        // Decidir se vai ganhar ou perder
        const deuRuim = Math.random() < local.chancePerda;
        
        let embed;
        
        if (deuRuim) {
            const perda = Math.floor(Math.random() * (local.perda[1] - local.perda[0] + 1) + local.perda[0]);
            const perdaReal = Math.min(perda, db.usuarios[userId].carteira || 0);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - perdaReal;
            saveDB(db);
            
            const perigoEventos = [
                'Uma explosão danificou seu equipamento!',
                'Piratas espaciais te emboscaram!',
                'A nave estava armadilhada!',
                'Radiação cósmica danificou seus Orbs!',
                'Um buraco negro quase te sugou!',
                'Inimigos alienígenas te atacaram!'
            ];
            
            const perigo = perigoEventos[Math.floor(Math.random() * perigoEventos.length)];
            
            embed = new EmbedBuilder()
                .setColor(local.cor)
                .setTitle('⚠️ Exploração Perigosa')
                .setDescription(`📡 Sondando: **${local.nome}**\n${perigo}`)
                .addFields(
                    { name: '💸 Você perdeu', value: `**-${perdaReal.toLocaleString()} Orbs**`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
        } else {
            const ganho = Math.floor(Math.random() * (local.ganho[1] - local.ganho[0] + 1) + local.ganho[0]);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
            saveDB(db);
            
            const sucessoEventos = [
                'Você encontrou uma cápsula cheia de Orbs!',
                'Restos de uma civilização avançada!',
                'O baú do tesouro estava escondido aqui!',
                'Orbs raros flutuando no vácuo!',
                'Tecnologia alienígena convertida em Orbs!'
            ];
            
            const sucesso = sucessoEventos[Math.floor(Math.random() * sucessoEventos.length)];
            
            embed = new EmbedBuilder()
                .setColor(local.cor)
                .setTitle('🔍 Exploração Espacial')
                .setDescription(`📡 Sondando: **${local.nome}**\n${sucesso}`)
                .addFields(
                    { name: '💎 Você encontrou', value: `**+${ganho.toLocaleString()} Orbs**`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
        }
        
        cooldowns.set(cooldownKey, Date.now());
        
        embed.setFooter({ text: 'Próxima exploração disponível em 10 minutos' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};