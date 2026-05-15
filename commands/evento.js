// commands/rpg/evento.js
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

// Eventos programados por data real
const eventosProgramados = {
    'halloween': { 
        nome: '🎃 Halloween', 
        bonus: 1.5, 
        cor: '#FF6600',
        inicio: { mes: 9, dia: 25 }, // 25 de Outubro (mês 9 = Outubro)
        fim: { mes: 10, dia: 2 }     // 2 de Novembro
    },
    'natal': { 
        nome: '🎄 Natal', 
        bonus: 2.0, 
        cor: '#FF0000',
        inicio: { mes: 11, dia: 20 }, // 20 de Dezembro
        fim: { mes: 0, dia: 5 }       // 5 de Janeiro
    },
    'aniversario': { 
        nome: '🎉 Aniversário do Servidor', 
        bonus: 1.3, 
        cor: '#FFD700',
        inicio: { mes: 2, dia: 15 },  // 15 de Março
        fim: { mes: 2, dia: 18 }      // 18 de Março
    },
    'verao': { 
        nome: '☀️ Festival de Verão', 
        bonus: 1.4, 
        cor: '#00CED1',
        inicio: { mes: 11, dia: 15 }, // 15 de Dezembro
        fim: { mes: 1, dia: 15 }      // 15 de Fevereiro
    },
    'ano_novo': { 
        nome: '🎆 Ano Novo', 
        bonus: 2.5, 
        cor: '#FFD700',
        inicio: { mes: 11, dia: 31 }, // 31 de Dezembro
        fim: { mes: 0, dia: 3 }       // 3 de Janeiro
    },
    'páscoa': { 
        nome: '🐰 Páscoa', 
        bonus: 1.6, 
        cor: '#FF69B4',
        inicio: { mes: 2, dia: 20 },  // Calcular baseado no ano
        fim: { mes: 3, dia: 5 }       // Configuração flexível
    }
};

// Eventos especiais (manuais, ativados por adm)
let eventosEspeciais = new Map(); // { id: { nome, bonus, cor, expira } }

// Função para calcular Páscoa (algoritmo computus)
function calcularPascoa(ano) {
    const a = ano % 19;
    const b = Math.floor(ano / 100);
    const c = ano % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return { mes: mes - 1, dia }; // Ajustar para array de meses (0-11)
}

// Verificar evento ativo automaticamente
function getEventoAtivo() {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const diaAtual = agora.getDate();
    const anoAtual = agora.getFullYear();
    
    // Verificar eventos programados
    for (const [id, evento] of Object.entries(eventosProgramados)) {
        let inicio = { ...evento.inicio };
        let fim = { ...evento.fim };
        
        // Caso especial para Páscoa
        if (id === 'páscoa') {
            const pascoa = calcularPascoa(anoAtual);
            inicio = { mes: pascoa.mes, dia: pascoa.dia - 7 };
            fim = { mes: pascoa.mes, dia: pascoa.dia + 7 };
        }
        
        // Verificar se está dentro do período
        let dentroPeriodo = false;
        
        if (fim.mes < inicio.mes) {
            // Evento que atravessa o ano (ex: Natal)
            if ((mesAtual > inicio.mes || (mesAtual === inicio.mes && diaAtual >= inicio.dia)) ||
                (mesAtual < fim.mes || (mesAtual === fim.mes && diaAtual <= fim.dia))) {
                dentroPeriodo = true;
            }
        } else {
            // Evento normal
            if ((mesAtual > inicio.mes || (mesAtual === inicio.mes && diaAtual >= inicio.dia)) &&
                (mesAtual < fim.mes || (mesAtual === fim.mes && diaAtual <= fim.dia))) {
                dentroPeriodo = true;
            }
        }
        
        if (dentroPeriodo) {
            return {
                ...evento,
                id,
                tipo: 'programado',
                expira: new Date(anoAtual, fim.mes, fim.dia, 23, 59, 59)
            };
        }
    }
    
    // Verificar eventos especiais ativos
    for (const [id, evento] of eventosEspeciais) {
        if (evento.expira > Date.now()) {
            return { ...evento, id, tipo: 'especial' };
        } else {
            eventosEspeciais.delete(id);
        }
    }
    
    return null;
}

// Aplicar bônus de evento (função para usar em outros comandos)
function aplicarBonusEvento(valor) {
    const evento = getEventoAtivo();
    if (evento) {
        return Math.floor(valor * evento.bonus);
    }
    return valor;
}

