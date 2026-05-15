// commands/rpg/habilidade.js
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

const habilidades = {
    '1': { nome: '⚔️ Corte Espacial', dano: 200, custo: 500, cooldown: 30, nivelMin: 5, desc: 'Causa 200 de dano no inimigo' },
    '2': { nome: '🛡️ Escudo Divino', dano: 0, custo: 1000, cooldown: 60, nivelMin: 10, desc: 'Se protege por 1 hora (reduz dano em 50%)' },
    '3': { nome: '💚 Cura Estelar', dano: 0, custo: 800, cooldown: 45, nivelMin: 8, desc: 'Recupera 300 de vida' },
    '4': { nome: '🔥 Fogo Cósmico', dano: 350, custo: 1500, cooldown: 90, nivelMin: 15, desc: 'Causa 350 de dano em área' },
    '5': { nome: '⚡ Raio Galáctico', dano: 500, custo: 2000, cooldown: 120, nivelMin: 20, desc: 'Ataque poderoso que causa 500 de dano' }
};

const habilidadeCooldowns = new Map();

module.exports = {
    name: 'habilidade',
    aliases: ['hab', 'skill'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, habilidades: [], vida: 1000, vidaMax: 1000 };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'listar') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Habilidades Disponíveis')
                .setDescription('Use `bt!habilidade comprar <id>` para aprender uma habilidade!');
            
            for (const [id, hab] of Object.entries(habilidades)) {
                const liberado = nivel >= hab.nivelMin;
                embed.addFields({
                    name: `${hab.nome}`,
                    value: `💰 Custo: ${hab.custo} Orbs | 🎯 Nível ${hab.nivelMin}+${liberado ? ' ✅' : ' 🔒'}\n📝 ${hab.desc}\n⏰ Cooldown: ${hab.cooldown}min`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            const id = args[1];
            if (!id || !habilidades[id]) return message.reply('❌ ID inválido!');
            
            const hab = habilidades[id];
            if (nivel < hab.nivelMin) return message.reply(`❌ Você precisa ser nível ${hab.nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < hab.custo) return message.reply(`❌ Você precisa de ${hab.custo} Orbs!`);
            if (db.usuarios[userId].habilidades?.includes(id)) return message.reply('❌ Você já possui esta habilidade!');
            
            db.usuarios[userId].carteira -= hab.custo;
            if (!db.usuarios[userId].habilidades) db.usuarios[userId].habilidades = [];
            db.usuarios[userId].habilidades.push(id);
            saveDB(db);
            
            await message.reply(`✅ Você aprendeu a habilidade **${hab.nome}**!`);
        }
        
        else if (subcmd === 'usar') {
            const id = args[1];
            const alvo = message.mentions.users.first();
            
            if (!id || !habilidades[id]) return message.reply('❌ ID inválido!');
            if (!db.usuarios[userId].habilidades?.includes(id)) return message.reply('❌ Você não possui esta habilidade!');
            
            const hab = habilidades[id];
            const cooldownKey = `hab_${userId}_${id}`;
            const lastUse = habilidadeCooldowns.get(cooldownKey);
            
            if (lastUse && Date.now() - lastUse < hab.cooldown * 60000) {
                const restante = Math.ceil((hab.cooldown * 60000 - (Date.now() - lastUse)) / 60000);
                return message.reply(`⏰ Aguarde **${restante} minutos** para usar ${hab.nome} novamente!`);
            }
            
            if (!alvo && hab.dano > 0) return message.reply('❌ Mencione um alvo para atacar!');
            if (alvo && alvo.id === userId) return message.reply('❌ Não pode usar habilidade em si mesmo!');
            
            habilidadeCooldowns.set(cooldownKey, Date.now());
            
            if (hab.dano > 0) {
                if (!db.usuarios[alvo.id]) db.usuarios[alvo.id] = { vida: 1000, vidaMax: 1000 };
                const danoReal = Math.floor(hab.dano * (Math.random() * 0.3 + 0.85));
                db.usuarios[alvo.id].vida = Math.max(0, (db.usuarios[alvo.id].vida || 1000) - danoReal);
                saveDB(db);
                
                await message.reply(`⚔️ Você usou **${hab.nome}** contra ${alvo.username}!\n💥 Causou **${danoReal} de dano**!`);
                
                if (db.usuarios[alvo.id].vida <= 0) {
                    await message.reply(`💀 **${alvo.username} foi derrotado!**`);
                    db.usuarios[alvo.id].vida = db.usuarios[alvo.id].vidaMax || 1000;
                    saveDB(db);
                }
            } else if (hab.nome === '🛡️ Escudo Divino') {
                db.usuarios[userId].escudoAtivo = Date.now() + 3600000;
                saveDB(db);
                await message.reply(`🛡️ Você ativou **${hab.nome}**! Dano reduzido em 50% por 1 hora!`);
            } else if (hab.nome === '💚 Cura Estelar') {
                const cura = 300;
                db.usuarios[userId].vida = Math.min(db.usuarios[userId].vidaMax || 1000, (db.usuarios[userId].vida || 1000) + cura);
                saveDB(db);
                await message.reply(`💚 Você usou **${hab.nome}**! Recuperou **${cura} de vida**!`);
            }
        }
        
        else if (subcmd === 'meus') {
            const minhasHabs = db.usuarios[userId].habilidades || [];
            if (minhasHabs.length === 0) return message.reply('📭 Você não possui nenhuma habilidade!');
            
            const lista = minhasHabs.map(id => `**${habilidades[id].nome}** - ${habilidades[id].desc}`).join('\n');
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`⭐ Habilidades de ${message.author.username}`)
                .setDescription(lista);
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⭐ **Sistema de Habilidades**\n`bt!habilidade listar` - Ver habilidades\n`bt!habilidade comprar <id>` - Comprar\n`bt!habilidade usar <id> @user` - Usar\n`bt!habilidade meus` - Suas habilidades');
        }
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}