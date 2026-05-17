// commands/admin/warnOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ warns: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'warn',
    aliases: ['advertir', 'warnorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('ModerateMembers')) {
            return message.reply('❌ Você não tem permissão orbital para usar este comando!');
        }
        
        const subcmd = args[0]?.toLowerCase();
        const user = message.mentions.users.first();
        
        if (!user) return message.reply('❌ Use: `bt!warn add/remove @usuario <motivo>`');
        
        const db = getDB();
        const guildId = message.guild.id;
        
        if (!db.warns[guildId]) db.warns[guildId] = {};
        if (!db.warns[guildId][user.id]) db.warns[guildId][user.id] = [];
        
        if (subcmd === 'add') {
            const motivo = args.slice(2).join(' ') || 'Não especificado';
            
            db.warns[guildId][user.id].push({
                motivo: motivo,
                data: Date.now(),
                moderador: message.author.id
            });
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⚠️ Advertência Orbital')
                .setDescription(`**${user.username}** recebeu uma advertência orbital!`)
                .addFields(
                    { name: '📝 Motivo', value: motivo, inline: true },
                    { name: '👑 Moderador', value: message.author.tag, inline: true },
                    { name: '📊 Total de Warns', value: `${db.warns[guildId][user.id].length}`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Advertência registrada' });
            
            await message.reply({ embeds: [embed] });
            
            // Notificar o usuário
            try {
                await user.send(`⚠️ Você recebeu uma advertência orbital em **${message.guild.name}**\n📝 Motivo: ${motivo}`);
            } catch (e) {}
        }
        
        else if (subcmd === 'remove') {
            const index = parseInt(args[2]) - 1;
            
            if (isNaN(index) || index < 0 || index >= db.warns[guildId][user.id].length) {
                return message.reply('❌ Índice orbital inválido! Use `bt!warn listar @user` para ver os índices.');
            }
            
            const warn = db.warns[guildId][user.id][index];
            db.warns[guildId][user.id].splice(index, 1);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Advertência Removida')
                .setDescription(`Advertência orbital de **${user.username}** foi removida!`)
                .addFields(
                    { name: '📝 Motivo anterior', value: warn.motivo, inline: true },
                    { name: '👑 Removido por', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Advertência removida' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'listar') {
            const warns = db.warns[guildId][user.id];
            
            if (warns.length === 0) {
                return message.reply(`✅ ${user.username} não possui advertências orbitais!`);
            }
            
            const lista = warns.map((w, i) => {
                const data = new Date(w.data).toLocaleDateString();
                return `**${i + 1}** - ${w.motivo} (${data}) - Moderador: <@${w.moderador}>`;
            }).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⚠️ Advertências Orbitais de ${user.username}`)
                .setDescription(lista)
                .addFields({ name: '📊 Total', value: `${warns.length} advertências`, inline: true })
                .setFooter({ text: '🌌 Orbit • Use bt!warn remove @user <id> para remover' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('📋 **Sistema de Warns Orbital**\n`warn add @user <motivo>` - Adicionar warn\n`warn remove @user <id>` - Remover warn\n`warn listar @user` - Listar warns');
        }
    }
};