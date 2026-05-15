// commands/rpg/missaodiaria.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../utilidades/xpSystem.js');

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

const missoesDiarias = [
    { id: 1, nome: '🎯 Completar 3 missões', alvo: 3, tipo: 'missoes', recompensa: 500 },
    { id: 2, nome: '☄️ Roubar 2 jogadores', alvo: 2, tipo: 'roubos', recompensa: 300 },
    { id: 3, nome: '🎁 Fazer 1 doação', alvo: 1, tipo: 'doacoes', recompensa: 200 },
    { id: 4, nome: '📆 Completar daily', alvo: 1, tipo: 'daily', recompensa: 400 },
    { id: 5, nome: '💰 Acumular 5000 Orbs', alvo: 5000, tipo: 'orbs', recompensa: 1000 }
];

const missoesSemanais = [
    { id: 1, nome: '🎯 Completar 20 missões', alvo: 20, tipo: 'missoes', recompensa: 5000 },
    { id: 2, nome: '💰 Acumular 50000 Orbs', alvo: 50000, tipo: 'orbs', recompensa: 10000 },
    { id: 3, nome: '📈 Subir 5 níveis', alvo: 5, tipo: 'niveis', recompensa: 7500 },
    { id: 4, nome: '☄️ Fazer 10 roubos', alvo: 10, tipo: 'roubos', recompensa: 5000 }
];

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'missaodiaria',
    aliases: ['dailyquest', 'diaria'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = {
                carteira: 0, xpTotal: 0, total_missoes: 0,
                missoesDiarias: {}, missoesSemanais: {},
                ultimoResetDiario: 0, ultimoResetSemanal: 0
            };
        }
        
        const now = Date.now();
        
        // Reset diário (24h)
        if (!db.usuarios[userId].ultimoResetDiario || now - db.usuarios[userId].ultimoResetDiario > 86400000) {
            db.usuarios[userId].missoesDiarias = {};
            db.usuarios[userId].ultimoResetDiario = now;
        }
        
        // Reset semanal (7d)
        if (!db.usuarios[userId].ultimoResetSemanal || now - db.usuarios[userId].ultimoResetSemanal > 604800000) {
            db.usuarios[userId].missoesSemanais = {};
            db.usuarios[userId].ultimoResetSemanal = now;
        }
        
        const userData = db.usuarios[userId];
        
        if (subcmd === 'diaria') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('📅 Missões Diárias')
                .setDescription('Complete as missões para ganhar recompensas!');
            
            for (const missao of missoesDiarias) {
                const progresso = userData.missoesDiarias?.[missao.id] || 0;
                const completo = progresso >= missao.alvo;
                embed.addFields({
                    name: `${completo ? '✅' : '📌'} ${missao.nome}`,
                    value: `📊 Progresso: ${progresso}/${missao.alvo} | 💰 Recompensa: ${missao.recompensa} Orbs`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'semanal') {
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('📅 Missões Semanais')
                .setDescription('Complete as missões para ganhar recompensas!');
            
            for (const missao of missoesSemanais) {
                const progresso = userData.missoesSemanais?.[missao.id] || 0;
                const completo = progresso >= missao.alvo;
                embed.addFields({
                    name: `${completo ? '✅' : '📌'} ${missao.nome}`,
                    value: `📊 Progresso: ${progresso}/${missao.alvo} | 💰 Recompensa: ${missao.recompensa} Orbs`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'recompensa') {
            const tipo = args[1]?.toLowerCase();
            const missaoId = parseInt(args[2]);
            
            if (tipo === 'diaria') {
                const missao = missoesDiarias.find(m => m.id === missaoId);
                if (!missao) return message.reply('❌ Missão não encontrada!');
                
                const progresso = userData.missoesDiarias?.[missaoId] || 0;
                if (progresso < missao.alvo) return message.reply('❌ Você ainda não completou esta missão!');
                if (userData.missoesDiariasColetadas?.includes(missaoId)) return message.reply('❌ Você já coletou esta recompensa!');
                
                userData.carteira += missao.recompensa;
                if (!userData.missoesDiariasColetadas) userData.missoesDiariasColetadas = [];
                userData.missoesDiariasColetadas.push(missaoId);
                saveDB(db);
                
                await message.reply(`✅ Você recebeu **${missao.recompensa} Orbs** pela missão diária **${missao.nome}**!`);
            }
            
            else if (tipo === 'semanal') {
                const missao = missoesSemanais.find(m => m.id === missaoId);
                if (!missao) return message.reply('❌ Missão não encontrada!');
                
                const progresso = userData.missoesSemanais?.[missaoId] || 0;
                if (progresso < missao.alvo) return message.reply('❌ Você ainda não completou esta missão!');
                if (userData.missoesSemanaisColetadas?.includes(missaoId)) return message.reply('❌ Você já coletou esta recompensa!');
                
                userData.carteira += missao.recompensa;
                if (!userData.missoesSemanaisColetadas) userData.missoesSemanaisColetadas = [];
                userData.missoesSemanaisColetadas.push(missaoId);
                saveDB(db);
                
                await message.reply(`✅ Você recebeu **${missao.recompensa} Orbs** pela missão semanal **${missao.nome}**!`);
            }
        }
        
        else {
            await message.reply('📅 **Missões Diárias/Semanais**\n`bt!missaodiaria diaria` - Ver missões diárias\n`bt!missaodiaria semanal` - Ver missões semanais\n`bt!missaodiaria recompensa <diaria/semanal> <id>` - Coletar recompensa');
        }
    }
};