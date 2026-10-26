/* =====================================================================
   CORPO BELO — LÓGICA DO CATÁLOGO
   Não é necessário editar este arquivo para atualizar produtos.
   Produtos  → produtos.js (ou editor.html)
   Contatos e textos → config.js
   ===================================================================== */
(function () {
  'use strict';

  const CFG = window.CATALOGO_CONFIG || {};
  const CORES = normalizarMapaCores(CFG.cores || {});
  const CHAVE_CARRINHO = 'cb-carrinho-v2';
  const CHAVE_CLIENTE = 'cb-cliente-v2';

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const estado = {
    produtos: [],
    categoria: 'todos',
    busca: '',
    ordem: 'padrao',
    carrinho: lerStorage(CHAVE_CARRINHO, []),
    vis: { fotos: [], i: 0 },
  };

  /* ───────────────────── utilidades ───────────────────── */
  function lerStorage(k, padrao) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
  }
  function gravarStorage(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem espaço / modo privado */ } }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function chaveTexto(s) { return semAcento(s).toLowerCase().trim(); }
  function slug(s) { return chaveTexto(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function normalizarMapaCores(mapa) {
    const out = {};
    Object.keys(mapa).forEach(k => { out[slug(k)] = mapa[k]; });
    return out;
  }

  // Aceita "89,90", "R$ 89,90", "1.234,56", "89.90", "89"
  function lerPreco(txt) {
    if (txt == null) return NaN;
    let s = String(txt).replace(/[R$\s]/g, '').trim();
    if (!s) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    return parseFloat(s);
  }
  function brl(n) {
    return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Converte links do Google Drive para um formato que abre como imagem
  function urlImagem(u) {
    u = String(u || '').trim();
    if (!u) return '';
    const m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{10,})/);
    if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1200';
    return u.includes('%') ? u : encodeURI(u);
  }

  function aviso(msg) {
    const el = $('#aviso');
    el.textContent = msg;
    el.classList.add('visivel');
    clearTimeout(aviso._t);
    aviso._t = setTimeout(() => el.classList.remove('visivel'), 2200);
  }

  /* ───────────────────── leitura do cadastro (produtos.js) ───────────────────── */
  function formatarCategoria(c) {
    c = String(c || '').trim();
    if (!c) return 'Outros';
    const k = chaveTexto(c);
    const conhecida = (CFG.ordemCategorias || []).find(x => chaveTexto(x) === k);
    if (conhecida) return conhecida;
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  function lista(v) {
    if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
    return String(v || '').split(/[,;/|]/).map(x => x.trim()).filter(Boolean);
  }

  function montarProdutos(brutos) {
    const out = [];
    (brutos || []).forEach((r, idx) => {
      if (!r || !r.nome) return;
      if (r.ativo === false || ['nao', 'não', 'false', 'desativado', '0'].includes(chaveTexto(r.ativo))) return;

      const preco = typeof r.preco === 'number' ? r.preco : lerPreco(r.preco);
      const desconto = Math.min(100, Math.max(0, parseInt(String(r.desconto || 0).replace(/\D/g, ''), 10) || 0));
      const precoFinal = !isNaN(preco) && desconto > 0 ? preco * (1 - desconto / 100) : preco;
      let cores = lista(r.cores).map(slug);
      if (!cores.length) cores = ['bege'];
      let tamanhos = lista(r.tamanhos).map(t => t.toUpperCase());
      if (!tamanhos.length) tamanhos = CFG.tamanhosPadrao || ['P', 'M', 'G'];

      out.push({
        id: r.id != null && String(r.id).trim() ? String(r.id).trim() : 'p' + (idx + 1),
        nome: String(r.nome),
        categoria: formatarCategoria(r.categoria),
        descricao: r.descricao || '',
        preco: preco,
        precoTexto: isNaN(preco) ? String(r.preco || '') : brl(preco),
        precoFinal: precoFinal,
        desconto: isNaN(preco) ? 0 : desconto,
        fotos: lista(r.fotos).map(urlImagem),
        tamanhos: tamanhos,
        cores: cores,
        destaque: r.destaque || '',
        tabela: urlImagem(r.tabelaMedidas || ''),
        ordem: idx,
        posicao: idx,
      });
    });
    const vistos = {};
    out.forEach(p => { if (vistos[p.id]) p.id = p.id + '-' + p.posicao; vistos[p.id] = true; });
    return out;
  }

  function carregar() {
    estado.produtos = montarProdutos(window.PRODUTOS);
    if (estado.produtos.length) { iniciarTela(); return; }
    $('#grade').innerHTML = `<div class="vazio"><h3>Nenhum produto cadastrado</h3>
      <p>Verifique o arquivo produtos.js.</p><button onclick="location.reload()">Tentar novamente</button></div>`;
    $('#secaoContagem').textContent = '';
  }

  /* ───────────────────── tela ───────────────────── */
  let telaPronta = false;
  function iniciarTela() {
    montarCategorias();
    renderizar();
    if (!telaPronta) { telaPronta = true; abrirLinkDireto(); }
    atualizarCarrinho();
  }

  function montarCategorias() {
    const contagem = {};
    estado.produtos.forEach(p => { contagem[p.categoria] = (contagem[p.categoria] || 0) + 1; });
    const ordem = (CFG.ordemCategorias || []).filter(c => contagem[c]);
    Object.keys(contagem).sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(c => { if (!ordem.includes(c)) ordem.push(c); });
    if (estado.categoria !== 'todos' && !contagem[estado.categoria]) estado.categoria = 'todos';
    $('#categorias').innerHTML =
      `<button class="cat-btn ${estado.categoria === 'todos' ? 'ativo' : ''}" data-cat="todos">Todos<span class="qtd">${estado.produtos.length}</span></button>` +
      ordem.map(c => `<button class="cat-btn ${estado.categoria === c ? 'ativo' : ''}" data-cat="${esc(c)}">${esc(c)}<span class="qtd">${contagem[c]}</span></button>`).join('');
  }

  function produtosVisiveis() {
    const termo = chaveTexto(estado.busca);
    let lista = estado.produtos.filter(p =>
      (estado.categoria === 'todos' || p.categoria === estado.categoria) &&
      (!termo || chaveTexto(p.nome + ' ' + p.categoria + ' ' + p.descricao + ' ' + p.destaque).includes(termo))
    );
    const preco = p => isNaN(p.precoFinal) ? Infinity : p.precoFinal;
    if (estado.ordem === 'menor') lista.sort((a, b) => preco(a) - preco(b));
    else if (estado.ordem === 'maior') lista.sort((a, b) => (isNaN(b.precoFinal) ? -1 : b.precoFinal) - (isNaN(a.precoFinal) ? -1 : a.precoFinal));
    else if (estado.ordem === 'az') lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    else if (estado.ordem === 'promo') lista.sort((a, b) => b.desconto - a.desconto || a.ordem - b.ordem);
    else lista.sort((a, b) => a.ordem - b.ordem);
    return lista;
  }

  function renderizar() {
    const lista = produtosVisiveis();
    $('#secaoTitulo').textContent = estado.busca ? `Resultados para “${estado.busca}”` : (estado.categoria === 'todos' ? 'Todos os produtos' : estado.categoria);
    $('#secaoContagem').textContent = lista.length + (lista.length === 1 ? ' produto' : ' produtos');
    if (!lista.length) {
      $('#grade').innerHTML = `<div class="vazio"><h3>Nenhum produto encontrado</h3>
        <p>Tente outra palavra ou veja todas as categorias.</p><button data-acao="limpar-filtros">Ver todos os produtos</button></div>`;
      return;
    }
    $('#grade').innerHTML = lista.map(card).join('');
    $$('#grade .card').forEach((el, i) => { el.style.animationDelay = Math.min(i * 40, 400) + 'ms'; });
  }

  const ICO_MAIS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  const ICO_REGUA = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="10" rx="1.5"/><path d="M6 7v4M10 7v3M14 7v4M18 7v3"/></svg>';
  const ICO_COMP = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>';

  // "2820DS - Modelador Short" → { codigo: "2820DS", nome: "Modelador Short" }
  function partesNome(n) {
    n = String(n || '').trim();
    const m = n.match(/^(\S*\d\S*)\s*(?:-\s+|\s+)(.+)$/);
    return m ? { codigo: m[1].replace(/-$/, ''), nome: m[2].trim() } : { codigo: '', nome: n };
  }

  function card(p) {
    const fotos = p.fotos.length
      ? `<div class="galeria-trilho">${p.fotos.map((f, i) => `<img src="${esc(f)}" alt="${esc(p.nome)} — foto ${i + 1}" loading="${i === 0 ? 'lazy' : 'lazy'}" draggable="false" onerror="this.style.visibility='hidden'">`).join('')}</div>`
      : '';
    const setas = p.fotos.length > 1
      ? `<button class="galeria-seta ant" data-acao="foto" data-dir="-1" aria-label="Foto anterior">&#8249;</button>
         <button class="galeria-seta prox" data-acao="foto" data-dir="1" aria-label="Próxima foto">&#8250;</button>
         <div class="galeria-pontos">${p.fotos.map((_, i) => `<span class="${i === 0 ? 'ativo' : ''}"></span>`).join('')}</div>`
      : '';
    const selos = `<div class="selos">${p.destaque ? `<span class="selo destaque">${esc(p.destaque)}</span>` : ''}${p.desconto > 0 ? `<span class="selo promo">${p.desconto}% OFF</span>` : ''}</div>`;

    const desc = p.descricao
      ? `<p class="card-desc ${p.descricao.length > 140 ? 'recolhida' : ''}">${esc(p.descricao).replace(/\n/g, '<br>')}</p>${p.descricao.length > 140 ? '<button class="ver-mais" data-acao="ver-mais">Ver mais</button>' : ''}`
      : '';

    const tams = p.tamanhos.map((t, i) => `<button class="tam ${i === 0 ? 'sel' : ''}" data-acao="tam" data-valor="${esc(t)}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('');
    const cores = p.cores.map((c, i) => `<button class="cor ${i === 0 ? 'sel' : ''}" data-acao="cor" data-valor="${esc(c)}" style="background:${esc(CORES[c] || '#C8B89A')}" title="${esc(nomeCor(c))}" aria-label="Cor ${esc(nomeCor(c))}" aria-pressed="${i === 0}"></button>`).join('');

    let preco;
    if (isNaN(p.preco)) preco = `<div class="preco consultar">${p.precoTexto ? esc(p.precoTexto) : 'Sob consulta'}</div>`;
    else if (p.desconto > 0) preco = `<div class="preco-antigo">${brl(p.preco)}</div><div class="preco promo">${brl(p.precoFinal)}</div>`;
    else preco = `<div class="preco">${brl(p.preco)}</div>`;

    return `
    <article class="card" id="produto-${esc(p.id)}" data-id="${esc(p.id)}">
      <div class="galeria ${p.fotos.length ? '' : 'sem-foto'}" data-acao="ampliar" data-i="0">
        ${fotos || '<span>Foto em breve</span>'}${setas}${selos}
        <button class="btn-compartilhar" data-acao="compartilhar" aria-label="Compartilhar este produto" title="Compartilhar">${ICO_COMP}</button>
      </div>
      <div class="card-corpo">
        <div class="card-cat">${esc(p.categoria)}</div>
        <h3 class="card-nome">${esc(p.nome)}</h3>
        ${desc}
        <div><div class="seletor-rotulo">Tamanho: <b data-rotulo="tam">${esc(p.tamanhos[0] || '')}</b></div><div class="opcoes">${tams}</div></div>
        <div><div class="seletor-rotulo">Cor: <b data-rotulo="cor">${esc(nomeCor(p.cores[0]))}</b></div><div class="opcoes">${cores}</div></div>
        ${p.tabela ? `<button class="btn-medidas" data-acao="medidas">${ICO_REGUA} Tabela de medidas</button>` : ''}
      </div>
      <div class="card-rodape">
        <div><div class="preco-rotulo">Preço</div>${preco}</div>
        <button class="btn-add" data-acao="adicionar">${ICO_MAIS} Adicionar</button>
      </div>
    </article>`;
  }

  function nomeCor(c) { return String(c || '').replace(/-/g, ' '); }
  function produto(id) { return estado.produtos.find(p => p.id === id); }

  /* Galeria do card */
  function irParaFoto(galeria, i) {
    const trilho = $('.galeria-trilho', galeria);
    if (!trilho) return;
    const total = trilho.children.length;
    i = (i + total) % total;
    galeria.dataset.i = i;
    trilho.style.transform = `translateX(${-i * 100}%)`;
    $$('.galeria-pontos span', galeria).forEach((s, k) => s.classList.toggle('ativo', k === i));
  }

  // Arrastar fotos com o dedo (celular)
  function ativarDeslize(area, aoDeslizar) {
    let x0 = null, y0 = null;
    area.addEventListener('touchstart', e => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
    area.addEventListener('touchend', e => {
      if (x0 === null) return;
      const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      const alvo = e.target; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) aoDeslizar(dx < 0 ? 1 : -1, alvo);
    }, { passive: true });
  }

  /* ───────────────────── eventos dos cards ───────────────────── */
  function cliqueGrade(e) {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao === 'limpar-filtros') { limparFiltros(); return; }
    const cardEl = alvo.closest('.card');
    const p = cardEl && produto(cardEl.dataset.id);
    if (!p) return;

    if (acao === 'foto') { e.stopPropagation(); const g = alvo.closest('.galeria'); irParaFoto(g, +g.dataset.i + +alvo.dataset.dir); }
    else if (acao === 'ampliar') { if (p.fotos.length && !e.target.closest('button')) abrirVisualizador(p.fotos, +alvo.dataset.i || 0, p.nome); }
    else if (acao === 'compartilhar') { e.stopPropagation(); compartilhar(p); }
    else if (acao === 'medidas') abrirVisualizador([p.tabela], 0, 'Tabela de medidas — ' + p.nome);
    else if (acao === 'ver-mais') {
      const d = $('.card-desc', cardEl); const rec = d.classList.toggle('recolhida');
      alvo.textContent = rec ? 'Ver mais' : 'Ver menos';
    }
    else if (acao === 'tam' || acao === 'cor') {
      $$(`[data-acao="${acao}"]`, cardEl).forEach(b => { b.classList.remove('sel'); b.setAttribute('aria-pressed', 'false'); });
      alvo.classList.add('sel'); alvo.setAttribute('aria-pressed', 'true');
      $(`[data-rotulo="${acao}"]`, cardEl).textContent = acao === 'cor' ? nomeCor(alvo.dataset.valor) : alvo.dataset.valor;
    }
    else if (acao === 'adicionar') {
      const tam = $('.tam.sel', cardEl)?.dataset.valor || '';
      const cor = $('.cor.sel', cardEl)?.dataset.valor || '';
      adicionar(p, tam, cor);
      alvo.classList.add('ok'); alvo.innerHTML = '✓ Adicionado';
      setTimeout(() => { alvo.classList.remove('ok'); alvo.innerHTML = ICO_MAIS + ' Adicionar'; }, 1400);
    }
  }

  function limparFiltros() {
    estado.busca = ''; estado.categoria = 'todos';
    $('#campoBusca').value = '';
    montarCategorias(); renderizar();
  }

  /* Link direto para um produto: site/#produto=ID */
  function linkProduto(p) { return location.origin + location.pathname + '#produto=' + encodeURIComponent(p.id); }
  async function compartilhar(p) {
    const url = linkProduto(p);
    const dados = { title: p.nome + ' — Corpo Belo', text: p.nome + (isNaN(p.precoFinal) ? '' : ' por ' + brl(p.precoFinal)), url: url };
    if (navigator.share) { try { await navigator.share(dados); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(url); aviso('Link do produto copiado!'); }
    catch (e) { prompt('Copie o link do produto:', url); }
  }
  function abrirLinkDireto() {
    const m = location.hash.match(/produto=([^&]+)/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (!produto(id)) return;
    const el = document.getElementById('produto-' + id);
    if (!el) return;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('destacado');
      setTimeout(() => el.classList.remove('destacado'), 3500);
    }, 250);
  }

  /* ───────────────────── carrinho ───────────────────── */
  function adicionar(p, tam, cor) {
    const chave = p.id + '|' + tam + '|' + cor;
    const item = estado.carrinho.find(i => i.chave === chave);
    if (item) item.qtd++;
    else estado.carrinho.push({ chave, id: p.id, nome: p.nome, tam, cor, qtd: 1, preco: p.precoFinal, precoTexto: p.precoTexto, foto: p.fotos[0] || '' });
    salvarCarrinho();
    const b = $('#btnCarrinho'); b.classList.remove('pulo'); void b.offsetWidth; b.classList.add('pulo');
    aviso(`${p.nome} (${tam}${cor ? ' · ' + nomeCor(cor) : ''}) adicionado`);
  }
  function salvarCarrinho() { gravarStorage(CHAVE_CARRINHO, estado.carrinho); atualizarCarrinho(); }

  function total() { return estado.carrinho.reduce((s, i) => s + (isNaN(i.preco) || i.preco == null ? 0 : i.preco * i.qtd), 0); }

  function atualizarCarrinho() {
    // mantém preços do carrinho em dia com o cadastro
    estado.carrinho.forEach(i => { const p = produto(i.id); if (p) { i.preco = p.precoFinal; i.precoTexto = p.precoTexto; i.nome = p.nome; i.foto = p.fotos[0] || i.foto; } });
    const qtd = estado.carrinho.reduce((s, i) => s + i.qtd, 0);
    $('#contadorCarrinho').textContent = qtd;
    const caixa = $('#itensCarrinho');
    if (!estado.carrinho.length) {
      caixa.innerHTML = `<div class="carrinho-vazio"><svg viewBox="0 0 24 24"><path d="M6 7h12l-1.2 12.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6 7z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/></svg>Seu carrinho está vazio.<br><small>Escolha tamanho e cor e toque em “Adicionar”.</small></div>`;
      $('#rodapeCarrinho').classList.add('oculto');
      return;
    }
    $('#rodapeCarrinho').classList.remove('oculto');
    caixa.innerHTML = estado.carrinho.map((i, k) => `
      <div class="item">
        ${i.foto ? `<img class="item-foto" src="${esc(i.foto)}" alt="" loading="lazy">` : '<div class="item-foto"></div>'}
        <div>
          <div class="item-nome">${esc(i.nome)}</div>
          <div class="item-meta">Tam. ${esc(i.tam)}${i.cor ? ' · ' + esc(nomeCor(i.cor)) : ''}</div>
          <div class="item-preco">${isNaN(i.preco) || i.preco == null ? 'Sob consulta' : brl(i.preco * i.qtd)}</div>
        </div>
        <div class="item-lado">
          <div class="item-qtd">
            <button data-k="${k}" data-d="-1" aria-label="Diminuir quantidade" ${i.qtd <= 1 ? 'disabled' : ''}>−</button>
            <input type="number" inputmode="numeric" min="1" max="999" value="${i.qtd}" data-k="${k}" aria-label="Quantidade de ${esc(i.nome)}" />
            <button data-k="${k}" data-d="1" aria-label="Aumentar quantidade">+</button>
          </div>
          <button class="item-remover" data-k="${k}" data-remover="1" aria-label="Remover ${esc(i.nome)} do carrinho">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>Remover
          </button>
        </div>
      </div>`).join('');
    $('#totalCarrinho').textContent = brl(total());
  }

  function mensagemPedido() {
    const T = CFG.textos || {};
    const cliente = lerStorage(CHAVE_CLIENTE, {});
    let m = (T.mensagemPedido || 'Olá! Gostaria de fazer o pedido:') + '\n\n';
    estado.carrinho.forEach((i, n) => {
      const unit = isNaN(i.preco) || i.preco == null ? 'sob consulta' : brl(i.preco) + ' cada';
      m += `${n + 1}. *${i.nome}*\n   Tam: ${i.tam}${i.cor ? ' | Cor: ' + nomeCor(i.cor) : ''}\n   Qtd: ${i.qtd}x (${unit})\n\n`;
    });
    m += `*Total estimado:* ${brl(total())}\n`;
    if (cliente.nome) m += `*Nome:* ${cliente.nome}\n`;
    if (cliente.obs) m += `*Observação:* ${cliente.obs}\n`;
    m += '\n' + (T.mensagemFinal || '');
    return m;
  }

  function montarBotoesEnvio() {
    const wpp = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm5.8 15.7c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5l-.6-.3z"/></svg>';
    const ats = CFG.atendentes || [];
    const unico = ats.length === 1;
    $('.enviar-titulo').style.display = unico ? 'none' : '';
    $('#botoesEnvio').innerHTML = ats.map((a, i) =>
      `<a class="btn-enviar" href="#" data-atendente="${i}" target="_blank" rel="noopener">${wpp}${unico ? 'Enviar pedido pelo WhatsApp' : esc(a.nome)}</a>`).join('');
  }

  function abrirCarrinho(abrir) {
    $('#carrinho').classList.toggle('aberto', abrir);
    $('#fundoCarrinho').classList.toggle('aberto', abrir);
    $('#carrinho').setAttribute('aria-hidden', String(!abrir));
    document.body.classList.toggle('travado', abrir);
    if (abrir) setTimeout(() => $('#fecharCarrinho').focus(), 50);
  }

  /* ───────────────────── visualizador de fotos ───────────────────── */
  function abrirVisualizador(fotos, i, titulo) {
    estado.vis = { fotos, i };
    $('#visImagem').alt = titulo || '';
    mostrarFotoVis();
    $('#visualizador').classList.add('aberto');
    $('#visualizador').setAttribute('aria-hidden', 'false');
    document.body.classList.add('travado');
  }
  function mostrarFotoVis() {
    const { fotos, i } = estado.vis;
    $('#visImagem').src = fotos[i];
    const varias = fotos.length > 1;
    $('#visAnt').style.visibility = $('#visProx').style.visibility = varias ? 'visible' : 'hidden';
    $('#visContador').textContent = varias ? `${i + 1} / ${fotos.length}` : '';
  }
  function navegarVis(d) {
    const v = estado.vis; if (v.fotos.length < 2) return;
    v.i = (v.i + d + v.fotos.length) % v.fotos.length; mostrarFotoVis();
  }
  function fecharVis() {
    $('#visualizador').classList.remove('aberto');
    $('#visualizador').setAttribute('aria-hidden', 'true');
    if (!$('#carrinho').classList.contains('aberto')) document.body.classList.remove('travado');
  }

  /* ───────────────────── inicialização ───────────────────── */
  function aplicarConfig() {
    const T = CFG.textos || {};
    if (T.etiqueta) $('#heroEtiqueta').textContent = T.etiqueta;
    if (T.tituloLinha1) $('#heroTitulo').innerHTML = T.tituloLinha1 + '<br>' + (T.tituloLinha2 || '');
    if (T.subtitulo) $('#heroSubtitulo').textContent = T.subtitulo;
    if (T.rodape) $('#rodapeTexto').textContent = T.rodape;
    $('#anoAtual').textContent = new Date().getFullYear();
    const tel = CFG.whatsappDuvidas || (CFG.atendentes && CFG.atendentes[0] && CFG.atendentes[0].telefone);
    if (tel) $('#wppFlutuante').href = 'https://wa.me/' + tel + '?text=' + encodeURIComponent('Olá! Vim pelo catálogo da Corpo Belo e tenho uma dúvida.');
    else $('#wppFlutuante').style.display = 'none';
    montarBotoesEnvio();
    const cliente = lerStorage(CHAVE_CLIENTE, {});
    $('#nomeCliente').value = cliente.nome || '';
    $('#obsCliente').value = cliente.obs || '';

    if (CFG.googleAnalytics) {
      const s = document.createElement('script');
      s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.googleAnalytics;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', CFG.googleAnalytics);
    }
  }

  function ligarEventos() {
    $('#grade').addEventListener('click', cliqueGrade);
    ativarDeslize($('#grade'), (d, alvo) => {
      const g = alvo.closest && alvo.closest('.galeria');
      if (g && $('.galeria-trilho', g) && $('.galeria-trilho', g).children.length > 1) { irParaFoto(g, +g.dataset.i + d); g._deslizou = Date.now(); }
    });
    // evita abrir a foto ampliada logo após deslizar
    $('#grade').addEventListener('click', e => { const g = e.target.closest('.galeria'); if (g && g._deslizou && Date.now() - g._deslizou < 400) e.stopImmediatePropagation(); }, true);

    $('#categorias').addEventListener('click', e => {
      const b = e.target.closest('.cat-btn'); if (!b) return;
      estado.categoria = b.dataset.cat;
      $$('.cat-btn').forEach(x => x.classList.toggle('ativo', x === b));
      b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      renderizar();
      const topo = $('#catalogo').getBoundingClientRect().top + scrollY - 190;
      if (scrollY > topo) scrollTo({ top: topo, behavior: 'smooth' });
    });
    let t;
    $('#campoBusca').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { estado.busca = e.target.value.trim(); renderizar(); }, 180); });
    $('#ordenar').addEventListener('change', e => { estado.ordem = e.target.value; renderizar(); });

    $('#btnTema').addEventListener('click', () => {
      const novo = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', novo);
      try { localStorage.setItem('cb-tema', novo); } catch (e) { }
    });

    $('#btnCarrinho').addEventListener('click', () => abrirCarrinho(true));
    $('#fecharCarrinho').addEventListener('click', () => abrirCarrinho(false));
    $('#fundoCarrinho').addEventListener('click', () => abrirCarrinho(false));
    $('#itensCarrinho').addEventListener('click', e => {
      const b = e.target.closest('button[data-k]'); if (!b) return;
      const k = +b.dataset.k, i = estado.carrinho[k]; if (!i) return;
      if (b.dataset.remover) { estado.carrinho.splice(k, 1); aviso('Item removido do carrinho'); }
      else i.qtd = Math.max(1, Math.min(999, i.qtd + +b.dataset.d));
      salvarCarrinho();
    });
    // quantidade digitada manualmente
    $('#itensCarrinho').addEventListener('change', e => {
      const inp = e.target.closest('input[data-k]'); if (!inp) return;
      const i = estado.carrinho[+inp.dataset.k]; if (!i) return;
      const n = parseInt(inp.value, 10);
      if (!n || n < 1) { inp.value = i.qtd; return; }
      i.qtd = Math.min(999, n); salvarCarrinho();
    });
    $('#itensCarrinho').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('input[data-k]')) e.target.blur(); });
    $('#limparCarrinho').addEventListener('click', () => {
      if (confirm('Esvaziar o carrinho?')) { estado.carrinho = []; salvarCarrinho(); }
    });
    const salvarCliente = () => gravarStorage(CHAVE_CLIENTE, { nome: $('#nomeCliente').value.trim(), obs: $('#obsCliente').value.trim() });
    $('#nomeCliente').addEventListener('input', salvarCliente);
    $('#obsCliente').addEventListener('input', salvarCliente);
    $('#botoesEnvio').addEventListener('click', e => {
      const a = e.target.closest('a[data-atendente]'); if (!a) return;
      if (!estado.carrinho.length) { e.preventDefault(); return; }
      const at = CFG.atendentes[+a.dataset.atendente];
      a.href = 'https://wa.me/' + at.telefone + '?text=' + encodeURIComponent(mensagemPedido());
      if (window.gtag) gtag('event', 'pedido_whatsapp', { atendente: at.nome, valor: total() });
    });

    $('#visFechar').addEventListener('click', fecharVis);
    $('#visAnt').addEventListener('click', e => { e.stopPropagation(); navegarVis(-1); });
    $('#visProx').addEventListener('click', e => { e.stopPropagation(); navegarVis(1); });
    $('#visualizador').addEventListener('click', e => { if (e.target.id === 'visualizador') fecharVis(); });
    ativarDeslize($('#visualizador'), d => navegarVis(d));

    document.addEventListener('keydown', e => {
      if ($('#visualizador').classList.contains('aberto')) {
        if (e.key === 'Escape') fecharVis();
        if (e.key === 'ArrowLeft') navegarVis(-1);
        if (e.key === 'ArrowRight') navegarVis(1);
      } else if (e.key === 'Escape' && $('#carrinho').classList.contains('aberto')) abrirCarrinho(false);
    });
    window.addEventListener('hashchange', abrirLinkDireto);
  }

  document.addEventListener('DOMContentLoaded', () => {
    aplicarConfig();
    ligarEventos();
    atualizarCarrinho();
    carregar();
  });
})();
