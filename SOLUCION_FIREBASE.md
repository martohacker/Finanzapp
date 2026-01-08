# 🔧 Solución: Error de Permisos en Firebase

## ❌ Problema
Las reglas de Firestore están bloqueando la escritura de datos. Esto causa el error:
- `permission-denied`
- `Timeout de escritura`

## ✅ Solución Paso a Paso

### 1. Configurar Reglas de Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **"Rules"** (Reglas)
5. **Reemplaza TODAS las reglas** con este código:

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

6. Haz clic en **"Publish"** (Publicar)
7. Espera 1-2 minutos a que se propaguen los cambios

### 2. Verificar Dominios Autorizados

1. En Firebase Console, ve a **Authentication**
2. Haz clic en **Settings** (Configuración)
3. Desplázate hasta **"Authorized domains"** (Dominios autorizados)
4. Verifica que esté incluido:
   - `localhost` (para desarrollo)
   - `martohacker.github.io` (para producción)
5. Si falta alguno, haz clic en **"Add domain"** y agrégalo

### 3. Verificar Usuario Autenticado

1. En Firebase Console, ve a **Authentication → Users**
2. Verifica que tu usuario (`martinhacker02@gmail.com`) esté listado
3. Si no está, el usuario debe registrarse/iniciar sesión primero

### 4. Verificar Índices (si es necesario)

Si ves un error sobre índices faltantes:

1. Ve a **Firestore Database → Indexes**
2. Haz clic en el enlace del error para crear el índice automáticamente
3. Espera 2-3 minutos a que se cree el índice

## 🧪 Probar la Solución

1. Recarga la página de la aplicación
2. Intenta agregar un nuevo gasto
3. Revisa la consola del navegador:
   - ✅ Si funciona: verás `✅ Gasto guardado en Firebase con ID: [ID]`
   - ❌ Si falla: verás el error específico con más detalles

## 📋 Verificar que Funciona

1. Ve a **Firestore Database → Data**
2. Deberías ver una colección llamada `gastos`
3. Dentro deberías ver documentos con tus gastos
4. Cada documento debe tener:
   - `user_id`: Tu ID de usuario
   - `descripcion`: Descripción del gasto
   - `monto`: Monto del gasto
   - `categoria`: Categoría del gasto
   - `fecha`: Fecha del gasto
   - `moneda`: Moneda (ARS, USD, etc.)

## ⚠️ Notas Importantes

- Las reglas de seguridad son **obligatorias** en Firestore
- Sin reglas correctas, **ninguna escritura funcionará**
- Los cambios en las reglas pueden tardar 1-2 minutos en aplicarse
- Siempre verifica que `request.auth.uid` coincida con `user_id` en los datos

## 🆘 Si Aún No Funciona

1. **Cierra sesión** y vuelve a **iniciar sesión** en la aplicación
2. Revisa la consola del navegador para ver el error exacto
3. Verifica que el usuario esté autenticado:
   - En la consola, busca: `✅ Usuario autenticado correctamente`
4. Si el error persiste, comparte:
   - El mensaje de error completo de la consola
   - Una captura de pantalla de las reglas de Firestore


