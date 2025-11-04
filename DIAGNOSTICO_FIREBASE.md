# 🔍 Diagnóstico de Problemas con Firebase

Si Firebase funciona localmente pero no en GitHub Pages, sigue esta guía paso a paso.

## ✅ Checklist de Verificación

### 1. Índice Compuesto (CRÍTICO)

**Verifica en Firebase Console:**
1. Ve a **Firestore Database** → **Indexes**
2. Busca un índice con:
   - Collection: `gastos`
   - Fields: `user_id` (Ascending), `fecha` (Descending)
   - Estado: Debe decir **"Enabled"** (NO "Building")

**Si está "Building":**
- Espera 2-5 minutos y recarga la página
- Si sigue "Building" después de 10 minutos, elimínalo y créalo de nuevo

**Si NO existe:**
- Créalo siguiendo el paso 5.1 de `FIREBASE_SETUP.md`

### 2. Dominio Autorizado (CRÍTICO)

**Verifica en Firebase Console:**
1. Ve a **Authentication** → **Settings**
2. Desplázate hasta **"Authorized domains"**
3. Verifica que esté tu dominio de GitHub Pages

**Para encontrar tu dominio:**
- Si tu repo es `https://github.com/tu-usuario/Finanzapp`
- Tu dominio es: `tu-usuario.github.io`
- Si tienes un subpath, agrega solo el dominio base (sin `/Finanzapp`)

**Lista de verificación:**
- ✅ `localhost` (ya está por defecto)
- ✅ `tu-usuario.github.io` (agregar manualmente)
- ✅ Tu dominio personalizado (si usas uno)

### 3. Reglas de Seguridad

**Verifica en Firebase Console:**
1. Ve a **Firestore Database** → **Rules**
2. Las reglas deben ser exactamente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{gastoId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.user_id;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.user_id;
    }
  }
}
```

3. Haz clic en **"Publish"** (aunque no hayas cambiado nada, a veces ayuda)

### 4. Variables de Entorno en GitHub

**Verifica en GitHub:**
1. Ve a tu repositorio → **Settings** → **Secrets and variables** → **Actions**
2. Verifica que existan estos secrets (con estos nombres EXACTOS):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

**Verifica los valores:**
- Copia cada valor de tu archivo `.env` local
- Compara con los secrets en GitHub
- Deben ser **exactamente iguales** (sin espacios, sin comillas)

### 5. Nuevo Despliegue

**Después de hacer cambios:**
1. Ve a **Actions** en GitHub
2. Haz clic en **"Run workflow"** → **"Run workflow"**
3. Espera a que termine el despliegue (puede tardar 2-5 minutos)

### 6. Limpiar Caché del Navegador

**En GitHub Pages:**
1. Presiona `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
2. O abre la consola (F12) → clic derecho en el botón de recargar → **"Vaciar caché y volver a cargar"**

## 🔴 Errores Comunes y Soluciones

### Error 400: "WebChannelConnection transport errored"

**Causas posibles:**
1. ❌ Índice compuesto no está "Enabled" (sigue "Building")
2. ❌ Dominio no autorizado en Firebase
3. ❌ Variables de entorno incorrectas en GitHub

**Solución:**
1. Verifica el índice (paso 1)
2. Verifica el dominio (paso 2)
3. Verifica las variables (paso 4)
4. Fuerza nuevo despliegue (paso 5)

### Error: "Permission denied"

**Causa:**
- Reglas de seguridad bloqueando la operación

**Solución:**
1. Verifica las reglas (paso 3)
2. Asegúrate de que el usuario esté autenticado
3. Verifica que el `user_id` en los documentos coincida con `request.auth.uid`

### Error: "Index missing"

**Causa:**
- El índice compuesto no existe o no está listo

**Solución:**
1. Ve a Firebase Console → Firestore → Indexes
2. Crea el índice siguiendo el paso 5.1 de `FIREBASE_SETUP.md`
3. Espera hasta que diga "Enabled"

### "Funciona local pero no en producción"

**Causas comunes:**
1. Dominio no autorizado (más común)
2. Variables de entorno diferentes
3. Índice no creado (requerido solo en producción)

**Solución:**
1. Agrega tu dominio de GitHub Pages (paso 2)
2. Verifica que los secrets en GitHub sean iguales a tu `.env` local (paso 4)
3. Crea el índice compuesto (paso 1)

## 📝 Verificar en la Consola del Navegador

Abre la consola (F12) en GitHub Pages y busca:

**✅ Si ves esto, está bien:**
```
✅ Firebase inicializado correctamente
📍 Entorno: { esProduccion: true, hostname: "tu-usuario.github.io", ... }
📥 Intentando cargar gastos desde Firebase para userId: ...
✅ Cargados X gastos desde Firebase
```

**❌ Si ves esto, hay un problema:**
```
❌ Error al cargar desde Firebase: ...
Failed to load resource: the server responded with a status of 400
```

**Para diagnosticar:**
1. Copia el error completo de la consola
2. Verifica qué paso del checklist falla
3. Sigue las soluciones arriba

## 🆘 Si Nada Funciona

1. **Verifica que el índice esté "Enabled"** (no "Building")
2. **Verifica que el dominio esté autorizado** (paso 2)
3. **Fuerza un nuevo despliegue** después de hacer cambios
4. **Limpia la caché del navegador** (Ctrl+Shift+R)
5. **Prueba en una ventana de incógnito** para descartar problemas de caché

