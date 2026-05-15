// commands/rpg/pet.js
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

const pets = {
    'lobinho': { nome: '🐕 Lobinho', bonus: { xp: 1.05 }, preco: 5000, nivelMin: 5, fomeMax: 100 },
    'dragao': { nome: '🐉 Dragão', bonus: { ataque: 1.10 }, preco: 15000, nivelMin: 15, fomeMax: 150 },
    'coruja': { nome: '🦉 Coruja', bonus: { sorte: 1.10 }, preco: 10000, nivelMin: 10, fomeMax: 80 },
    'lobo': { nome: '🐺 Lobo', bonus: { defesa: 1.15 }, preco: 20000, nivelMin: 20, fomeMax: 120 },
    'alien': { nome: '👽 Alien', bonus: { todos: 1.20 }, preco: 50000, nivelMin: 30, fomeMax: 200 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'pet',
    aliases: ['companheiro', 'mascote'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, pet: null, petFome: 0 };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'adotar') {
            const petId = args[1];
            if (!petId || !pets[petId]) return message.reply('❌ Pet inválido! Use `bt!pet lista`');
            if (db.usuarios[userId].pet) return message.reply('❌ Você já tem um pet!');
            if (nivel < pets[petId].nivelMin) return message.reply(`❌ Você precisa ser nível ${pets[petId].nivelMin}!`);
            if ((db.usuarios[userId].carteira || 0) < pets[petId].preco) return message.reply(`❌ Você precisa de ${pets[petId].preco.toLocaleString()} Orbs!`);
            
            db.usuarios[userId].carteira -= pets[petId].preco;
            db.usuarios[userId].pet = petId;
            db.usuarios[userId].petFome = pets[petId].fomeMax;
            saveDB(db);
            
            await message.reply(`✅ Você adotou **${pets[petId].nome}**! Use \`bt!pet alimentar\` para mantê-lo feliz!`);
        }
        
        else if (subcmd === 'alimentar') {
            if (!db.usuarios[userId].pet) return message.reply('❌ Você não tem um pet!');
            
            const pet = pets[db.usuarios[userId].pet];
            const custoComida = 100;
            
            if ((db.usuarios[userId].carteira || 0) < custoComida) return message.reply(`❌ Você precisa de ${custoComida} Orbs para alimentar seu pet!`);
            
            db.usuarios[userId].carteira -= custoComida;
            db.usuarios[userId].petFome = Math.min(pet.fomeMax, (db.usuarios[userId].petFome || 0) + 30);
            saveDB(db);
            
            await message.reply(`🍖 Você alimentou **${pet.nome}**! Fome atual: ${db.usuarios[userId].petFome}/${pet.fomeMax}`);
        }
        
        else if (subcmd === 'info') {
            if (!db.usuarios[userId].pet) return message.reply('❌ Você não tem um pet!');
            
            const petId = db.usuarios[userId].pet;
            const pet = pets[petId];
            const fome = db.usuarios[userId].petFome || pet.fomeMax;
            const felicidade = Math.floor((fome / pet.fomeMax) * 100);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`🐾 Seu Pet: ${pet.nome}`)
                .addFields(
                    { name: '🍖 Fome', value: `${fome}/${pet.fomeMax} (${felicidade}%)`, inline: true },
                    { name: '✨ Bônus', value: Object.entries(pet.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join('\n'), inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'lista') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🐾 Pets Disponíveis')
                .setDescription('Use `bt!pet adotar <id>` para adotar um pet!');
            
            for (const [id, pet] of Object.entries(pets)) {
                embed.addFields({
                    name: `${id} - ${pet.nome}`,
                    value: `💰 Preço: ${pet.preco.toLocaleString()} Orbs | 🎯 Nível ${pet.nivelMin}+\n✨ Bônus: ${Object.entries(pet.bonus).map(([k, v]) => `+${Math.round((v - 1) * 100)}% ${k}`).join(', ')}`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('🐾 **Sistema de Pets**\n`bt!pet lista` - Ver pets\n`bt!pet adotar <id>` - Adotar pet\n`bt!pet alimentar` - Alimentar pet\n`bt!pet info` - Info do pet');
        }
    }
};