import re

# Read script.js file
with open('script.js', 'r', encoding='utf-8') as f:
    script_content = f.read()

# Read index.html file
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Extract all getElementById calls from script.js
script_ids = re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', script_content)

# Extract all id attributes from index.html
html_ids = re.findall(r'id=["\']([^"\']+)["\']', html_content)

# Convert to sets for easier comparison
script_ids_set = set(script_ids)
html_ids_set = set(html_ids)

# Find missing IDs (in script but not in HTML)
missing_ids = script_ids_set - html_ids_set

# Find extra IDs (in HTML but not used in script)
extra_ids = html_ids_set - script_ids_set

print("IDs used in script.js:")
print(sorted(script_ids_set))
print("\nIDs defined in index.html:")
print(sorted(html_ids_set))
print("\nMissing IDs (in script but not in HTML):")
print(missing_ids)
print("\nExtra IDs (in HTML but not used in script):")
print(extra_ids)

# Specifically check for closeHelp
print(f"\nCloseHelp element check:")
print(f"In script.js: {'closeHelp' in script_ids_set}")
print(f"In index.html: {'closeHelp' in html_ids_set}")