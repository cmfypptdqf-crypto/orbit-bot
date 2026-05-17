// commands/rpg/petOrbital.js
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

const petsOrbitais = {
    'lobinho': { nome: '🐕 Lobinho Orbital', bonus: { xp: 1.05 }, preco: 5000, nivelMin: 5, fomeMax: 100 },
    'dragao': { nome: '🐉 Dragão Cósmico', bonus: { ataque: 1.10 }, preco: 15000, nivelMin: 15, fomeMax: 150 },
    'coruja': { nome: '🦉 Coruja Estelar', bonus: { sorte: 1.10 }, preco: 10000, nivelMin: 10, fomeMax: 80 },
    'lobo': { nome: '🐺 Lobo Espacial', bonus: { defesa: 1.15 }, preco: 20000, nivelMin: 20, fomeMax: 120 },
    'alien': { nome: '👽 Alien Orbital', bonus: { todos: 1.20 }, preco: 50000, nivelMin: 30, fomeMax: 200 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'petorbital',
    aliases: ['pet', 'companheiro', 'mascote', 'pets'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, pet: null, petFome: 0 };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        // Adicionar XP por usar o comando
        const xpGanho = 5;
        const resultadoXP = adicionarXP(userId, xpGanho, 'petorbital');
        
        if (subcmd === 'adotar') {
            const petId = args[1];
            if (!petId || !petsOrbitais[petId]) return message.reply('❌ Pet orbital inválido! Use `bt!petorbital lista`');
            if (db.usuarios[userId].pet) return message.reply('❌ Você já tem um pet orbital!');
            if (nivel < petsOrbitais[petId].nivelMin) return message.reply(`❌ Você precisa ser nível orbital ${petsOrbitais[petId].nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < petsOrbitais[petId].preco) return message.reply(`❌ Você precisa de ${petsOrbitais[petId].preco.toLocaleString()} Orbs orbitais!`);
            
            db.usuarios[userId].carteira -= petsOrbitais[petId].preco;
            db.usuarios[userId].pet = petId;
            db.usuarios[userId].petFome = petsOrbitais[petId].fomeMax;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🐾 Pet Orbital Adotado!')
                .setDescription(`✅ Você adotou **${petsOrbitais[petId].nome}**! Use \`bt!petorbital alimentar\` para mantê-lo feliz!`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'alimentar') {
            if (!db.usuarios[userId].pet) return message.reply('❌ Você não tem um pet orbital!');
            
            const pet = petsOrbitais[db.usuarios[userId].pet];
            const custoComida = 100;
            
            if ((db.usuarios[userId].carteira || 0) < custoComida) return message.reply(`❌ Você precisa de ${custoComida} Orbs orbitais para alimentar seu pet!`);
            
            db.usuarios[userId].carteira -= custoComida;
            db.usuarios[userId].petFome = Math.min(pet.fomeMax, (db.usuarios[userId].petFome || 0) + 30);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🍖 Pet Orbital Alimentado!')
                .setDescription(`Você alimentou **${pet.nome}**! Fome atual: ${db.usuarios[userId].petFome}/${pet.fomeMax}`)
                .addFields(
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'info') {
            if (!db.usuarios[userId].pet) return message.reply('❌ Você não tem um pet orbital!');
            
            const petId = db.usuarios[userId].pet;
            const pet = petsOrbitais[petId];
            const fome = db.usuarios[userId].petFome || pet.fomeMax;
            const felicidade = Math.floor((fome / pet.fomeMax) * 100);
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle(`🐾 Pet Orbital de ${message.author.username}`)
                .setDescription(`🐕 **${pet.nome}**`)
                .addFields(
                    { name: '🍖 Fome Orbital', value: `${fome}/${pet.fomeMax} (${felicidade}%)`, inline: true },
                    { name: '✨ Bônus Orbital', value: Object.entries(pet.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join('\n'), inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'lista') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🐾 Pets Orbitais Disponíveis')
                .setDescription('Use `bt!petorbital adotar <id>` para adotar um pet orbital!')
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true });
            
            for (const [id, pet] of Object.entries(petsOrbitais)) {
                embed.addFields({
                    name: `${id} - ${pet.nome}`,
                    value: `💰 Preço: ${pet.preco.toLocaleString()} Orbs | 🎯 Nível Orbital ${pet.nivelMin}+\n✨ Bônus: ${Object.entries(pet.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join(', ')}`,
                    inline: false
                });
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🐾 **Sistema de Pets Orbitais**\n`bt!petorbital lista` - Ver pets\n`bt!petorbital adotar <id>` - Adotar pet\n`bt!petorbital alimentar` - Alimentar pet\n`bt!petorbital info` - Info do pet');
        }
    }
};