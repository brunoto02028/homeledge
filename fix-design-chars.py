#!/usr/bin/env python3
path = '/opt/homeledger/app/admin/marketing/design-studio/design-studio-client.tsx'

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

replacements = [
    ('├ú', 'ã'), ('├â', 'â'), ('├Â', 'ô'), ('├¡', 'í'), ('├│', 'ó'),
    ('├║', 'ú'), ('├º', 'ç'), ('├í', 'á'), ('├®', 'é'), ('├¬', 'ê'),
    ('ÔÇö', '—'), ('ÔÇó', '•'),
    ('­ƒÄë', '🎉'), ('­ƒôØ', '📝'), ('­ƒôä', '🖼'), ('­ƒÄ¿', '📸'),
    ('Ô£à', '✅'), ('­ƒôé', '📄'),
    ('Título', 'Título'), ('São', 'São'), ('Serviços', 'Serviços'),
    ('bilíngues', 'bilíngues'), ('conteúdo', 'conteúdo'),
]

for bad, good in replacements:
    content = content.replace(bad, good)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done. Lines:', content.count('\n'))
