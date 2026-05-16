collector.on('collect', async (interaction) => {
    if (!interaction.customId.startsWith('pvp_')) return;
    
    const parts = interaction.customId.split('_');
    const action = parts[1];
    const battleId = parts[2];
    const side = parts[3];
    const habIndex = parts[4];
    
    const currentBattle = battles.get(battleId);
    
    if (!currentBattle) {
        return interaction.reply({ content: '❌ Batalha não encontrada!', ephemeral: true });
    }
    
    // VERIFICAÇÃO DE TURNO CORRIGIDA
    const jogadorId = interaction.user.id;
    const turnoAtualId = currentBattle.turno;
    
    // Verificar se é o turno do jogador
    if (jogadorId !== turnoAtualId) {
        const quemJoga = turnoAtualId === currentBattle.desafiante.id ? currentBattle.desafiante.username : currentBattle.adversario.username;
        return interaction.reply({ 
            content: `❌ Não é seu turno! Agora é a vez de **${quemJoga}**. Aguarde sua vez!`, 
            ephemeral: true 
        });
    }
    
    // Verificar se o botão é do jogador correto (evitar clicar no botão do oponente)
    const isDesafiante = jogadorId === currentBattle.desafiante.id;
    const botaoCorreto = (isDesafiante && side === 'desafiante') || (!isDesafiante && side === 'adversario');
    
    if (!botaoCorreto) {
        return interaction.reply({ content: '❌ Você não pode usar os botões do oponente!', ephemeral: true });
    }
    
    const attacker = isDesafiante ? currentBattle.desafiante : currentBattle.adversario;
    const defender = isDesafiante ? currentBattle.adversario : currentBattle.desafiante;
    
    // Desistir
    if (action === 'desistir') {
        const vencedor = defender;
        const perdedor = attacker;
        
        // Transferir aposta
        db.usuarios[vencedor.id].carteira = (db.usuarios[vencedor.id].carteira || 0) + currentBattle.aposta;
        db.usuarios[perdedor.id].carteira = (db.usuarios[perdedor.id].carteira || 0) - currentBattle.aposta;
        db.usuarios[vencedor.id].pvpVitorias = (db.usuarios[vencedor.id].pvpVitorias || 0) + 1;
        db.usuarios[perdedor.id].pvpDerrotas = (db.usuarios[perdedor.id].pvpDerrotas || 0) + 1;
        
        // XP para vencedor
        const xpGanho = 50 + currentBattle.aposta / 100;
        db.usuarios[vencedor.id].xpTotal = (db.usuarios[vencedor.id].xpTotal || 0) + xpGanho;
        
        saveDB(db);
        battles.delete(battleId);
        
        const embedDesistir = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🏳️ BATALHA ENCERRADA!')
            .setDescription(`${perdedor.username} desistiu da batalha!`)
            .addFields(
                { name: '🏆 Vencedor', value: vencedor.username, inline: true },
                { name: '💰 Prêmio', value: `${currentBattle.aposta.toLocaleString()} Orbs`, inline: true },
                { name: '✨ XP Ganho', value: `${Math.floor(xpGanho)}`, inline: true }
            );
        
        await interaction.update({ embeds: [embedDesistir], components: [] });
        return;
    }
    
    let danoCalculado;
    let habilidadeUsada = null;
    
    // Ataque normal
    if (action === 'atk') {
        danoCalculado = calcularDano(attacker.stats.atk, defender.stats.def, attacker.stats.crit, defender.stats.evasao);
    } 
    // Habilidade
    else if (action === 'habilidade') {
        const habIndexNum = parseInt(habIndex);
        const classeAtacante = db.usuarios[attacker.id]?.classe || 'guerreiro';
        const classeInfo = getClasseInfo(classeAtacante);
        habilidadeUsada = classeInfo.habilidades[habIndexNum];
        
        if (!habilidadeUsada) {
            return interaction.reply({ content: '❌ Habilidade inválida!', ephemeral: true });
        }
        
        if (currentBattle.habilidadesUsadas.includes(`${attacker.id}_${habilidadeUsada}`)) {
            return interaction.reply({ content: '❌ Você já usou essa habilidade nesta batalha!', ephemeral: true });
        }
        
        danoCalculado = calcularDano(attacker.stats.atk, defender.stats.def, attacker.stats.crit, defender.stats.evasao, habilidadeUsada);
        currentBattle.habilidadesUsadas.push(`${attacker.id}_${habilidadeUsada}`);
    }
    
    // Verificar evasão
    const evadiu = Math.random() * 100 < defender.stats.evasao;
    
    if (evadiu && action !== 'desistir') {
        const embedEvasao = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('💨 EVASÃO!')
            .setDescription(`${defender.username} desviou do ataque de ${attacker.username}!`);
        
        await interaction.update({ embeds: [embedEvasao] });
    } else {
        // Aplicar dano ou cura
        if (habilidadeUsada === 'Cura Leve') {
            const cura = Math.abs(danoCalculado.dano);
            attacker.hpAtual = Math.min(attacker.stats.hpMax, attacker.hpAtual + cura);
            
            const embedCura = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💚 CURA!')
                .setDescription(`${attacker.username} usou ${habilidadeUsada} e recuperou **${cura}** de HP!`)
                .addFields(
                    { name: '❤️ HP do Atacante', value: `${attacker.hpAtual}/${attacker.stats.hpMax}`, inline: true }
                );
            
            await interaction.update({ embeds: [embedCura] });
        } else {
            defender.hpAtual -= danoCalculado.dano;
            
            const embedAtaque = new EmbedBuilder()
                .setColor(danoCalculado.isCrit ? 0xFF0000 : 0xFFA500)
                .setTitle(habilidadeUsada ? `✨ ${habilidadeUsada}!` : '⚔️ ATAQUE!')
                .setDescription(`${attacker.username} atacou ${defender.username} e causou **${danoCalculado.dano}** de dano!${danoCalculado.isCrit ? ' **CRÍTICO!**' : ''}`)
                .addFields(
                    { name: '❤️ HP do Defensor', value: `${Math.max(0, defender.hpAtual)}/${defender.stats.hpMax}`, inline: true }
                );
            
            await interaction.update({ embeds: [embedAtaque] });
        }
    }
    
    // Verificar fim de batalha
    if (defender.hpAtual <= 0) {
        const vencedor = attacker;
        const perdedor = defender;
        
        // Transferir aposta
        db.usuarios[vencedor.id].carteira = (db.usuarios[vencedor.id].carteira || 0) + currentBattle.aposta;
        db.usuarios[perdedor.id].carteira = (db.usuarios[perdedor.id].carteira || 0) - currentBattle.aposta;
        db.usuarios[vencedor.id].pvpVitorias = (db.usuarios[vencedor.id].pvpVitorias || 0) + 1;
        db.usuarios[perdedor.id].pvpDerrotas = (db.usuarios[perdedor.id].pvpDerrotas || 0) + 1;
        
        // XP para vencedor
        const xpGanho = 100 + currentBattle.aposta / 100;
        db.usuarios[vencedor.id].xpTotal = (db.usuarios[vencedor.id].xpTotal || 0) + xpGanho;
        
        saveDB(db);
        battles.delete(battleId);
        
        const finalEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏆 VITÓRIA!')
            .setDescription(`${vencedor.username} venceu a batalha!`)
            .addFields(
                { name: '💰 Prêmio', value: `${currentBattle.aposta.toLocaleString()} Orbs`, inline: true },
                { name: '✨ XP Ganho', value: `${Math.floor(xpGanho)}`, inline: true },
                { name: '🏅 Total de Vitórias', value: `${db.usuarios[vencedor.id].pvpVitorias}`, inline: true }
            );
        
        await interaction.followUp({ embeds: [finalEmbed] });
        return;
    }
    
    // MUDAR TURNO - Corrigido
    currentBattle.turno = currentBattle.turno === currentBattle.desafiante.id ? currentBattle.adversario.id : currentBattle.desafiante.id;
    currentBattle.turnoNumero++;
    battles.set(battleId, currentBattle);
    
    // Verificar se a batalha ainda existe
    const updatedBattle = battles.get(battleId);
    if (!updatedBattle) return;
    
    // Atualizar botões para o próximo jogador
    const nextAttacker = updatedBattle.turno === updatedBattle.desafiante.id ? updatedBattle.desafiante : updatedBattle.adversario;
    const nextAttackerClasse = db.usuarios[nextAttacker.id]?.classe || 'guerreiro';
    const nextSide = updatedBattle.turno === updatedBattle.desafiante.id ? 'desafiante' : 'adversario';
    
    const components = getHabilidadesButton(nextAttackerClasse, battleId, nextSide === 'desafiante');
    
    const turnEmbed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(`⚔️ Turno ${updatedBattle.turnoNumero}`)
        .setDescription(`🎭 **${nextAttacker.username}** é sua vez de atacar!`)
        .addFields(
            { name: '❤️ Desafiante HP', value: `${updatedBattle.desafiante.hpAtual}/${updatedBattle.desafiante.stats.hpMax}`, inline: true },
            { name: '❤️ Adversário HP', value: `${updatedBattle.adversario.hpAtual}/${updatedBattle.adversario.stats.hpMax}`, inline: true }
        );
    
    await interaction.followUp({ embeds: [turnEmbed], components });
});