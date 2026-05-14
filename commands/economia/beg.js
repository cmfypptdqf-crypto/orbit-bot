// commands/economia/beg.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomFrase, checkRandomEvent, processEvent } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

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

module.exports = {
    name: 'beg',
    aliases: ['pedir', 'mendigar', 'esmolar', 'mendigo'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // ========== VERIFICAR COOLDOWN ==========
        const cooldownCheck = cooldownsManager.check(userId, 'beg');
        if (!cooldownCheck.available) {
            const fraseCooldown = getRandomFrase('cooldown');
            return message.reply(`${fraseCooldown}\n⏰ Aguarde mais **${cooldownCheck.formatted}** para pedir novamente!`);
        }
        
        // ========== EVENTOS DE PEDIR ==========
        const eventos = [
            { texto: '👽 Um alienígena ficou com pena de você', ganho: [200, 400], cor: 0x9B59B6, emoji: '👽' },
            { texto: '🚀 Um viajante espacial jogou Orbs para você', ganho: [150, 300], cor: 0x3498DB, emoji: '🚀' },
            { texto: '🛸 Uma nave desconhecida dropou suprimentos', ganho: [100, 250], cor: 0x00FF00, emoji: '🛸' },
            { texto: '💫 Uma estrela cadente deixou Orbs para você', ganho: [180, 350], cor: 0xF1C40F, emoji: '💫' },
            { texto: '🌙 A Estação Espacial te enviou um auxílio', ganho: [250, 500], cor: 0xE67E22, emoji: '🌙' },
            { texto: '🧙 O Mestre Cósmico abençoou você', ganho: [300, 600], cor: 0x8E44AD, emoji: '🧙' },
            { texto: '🪐 Saturno alinhou os planetas a seu favor', ganho: [220, 450], cor: 0xFF9800, emoji: '🪐' },
            { texto: '✨ Uma fada espacial te presenteou', ganho: [180, 380], cor: 0xE91E63, emoji: '✨' }
        ];
        
        const evento = eventos[Math.floor(Math.random() * eventos.length)];
        const ganhoBase = Math.floor(Math.random() * (evento.ganho[1] - evento.ganho[0] + 1) + evento.ganho[0]);
        
        // ========== APLICAR EVENTO ALEATÓRIO CÓSMICO ==========
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_beg: 0 };
        }
        
        let ganhoFinal = ganhoBase;
        
        // Verificar evento cósmico
        const eventoCosmico = checkRandomEvent();
        let eventoResultado = null;
        
        if (eventoCosmico && eventoCosmico.efeito === 'positivo') {
            const bonusEvento = Math.floor(Math.random() * 150) + 30;
            ganhoFinal += bonusEvento;
            eventoResultado = { mensagem: eventoCosmico.frase, efeito: `✨ +${bonusEvento} Orbs de bônus cósmico!` };
        } else if (eventoCosmico && eventoCosmico.efeito === 'negativo') {
            const perdaEvento = Math.floor(Math.random() * 100) + 20;
            ganhoFinal = Math.max(10, ganhoFinal - perdaEvento);
            eventoResultado = { mensagem: eventoCosmico.frase, efeito: `💸 -${perdaEvento} Orbs (azar cósmico)` };
        } else if (eventoCosmico) {
            eventoResultado = { mensagem: eventoCosmico.frase, efeito: '🌌 Neutro' };
        }
        
        // Aplicar ganho
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganhoFinal;
        db.usuarios[userId].total_beg = (db.usuarios[userId].total_beg || 0) + 1;
        
        saveDB(db);
        
        // ========== REGISTRAR COOLDOWN ==========
        cooldownsManager.set(userId, 'beg');
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        // Calcular estatísticas
        const totalGanho = db.usuarios[userId].carteira;
        const vezesPediu = db.usuarios[userId].total_beg || 1;
        const mediaGanho = Math.floor(totalGanho / vezesPediu);
        
        const embed = new EmbedBuilder()
            .setColor(evento.cor)
            .setTitle(`${evento.emoji} ${fraseSucesso}`)
            .setDescription(`📡 ${evento.texto}`)
            .addFields(
                { name: '💰 Você recebeu', value: `**+${ganhoFinal.toLocaleString()} Orbs**`, inline: true },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                { name: '🎭 Vezes que pediu', value: `${db.usuarios[userId].total_beg}`, inline: true },
                { name: '📊 Média por pedido', value: `${mediaGanho.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Próximo pedido disponível em 5 minutos' })
            .setTimestamp();
        
        if (eventoResultado) {
            embed.addFields(
                { name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false },
                { name: '✨ Efeito', value: eventoResultado.efeito, inline: true }
            );
        }
        
        await message.reply({ embeds: [embed] });
    }
};