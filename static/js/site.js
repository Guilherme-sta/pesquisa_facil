// ─── NAVEGAÇÃO ENTRE ABAS ───────────────────────────────────────────────────
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('visible'));
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('visible');
  btn.classList.add('active');
}

// ─── ABA 3: GRUPOS POR CAMPUS ───────────────────────────────────────────────

// Mapa de arquivos -> nome de exibição do campus (usado para rotular cada
// registro depois que todos os JSONs forem carregados de uma vez).
const CAMPUS_FILES = [
  { file: 'grupos_ang_final.json',        nome: 'Angical' },
  { file: 'grupos_campo_maior_final.json',nome: 'Campo Maior' },
  { file: 'grupos_central_final.json',    nome: 'Teresina Central' },
  { file: 'grupos_cocal_final.json',      nome: 'Cocal' },
  { file: 'grupos_corrente_maior_final.json', nome: 'Corrente' },
  { file: 'grupos_dirceu_final.json',     nome: 'Dirceu Arcoverde' },
  { file: 'grupos_floriano_final.json',   nome: 'Floriano' },
  { file: 'grupos_freitas_final.json',    nome: 'José de Freitas' },
  { file: 'grupos_oeiras_final.json',     nome: 'Oeiras' },
  { file: 'grupos_parnaiba_final.json',   nome: 'Parnaíba' },
  { file: 'grupos_paulistana_final.json', nome: 'Paulistana' },
  { file: 'grupos_pedroII_final.json',    nome: 'Pedro II' },
];

let dadosCampusTodos = [];   // todos os registros, de todos os campi, já carregados
let dadosCampusAtual = [];   // recorte atualmente exibido (todos ou 1 campus)

const campusSelect  = document.getElementById('campusSelect');
const searchCampus  = document.getElementById('searchCampus');
const tableCampus   = document.getElementById('tableCampus');
const counterCampus = document.getElementById('counterCampus');
const sortCampus = document.getElementById('sortCampus');

async function carregarTodosCampus() {
  tableCampus.innerHTML = `<tr class="status-row"><td colspan="4"><span class="loading-spinner"></span> Carregando grupos de todos os campi...</td></tr>`;

  const resultados = await Promise.allSettled(
    CAMPUS_FILES.map(c => fetch('/api/public-data/' + encodeURIComponent(c.file)).then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    }))
  );

  dadosCampusTodos = [];
  let falhas = 0;
  resultados.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      const nome = CAMPUS_FILES[i].nome;
      res.value.forEach(item => {
        dadosCampusTodos.push({
          ...item,
          campusNome: nome,
          data_criacao: obterDataCriacao(item)
        });
      });
    } else {
      falhas++;
    }
  });

  dadosCampusAtual = dadosCampusTodos;
  renderCampus(dadosCampusAtual);

  if (falhas === CAMPUS_FILES.length) {
    tableCampus.innerHTML = `<tr class="status-row"><td colspan="4" style="color:#b91c1c;">Não foi possível carregar os arquivos JSON de grupos pelo servidor.</td></tr>`;
    counterCampus.style.display = 'none';
  }
}

function aplicarFiltrosCampus() {
  const arquivo = campusSelect.value;
  const termo = searchCampus.value
    .toLocaleLowerCase('pt-BR')
    .trim();

  let filtrados = dadosCampusTodos.filter(item => {
    const campusInfo = CAMPUS_FILES.find(c => c.file === arquivo);

    const correspondeCampus =
      !arquivo || (campusInfo && campusInfo.nome === item.campusNome);

    const correspondeBusca =
      [
        item.nome,
        item.grupo,
        item.lider_1,
        item.lider_2,
        item.campusNome
      ].some(valor =>
        String(valor || '')
          .toLocaleLowerCase('pt-BR')
          .includes(termo)
      );

    return correspondeCampus && correspondeBusca;
  });

  const ordem = sortCampus?.value || 'padrao';

  if (ordem === 'recentes' || ordem === 'antigos') {
    filtrados.sort((a, b) => {
      const da = converterDataBR(a.data_criacao);
      const db = converterDataBR(b.data_criacao);

      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;

      return ordem === 'recentes' ? db - da : da - db;
    });
  }

  dadosCampusAtual = filtrados;
  renderCampus(filtrados);
}

