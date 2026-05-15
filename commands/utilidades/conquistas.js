// commands/rpg/conquista.js
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

const conquistas = [
    { id: 1, nome: '🎯 Primeiros Passos', desc: 'Atingir nível 10', requisito: (data) => data.nivel >= 10, recompensa: 1000 },
    { id: 2, nome: '💰 Primeiro Milhão', desc: 'Acumular 1.000.000 Orbs', requisito: (data) => data.totalOrbs >= 1000000, recompensa: 10000 },
    { id: 3, nome: '⚔️ Mestre Guerreiro', desc: '100 vitórias em ataques', requisito: (data) => data.vitorias >= 100, recompensa: 5000 },
    { id: 4, nome: '👑 Lendário', desc: 'Atingir nível 100', requisito: (data) => data.nivel >= 100, recompensa: 100000 },
    { id: 5, nome: '🌌 Explorador', desc: '500 missões completadas', requisito: (data) => data.missoes >= 500, recompensa: 25000 }
];

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'conquista',
    aliases: ['achievement', 'conquistas'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0, total_missoes: 0, vitorias: 0, conquistasColetadas: [] };
        }
        
        const userData = db.usuarios[userId];
        const nivel = calcularNivel(userData.xpTotal || 0);
        const totalOrbs = (userData.carteira || 0) + (userData.banco || 0);
        
        const conquistasStatus = conquistas.map(c => ({
            ...c,
            completo: c.requisito({
                nivel,
                totalOrbs,
                missoes: userData.total_missoes || 0,
                vitorias: userData.vitorias || 0
            }),
            coletado: userData.conquistasColetadas?.includes(c.id)
        }));
        
        const completas = conquistasStatus.filter(c => c.completo && !c.coletado);
        const conquistadas = conquistasStatus.filter(c => c.coletado);
        const pendentes = conquistasStatus.filter(c => !c.completo);
        
        if (subcmd === 'coletar') {
            if (completas.length === 0) return message.reply('❌ Nenhuma conquista disponível para coletar!');
            
            let totalOrbsGanho = 0;
            for (const c of completas) {
                userData.carteira += c.recompensa;
                totalOrbsGanho += c.recompensa;
                if (!userData.conquistasColetadas) userData.conquistasColetadas = [];
                userData.conquistasColetadas.push(c.id);
            }
            saveDB(db);
            
            await message.reply(`✅ Você coletou **${completas.length} conquistas** e ganhou **${totalOrbsGanho.toLocaleString()} Orbs**!`);
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`🏆 Conquistas de ${message.author.username}`)
                .setDescription(`📊 Progresso: ${conquistadas.length}/${conquistas.length} conquistas`);
            
            if (conquistadas.length > 0) {
                embed.addFields({
                    name: '✅ CONQUISTADAS',
                    value: conquistadas.map(c => `**${c.nome}**\n📝 ${c.desc}`).join('\n\n'),
                    inline: false
                });
            }
            
            if (pendentes.length > 0) {
                embed.addFields({
                    name: '🔒 PRÓXIMAS',
                    value: pendentes.map(c => `**${c.nome}**\n📝 ${c.desc}\n💰 Recompensa: ${c.recompensa.toLocaleString()} Orbs`).join('\n\n'),
                    inline: false
                });
            }
            
            if (completas.length > 0) {
                embed.addFields({
                    name: '🎁 PRONTAS PARA COLETAR',
                    value: completas.map(c => `**${c.nome}** - ${c.recompensa.toLocaleString()} Orbs`).join('\n'),
                    inline: false
                });
                embed.setFooter({ text: 'Use bt!conquista coletar para receber suas recompensas!' });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};