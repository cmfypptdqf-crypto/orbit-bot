// commands/utilidades/levelSystem.js
function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    const nivel = Math.floor(Math.sqrt(xpTotal / 100)) + 1;
    return Math.min(100, Math.max(1, nivel));
}

function xpParaProximoNivel(nivelAtual) {
    return 100 * Math.pow(nivelAtual, 2);
}

function xpAtualNoNivel(xpTotal, nivelAtual) {
    const xpNecessarioAnterior = nivelAtual > 1 ? 100 * Math.pow(nivelAtual - 1, 2) : 0;
    return xpTotal - xpNecessarioAnterior;
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

module.exports = { calcularNivel, xpParaProximoNivel, xpAtualNoNivel, getTituloPorNivel };