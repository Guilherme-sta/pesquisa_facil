# Arquitetura e implantação

A aplicação é Flask. `app.py` é o ponto de entrada; rotas e blueprints ficam em `routes/`; rotas antigas de autenticação SUAP, títulos e exportação foram preservadas em `routes/legacy.py`. `services/` contém normalização dos docentes e acesso ao OpenAlex. HTML fica em `templates/`, CSS/JavaScript em `static/`.

Os JSONs estão organizados dentro de `data/`: `data/public/` guarda arquivos de grupos sanitizados que a página precisa ler; `data/private/` guarda caches de servidores e o arquivo de vínculos bibliométricos; `data/professores.json` guarda a lista normalizada do Metabase. A rota pública de JSON aceita somente os nomes de arquivos de grupos autorizados; os caches privados não são servidos pela aplicação. Não publique `data/private/` em um servidor de arquivos estáticos.

## Login

Execute `python app.py` e abra `http://127.0.0.1:5000`. A página pede o usuário e a senha SUAP; o campo da senha é mascarado. As credenciais são usadas somente durante a autenticação e não são gravadas em arquivo, log ou armazenamento do navegador. O servidor guarda a sessão autenticada SUAP em memória e entrega ao navegador apenas um cookie de sessão `HttpOnly` (não legível por JavaScript). Em hospedagem fora da máquina local, use HTTPS para proteger o envio das credenciais. `login-senha.py` não contém mais chaves ou senhas; é apenas um aviso de que o login ocorre pelo site.

A sessão requer processo Flask persistente, porque os tokens e a sessão SUAP são mantidos em memória. O cache legado de servidores e o progresso de coleta ficam em `data/private/`.

## Fonte de professores

`data/professores.json` é uma versão normalizada do export Metabase de 2026-10-28. Contém 1.879 docentes e campos úteis para a visualização. Matrícula SIAPE, chave interna Metabase, sexo e coordenadas não foram copiados. O campus usado nos filtros é o de exercício; quando vazio, usa o campus de lotação. O JSON tem 87 docentes sem campus de exercício e 52 sem campus de exercício ou lotação.

## Citações e vínculo de autores

O Lattes é a fonte para o identificador/perfil curricular, mas não foi encontrada documentação oficial de uma API pública geral para consultar contagens individuais de citações. O CNPq descreve o Extrator Lattes como serviço para instituições elegíveis/habilitadas, não como API pública irrestrita. Por isso, os números são fornecidos pelo OpenAlex, que publica API documentada para registros de autores, obras e citações. Essas contagens bibliométricas não equivalem a indicadores do Lattes; cobertura e atualização variam.

Nenhum vínculo é inferido pelo nome. Para habilitar um perfil, confirme a identidade com identificadores fortes (por exemplo ORCID no currículo e no OpenAlex) e registre em `data/private/citation_profiles.json`:

```json
{
  "profiles": [
    {
      "faculty_id": "ifpi-0001",
      "openalex_author_id": "A1234567890",
      "lattes_url": "https://lattes.cnpq.br/IDENTIFICADOR_CONFIRMADO",
      "verified": true,
      "verified_at": "2026-10-28",
      "verification_method": "ORCID conferido no Currículo Lattes e no perfil OpenAlex"
    }
  ]
}
```

A rota consulta apenas IDs confirmados. Respostas são cacheadas por 24 horas em memória; há limite de 25 consultas de autores por chamada. `OPENALEX_MAILTO` é opcional.

Sem ano selecionado, a métrica é o total acumulado de citações do OpenAlex. Com ano, são citações recebidas naquele ano segundo `counts_by_year`. Resultado sem vínculo fica em branco; zero só aparece quando o perfil validado informa zero. A soma agregada pode contar mais de uma vez citações de artigos em coautoria.

## Rotas

- `GET /api/citations/faculty`: lista filtrável; aceita `q`, `campus`, `area`, `degree` e `year`; exige sessão.
- `GET /api/public-data/<arquivo>`: serve apenas JSONs sanitizados e autorizados da lista de grupos.
- `GET /painel`: interface do site; exige sessão SUAP.

## Referências

- Painel e serviços Lattes/CNPq: https://www.gov.br/cnpq/pt-br/acesso-a-informacao/dados-abertos/paineis-de-dados/painel-lattes
- Extrator Lattes e Carta de Serviços CNPq: https://www.gov.br/cnpq/pt-br/acesso-a-informacao/acoes-e-programas/carta-de-servicos
- API OpenAlex: https://help.openalex.org/api/
- Campos e contagens por autor OpenAlex: https://help.openalex.org/api/llm-quick-reference/
# Hospedagem pública

O painel pode ser hospedado como Flask Web Service no Render. O blueprint `render.yaml` define serviço gratuito de início, instalação, Gunicorn com um worker, chave aleatória para Flask, health check e mantém o login SUAP desativado. Para enviar ao Render, crie um repositório Git privado com os arquivos do projeto e conecte-o ao Render. Não publique `data/private/`, arquivos `.xlsx` ou `.zip`; o `.gitignore` já os exclui junto com ambientes virtuais e caches locais.

O Render deve conectar o repositório e detectar o `render.yaml` como Blueprint. Se criar o serviço manualmente, use:

- Runtime: Python 3
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn --workers 1 --bind 0.0.0.0:$PORT app:app`
- Health check: `/api/status`
- Variáveis: `FLASK_SECRET_KEY` com valor aleatório; `ENABLE_SUAP_LOGIN=false`

O painel em `/` e `/painel`, os dados normalizados dos docentes e a API de citações são públicos. As rotas SUAP restantes continuam exigindo sessão, mas a criação de sessão por senha está desativada por padrão. Não habilite `ENABLE_SUAP_LOGIN` em um serviço público: isso faria a aplicação receber credenciais SUAP de visitantes. Para recursos SUAP em produção, use um mecanismo de autenticação institucional aprovado pelo IFPI.

Os JSONs necessários ao painel (`data/professores.json` e `data/public/`) precisam estar no repositório. Os caches `data/private/cache*.json` são locais e ignorados pelo Git. A lista `data/private/citation_profiles.json` pode ser mantida no repositório quando contiver somente IDs OpenAlex e links públicos já validados; ela começa vazia, portanto as citações só aparecerão após cadastrar correspondências confirmadas. Se optar por armazenar esse arquivo como segredo no Render, configure `CITATION_PROFILES_PATH` para o caminho do secret file.

O Render fornece URL pública com HTTPS; depois do primeiro deploy, abra o endereço do serviço, confira a tela inicial, os grupos e a seção de citações. O plano gratuito pode suspender o serviço após inatividade, causando demora no primeiro acesso seguinte.
