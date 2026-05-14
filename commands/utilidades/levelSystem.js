// commands/utilidades/levelSystem.js
function calcularNivel(totalOrbs) {
    if (totalOrbs <= 0) return 1;
    const nivel = Math.floor(Math.log10(totalOrbs / 100 + 1) * 15);
    return Math.max(1, Math.min(100, nivel));
}

function xpParaProximoNivel(nivelAtual) {
    return nivelAtual * 1000;
}

function xpAtual(totalOrbs, nivelAtual) {
    const xpNecessario = xpParaProximoNivel(nivelAtual);
    return totalOrbs % xpNecessario;
}

function getTituloPorNivel(nivel) {
    if (nivel >= 100) return '👑 Lenda Galáctica';
    if (nivel >= 80) return '⭐ Magnata Cósmico';
    if (nivel >= 60) return '🚀 Comandante Estelar';
    if (nivel >= 40) return '🌌 Explorador Espacial';
    if (nivel >= 20) return '🛸 Viajante das Estrelas';
    if (nivel >= 10) return '🌟 Recruta Espacial';
    return '🌱 Aprendiz Cósmico';
}

module.exports = { calcularNivel, xpParaProximoNivel, xpAtual, getTituloPorNivel };
