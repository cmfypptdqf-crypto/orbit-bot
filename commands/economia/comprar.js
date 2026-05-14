// commands/economia/comprar.js (com Orbit Prime)
// Adicione no embed quando comprar VIP:

if (item.tipo === 'vip') {
    const agora = Date.now();
    const expira = agora + (item.dias * 86400000);
    
    if (!db.vip_list) db.vip_list = {};
    db.vip_list[userId] = { tier: item.tier, expira: expira, multiplicador: item.mult };
    
    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('⭐ Orbit Prime Ativado!')
        .setDescription(`Parabéns! Agora você é **Orbit Prime ${item.tier.toUpperCase()}** por ${item.dias} dias!`)
        .addFields(
            { name: '✨ Multiplicador', value: `${item.mult}x em todos ganhos`, inline: true },
            { name: '💰 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
        )
        .setFooter({ text: '⭐ Orbit Prime • Benefícios exclusivos para exploradores' });
    saveDB(db);
    return await message.reply({ embeds: [embed] });
}