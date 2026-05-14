// Exemplo de como clã e galáxia se integram

// 1. Clã conquista uma galáxia
const clan = db.clans[clanId];
const galaxia = galaxias[galaxiaId];

// 2. Todos membros ganham bônus da galáxia
for (const membro of clan.membros) {
    // Bônus de +5% em todas atividades
    aplicarBonus(membro, galaxia.bonus);
}

// 3. Clã ganha poder baseado na galáxia
clan.poder += galaxia.defesa / 10;

// 4. Guerra entre clãs pela galáxia
if (clanAtacante.poder > clanDefensor.poder) {
    // Clã atacante toma a galáxia
    galaxia.dono = clanAtacante.id;
}