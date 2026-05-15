const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const eventos = {
    'halloween': { nome: '🎃 Halloween', duracao: 7, bonus: 1.5, cor: '#FF6600' },
    'natal': { nome: '🎄 Natal', duracao: 15, bonus: 2.0, cor: '#FF0000' },
    'aniversario': { nome: '🎉 Aniversário', duracao: 3, bonus: 1.3, cor: '#FFD700' },
    'cosmico': { nome: '🌌 Cósmico', duracao: 5, bonus: 1.8, cor: '#9B59B6' }
};

let eventoAtivo = null;
let eventoExpira = null;

// Função para aplicar bônus de evento (será usada por outros comandos)
function aplicarBonusEvento(valor) {
    if (eventoAtivo && eventoExpira && eventoExpira > Date.now()) {
        return Math.floor(valor * eventoAtivo.bonus);
    }
    return valor;
}

// Função para obter evento ativo
function getEventoAtivo() {
    if (eventoAtivo && eventoExpira && eventoExpira > Date.now()) {
        return eventoAtivo;
    }
    return null;
}

module.exports = {
    name: 'evento',
    aliases: ['event', 'eventos'],
    aplicarBonusEvento,  // Exportando a função
    getEventoAtivo,      // Exportando a função
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'iniciar' && message.member.permissions.has('Administrator')) {
            const eventoId = args[1];
            if (!eventoId || !eventos[eventoId]) return message.reply('❌ Evento inválido! Use: `halloween`, `natal`, `aniversario`, `cosmico`');
            
            eventoAtivo = eventos[eventoId];
            eventoExpira = Date.now() + (eventoAtivo.duracao * 24 * 60 * 60 * 1000);
            
            const embed = new EmbedBuilder()
                .setColor(eventoAtivo.cor)
                .setTitle(`🎉 EVENTO ATIVADO: ${eventoAtivo.nome}`)
                .setDescription(`✨ Bônus: +${Math.round((eventoAtivo.bonus - 1) * 100)}% em todos ganhos!\n⏰ Duração: ${eventoAtivo.duracao} dias\n📅 Termina: <t:${Math.floor(eventoExpira / 1000)}:R>`);
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'info') {
            if (!eventoAtivo || eventoExpira < Date.now()) {
                return message.reply('🌌 Nenhum evento ativo no momento!');
            }
            
            const embed = new EmbedBuilder()
                .setColor(eventoAtivo.cor)
                .setTitle(`🎉 Evento Ativo: ${eventoAtivo.nome}`)
                .setDescription(`✨ Bônus: +${Math.round((eventoAtivo.bonus - 1) * 100)}% em todos ganhos!\n⏰ Termina: <t:${Math.floor(eventoExpira / 1000)}:R>`);
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'encerrar' && message.member.permissions.has('Administrator')) {
            eventoAtivo = null;
            eventoExpira = null;
            await message.reply('✅ Evento encerrado!');
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎉 Eventos Especiais')
                .setDescription(eventoAtivo ? `🎊 **${eventoAtivo.nome}** está ativo!\n✨ Bônus: +${Math.round((eventoAtivo.bonus - 1) * 100)}% em todos ganhos!` : '🌌 Nenhum evento ativo no momento.\nFique ligado para eventos especiais!')
                .addFields(
                    { name: 'Eventos Disponíveis', value: Object.values(eventos).map(e => `**${e.nome}** - ${e.duracao} dias - +${Math.round((e.bonus - 1) * 100)}%`).join('\n'), inline: false }
                );
            await message.reply({ embeds: [embed] });
        }
    }
};
