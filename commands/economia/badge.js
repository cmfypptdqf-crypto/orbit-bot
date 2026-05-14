// commands/economia/badge.js
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

module.exports = {
    name: 'badge',
    description: 'Suas medalhas conquistadas',
    aliases: ['medalhas', 'conquistas'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0, total_ataques: 0 };
        }
        
        const userData = db.usuarios[userId];
        const missoes = userData.total_missoes || 0;
        const totalOrbs = (userData.carteira || 0) + (userData.banco || 0);
        const ataques = userData.total_ataques || 0;
        
        // Verificar rank global (simulação - você precisa implementar o ranking real)
        const rank = 15; // Placeholder - substitua pelo rank real do usuário
        
        // Definir medalhas com requisitos
        const todasBadges = [
            { 
                nome: '🚀 Explorador Iniciante', 
                desc: 'Completou 10 missões', 
                requisito: missoes >= 10,
                cor: '#808080' 
            },
            { 
                nome: '⭐ Veterano Espacial', 
                desc: 'Completou 100 missões', 
                requisito: missoes >= 100,
                cor: '#C0C0C0' 
            },
            { 
                nome: '💰 Magnata Cósmico', 
                desc: 'Acumulou 1.000.000 Orbs', 
                requisito: totalOrbs >= 1000000,
                cor: '#FFD700' 
            },
            { 
                nome: '🛸 Caçador de Naves', 
                desc: 'Realizou 50 ataques', 
                requisito: ataques >= 50,
                cor: '#FF6347' 
            },
            { 
                nome: '👑 Lenda Galáctica', 
                desc: 'Top 10 do ranking', 
                requisito: rank <= 10,
                cor: '#9B59B6' 
            },
            { 
                nome: '💎 Colecionador', 
                desc: 'Possui 10 itens diferentes', 
                requisito: Object.keys(userData.inventario || {}).length >= 10,
                cor: '#00BFFF' 
            },
            { 
                nome: '⚔️ Guerreiro Estelar', 
                desc: 'Venceu 20 batalhas', 
                requisito: (userData.vitorias || 0) >= 20,
                cor: '#FF4500' 
            }
        ];
        
        // Separar medalhas conquistadas e não conquistadas
        const conquistadas = todasBadges.filter(b => b.requisito);
        const bloqueadas = todasBadges.filter(b => !b.requisito);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🏅 Medalhas de ${message.author.username}`)
            .setDescription(`📊 Total conquistadas: **${conquistadas.length}/${todasBadges.length}**`)
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        
        if (conquistadas.length > 0) {
            embed.addFields({
                name: '✅ MEDALHAS CONQUISTADAS',
                value: conquistadas.map(b => `**${b.nome}**\n📝 ${b.desc}`).join('\n\n'),
                inline: false
            });
        } else {
            embed.addFields({
                name: '✅ MEDALHAS CONQUISTADAS',
                value: 'Nenhuma medalha ainda... Complete desafios!',
                inline: false
            });
        }
        
        if (bloqueadas.length > 0) {
            embed.addFields({
                name: '🔒 MEDALHAS BLOQUEADAS',
                value: bloqueadas.map(b => `**${b.nome}**\n📝 ${b.desc}`).join('\n\n'),
                inline: false
            });
        }
        
        // Mostrar progresso
        const progresso = [
            `🚀 **Missões:** ${missoes}/100`,
            `💰 **Orbs:** ${totalOrbs.toLocaleString()}/1.000.000`,
            `🛸 **Ataques:** ${ataques}/50`,
            `🎒 **Itens:** ${Object.keys(userData.inventario || {}).length}/10`
        ];
        
        embed.addFields({
            name: '📈 SEU PROGRESSO',
            value: progresso.join('\n'),
            inline: false
        });
        
        embed.setFooter({ text: 'Complete os desafios para desbloquear mais medalhas!' });
        
        await message.reply({ embeds: [embed] });
    }
};