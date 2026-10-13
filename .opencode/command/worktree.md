---
description: Crea un git worktree en .worktrees/ a partir del argumento recibido
agent: build
---

Vas a crear un git worktree. Recibirás un argumento (opcionalmente entre comillas) que puede contener espacios o no:

`$ARGUMENTS`

Reglas estrictas — sigue EXACTAMENTE estos pasos y no hagas nada más:

1. Toma el argumento recibido y deriva el nombre del worktree a partir de él:
   - Si tiene espacios, conviértelos en guiones (`-`).
   - Minúsculas, sin acentos ni caracteres especiales; elimina cualquier carácter distinto de letras, números y guiones (por ejemplo: `"mi feature nueva"` → `mi-feature-nueva`, `"Hotfix Login!!"` → `hotfix-login`).
   - Si no recibes ningún argumento, usa el nombre `worktree`.
2. Ejecuta únicamente este comando (sin `cd`, sin nada adicional):

   ```
   git worktree add .worktrees/<nombre-del-worktree>
   ```

   Si la ruta contiene espacios (no debería tras la normalización), cítala.

3. Reporta la ruta del worktree creado y detente ahí.

Prohibido: cambiar de directorio, crear branches manualmente, hacer checkout, tocar archivos, o ejecutar cualquier otro comando distinto del indicado en el paso 2.
