// commands/economia/perfil.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
    name: 'perfil',
    description: 'Mostra seu perfil espacial',
    aliases: ['profile', 'me'],
    
    async executeSlash(interaction, client) {
        const user = interaction.user;
        await interaction.deferReply();
        
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    width: 1000px;
                    height: 500px;
                    background: linear-gradient(135deg, #0a0a2a, #1a1a4a, #2a0a3a);
                    font-family: 'Segoe UI', Arial;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }
                .stars {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                }
                .star {
                    position: absolute;
                    background: white;
                    border-radius: 50%;
                    opacity: ${Math.random()};
                }
                .card {
                    width: 920px;
                    height: 440px;
                    background: rgba(0,0,0,0.75);
                    border-radius: 30px;
                    border: 2px solid #FFD700;
                    position: relative;
                    backdrop-filter: blur(5px);
                    box-shadow: 0 0 30px rgba(0,0,0,0.5);
                }
                .avatar {
                    position: absolute;
                    left: 40px;
                    top: 40px;
                    width: 130px;
                    height: 130px;
                    border-radius: 50%;
                    border: 4px solid #FFD700;
                    box-shadow: 0 0 20px rgba(255,215,0,0.3);
                }
                .username {
                    position: absolute;
                    left: 200px;
                    top: 50px;
                    font-size: 32px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                .badge {
                    position: absolute;
                    left: 200px;
                    top: 100px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                }
                .stats {
                    position: absolute;
                    left: 200px;
                    top: 160px;
                }
                .stat {
                    margin-bottom: 25px;
                    display: flex;
                    align-items: center;
                }
                .stat-icon {
                    font-size: 24px;
                    width: 50px;
                }
                .stat-label {
                    font-size: 16px;
                    color: #FFD700;
                    width: 120px;
                }
                .stat-value {
                    font-size: 22px;
                    color: white;
                    font-weight: bold;
                }
                .level {
                    position: absolute;
                    right: 40px;
                    top: 40px;
                    text-align: center;
                }
                .level-number {
                    font-size: 48px;
                    font-weight: bold;
                    color: #FFD700;
                }
                .level-text {
                    font-size: 14px;
                    color: #aaa;
                }
                .xp-bar {
                    position: absolute;
                    bottom: 40px;
                    left: 40px;
                    right: 40px;
                    height: 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                    overflow: hidden;
                }
                .xp-fill {
                    width: 65%;
                    height: 100%;
                    background: linear-gradient(90deg, #FFD700, #FFA500);
                    border-radius: 10px;
                }
                .xp-text {
                    position: absolute;
                    bottom: 70px;
                    left: 40px;
                    font-size: 12px;
                    color: #aaa;
                }
                .inventory {
                    position: absolute;
                    right: 40px;
                    top: 120px;
                    width: 250px;
                }
                .inv-title {
                    font-size: 14px;
                    color: #FFD700;
                    margin-bottom: 10px;
                }
                .inv-item {
                    font-size: 12px;
                    color: white;
                    margin-bottom: 5px;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <img class="avatar" src="${user.displayAvatarURL({ extension: 'png', size: 256 })}">
                <div class="username">${user.username}</div>
                <div class="badge">⭐ VIP DIAMANTE</div>
                <div class="stats">
                    <div class="stat"><span class="stat-icon">💰</span><span class="stat-label">ORBS</span><span class="stat-value">125.000</span></div>
                    <div class="stat"><span class="stat-icon">🏦</span><span class="stat-label">BANCO</span><span class="stat-value">50.000</span></div>
                    <div class="stat"><span class="stat-icon">🚀</span><span class="stat-label">MISSÕES</span><span class="stat-value">127</span></div>
                    <div class="stat"><span class="stat-icon">🎯</span><span class="stat-label">RANK</span><span class="stat-value">#15</span></div>
                </div>
                <div class="level">
                    <div class="level-number">42</div>
                    <div class="level-text">NÍVEL</div>
                </div>
                <div class="inventory">
                    <div class="inv-title">🎒 ITENS ESPECIAIS</div>
                    <div class="inv-item">🔭 Telescópio Avançado x2</div>
                    <div class="inv-item">🚀 Nave Explorer x1</div>
                    <div class="inv-item">💍 Anel Cósmico x1</div>
                    <div class="inv-item">🍀 Amuleto da Sorte x3</div>
                </div>
                <div class="xp-text">🪐 PRÓXIMO NÍVEL: 1.250 XP</div>
                <div class="xp-bar"><div class="xp-fill"></div></div>
            </div>
        </body>
        </html>
        `;
        
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1000, height: 500 });
        await page.setContent(html);
        
        const screenshot = await page.screenshot({ type: 'png' });
        await browser.close();
        
        const attachment = new AttachmentBuilder(screenshot, { name: 'perfil.png' });
        await interaction.editReply({ files: [attachment] });
    }
};