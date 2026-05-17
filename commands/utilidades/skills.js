// commands/rpg/habilidadeOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

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

const habilidadesOrbitais = {
    '1': { nome: '⚔️ Corte Orbital', dano: 200, custo: 500, cooldown: 30, nivelMin: 5, desc: 'Causa 200 de dano orbital' },
    '2': { nome: '🛡️ Escudo Estelar', dano: 0, custo: 1000, cooldown: 60, nivelMin: 10, desc: 'Se protege por 1 hora (reduz dano em 50%)' },
    '3': { nome: '💚 Cura Cósmica', dano: 0, custo: 800, cooldown: 45, nivelMin: 8, desc: 'Recupera 300 de vida orbital' },
    '4': { nome: '🔥 Fogo Nebuloso', dano: 350, custo: 1500, cooldown: 90, nivelMin: 15, desc: 'Causa 350 de dano em área' },
    '5': { nome: '⚡ Raio Estelar', dano: 500, custo: 2000, cooldown: 120, nivelMin: 20, desc: 'Ataque poderoso que causa 500 de dano' }
};

const habilidadeCooldowns = new Map();

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'habilidade',
    aliases: ['hab', 'skill', 'habilidadeorbital', 'skills'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, habilidades: [], vida: 1000, vidaMax: 1000 };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        const xpGanho = 8;
        const resultadoXP = adicionarXP(userId, xpGanho, 'habilidade');
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Habilidades Orbitais Disponíveis')
                .setDescription('Use `bt!habilidade comprar <id>` para aprender uma habilidade orbital!')
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            for (const [id, hab] of Object.entries(habilidadesOrbitais)) {
                const liberado = nivel >= hab.nivelMin;
                embed.addFields({
                    name: `${hab.nome}`,
                    value: `💰 Custo: ${hab.custo} Orbs | 🎯 Nível ${hab.nivelMin}+${liberado ? ' ✅' : ' 🔒'}\n📝 ${hab.desc}\n⏰ Cooldown: ${hab.cooldown}min`,
                    inline: false
                });
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            const id = args[1];
            if (!id || !habilidadesOrbitais[id]) return message.reply('❌ ID orbital inválido!');
            
            const hab = habilidadesOrbitais[id];
            if (nivel < hab.nivelMin) return message.reply(`❌ Você precisa ser nível orbital ${hab.nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < hab.custo) return message.reply(`❌ Você precisa de ${hab.custo} Orbs orbitais!`);
            if (db.usuarios[userId].habilidades?.includes(id)) return message.reply('❌ Você já possui esta habilidade orbital!');
            
            db.usuarios[userId].carteira -= hab.custo;
            if (!db.usuarios[userId].habilidades) db.usuarios[userId].habilidades = [];
            db.usuarios[userId].habilidades.push(id);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Habilidade Orbital Adquirida!')
                .setDescription(`Você aprendeu a habilidade **${hab.nome}**!`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'usar') {
            const id = args[1];
            const alvo = message.mentions.users.first();
            
            if (!id || !habilidadesOrbitais[id]) return message.reply('❌ ID orbital inválido!');
            if (!db.usuarios[userId].habilidades?.includes(id)) return message.reply('❌ Você não possui esta habilidade orbital!');
            
            const hab = habilidadesOrbitais[id];
            const cooldownKey = `hab_${userId}_${id}`;
            const lastUse = habilidadeCooldowns.get(cooldownKey);
            
            if (lastUse && Date.now() - lastUse < hab.cooldown * 60000) {
                const restante = Math.ceil((hab.cooldown * 60000 - (Date.now() - lastUse)) / 60000);
                return message.reply(`⏰ Aguarde **${restante} minutos** para usar ${hab.nome} novamente!`);
            }
            
            if (!alvo && hab.dano > 0) return message.reply('❌ Mencione um alvo orbital para atacar!');
            if (alvo && alvo.id === userId) return message.reply('❌ Não pode usar habilidade orbital em si mesmo!');
            
            habilidadeCooldowns.set(cooldownKey, Date.now());
            
            if (hab.dano > 0) {
                if (!db.usuarios[alvo.id]) db.usuarios[alvo.id] = { vida: 1000, vidaMax: 1000 };
                const danoReal = Math.floor(hab.dano * (Math.random() * 0.3 + 0.85));
                db.usuarios[alvo.id].vida = Math.max(0, (db.usuarios[alvo.id].vida || 1000) - danoReal);
                saveDB(db);
                
                const embed = new EmbedBuilder()
                    .setColor(0xFF6347)
                    .setTitle(`⚔️ ${hab.nome}!`)
                    .setDescription(`📡 Você usou **${hab.nome}** contra ${alvo.username}!\n💥 Causou **${danoReal} de dano orbital**!`)
                    .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
                
                if (db.usuarios[alvo.id].vida <= 0) {
                    await message.reply(`💀 **${alvo.username} foi derrotado orbitalmente!**`);
                    db.usuarios[alvo.id].vida = db.usuarios[alvo.id].vidaMax || 1000;
                    saveDB(db);
                }
            } else if (hab.nome === '🛡️ Escudo Estelar') {
                db.usuarios[userId].escudoAtivo = Date.now() + 3600000;
                saveDB(db);
                await message.reply(`🛡️ Você ativou **${hab.nome}**! Dano orbital reduzido em 50% por 1 hora!`);
            } else if (hab.nome === '💚 Cura Cósmica') {
                const cura = 300;
                db.usuarios[userId].vida = Math.min(db.usuarios[userId].vidaMax || 1000, (db.usuarios[userId].vida || 1000) + cura);
                saveDB(db);
                await message.reply(`💚 Você usou **${hab.nome}**! Recuperou **${cura} de vida orbital**!`);
            }
        }
        
        else if (subcmd === 'meus') {
            const minhasHabs = db.usuarios[userId].habilidades || [];
            if (minhasHabs.length === 0) return message.reply('📭 Você não possui nenhuma habilidade orbital!');
            
            const lista = minhasHabs.map(id => `**${habilidadesOrbitais[id].nome}** - ${habilidadesOrbitais[id].desc}`).join('\n');
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`⭐ Habilidades Orbitais de ${message.author.username}`)
                .setDescription(lista)
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Sistema de Habilidades Orbitais**\n`bt!habilidade listar` - Ver habilidades\n`bt!habilidade comprar <id>` - Comprar\n`bt!habilidade usar <id> @user` - Usar\n`bt!habilidade meus` - Suas habilidades');
        }
    }
};