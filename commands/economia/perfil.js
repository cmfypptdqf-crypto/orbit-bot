// commands/economia/perfil.js (versão com fundo customizado)
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

// Caminho do fundo (coloque uma imagem na pasta assets)
const BACKGROUND_PATH = path.join(__dirname, '..', '..', 'assets', 'background.png');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'perfil',
    aliases: ['profile', 'me', 'perfilg'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0 };
        }
        
        const userData = db.usuarios[userId];
        const carteira = userData.carteira || 0;
        const banco = userData.banco || 0;
        const total = carteira + banco;
        const missoes = userData.total_missoes || 0;
        
        // Verificar VIP
        let vipTier = null;
        let vipMult = 1.0;
        let vipExpira = null;
        if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            vipTier = db.vip_list[userId].tier;
            vipMult = db.vip_list[userId].multiplicador;
            vipExpira = db.vip_list[userId].expira;
        }
        
        // Criar canvas
        const width = 900;
        const height = 450;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // === FUNDO (imagem ou gradiente) ===
        if (fs.existsSync(BACKGROUND_PATH)) {
            const background = await loadImage(BACKGROUND_PATH);
            ctx.drawImage(background, 0, 0, width, height);
        } else {
            // Gradiente espacial
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#0a0a2a');
            gradient.addColorStop(0.5, '#1a1a4a');
            gradient.addColorStop(1, '#2a0a3a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Estrelas
            for (let i = 0; i < 100; i++) {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8})`;
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // === CARD DO PERFIL (fundo semi-transparente) ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillRect(30, 30, width - 60, height - 60);
        ctx.shadowColor = 'transparent';
        
        // === BORDA DO CARD ===
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, width - 60, height - 60);
        
        // === AVATAR ===
        ctx.save();
        ctx.beginPath();
        ctx.arc(130, 130, 80, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, 50, 50, 160, 160);
        ctx.restore();
        
        // Borda do avatar
        ctx.beginPath();
        ctx.arc(130, 130, 85, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Efeito de brilho no avatar
        ctx.beginPath();
        ctx.arc(130, 130, 90, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD70040';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // === NOME ===
        ctx.font = 'bold 34px "Segoe UI", Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.fillText(user.username, 260, 85);
        
        ctx.font = '18px "Segoe UI", Arial';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText(`#${user.discriminator || '0000'}`, 260, 120);
        
        // === VIP BADGE ===
        if (vipTier) {
            let vipColor = '#FFD700';
            let vipIcon = '⭐';
            if (vipTier === 'diamante') { vipColor = '#00BFFF'; vipIcon = '💎'; }
            if (vipTier === 'ouro') { vipColor = '#FFD700'; vipIcon = '⭐'; }
            if (vipTier === 'prata') { vipColor = '#C0C0C0'; vipIcon = '✨'; }
            if (vipTier === 'bronze') { vipColor = '#CD7F32'; vipIcon = '🌟'; }
            
            ctx.font = 'bold 16px "Segoe UI", Arial';
            ctx.fillStyle = vipColor;
            ctx.fillText(`${vipIcon} VIP ${vipTier.toUpperCase()} - ${vipMult}x em ganhos`, 260, 152);
            
            if (vipExpira) {
                ctx.font = '12px "Segoe UI", Arial';
                ctx.fillStyle = '#888888';
                ctx.fillText(`Expira: <t:${Math.floor(vipExpira / 1000)}:R>`, 260, 172);
            }
        }
        
        // === LINHA DIVISÓRIA ===
        ctx.beginPath();
        ctx.moveTo(260, 190);
        ctx.lineTo(width - 50, 190);
        ctx.strokeStyle = '#FFFFFF20';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // === ESTATÍSTICAS ===
        const statsY = 220;
        const statsSpacing = 45;
        
        const stats = [
            { icon: '💵', label: 'Núcleo', value: `${carteira.toLocaleString()} Orbs`, color: '#00FF00' },
            { icon: '🏦', label: 'Estação', value: `${banco.toLocaleString()} Orbs`, color: '#3498DB' },
            { icon: '📊', label: 'Patrimônio', value: `${total.toLocaleString()} Orbs`, color: '#FFD700' },
            { icon: '🚀', label: 'Missões', value: `${missoes}`, color: '#E67E22' },
            { icon: '💰', label: 'Roubos', value: `${userData.total_roubos || 0}`, color: '#FF0000' },
            { icon: '🔍', label: 'Explorações', value: `${userData.total_exploracoes || 0}`, color: '#9B59B6' }
        ];
        
        stats.forEach((stat, i) => {
            const y = statsY + (i * statsSpacing);
            
            ctx.font = 'bold 18px "Segoe UI", Arial';
            ctx.fillStyle = stat.color;
            ctx.fillText(`${stat.icon} ${stat.label}`, 260, y);
            
            ctx.font = '20px "Segoe UI", Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(stat.value, 420, y);
        });
        
        // === INVENTÁRIO (lado direito) ===
        const inventario = userData.inventario || {};
        const itensLista = Object.entries(inventario);
        
        ctx.font = 'bold 20px "Segoe UI", Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('🎒 INVENTÁRIO', width - 280, 85);
        
        ctx.beginPath();
        ctx.moveTo(width - 280, 100);
        ctx.lineTo(width - 50, 100);
        ctx.strokeStyle = '#FFFFFF20';
        ctx.stroke();
        
        if (itensLista.length === 0) {
            ctx.font = '16px "Segoe UI", Arial';
            ctx.fillStyle = '#888888';
            ctx.fillText('Nenhum item encontrado', width - 270, 140);
        } else {
            const nomesItens = {
                '1': '🔭 Telescópio Avançado',
                '2': '🚀 Nave Explorer',
                '3': '💍 Anel Cósmico',
                '4': '🛡️ Escudo Energético',
                '5': '👻 Capa da Invisibilidade',
                '6': '🚨 Alarme Anti-Roubo',
                '7': '⭐ VIP Bronze',
                '8': '⭐ VIP Prata',
                '9': '⭐ VIP Ouro',
                '10': '⭐ VIP Diamante',
                '11': '🍀 Amuleto da Sorte',
                '12': '📈 Ação da Bolsa',
                '13': '🎰 Caça-Níquel'
            };
            
            let yPos = 130;
            const maxItens = 6;
            
            for (let i = 0; i < Math.min(itensLista.length, maxItens); i++) {
                const [id, qtd] = itensLista[i];
                const nome = nomesItens[id] || `Item ${id}`;
                
                ctx.font = '14px "Segoe UI", Arial';
                ctx.fillStyle = '#DDDDDD';
                ctx.fillText(`${nome}`, width - 280, yPos);
                
                ctx.font = 'bold 14px "Segoe UI", Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText(`x${qtd}`, width - 100, yPos);
                
                yPos += 30;
            }
            
            if (itensLista.length > maxItens) {
                ctx.font = '12px "Segoe UI", Arial';
                ctx.fillStyle = '#AAAAAA';
                ctx.fillText(`+ ${itensLista.length - maxItens} outros itens...`, width - 280, yPos);
            }
        }
        
        // === DATA DE ENTRADA ===
        const member = await message.guild.members.fetch(user.id);
        const joinedDate = member.joinedTimestamp;
        
        ctx.font = '12px "Segoe UI", Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(`📅 Entrou em: <t:${Math.floor(joinedDate / 1000)}:D>`, 260, height - 45);
        
        // === RODAPÉ ===
        ctx.font = 'italic 12px "Segoe UI", Arial';
        ctx.fillStyle = '#555555';
        ctx.fillText(`🌌 Economia Intergaláctica • ${client.user.username}`, width - 280, height - 25);
        
        // === SELO DE NÍVEL (opcional) ===
        const level = Math.floor(Math.log10(total / 100 + 1) * 10);
        ctx.font = 'bold 14px "Segoe UI", Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`🏆 Nível ${level}`, width - 100, height - 45);
        
        // === BOTÕES INTERATIVOS (opcional - desenhar na imagem) ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(width - 280, height - 50, 200, 35);
        
        ctx.font = '12px "Segoe UI", Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('⬅️ Voltar | Próximo ➡️', width - 270, height - 28);
        
        // Salvar imagem
        const buffer = canvas.toBuffer();
        const attachment = new AttachmentBuilder(buffer, { name: 'perfil.png' });
        
        // Enviar como embed
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`📋 Perfil Galáctico de ${user.username}`)
            .setImage('attachment://perfil.png')
            .setFooter({ text: 'Use !perfil @usuario para ver o perfil de alguém • Estilo Orbit™' });
        
        await message.reply({ embeds: [embed], files: [attachment] });
    }
};