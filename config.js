/* =====================================================================
   CORPO BELO — CONFIGURAÇÕES DO CATÁLOGO
   ---------------------------------------------------------------------
   Este é o ÚNICO arquivo que você precisa editar no GitHub para mudar
   informações gerais do site. Produtos, preços e fotos NÃO ficam aqui:
   ficam no arquivo produtos.js (edite pelo editor.html — veja o LEIA-ME.md).

   Regras simples para editar sem quebrar:
   - Mantenha os textos entre aspas  '  '
   - Mantenha a vírgula no fim de cada linha
   - Telefones: só números, com 55 + DDD (ex: 5567999999999)
   ===================================================================== */

window.CATALOGO_CONFIG = {

  /* 1) ATENDENTES — para quem o pedido é enviado no WhatsApp.
        Para adicionar alguém, copie uma linha { ... }, e altere. */
  atendentes: [
    { nome: 'Breno',   telefone: '5567993435284' },
  ],

  /* Número do botão flutuante "Dúvidas? Fale conosco" */
  whatsappDuvidas: '5567993435284',

  /* 2) TEXTOS DO TOPO DO SITE */
  textos: {
    etiqueta: 'Catálogo Oficial',
    tituloLinha1: 'Conforto, <em>Segurança</em>',
    tituloLinha2: '&amp; Elegância em cada detalhe',
    subtitulo: 'Uma linha completa de produtos desenvolvidos para recuperação, suporte, bem-estar e autoestima no pós-operatório.',
    rodape: 'Corpo Belo — Todos os direitos reservados',
    mensagemPedido: 'Olá! Montei meu carrinho no catálogo e gostaria de finalizar o pedido:',
    mensagemFinal: 'Por favor, me informe sobre a disponibilidade e as formas de pagamento.',
  },

  /* 3) ORDEM DAS CATEGORIAS NOS BOTÕES.
        Categorias novas cadastradas entram sozinhas no fim. */
  ordemCategorias: ['Pós Cirúrgico', 'Sutiã', 'Masculino', 'Faixas', 'Placas', 'Pós Parto', 'Estético', 'Vestidos Pós-Operatórios'],

  /* 4) TAMANHOS usados quando o produto não tiver tamanhos */
  tamanhosPadrao: ['P', 'M', 'G'],

  /* 5) CORES disponíveis (nome usado no cadastro : código da cor) */
  cores: {
    'bege': '#C8B89A',
    'preto': '#1A1A1A',
    'azul-marinho': '#0F1E36',
    'azul': '#2B4A7A',
    'pink': '#FF69B4',
    'rosa': '#E8A0B4',
    'vermelho': '#C82333',
    'branco': '#F5F5F5',
    'nude': '#D9B99B',
    'cinza': '#8A8A8A',
    'marrom': '#6B4A35',
    'verde': '#2F6B4F',
  },

  /* 6) GOOGLE ANALYTICS (deixe '' para desativar) */
  googleAnalytics: 'G-96QDWZK1GK',
};