module.exports = {
    name: 'evento',
    aliases: ['event', 'eventos'],
    
    // Função para usar em outros comandos
    getBonusAtivo: () => {
        const evento = getEventoAtivo();
        return evento ? evento.bonus : 1;
    },
    
    getEventoAtivo: getEventoAtivo,
    aplicarBonusEvento: aplicarBonusEvento,
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const evento = getEventoAtivo();
        
        // Comandos de admin
        if (subcmd === 'criar' && message.member.permissions.has('Administrator')) {
            const nome = args[1];
            const bonus = parseFloat(args[2]);
            const duracaoHoras = parseInt(args[3]);
            
            if (!nome || !bonus || !duracaoHoras) {
                return message.reply('❌ Use: `bt!evento criar "Nome do Evento" 1.5 24`\n(Bonus: 1.5 = +50%, duração em horas)');
            }
            
            const eventId = Date.now().toString();
            eventosEspeciais.set(eventId, {
                nome: nome,
                bonus: bonus,
                cor: '#9B59B6',
                expira: Date.now() + (duracaoHoras * 60 * 60 * 1000)
            });
            
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('✨ EVENTO ESPECIAL CRIADO!')
                .setDescription(`📋 **${nome}**\n🎁 Bônus: +${Math.round((bonus - 1) * 100)}%\n⏰ Duração: ${duracaoHoras} horas`)
                .setFooter({ text: 'Evento manual ativado!' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'encerrar' && message.member.permissions.has('Administrator')) {
            const eventId = args[1];
            if (eventId && eventosEspeciais.has(eventId)) {
                eventosEspeciais.delete(eventId);
                await message.reply(`✅ Evento especial "${eventId}" encerrado!`);
            } else if (!eventId && evento?.tipo === 'especial') {
                // Encerrar evento especial atual
                for (const [id] of eventosEspeciais) {
                    eventosEspeciais.delete(id);
                }
                await message.reply('✅ Evento especial encerrado!');
            } else {
                await message.reply('❌ Nenhum evento especial ativo para encerrar!');
            }
        }
        
        // Comandos para todos
        else if (subcmd === 'info' || subcmd === 'status') {
            if (!evento) {
                const proximos = [];
                const agora = new Date();
                
                // Mostrar próximos eventos
                for (const [id, ev] of Object.entries(eventosProgramados)) {
                    let dataInicio = new Date(agora.getFullYear(), ev.inicio.mes, ev.inicio.dia);
                    if (dataInicio < agora) {
                        dataInicio.setFullYear(agora.getFullYear() + 1);
                    }
                    const diasRestantes = Math.ceil((dataInicio - agora) / (1000 * 60 * 60 * 24));
                    if (diasRestantes <= 30) { // Mostrar apenas próximos 30 dias
                        proximos.push(`**${ev.nome}** - Em ${diasRestantes} dias`);
                    }
                }
                
                const embed = new EmbedBuilder()
                    .setColor(0x808080)
                    .setTitle('🌌 Nenhum evento ativo no momento')
                    .setDescription(proximos.length > 0 
                        ? `📅 **Próximos eventos:**\n${proximos.join('\n')}`
                        : 'Fique ligado para eventos especiais programados!')
                    .setFooter({ text: 'Eventos automáticos ocorrem em datas comemorativas!' });
                
                return message.reply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor(evento.cor || '#FFD700')
                .setTitle(`🎉 EVENTO ATIVO: ${evento.nome}`)
                .setDescription(`✨ **Bônus:** +${Math.round((evento.bonus - 1) * 100)}% em todos os ganhos!\n📊 **Multiplicador:** ${evento.bonus}x`)
                .addFields(
                    { name: '🎯 O que ganha bônus?', value: '✅ Missões completadas\n✅ Recompensas diárias\n✅ Batalhas PvP\n✅ XP de comandos', inline: false }
                );
            
            if (evento.tipo === 'programado') {
                embed.addFields({ name: '⏰ Termina em', value: `<t:${Math.floor(evento.expira / 1000)}:R>`, inline: true });
                embed.setFooter({ text: 'Evento programado automático!' });
            } else {
                embed.addFields({ name: '⏰ Termina em', value: `<t:${Math.floor(evento.expira / 1000)}:R>`, inline: true });
                embed.setFooter({ text: 'Evento especial criado por um admin!' });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'calendario') {
            const embed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('📅 Calendário de Eventos 2024')
                .setDescription('Eventos programados que ocorrem automaticamente!')
                .addFields(
                    { name: '🎃 Halloween', value: '25/10 - 02/11\nBônus: +50%', inline: true },
                    { name: '🎄 Natal', value: '20/12 - 05/01\nBônus: +100%', inline: true },
                    { name: '🎆 Ano Novo', value: '31/12 - 03/01\nBônus: +150%', inline: true },
                    { name: '🎉 Aniversário Servidor', value: '15/03 - 18/03\nBônus: +30%', inline: true },
                    { name: '☀️ Festival Verão', value: '15/12 - 15/02\nBônus: +40%', inline: true },
                    { name: '🐰 Páscoa', value: 'Semana da Páscoa\nBônus: +60%', inline: true }
                )
                .setFooter({ text: 'Eventos ativam automaticamente! Admins podem criar eventos especiais' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            // Comando padrão
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎉 Sistema de Eventos')
                .setDescription(evento 
                    ? `🎊 **${evento.nome}** está ATIVO!\n✨ Bônus atual: **+${Math.round((evento.bonus - 1) * 100)}%** em todos ganhos!`
                    : '🌌 Nenhum evento ativo no momento.')
                .addFields(
                    { name: '📋 Comandos', value: '`bt!evento info` - Ver evento atual\n`bt!evento calendario` - Ver eventos programados\n`bt!evento status` - Status detalhado', inline: false },
                    { name: '🎯 Bônus aplicado em', value: '• Missões\n• Recompensas diárias\n• Batalhas PvP\n• XP e moedas', inline: false }
                )
                .setFooter({ text: 'Eventos programados acontecem automaticamente em datas especiais!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};