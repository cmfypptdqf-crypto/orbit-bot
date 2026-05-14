// commands/economia/saldo.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { calcularNivel, getTituloPorNivel } = require('../utilidades/levelSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {}, clans: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'saldo',
    aliases: ['bal', 'carteira', 'money', 'nucleo', 'orbs'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        let userId = message.author.id;
        
        // Verificar se mencionou outro usuário
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) userId = mention.id;
        }
        
        // Inicializar usuário se não existir
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        const banco = db.usuarios[userId].banco || 0;
        const totalOrbs = carteira + banco;
        
        // Calcular nível e título
        const nivel = calcularNivel(totalOrbs);
        const titulo = getTituloPorNivel(nivel);
        const xpNecessario = nivel * 1000;
        const xpAtualValue = totalOrbs % xpNecessario;
        const progresso = Math.floor((xpAtualValue / xpNecessario) * 100);
        
        // Verificar VIP
        let isVip = false;
        let vipTier = null;
        let vipExpira = null;
        let vipMult = 1.0;
        
        if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            isVip = true;
            vipTier = db.vip_list[userId].tier;
            vipExpira = db.vip_list[userId].expira;
            vipMult = db.vip_list[userId].multiplicador || 1.5;
        }
        
        // Verificar bônus do clã
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        
        const user = await client.users.fetch(userId);
        
        // Barra de progresso
        const barraProgresso = gerarBarraProgresso(progresso, 20);
        
        // Frases do Orbit
        const frasesInicio = [
            '📡 Sondando ativos orbitais...',
            '💰 Calculando núcleo financeiro...',
            '🌌 Escaneando sua carteira interestelar...',
            '🚀 Acessando banco de dados galáctico...',
            '🔭 Localizando seus recursos espaciais...'
        ];
        const fraseOrbit = frasesInicio[Math.floor(Math.random() * frasesInicio.length)];
        
        const embed = new EmbedBuilder()
            .setColor(isVip ? 0xFFD700 : 0x00BFFF)
            .setTitle(`🛸 ${fraseOrbit}`)
            .setDescription(`📡 **${user.username}** | ${titulo}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { 
                    name: '💎 **ORBS**',
                    value: `\`\`\`diff\n+ 💵 Carteira: ${carteira.toLocaleString()} Orbs\n+ 🏦 Banco Galáctico: ${banco.toLocaleString()} Orbs\n+ 📊 Patrimônio Total: ${totalOrbs.toLocaleString()} Orbs\`\`\``,
                    inline: false
                },
                { 
                    name: '🚀 **NÍVEL ESPACIAL**',
                    value: `\`\`\`yaml\nNível: ${nivel}\nTítulo: ${titulo}\`\`\``,
                    inline: true
                },
                { 
                    name: '📊 **PROGRESSO**',
                    value: `${barraProgresso}\n📈 ${xpAtualValue.toLocaleString()} / ${xpNecessario.toLocaleString()} XP (${progresso}%)`,
                    inline: false
                }
            );
        
        // Adicionar informações de VIP
        if (isVip) {
            let vipIcon = vipTier === 'diamante' ? '💎' : vipTier === 'ouro' ? '⭐' : vipTier === 'prata' ? '✨' : '🌟';
            embed.addFields({
                name: '⭐ **STATUS VIP**',
                value: `${vipIcon} **${vipTier?.toUpperCase()}** (${vipMult}x)\n⏰ Expira: <t:${Math.floor(vipExpira / 1000)}:R>`,
                inline: true
            });
        }
        
        // Adicionar informações do clã
        if (bonusInfo.clanBonus > 1.0) {
            embed.addFields({
                name: '🌌 **BÔNUS DO CLÃ**',
                value: `✨ +${Math.round((bonusInfo.clanBonus - 1) * 100)}% em ganhos\n📡 Ativo via galáxia dominada`,
                inline: true
            });
        }
        
        embed.setFooter({ text: '🌌 Orbit • Sistema Econômico Intergaláctico' }).setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraProgresso(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    const vazio = tamanho - preenchido;
    return `🟩`.repeat(preenchido) + `⬜`.repeat(vazio);
}