campusSelect.addEventListener('change', aplicarFiltrosCampus);
searchCampus.addEventListener('input', aplicarFiltrosCampus);
sortCampus?.addEventListener('change', aplicarFiltrosCampus);

function renderCampus(dados) {
  tableCampus.innerHTML = '';
  counterCampus.style.display = 'block';

  if (!dados.length) {
    tableCampus.innerHTML =
      '<tr class="status-row"><td colspan="5">Nenhum resultado encontrado.</td></tr>';

    counterCampus.textContent = '0 registros encontrados.';
    return;
  }

  counterCampus.textContent = `${dados.length} registro(s) encontrado(s).`;

  const fragmento = document.createDocumentFragment();

  dados.forEach(item => {
    const tr = document.createElement('tr');

    const tdCampus = document.createElement('td');
    tdCampus.textContent = item.campusNome || '—';

    const tdGrupo = document.createElement('td');
    tdGrupo.textContent = item.grupo || '—';

    const tdData = document.createElement('td');
    tdData.textContent = formatarDataBR(item.data_criacao);

    const tdServidor = document.createElement('td');
    tdServidor.textContent = item.nome || '—';

    const tdLideres = document.createElement('td');
    tdLideres.textContent =
      `Líder 1: ${item.lider_1 || '—'}\nLíder 2: ${
        item.lider_2 && item.lider_2 !== '-' ? item.lider_2 : '—'
      }`;

    tdCampus.className = 'muted';
    tdCampus.style.fontWeight = '600';

    tdGrupo.style.fontWeight = '600';
    tdGrupo.style.maxWidth = '260px';
    tdGrupo.style.wordBreak = 'break-word';

    tdData.className = 'muted';
    tdData.style.whiteSpace = 'nowrap';

    tdLideres.className = 'muted';
    tdLideres.style.whiteSpace = 'pre-line';

    tr.append(
      tdCampus,
      tdGrupo,
      tdData,
      tdServidor,
      tdLideres
    );

    fragmento.appendChild(tr);
  });

  tableCampus.appendChild(fragmento);
}

// Carrega os grupos de todos os campi automaticamente ao abrir a página
carregarTodosCampus();

// ─── ABA 4: GRUPOS IFPI ─────────────────────────────────────────────────────
// ─── ABA 4: GRUPOS IFPI — COM DATA DE CRIAÇÃO E ORDENAÇÃO ────────────────────
let dadosGrupos = [];

const searchGrupos  = document.getElementById('searchGrupos');
const tableGrupos   = document.getElementById('tableGrupos');
const counterGrupos = document.getElementById('counterGrupos');

