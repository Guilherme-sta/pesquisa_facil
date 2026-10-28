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
      res.value.forEach(item => dadosCampusTodos.push({ ...item, campusNome: nome }));
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

campusSelect.addEventListener('change', (e) => {
  const arquivo = e.target.value;
  searchCampus.value = '';

  if (!arquivo) {
    dadosCampusAtual = dadosCampusTodos;
  } else {
    const campusInfo = CAMPUS_FILES.find(c => c.file === arquivo);
    dadosCampusAtual = dadosCampusTodos.filter(item => item.campusNome === campusInfo.nome);
  }
  renderCampus(dadosCampusAtual);
});

searchCampus.addEventListener('input', (e) => {
  const t = e.target.value.toLowerCase().trim();
  renderCampus(dadosCampusAtual.filter(item =>
    [item.nome, item.grupo, item.lider_1, item.lider_2, item.campusNome]
      .some(v => (v || '').toLowerCase().includes(t))
  ));
});

function renderCampus(dados) {
  tableCampus.innerHTML = '';
  counterCampus.style.display = 'block';

  if (!dados.length) {
    tableCampus.innerHTML = `<tr class="status-row"><td colspan="4">Nenhum resultado encontrado.</td></tr>`;
    counterCampus.textContent = '0 registros encontrados.';
    return;
  }

  counterCampus.textContent = `${dados.length} registro(s) encontrado(s).`;
  dados.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="muted" style="font-weight:600; white-space:nowrap;">${item.campusNome || '—'}</td>
      <td style="font-weight:600; max-width:260px; word-break:break-word;">${item.grupo || '—'}</td>
      <td>${item.nome || '—'}</td>
      <td class="muted">
        <span class="td-label">Líder 1</span>${item.lider_1 || '—'}
        <br><span class="td-label" style="margin-top:4px;">Líder 2</span>${item.lider_2 || '—'}
      </td>
    `;
    tableCampus.appendChild(tr);
  });
}

// Carrega os grupos de todos os campi automaticamente ao abrir a página
carregarTodosCampus();

// ─── ABA 4: GRUPOS IFPI ─────────────────────────────────────────────────────
let dadosGrupos = [];

const searchGrupos  = document.getElementById('searchGrupos');
const tableGrupos   = document.getElementById('tableGrupos');
const counterGrupos = document.getElementById('counterGrupos');

async function carregarGrupos() {
  try {
    const res = await fetch('/api/public-data/grupos_lideres.json');
    if (!res.ok) throw new Error();
    const todos = await res.json();
    dadosGrupos = todos.filter((d, i) => i > 0 && d.grupo && d.grupo !== 'GRUPO');
    renderGrupos(dadosGrupos);
  } catch {
    tableGrupos.innerHTML = `<tr class="status-row"><td colspan="4" style="color:#b91c1c;">Erro ao carregar os dados dos grupos pelo servidor.</td></tr>`;
  }
}

searchGrupos.addEventListener('input', (e) => {
  const t = e.target.value.toLowerCase().trim();
  renderGrupos(dadosGrupos.filter(item =>
    [item.grupo, item.lider_1, item.lider_2].some(v => (v || '').toLowerCase().includes(t))
  ));
});

function renderGrupos(dados) {
  tableGrupos.innerHTML = '';
  counterGrupos.style.display = 'block';

  if (!dados.length) {
    tableGrupos.innerHTML = `<tr class="status-row"><td colspan="4">Nenhum resultado encontrado.</td></tr>`;
    counterGrupos.textContent = '0 grupos encontrados.';
    return;
  }

  counterGrupos.textContent = `${dados.length} grupo(s) encontrado(s).`;
  dados.forEach((item, idx) => {
    const lider2 = (!item.lider_2 || item.lider_2 === '-') ? '<span style="color:var(--cinza-borda);">—</span>' : item.lider_2;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${idx + 1}</td>
      <td style="font-weight:600; max-width:300px; word-break:break-word;">${item.grupo}</td>
      <td class="muted">${item.lider_1}</td>
      <td class="muted">${lider2}</td>
    `;
    tableGrupos.appendChild(tr);
  });
}

// Carrega grupos automaticamente ao abrir a página
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
