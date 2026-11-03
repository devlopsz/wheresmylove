# Onde Está Meu Amor? — jogo de plataforma

Jogo estático para navegador, preparado para jogar em formato horizontal no computador e no celular. Não precisa de servidor ou dependências: os arquivos podem ser publicados diretamente no Cloudflare Pages.

## Como jogar

- Computador: `A`/`D` ou setas para andar, `Espaço` (ou `W`/`↑`) para pular, `X` (ou `J`) para atacar.
- Celular deitado: arraste o analógico para os lados; use `↑` para pular e `X` para atacar. Na orientação vertical aparece a instrução para virar o celular.
- O ataque elimina apenas um inimigo próximo e à frente. Encostar em inimigos tira uma vida. Há três vidas.
- Entre em uma das três portas para abrir a página correspondente em `areas/`.

## Trocar as imagens

1. Copie as imagens para `assets/images/`.
2. Abra `game.js` e edite o objeto `ASSETS` no começo do arquivo (linhas 5–15; caminhos nas linhas 6–14). Troque o texto vazio pelo caminho, entre aspas. Exemplo: `player: "assets/images/personagem.png"` na linha 9.
3. Salve e recarregue o jogo. Se o arquivo da imagem não existir ou ainda estiver carregando, a forma sólida de exemplo aparece no lugar.

| Campo no objeto `ASSETS` | Imagem usada para |
| --- | --- |
| `background` | Fundo da fase inteira |
| `ground` | Chão; a imagem é esticada ao longo do chão |
| `platform` | Plataformas suspensas |
| `player` | Personagem parado/em movimento |
| `playerAttack` | Personagem durante o ataque |
| `enemy` | Inimigos |
| `door` | As três portas |
| `heart` | Ícone repetido das três vidas |
| `gameOver` | Fundo da tela de fim de jogo; o botão de recomeçar fica por cima |

Prefira PNG ou WebP com fundo transparente para personagens, inimigos e portas. Cada imagem é ajustada ao retângulo do elemento. Os controles, regras e dimensões ficam em `game.js`; aparência e layout responsivo ficam em `style.css`.

## Publicar no Cloudflare Pages

Crie um projeto Pages apontando para este repositório ou envie a pasta. Use a raiz do projeto como diretório de saída. Não há comando de build; se a tela pedir, deixe o comando de build vazio. `index.html` é a página inicial.