// Datas obtidas da planilha "rel_consulta_parametrizada_por_grupo".
// Quando o próprio JSON já possuir data_criacao, ela terá prioridade.
const DATAS_CRIACAO_GRUPOS = {
  "Núcleo de Estudos da Canção": "18/03/2026",
  "SciGEO - Núcleo de Estudos Avançados em Ciência Geoespacial": "05/04/2026",
  "Núcleo de Extensão e Pesquisa em Mobilidade": "26/07/2017",
  "Grupo de Estudos e Pesquisa em Educação, Inclusão e Politica Públicas -": "10/12/2025",
  "Núcleo de Estudos em Conservação do Solo e Planejamento Geoespacial": null,
  "Estudos em Monitoramento Ambiental": "15/10/2025",
  "Núcleo de Pesquisas em Meio Ambiente": "17/09/2025",
  "Predição Experimental da Propagação de Trincas": "04/04/2025",
  "Edáficos do Nordeste: GEP em Conservação de Solos, Águas e Florestas do Nordeste": "12/04/2025",
  "Gestão de Águas Urbanas": "12/08/2025",
  "Grupo de Estudos e Pesquisa em Investigação e Monitoramento da": "07/04/2025",
  "Grupo de Pesquisa em Sistemas Embarcados e Instrumentação": "16/09/2025",
  "Grupo de Estudos e Pesquisas em Educação Profissional e Tecnológica": "04/09/2025",
  "Laboratory of Innovation on Multimedia Systems (LIMS)": "16/12/2024",
  "Grupo Espectroscopia Raman e Infravermelho - GERI": "12/12/2025",
  "Núcleo de Pesquisa em Direitos Humanos: Educação, Trabalho e": "16/04/2026",
  "Grupo Interdisciplinar de Estudos e Pesquisas em Secretariado - GIEPS": "16/12/2024",
  "Química de Produtos Naturais": "16/09/2025",
  "Laboratório de Física Teórica e Computacional - LAFITEC": "10/10/2025",
  "Educação Tecnológica na Contemporaneidade - ETC": "29/01/2021",
  "GENALE - Grupo de Pesquisa, Ensino e Aprendizagem da Leitura e da Escrita": "02/10/2025",
  "Laboratório de Biologia Molecular e Epidemiologia": "26/03/2026",
  "LUAR (Laboratório Unificado de Artes e Relações Interdisciplinares": "14/01/2026",
  "Grupo de Investigación y Estudios en Linguística y Literatura": "19/08/2021",
  "Laboratório de Pesquisa em Sistemas de Informação (LaPeSI)": "28/11/2025",
  "Núcleo de Computação Aplicada": "19/03/2026",
  "Grupo de Pesquisa em Práticas Empresariais": "22/04/2025",
  "CRIAÇÃO, DESENVOLVIMENTO E APRIMORAMENTO DE MEDIADORES": "04/09/2025",
  "Núcleo de Produção, Processamento de Alimentos e Biotecnologia": "10/02/2026",
  "Núcleo Estratégico em Geografia do IFPI - NEG": "06/12/2024",
  "Núcleo de Pesquisa Interdisciplinar e Desenvolvimento Tecnológico (NuPIDT)": "28/02/2024",
  "NÚCLEO DE PESQUISA INTERDISCIPLINAR EM": "05/10/2025",
  "Grupo de Estudos e Pesquisas em Clima, Riscos, Desastres e": "26/03/2026",
  "Biotecnologia aplicada à alimentos - BIOTECAL": "15/09/2025",
  "BIOTECNOLOGIA E POLÍMEROS (BIOPOL)": "14/04/2026",
  "GRUPO DE PESQUISA EM ENGENHARIA DE MATERIAIS E PROCESSOS": "17/03/2025",
  "Grupo de Pesquisas em Comportamento do Consumidor": "05/11/2025"
};

