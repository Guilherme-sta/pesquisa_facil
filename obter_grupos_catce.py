import json

# =========================
# CARREGAR JSONS
# =========================

with open("data/private/cache_servidores_pedroII.json", "r", encoding="utf-8") as f:
    servidores = json.load(f)

with open("data/public/grupos_lideres.json", "r", encoding="utf-8") as f:
    grupos = json.load(f)

# =========================
# CRUZAMENTO
# =========================

resultado = []

for servidor in servidores:

    nome_servidor = servidor["nome"].strip().lower()

    for grupo in grupos:

        lider_1 = grupo["lider_1"].strip().lower()
        lider_2 = grupo["lider_2"].strip().lower()

        # compara com líder 1 ou líder 2
        if (
            nome_servidor == lider_1
            or nome_servidor == lider_2
        ):

            resultado.append({
                "nome": servidor["nome"],
                "grupo": grupo["grupo"],
                "lider_1": grupo["lider_1"],
                "lider_2": grupo["lider_2"]
            })

# =========================
# SALVAR
# =========================

with open("data/public/grupos_pedroII_final.json", "w", encoding="utf-8") as f:
    json.dump(resultado, f, ensure_ascii=False, indent=4)

print(f"[INFO] Matches encontrados: {len(resultado)}")
print("[INFO] Arquivo salvo!")
