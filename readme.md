# Pesquisa Fácil — IFPI

Painel web para consulta e visualização de informações sobre grupos de pesquisa e indicadores acadêmicos relacionados aos docentes do Instituto Federal do Piauí (IFPI).

## Recursos

- Consulta a grupos de pesquisa por campus.
- Busca e filtros para explorar os dados disponíveis.
- Visualização de docentes e de indicadores bibliométricos.
- Filtros de citações por ano, campus, área de formação e titulação.
- Links para os perfis e fontes dos dados, quando disponíveis.

## Fontes e limitações

A lista de docentes foi preparada a partir de um arquivo exportado do Metabase do IFPI. Os dados bibliométricos de citações são consultados no OpenAlex; eles não representam contagens fornecidas pelo Currículo Lattes e podem diferir de outros serviços.

Um perfil só é associado a um docente depois de ter sido confirmado. Quando não há vínculo validado ou a fonte não retorna dados, o painel não apresenta uma contagem como se fosse zero.

## Organização do projeto

- `app.py`: inicialização da aplicação Flask.
- `routes/`: rotas do site e APIs.
- `services/`: leitura de dados e integração com o OpenAlex.
- `templates/`: páginas HTML.
- `static/`: arquivos CSS e JavaScript.
- `data/public/`: arquivos sanitizados de grupos usados no painel.
- `data/professores.json`: lista normalizada de docentes.
- `data/private/`: caches locais e vínculos bibliométricos.

Os arquivos de `data/private/` não devem ser publicados em servidores de arquivos estáticos.

## Executar localmente

Requer Python instalado.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py app.py