function normalizarNomeGrupo(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

const DATAS_NORMALIZADAS = new Map(
  Object.entries(DATAS_CRIACAO_GRUPOS).map(([grupo, data]) => [
    normalizarNomeGrupo(grupo),
    data
  ])
);

function obterDataCriacao(item) {
  const dataExistente =
    item.data_criacao ??
    item.dataCriacao ??
    item.data_de_criacao ??
    item['DATA DE CRIAÇÃO DO GRUPO'];

  return dataExistente ||
    DATAS_NORMALIZADAS.get(normalizarNomeGrupo(item.grupo)) ||
    null;
}

function converterDataBR(data) {
  if (!data) return null;

  const texto = String(data).trim();

  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (br) {
    const dia = Number(br[1]);
    const mes = Number(br[2]);
    const ano = Number(br[3]);

    const dataObj = new Date(ano, mes - 1, dia);

    if (
      dataObj.getFullYear() !== ano ||
      dataObj.getMonth() !== mes - 1 ||
      dataObj.getDate() !== dia
    ) {
      return null;
    }

    return dataObj;
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    const ano = Number(iso[1]);
    const mes = Number(iso[2]);
    const dia = Number(iso[3]);

    const dataObj = new Date(ano, mes - 1, dia);

    if (
      dataObj.getFullYear() !== ano ||
      dataObj.getMonth() !== mes - 1 ||
      dataObj.getDate() !== dia
    ) {
      return null;
    }

    return dataObj;
  }

  return null;
}

function formatarDataBR(data) {
  const dataObj = converterDataBR(data);

  return dataObj
    ? dataObj.toLocaleDateString('pt-BR')
    : 'Não informada';
}

// Cria o seletor sem exigir alteração manual no HTML.
let sortGrupos = document.getElementById('sortGrupos');
if (!sortGrupos && searchGrupos) {
  sortGrupos = document.createElement('select');
  sortGrupos.id = 'sortGrupos';
  sortGrupos.setAttribute('aria-label', 'Ordenar grupos por data de criação');
  sortGrupos.innerHTML = `
    <option value="padrao">Ordem padrão</option>
    <option value="recentes">Mais novos primeiro</option>
    <option value="antigos">Mais antigos primeiro</option>
  `;
  sortGrupos.style.cssText =
    'min-height:42px;padding:9px 12px;border:1px solid var(--cinza-borda,#d1d5db);' +
    'border-radius:10px;background:var(--branco,#fff);color:inherit;font:inherit;';

  searchGrupos.insertAdjacentElement('afterend', sortGrupos);
}

function prepararCabecalhoData() {
  const tabela = tableGrupos?.closest('table');
  const cabecalho = tabela?.querySelector('thead tr');
  if (!cabecalho) return;

  if (!cabecalho.querySelector('[data-coluna-data-criacao]')) {
    const th = document.createElement('th');
    th.textContent = 'DATA DE CRIAÇÃO';
    th.setAttribute('data-coluna-data-criacao', 'true');
    cabecalho.appendChild(th);
  }
}

async function carregarGrupos() {
  try {
    const res = await fetch('/api/public-data/grupos_lideres.json');
    if (!res.ok) throw new Error('Não foi possível carregar os grupos.');

    const todos = await res.json();
    dadosGrupos = todos
      .filter((d, i) => i > 0 && d.grupo && d.grupo !== 'GRUPO')
      .map(item => ({ ...item, data_criacao: obterDataCriacao(item) }));

    prepararCabecalhoData();
    renderGrupos(dadosGrupos);
  } catch (error) {
    tableGrupos.innerHTML =
      '<tr class="status-row"><td colspan="5" style="color:#b91c1c;">' +
      'Erro ao carregar os dados dos grupos pelo servidor.</td></tr>';
    console.error(error);
  }
}

function aplicarFiltrosGrupos() {
  const termo = (searchGrupos?.value || '').toLocaleLowerCase('pt-BR').trim();
  let filtrados = dadosGrupos.filter(item =>
    [item.grupo, item.lider_1, item.lider_2]
      .some(valor => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo))
  );

  const ordem = sortGrupos?.value || 'padrao';
  if (ordem === 'recentes' || ordem === 'antigos') {
    filtrados = [...filtrados].sort((a, b) => {
      const da = converterDataBR(a.data_criacao);
      const db = converterDataBR(b.data_criacao);

      // Sem data sempre fica depois dos grupos datados.
      if (!da && !db) return String(a.grupo).localeCompare(String(b.grupo), 'pt-BR');
      if (!da) return 1;
      if (!db) return -1;

      return ordem === 'recentes' ? db - da : da - db;
    });
  }

  renderGrupos(filtrados);
}

searchGrupos?.addEventListener('input', aplicarFiltrosGrupos);
sortGrupos?.addEventListener('change', aplicarFiltrosGrupos);

function renderGrupos(dados) {
  tableGrupos.innerHTML = '';
  counterGrupos.style.display = 'block';

  if (!dados.length) {
    tableGrupos.innerHTML =
      '<tr class="status-row"><td colspan="5">Nenhum resultado encontrado.</td></tr>';
    counterGrupos.textContent = '0 grupos encontrados.';
    return;
  }

  counterGrupos.textContent = `${dados.length} grupo(s) encontrado(s).`;
  const fragmento = document.createDocumentFragment();

  dados.forEach((item, idx) => {
    const tr = document.createElement('tr');
    const lider2 = (!item.lider_2 || item.lider_2 === '-') ? '—' : item.lider_2;

    const valores = [
      String(idx + 1),
      item.grupo || '—',
      item.lider_1 || '—',
      lider2,
      formatarDataBR(item.data_criacao)
    ];

    valores.forEach((valor, coluna) => {
      const td = document.createElement('td');
      td.textContent = valor;
      if (coluna === 0) td.className = 'mono';
      if (coluna === 2 || coluna === 3 || coluna === 4) td.classList.add('muted');
      if (coluna === 1) {
        td.style.fontWeight = '600';
        td.style.maxWidth = '300px';
        td.style.wordBreak = 'break-word';
      }
      if (coluna === 4) td.style.whiteSpace = 'nowrap';
      tr.appendChild(td);
    });

    fragmento.appendChild(tr);
  });

  tableGrupos.appendChild(fragmento);
}

