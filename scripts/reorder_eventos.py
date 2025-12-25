import json
import os

# Ler arquivo
with open('data/eventos.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Criar novo JSON em string com ordem correta
output = "[\n"
for idx, evento in enumerate(data):
    # Montar evento na ordem correta
    output += '    {\n'
    output += f'        "nome": "{evento["nome"]}",\n'
    output += f'        "horario_visitacao": "{evento.get("horario_visitacao", "A definir")}",\n'
    output += f'        "tipo": "{evento.get("tipo", "")}",\n'
    output += f'        "bairro": "{evento.get("bairro", "")}",\n'
    output += f'        "endereco": "{evento.get("endereco", "").replace(chr(34), chr(92)+chr(34))}",\n'
    output += f'        "latitude": {evento.get("latitude", 0)},\n'
    output += f'        "longitude": {evento.get("longitude", 0)},\n'
    
    # Imagens
    imgs = evento.get("imagens", [])
    imgs_str = ', '.join(f'"{img}"' for img in imgs)
    output += f'        "imagens": [{imgs_str}],\n'
    
    # Horários
    horarios = evento.get("horarios", {})
    h_str = json.dumps(horarios, ensure_ascii=False)
    output += f'        "horarios": {h_str},\n'
    
    desc = evento.get("descricao", "").replace(chr(10), " ").replace(chr(13), "").replace(chr(34), chr(92)+chr(34))
    output += f'        "descricao": "{desc}",\n'
    output += f'        "site": "{evento.get("site", "")}",\n'
    output += f'        "instagram": "{evento.get("instagram", "")}",\n'
    output += f'        "distancia_airbnb_m": {evento.get("distancia_airbnb_m", 0)}'
    
    if idx < len(data) - 1:
        output += '\n    },\n'
    else:
        output += '\n    }\n'

output += ']'

# Escrever
with open('data/eventos.json', 'w', encoding='utf-8') as f:
    f.write(output)

print(f'✓ {len(data)} eventos reorganizados!')
