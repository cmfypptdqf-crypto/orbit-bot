// commands/events/eventoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

let eventoAtivo = null;
let eventoExpira = null;

const eventosOrbitais = {
    'halloween': { nome: '🎃 Halloween Orbital', duracao: 7, bonus: 1.5, cor: '#FF6600', descricao: 'Evento assombrado! +50% em tudo!' },
    'natal': { nome: '🎄 Natal Cósmico', duracao: 15, bonus: 2.0, cor: '#FF0000', descricao: 'Presentes estelares! +100% em tudo!' },
    'aniversario': { nome: '🎉 Aniversário Orbital', duracao: 3, bonus: 1.3, cor: '#FFD700', descricao: 'Comemoração especial! +30% em tudo!' },
    'cosmico': { nome: '🌌 Evento Cósmico', duracao: 5, bonus: 1.8, cor: '#9B59B6', descricao: 'Energia pura! +80% em tudo!' }
};

module.exports = {
    name: 'evento',
    aliases: ['event', 'eventoorbital'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        
        // Adicionar XP por usar o comando
        const xpGanho = 10;
        const resultadoXP = adicionarXP(userId, xpGanho, 'evento');
        
        if (subcmd === 'iniciar' && message.member.permissions.has('Administrator')) {
            const eventoId = args[1];
            if (!eventoId || !eventosOrbitais[eventoId]) return message.reply('❌ Evento orbital inválido! Use: `halloween`, `natal`, `aniversario`, `cosmico`');
            
            eventoAtivo = eventosOrbitais[eventoId];
            eventoExpira = Date.now() + (eventoAtivo.duracao * 24 * 60 * 60 * 1000);
            
            const embed = new EmbedBuilder()
                .setColor(eventoAtivo.cor)
                .setTitle(`🎉 EVENTO ORBITAL ATIVADO: ${eventoAtivo.nome}`)
                .setDescription(`📡 ${eventoAtivo.descricao}`)
                .addFields(
                    { name: '✨ Bônus Orbital', value: `+${Math.round((eventoAtivo.bonus - 1) * 100)}% em todos ganhos!`, inline: true },
                    { name: '⏰ Duração', value: `${eventoAtivo.duracao} dias`, inline: true },
                    { name: '⏰ Expira em', value: `<t:${Math.floor(eventoExpira / 1000)}:R>`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Evento orbital ativo para todos os exploradores!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'info') {
            if (!eventoAtivo || eventoExpira < Date.now()) {
                const embed = new EmbedBuilder()
                    .setColor(0x3498DB)
                    .setTitle('🌌 Calma Cósmica')
                    .setDescription('Nenhum evento orbital está ativo no momento.\nContinue explorando para encontrar anomalias estelares!')
                    .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true })
                    .setFooter({ text: '🌠 Orbit • Eventos orbitais ocorrem aleatoriamente' });
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
                return;
            }
            
            const embed = new EmbedBuilder()
                .setColor(eventoAtivo.cor)
                .setTitle(`🎉 Evento Orbital Ativo: ${eventoAtivo.nome}`)
                .setDescription(`📡 ${eventoAtivo.descricao}`)
                .addFields(
                    { name: '✨ Bônus Orbital', value: `+${Math.round((eventoAtivo.bonus - 1) * 100)}% em todos ganhos!`, inline: true },
                    { name: '⏰ Termina', value: `<t:${Math.floor(eventoExpira / 1000)}:R>`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Aproveite os bônus orbitais!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'encerrar' && message.member.permissions.has('Administrator')) {
            eventoAtivo = null;
            eventoExpira = null;
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Evento Orbital Encerrado!')
                .setDescription('O evento orbital foi encerrado pelo Comando Orbital.')
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎉 Eventos Orbitais')
                .setDescription(eventoAtivo ? `🎊 **${eventoAtivo.nome}** está ativo!\n✨ Bônus: +${Math.round((eventoAtivo.bonus - 1) * 100)}% em todos ganhos!` : '🌌 Nenhum evento orbital ativo no momento.\nFique ligado para eventos especiais!')
                .addFields(
                    { name: '🌠 Eventos Orbitais Disponíveis', value: Object.values(eventosOrbitais).map(e => `**${e.nome}** - ${e.duracao} dias - +${Math.round((e.bonus - 1) * 100)}%`).join('\n'), inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Eventos orbitais são ativados pelo Comando Orbital!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};