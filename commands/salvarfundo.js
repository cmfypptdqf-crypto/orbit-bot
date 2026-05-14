// commands/salvarfundo.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'salvarfundo',
    aliases: ['setbackground', 'setbg'],
    
    async executePrefix(message, args, client) {
        // Verificar se o usuário é admin
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores podem usar este comando!');
        }
        
        // Verificar se tem uma imagem anexada
        if (message.attachments.size === 0) {
            return message.reply('❌ Envie uma imagem junto com o comando! Ex: `!salvarfundo` e anexe a imagem');
        }
        
        const attachment = message.attachments.first();
        const imageUrl = attachment.url;
        
        // Verificar se é imagem
        if (!imageUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return message.reply('❌ Por favor, envie uma imagem válida (jpg, png, gif)');
        }
        
        // Criar pasta se não existir
        const assetsPath = path.join(__dirname, '..', 'assets');
        if (!fs.existsSync(assetsPath)) {
            fs.mkdirSync(assetsPath);
        }
        
        // Baixar e salvar imagem
        const response = await fetch(imageUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        
        const filePath = path.join(assetsPath, 'background.png');
        fs.writeFileSync(filePath, buffer);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Fundo atualizado!')
            .setDescription('A imagem de fundo do perfil foi alterada com sucesso!')
            .setImage('attachment://background.png')
            .setFooter({ text: 'Novo fundo salvo!' });
        
        await message.reply({ 
            embeds: [embed], 
            files: [{ attachment: filePath, name: 'background.png' }] 
        });
    }
};