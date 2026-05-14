// commands/orbit.js
const { EmbedBuilder } = require('discord.js');
const { getOrbitResponse, getRandomFrase, checkRandomEvent } = require('../utilidades/orbitAI.js');

module.exports = {
    name: 'orbit',
    description: 'Interaja com o sistema Orbit',
    aliases: ['ia', 'bot', 'assistente'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'status') {
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🤖 Sistema Orbit - Status')
                .setDescription('🌌 **Inteligência Artificial Intergaláctica**')
                .addFields(
                    { name: '📡 Versão', value: '2.0.0', inline: true },
                    { name: '🔋 Energia', value: '100%', inline: true },
                    { name: '🌍 Servidores', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '👥 Usuários', value: `${client.users.cache.size}`, inline: true },
                    { name: '🚀 Comandos', value: `${client.commands?.size || 0}`, inline: true },
                    { name: '✨ Status', value: '🟢 Online', inline: true }
                )
                .setFooter({ text: 'Orbit • IA Espacial' })
                .setTimestamp();
            
            return await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'evento') {
            const evento = checkRandomEvent();
            if (evento) {
                const embed = new EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle('🎲 Evento Cósmico Detectado!')
                    .setDescription(evento.frase)
                    .addFields(
                        { name: '📊 Probabilidade', value: `${(evento.chance * 100)}%`, inline: true },
                        { name: '⚡ Efeito', value: evento.efeito || 'Neutro', inline: true }
                    );
                
                await message.reply({ embeds: [embed] });
            } else {
                await message.reply('🌌 Nenhum evento cósmico detectado no momento... Continue explorando!');
            }
            return;
        }
        
        if (subcmd === 'conversar') {
            const pergunta = args.slice(1).join(' ');
            if (!pergunta) return message.reply('❌ Use: `bt!orbit conversar <mensagem>`');
            
            const respostas = [
                `🌌 *Analisando*... ${pergunta}? Interessante...`,
                `🤖 Orbit processa: "${pergunta}". Continue explorando, comandante!`,
                `📡 Detectei sua pergunta. O universo guarda muitas respostas...`,
                `🚀 Boa pergunta! Os sistemas ainda estão calculando a melhor resposta.`,
                `✨ Orbit não tem certeza, mas acredita que a força está com você!`
            ];
            
            const resposta = respostas[Math.floor(Math.random() * respostas.length)];
            
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('🤖 Orbit respondendo...')
                .setDescription(resposta)
                .setFooter({ text: 'Pergunte algo mais para Orbit!' });
            
            await message.reply({ embeds: [embed] });
            return;
        }
        
        const saudacao = getOrbitResponse('saudacao');
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('🤖 Orbit - IA Espacial')
            .setDescription(`${saudacao}\n\n📡 **Sistema Orbit v2.0 ativo**\n🌌 Explorando o universo em sua companhia!`)
            .addFields(
                { name: '📋 Comandos disponíveis', value: '`bt!orbit status` - Ver status\n`bt!orbit evento` - Ver evento atual\n`bt!orbit conversar <msg>` - Converse com Orbit', inline: false }
            )
            .setFooter({ text: '🌠 Orbit está aqui para ajudar!' });
        
        await message.reply({ embeds: [embed] });
    }
};