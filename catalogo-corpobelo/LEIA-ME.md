# Catálogo Digital Corpo Belo — Guia completo

Este site é **independente**: não usa planilha. Todo o cadastro (os 70 produtos do catálogo antigo, com nomes, descrições, preços, tamanhos, cores, tabelas de medidas e fotos) está dentro do arquivo `produtos.js`.

## O que tem nesta pasta

| Arquivo / pasta | Para que serve |
|---|---|
| `index.html` | O catálogo que os clientes veem |
| `editor.html` | **Página para cadastrar e alterar produtos** (sem mexer em código) |
| `produtos.js` | O cadastro dos produtos |
| `config.js` | WhatsApp dos atendentes, textos do topo, cores |
| `assets/` | Visual e funcionamento do site (não precisa mexer) |
| `image/` | Logos, ícone e imagem de prévia do WhatsApp |
| `manifest.json` | Permite "Adicionar à tela inicial" no celular |

---

## PARTE 1 — Publicar no GitHub (conta nova)

### 1. Criar a conta (se ainda não tiver)
1. Acesse **github.com** e clique em **Sign up**.
2. Escolha um nome de usuário — ele vai aparecer no link. Ex.: usuário `corpobelo` → link `https://corpobelo.github.io/...`
3. Confirme o e-mail.

### 2. Criar o repositório
1. Logado, clique no **+** (canto superior direito) → **New repository**.
2. Em *Repository name* escreva o nome que quer no link. Ex.: `catalogo`.
3. Marque **Public**.
4. Clique em **Create repository**.

### 3. Enviar os arquivos
1. Descompacte o arquivo `catalogo-corpobelo.zip` no computador.
2. Na página do repositório, clique no link **uploading an existing file**.
3. Abra a pasta descompactada, selecione **todo o conteúdo dela** (os arquivos e as pastas `assets` e `image`) e arraste para a área de upload.
   - Arraste o *conteúdo*, não a pasta em si — o `index.html` precisa ficar na raiz.
4. Desça e clique em **Commit changes**.

### 4. Ligar o site
1. No repositório, clique em **Settings** (engrenagem) → no menu da esquerda, **Pages**.
2. Em *Source*, escolha **Deploy from a branch**.
3. Em *Branch*, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
4. Aguarde 1 a 3 minutos e atualize a página: aparecerá **"Your site is live at…"** com o link.
   Ex.: `https://corpobelo.github.io/catalogo/`

### 5. Prévia com a logo no WhatsApp (1 minuto)
Para que, ao enviar o link no WhatsApp, apareça a imagem com a logo:
1. No repositório, abra `index.html` e clique no lápis ✏️.
2. Procure a linha com `og:image` (Ctrl+F).
3. Troque `content="image/compartilhar.jpg"` pelo endereço completo:
   `content="https://SEU-USUARIO.github.io/SEU-REPOSITORIO/image/compartilhar.jpg"`
4. **Commit changes**.

> **Dica:** se quiser o link mais curto (`https://corpobelo.github.io`), dê ao repositório exatamente o nome `SEU-USUARIO.github.io`.

---

## PARTE 2 — Cadastrar e alterar produtos (dia a dia)

### Pelo editor (recomendado)
1. Abra **`SEU-LINK/editor.html`** (ex.: `https://corpobelo.github.io/catalogo/editor.html`).
2. Faça as alterações:
   - Clique num produto da lista para editar preço, desconto, descrição, cores, tamanhos, fotos…
   - **+ Novo produto** para cadastrar; **Duplicar** para criar um parecido.
   - Desmarque **"Produto visível"** para esconder (ex.: esgotado) sem apagar.
   - **↑ Subir / ↓ Descer** muda a ordem no catálogo.
   - O editor mostra como o preço ficará no site (com desconto).
3. Clique em **⬇ Baixar produtos.js**.
4. No GitHub, no repositório: **Add file → Upload files** → arraste o `produtos.js` baixado → **Commit changes**.
5. Em 1 a 3 minutos o catálogo está atualizado.

> As alterações ficam guardadas no navegador até você baixar o arquivo, então dá para editar aos poucos. **Nada muda no site até o passo 4.**
> O link do editor não é divulgado aos clientes, e mesmo que alguém o abra, não consegue alterar o site — só baixaria um arquivo.

### Direto no GitHub (alterações rápidas)
Abra `produtos.js` no GitHub, clique no lápis ✏️, use Ctrl+F para achar o produto, altere (ex.: o preço) e clique em **Commit changes**. Mantenha as aspas e vírgulas.

### Fotos
- As fotos atuais estão hospedadas no **postimg.cc** e continuam funcionando normalmente.
- Para fotos novas, você pode continuar usando o postimg (copie o **"Link direto"**, que termina em `.jpg`) ou **Google Drive** (compartilhe como "Qualquer pessoa com o link" e cole o link).
- Ou guarde as fotos no próprio GitHub: crie a pasta `image/produtos`, envie as fotos (Add file → Upload files) e, no editor, cole `image/produtos/nome-da-foto.jpg`.
- Formato ideal: vertical 4:5 (ex.: 1080×1350).

---

## PARTE 3 — WhatsApp, textos e cores (`config.js`)

1. No GitHub, abra `config.js` e clique no lápis ✏️.
2. Altere o que precisar:
   - **Atendentes:** para incluir alguém, copie uma linha `{ nome: '…', telefone: '55…' },` e altere.
   - **Telefone:** só números, com 55 + DDD.
   - **Textos do topo, rodapé e mensagem do pedido.**
   - **Cores:** para criar uma cor nova, adicione uma linha (nome e código da cor). Ela aparece no editor.
   - **Google Analytics:** está com o código do catálogo antigo. Troque pelo seu ou deixe `''` para desligar.
3. **Commit changes**.

> Se algo der errado, no GitHub abra o arquivo → **History** e volte para a versão anterior.

---

## O que mudou em relação ao catálogo anterior

- Não depende mais de planilha: cadastro próprio + **editor visual de produtos**.
- Logo oficial no topo, rodapé e ícone da aba.
- **Busca** de produtos e **ordenação** (menor/maior preço, A–Z, promoções).
- **Categorias automáticas** com contagem — categoria nova aparece sozinha.
- **Carrinho salvo**: o cliente fecha o site e, ao voltar, o carrinho continua lá.
- Cliente pode informar **nome e observação**, que vão na mensagem do WhatsApp.
- Atendentes configuráveis; botão flutuante **"Dúvidas?"**.
- Fotos com **deslizar o dedo** no celular e visualização ampliada.
- Botão **compartilhar produto**: link que abre direto naquele produto.
- Selo de **destaque** opcional ("Mais vendido", "Novo"…).
- Preços no formato brasileiro (inclusive acima de R$ 1.000,00).
- Modo escuro que lembra a escolha do cliente; prévia com logo no WhatsApp; pode ser instalado na tela inicial do celular.
