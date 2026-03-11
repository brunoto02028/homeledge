#!/usr/bin/env python3
# Fix mojibake characters in marketing-client.tsx
import re

path = '/opt/homeledger/app/admin/marketing/marketing-client.tsx'

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

replacements = [
    # Portuguese accented chars
    ('├ú', 'ã'), ('├â', 'â'), ('├Â', 'ô'), ('├¡', 'í'), ('├│', 'ó'),
    ('├║', 'ú'), ('├º', 'ç'), ('├í', 'á'), ('├®', 'é'), ('├¬', 'ê'),
    ('├Ä', 'Á'), ('├ü', 'À'), ('├É', 'É'), ('├ì', 'è'),
    # Em dash, bullet
    ('ÔÇö', '—'), ('ÔÇó', '•'),
    # Emojis
    ('­ƒæï', '👋'), ('­ƒÄë', '🎉'), ('­ƒÜÇ', '🚀'), ('­ƒÆ¥', '💾'),
    ('­ƒÄ¿', '📸'), ('­ƒôØ', '📝'), ('­ƒô▒', '📱'), ('­ƒôº', '📧'),
    ('­ƒôè', '📊'), ('­ƒæÑ', '👥'), ('Ô£à', '✅'), ('ÔØî', '❌'),
    ('­ƒÄö', '🎙'), ('Ô£Å', '✏'), ('­ƒÄÖ´©Å', '🎙️'), ('Ô£Å´©Å', '✏️'),
]

for bad, good in replacements:
    content = content.replace(bad, good)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done. Lines:', content.count('\n'))
