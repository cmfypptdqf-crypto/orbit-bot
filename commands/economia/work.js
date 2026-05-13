const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'trabalharglobal',
    aliases: ['workglobal', 'trabglobal'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `work_global_${userId}`;
        const lastWork = cooldowns.get(cooldownKey);
        
        // Cooldown global de 2 horas (para evitar spam em vários servidores)
        if (lastWork && Date.now() - lastWork < 7200000) {
            const remaining = Math.ceil((7200000 - (Date.now() - lastWork)) / 60000);
            return message.reply(`⏰ Você já trabalhou globalmente! Volte em **${remaining} minutos**.`);
        }
        
        const trabalhos = [
            { nome: '💻 Programador Global', ganho: [100, 300] },
            { nome: '🌍 Empreendedor', ganho: [150, 400] },
            { nome: '✈️ Viajante', ganho: [80, 250] },
            { nome: '📊 Consultor', ganho: [120, 350] },
            { nome: '🎓 Professor Global', ganho: [90, 280] }
        ];
        
        const trabalho = trabalhos[Math.floor(Math.random() * trabalhos.length)];
        const ganho = Math.floor(Math.random() * (trabalho.ganho[1] - trabalho.ganho[0] + 1) + trabalho.ganho[0]);
        
        // Adicionar ao servidor atual
        const db = getDB();
        const guildId = message.guild.id;
        const walletKey = `carteira_${userId}_${guildId}`;
        
        db[walletKey] = (db[walletKey] || 0) + ganho;
        saveDB(db);
        
        cooldowns.set(cooldownKey, Date.now());
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🌍 Trabalho  realizado!')
            .setDescription(`Você trabalhou como **${trabalho.nome}** e ganhou **${ganho} moedas**!`)
            .addFields(
                { name: '💰 Adicionado no servidor', value: message.guild.name, inline: true },
                { name: '💰 Novo saldo local', value: `${db[walletKey]} moedas`, inline: true }
            )
            .setFooter({ text: 'Cooldown global: 2 horas' });
        
        await message.reply({ embeds: [embed] });
    }
};