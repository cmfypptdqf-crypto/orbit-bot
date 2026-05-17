import discord
from discord.ext import commands
from discord.ui import Select, View

class HelpMenu(View):
    def __init__(self):
        super().__init__(timeout=120)
        
        self.categorias = {
            "💰 Economia": {
                "emoji": "<:money:1324567890123456789>",
                "cor": 0xF1C40F,
                "comandos": [
                    ("daily", "Ganhe recompensa diária"),
                    ("work", "Trabalhe para ganhar moedas"),
                    ("pay @user", "Envie dinheiro para alguém"),
                    ("rank", "Veja o ranking global"),
                    ("bal", "Consulte seu saldo"),
                    ("shop", "Compre itens na loja"),
                    ("buy", "Compre um item específico")
                ]
            },
            "🎲 Diversão": {
                "emoji": "<a:confetti:1324567890123456790>",
                "cor": 0xE91E63,
                "comandos": [
                    ("meme", "Veja memes aleatórios"),
                    ("8ball", "Faça uma pergunta mágica"),
                    ("roll", "Role um dado de 1 a 6"),
                    ("ship @user", "Calcule o match amoroso"),
                    ("gif", "Envie um GIF aleatório"),
                    ("coinflip", "Cara ou coroa")
                ]
            },
            "⚔️ RPG": {
                "emoji": "<:sword:1324567890123456791>",
                "cor": 0x9B59B6,
                "comandos": [
                    ("perfil", "Veja sua ficha de personagem"),
                    ("batalhar", "Enfrente um inimigo"),
                    ("inventario", "Mostra seus itens"),
                    ("upar", "Aumente seu nível"),
                    ("loja", "Compre equipamentos RPG"),
                    ("ranking", "Ranking dos aventureiros")
                ]
            },
            "🛡️ Administração": {
                "emoji": "<:modshield:1324567890123456792>",
                "cor": 0x3498DB,
                "comandos": [
                    ("clear", "Limpe mensagens do chat"),
                    ("warn @user", "Advertir um membro"),
                    ("kick @user", "Expulsar do servidor"),
                    ("ban @user", "Banir permanentemente"),
                    ("slowmode", "Ativar modo lento"),
                    ("unban", "Desbanir usuário")
                ]
            },
            "🔨 Anti Raid": {
                "emoji": "<:antiraid:1324567890123456793>",
                "cor": 0xE74C3C,
                "comandos": [
                    ("antiraid on", "Ativar proteção anti-raid"),
                    ("antiraid off", "Desativar proteção"),
                    ("lockdown", "Bloquear o servidor"),
                    ("massban", "Banir múltiplos usuários"),
                    ("antijoin", "Prevenir entradas suspeitas"),
                    ("verification", "Sistema de verificação")
                ]
            }
        }
        
        select = Select(
            placeholder="📌 Selecione uma categoria de comandos",
            options=[
                discord.SelectOption(
                    label=nome,
                    value=nome,
                    description=f"Veja os comandos de {nome.split()[1]}",
                    emoji=nome.split()[0]
                )
                for nome in self.categorias.keys()
            ]
        )
        select.callback = self.select_callback
        self.add_item(select)
    
    async def select_callback(self, interaction: discord.Interaction):
        categoria_nome = interaction.data['values'][0]
        categoria = self.categorias[categoria_nome]
        
        # Embed principal
        embed = discord.Embed(
            title=f"{categoria_nome} • Comandos Disponíveis",
            description="```✨ Utilize os comandos abaixo para interagir com o bot```",
            color=categoria["cor"]
        )
        
        # Adicionar comandos formatados
        for cmd, desc in categoria["comandos"]:
            embed.add_field(
                name=f"`!{cmd}`",
                value=f"📝 {desc}",
                inline=False
            )
        
        # Rodapé bonito
        embed.set_footer(
            text=f"📖 Categoria: {categoria_nome} • Use !help para voltar ao menu",
            icon_url=interaction.user.avatar.url if interaction.user.avatar else None
        )
        
        # Thumbnail decorativa
        embed.set_thumbnail(url="https://i.imgur.com/6Y8J8kK.png")
        
        await interaction.response.edit_message(embed=embed, view=self)

@bot.command()
async def help(ctx):
    # Embed inicial bonita
    embed = discord.Embed(
        title="📜 **Central de Ajuda**",
        description="> **Bem-vindo ao centro de comandos do bot!**\n> Selecione uma categoria no menu abaixo para ver todos os comandos disponíveis\n\n",
        color=0x5865F2
    )
    
    # Adicionar categorias em formato visual
    categorias_texto = ""
    for nome, dados in HelpMenu().categorias.items():
        emoji = nome.split()[0]
        categorias_texto += f"{emoji} **{nome}** – {len(dados['comandos'])} comandos\n"
    
    embed.add_field(
        name="🎯 **Categorias disponíveis:**",
        value=categorias_texto,
        inline=False
    )
    
    embed.add_field(
        name="ℹ️ **Informações**",
        value="• Clique no menu abaixo para navegar\n• Cada categoria possui comandos específicos\n• Use `!comando` para executar",
        inline=False
    )
    
    # Decorar embed
    embed.set_thumbnail(url="https://i.imgur.com/6Y8J8kK.png")
    embed.set_footer(
        text=f"Solicitado por {ctx.author.name}",
        icon_url=ctx.author.avatar.url if ctx.author.avatar else None
    )
    embed.set_image(url="https://i.imgur.com/3JZqVcL.png")  # Banner decorativo
    
    view = HelpMenu()
    await ctx.send(embed=embed, view=view)