// Carrega grupos automaticamente ao abrir a página.
carregarGrupos();

// ─── CITAÇÕES E DOCENTES ────────────────────────────────────────────────────
let citationsLoaded = false;
let citationRecords = [];
async function carregarCitacoes() {
  const status = document.getElementById('citationStatus');
  if (!status) return;
  status.textContent = 'Consultando docentes e perfis validados…';
  const params = new URLSearchParams();
  const fields = [['q','citationSearch'],['campus','citationCampus'],['area','citationArea'],['degree','citationDegree'],['year','citationYear']];
  fields.forEach(([key,id]) => { const value=document.getElementById(id)?.value?.trim(); if(value) params.set(key,value); });
  try {
    const response=await fetch('/api/citations/faculty?'+params.toString(),{credentials:'same-origin'});
    if(response.status===401){ location.href='/'; return; }
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||'Erro ao consultar dados.');
    citationRecords=data.results||[];
    fillCitationOptions(data.filters||{});
    document.getElementById('citationFaculty').textContent=Number(data.total||0).toLocaleString('pt-BR');
    document.getElementById('citationLinked').textContent=Number(data.linked_total||0).toLocaleString('pt-BR');
    document.getElementById('citationSum').textContent=data.citation_sum===null?'—':Number(data.citation_sum).toLocaleString('pt-BR');
    const stamp=data.snapshot_date?`Lista de docentes: ${data.snapshot_date}. `:'';
    const yearText=data.year?`Citações recebidas em ${data.year}.`:'Total acumulado de citações indexadas.';
    status.textContent=stamp+yearText+' Os valores dependem da cobertura do OpenAlex e da atualização dos registros.'+(data.source_errors?` ${data.source_errors} perfil(is) não puderam ser consultados.`:'');
    renderCitationRows(citationRecords);
    citationsLoaded=true;
  } catch(error) { status.textContent=error.message; }
}
function fillCitationOptions(filters){
  if(citationsLoaded)return;
  [['citationCampus',filters.campuses,'Todos os campi'],['citationArea',filters.areas,'Todas as áreas'],['citationDegree',filters.degrees,'Todas']].forEach(([id,values,label])=>{
    const select=document.getElementById(id); if(!select)return;
    (values||[]).forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;select.appendChild(option);});
  });
}
function renderCitationRows(rows){
  const tbody=document.getElementById('citationRows'); if(!tbody)return; tbody.replaceChildren();
  rows.sort((a,b)=>(b.citation_count??-1)-(a.citation_count??-1)||a.name.localeCompare(b.name,'pt-BR'));
  if(!rows.length){const tr=tbody.insertRow();const td=tr.insertCell();td.colSpan=6;td.textContent='Nenhum docente encontrado.';return;}
  const frag=document.createDocumentFragment();
  rows.forEach(row=>{
    const tr=document.createElement('tr');
    [row.name,row.campus||'Campus não identificado',row.area||'—',row.degree||'—',row.citation_count===null?'Sem vínculo validado':Number(row.citation_count).toLocaleString('pt-BR')].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.appendChild(td);});
    const links=tr.insertCell();
    if(row.profile_url){const lattes=document.createElement('a');lattes.href=row.profile_url;lattes.target='_blank';lattes.rel='noopener noreferrer';lattes.textContent='Lattes';links.appendChild(lattes);}
    if(row.source_url){if(links.childNodes.length)links.append(' · ');const source=document.createElement('a');source.href=row.source_url;source.target='_blank';source.rel='noopener noreferrer';source.textContent='OpenAlex';links.appendChild(source);}
    if(row.updated_at){const date=document.createElement('small');date.style.display='block';date.textContent='Atualizado: '+new Date(row.updated_at).toLocaleDateString('pt-BR');links.appendChild(date);}
    if(row.identity_status==='verified_pending_refresh'){const small=document.createElement('small');small.textContent='Consulta pendente';links.appendChild(small);}
    frag.appendChild(tr);
  });
  tbody.appendChild(frag);
}
['citationSearch','citationCampus','citationArea','citationDegree','citationYear'].forEach(id=>document.getElementById(id)?.addEventListener('change',carregarCitacoes));
document.getElementById('citationSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter')carregarCitacoes();});
