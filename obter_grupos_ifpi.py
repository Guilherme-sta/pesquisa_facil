import pandas as pd
import json
import unicodedata

ARQUIVO = "rel_consulta_parametrizada_por_grupo (1).xlsx"

print("[INFO] Lendo Excel...")

# =========================
# FUNÇÃO PARA REMOVER ACENTOS
# =========================

def remover_acentos(texto):

    texto = str(texto).strip()

    texto = unicodedata.normalize('NFKD', texto)

    texto = ''.join(
        c for c in texto
        if not unicodedata.combining(c)
    )

    return texto

# =========================
# LEITURA DO EXCEL
# =========================

df = pd.read_excel(ARQUIVO, header=None)

dados = []
vistos = set()

for linha in df.values:

    valores = [
        str(x).strip()
        for x in linha
        if pd.notna(x) and str(x).strip()
    ]

    # mínimo esperado
    if len(valores) < 5:
        continue

    instituicao = valores[0]
    grupo = valores[1]

    # remove apenas acentos
    lider_1 = remover_acentos(valores[3])
    lider_2 = remover_acentos(valores[4])

    chave = (grupo, lider_1, lider_2)

    # remove apenas duplicados reais
    if chave in vistos:
        continue

    vistos.add(chave)

    dados.append({
        "instituicao": instituicao,
        "grupo": grupo,
        "lider_1": lider_1,
        "lider_2": lider_2
    })

print(f"[INFO] Registros encontrados: {len(dados)}")

with open("data/public/grupos_lideres.json", "w", encoding="utf-8") as f:
    json.dump(dados, f, ensure_ascii=False, indent=4)

print("[INFO] JSON salvo!")
