// commands/utilidades/clanUtils.js
function recalcularPoderClan(clanId, db) {
    const clan = db.clans[clanId];
    if (!clan) return 0;
    
    let poder = 0;
    for (const membroId of clan.membros) {
        const user = db.usuarios[membroId];
        if (user) {
            const xpPower = (user.xpTotal || 0) / 1000;
            const orbPower = ((user.carteira || 0) + (user.banco || 0)) / 10000;
            poder += Math.floor(xpPower + orbPower);
        }
    }
    poder += clan.level * 100;
    poder += (clan.recursos || 0) / 1000;
    clan.poder = Math.floor(poder);
    return clan.poder;
}

function adicionarXPaoClan(clanId, xp, db) {
    const clan = db.clans[clanId];
    if (!clan) return false;
    clan.xp = (clan.xp || 0) + xp;
    const xpNecessario = clan.level * 1000;
    if (clan.xp >= xpNecessario) {
        clan.level++;
        clan.xp -= xpNecessario;
        return true;
    }
    return false;
}

module.exports = { recalcularPoderClan, adicionarXPaoClan };