# Cómo conectar FinanzApp con Firebase (paso a paso)

## 1. Crear proyecto en Firebase

1. Entra en **https://console.firebase.google.com**
2. Inicia sesión con Google.
3. **Agregar proyecto** → nombre (ej: `finanzapp`) → Crear.
4. En el panel, haz clic en el icono **Web** (</>) para agregar una app.
5. Nickname: `FinanzApp` → **Registrar app**.
6. **Copia** el bloque `firebaseConfig` que te muestra (lo usarás en el paso 3).

---

## 2. Activar Firestore y Authentication

1. En el menú izquierdo: **Build** → **Firestore Database** → **Create database**.
   - Modo: **Test mode** (para empezar).
   - Elige una región y **Enable**.

2. **Reglas de Firestore:** pestaña **Rules**, pega esto y **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /gastos/{gastoId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.user_id;
    }
  }
}
```

3. **Índice en Firestore:**  
   **Firestore** → **Indexes** → **Create Index**:
   - Collection: `gastos`
   - Campo 1: `user_id` (Ascending)
   - Campo 2: `fecha` (Descending)
   - Scope: Collection  
   → **Create** y espera a que pase a "Enabled".

4. **Authentication:**  
   **Build** → **Authentication** → **Get started** → pestaña **Sign-in method** → **Email/Password** → Activar → **Save**.

---

## 3. Crear el archivo `.env` en tu proyecto

1. En la carpeta del proyecto (donde está `package.json`), crea un archivo llamado **`.env`**.

2. Abre **Firebase Console** → icono de engranaje → **Project settings** → **General** → en "Your apps" selecciona tu app web.

3. Copia cada valor del `firebaseConfig` y pégalo en `.env` así (sin comillas, sin espacios alrededor del `=`):

```
VITE_FIREBASE_API_KEY=tu-apiKey
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

4. Guarda el archivo.

**En Windows**, si no ves `.env`: en la terminal dentro del proyecto:
```powershell
New-Item -Path .env -ItemType File
```
Luego ábrelo con el editor y pega las líneas de arriba con tus valores.

---

## 4. Reiniciar la app

1. Si tienes `npm run dev` en marcha, deténlo con **Ctrl + C**.
2. Vuelve a ejecutar:
   ```bash
   npm run dev
   ```
3. Abre **http://localhost:5173** en el navegador.

---

## 5. Usar la app con Firebase

1. En la app, haz clic en **Registrarse** (no uses el usuario solo local).
2. Pon un email y contraseña (mínimo 6 caracteres) y regístrate.
3. Añade gastos o importa datos como siempre.

---

## 6. Ver los datos en Firebase

1. Ve a **https://console.firebase.google.com** → tu proyecto.
2. **Build** → **Firestore Database** → pestaña **Data**.
3. Ahí verás la colección **`gastos`**: cada documento es un gasto (descripción, monto, categoría, fecha, `user_id`, etc.).

Para ver usuarios:
- **Build** → **Authentication** → **Users**.

---

## Si algo falla

- **"Firebase no está configurado"** en consola (F12): revisa que `.env` exista en la raíz, que las variables empiecen por `VITE_FIREBASE_` y que hayas reiniciado `npm run dev`.
- **Error de permisos al cargar/guardar:** repasa las reglas de Firestore (paso 2) y que el índice esté en estado "Enabled".
- **Error 400 o índice:** crea el índice del paso 2 (user_id + fecha) y espera a que esté "Enabled".
