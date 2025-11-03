# Cómo Funciona el Almacenamiento Cuando la App Está Online

## 🔍 Concepto Clave

Cuando subes la app a GitHub Pages (o cualquier hosting web), **NO hay servidor de base de datos**. Todo funciona en el navegador del usuario usando **localStorage**.

## 📍 ¿Dónde se Guardan los Datos?

### En el Navegador del Usuario

Cuando alguien visita tu sitio web en:
```
https://martohacker.github.io/Finanzapp/
```

Los datos se guardan en **el localStorage de SU navegador**, no en el servidor.

### Ubicación Física (Chrome en Windows)

```
C:\Users\[NombreUsuario]\AppData\Local\Google\Chrome\User Data\Default\Local Storage\leveldb\
```

### Ubicación Física (Firefox)

```
C:\Users\[NombreUsuario]\AppData\Roaming\Mozilla\Firefox\Profiles\[perfil]\storage\default\
```

## 👥 Ejemplo Práctico

### Escenario: 3 usuarios diferentes

1. **Usuario A** (Juan) abre la app en su computadora:
   - Se registra con: `juan@email.com`
   - Agrega 10 gastos
   - ✅ Sus datos se guardan en el localStorage de SU navegador

2. **Usuario B** (María) abre la app en su celular:
   - Se registra con: `maria@email.com`
   - Agrega 5 gastos
   - ✅ Sus datos se guardan en el localStorage de SU navegador

3. **Usuario C** (Pedro) abre la app en su tablet:
   - Se registra con: `pedro@email.com`
   - Agrega 8 gastos
   - ✅ Sus datos se guardan en el localStorage de SU navegador

### ¿Qué pasa en el servidor?

**NADA**. El servidor (GitHub Pages) solo sirve los archivos estáticos (HTML, CSS, JS). No guarda ningún dato.

## 🔐 Seguridad y Privacidad

### ✅ Ventajas:
- **Privacidad total**: Cada usuario solo ve sus propios datos
- **Sin servidor**: No necesitas base de datos ni backend
- **Gratis**: GitHub Pages es gratuito
- **Seguridad local**: Los datos están en el dispositivo del usuario

### ⚠️ Limitaciones:
- **No sincroniza entre dispositivos**: Si Juan usa la app en su PC y luego en su celular, tendrá datos diferentes en cada uno
- **Se pierden si borra el navegador**: Si el usuario borra los datos del navegador, pierde todo
- **No hay backup automático**: Los datos no se respaldan en la nube

## 📦 Qué se Guarda en localStorage

### Claves que se crean:

1. **`finanzapp-usuarios`** (compartida por todos)
   - Lista de TODOS los usuarios registrados
   - ⚠️ **Importante**: Esta lista está en cada navegador
   - Si Juan se registra en su PC, María NO lo verá en su celular

2. **`finanzapp-sesion`**
   - ID del usuario actualmente logueado
   - Solo existe si hay sesión activa

3. **`finanzapp-pwd-{userId}`**
   - Hash de la contraseña de cada usuario
   - Una clave por usuario

4. **`finanzapp-gastos-{userId}`**
   - Gastos del usuario específico
   - Cada usuario tiene su propia clave

5. **`finanzapp-moneda-{userId}`**
   - Moneda preferida del usuario
   - Cada usuario tiene su propia clave

## 🔄 ¿Cómo Funciona la Registro/Login?

### Registro:
1. Usuario llena el formulario (email, password, nombre)
2. Se hashea la contraseña (SHA-256)
3. Se crea un nuevo usuario con ID único
4. Se guarda en `finanzapp-usuarios` (en SU navegador)
5. Se guarda el hash en `finanzapp-pwd-{userId}` (en SU navegador)
6. Se inicia sesión automáticamente

### Login:
1. Usuario ingresa email y password
2. Se busca el usuario en `finanzapp-usuarios` (de SU navegador)
3. Se hashea la password ingresada
4. Se compara con el hash guardado
5. Si coincide, se inicia sesión

## ⚙️ Diferencia: Online vs Offline

### Cuando está Online (GitHub Pages):
- ✅ Múltiples usuarios pueden visitar el sitio
- ✅ Cada uno tiene sus propios datos en su navegador
- ✅ Los datos NO se comparten entre usuarios
- ✅ Los datos NO se guardan en el servidor

### Cuando está Offline (PWA instalada):
- ✅ Funciona igual que online
- ✅ Los datos siguen en el localStorage del navegador
- ✅ Puede funcionar sin internet (una vez cargada)

## 🚀 Para Sincronización Entre Dispositivos

Si quieres que los datos se sincronicen entre dispositivos del mismo usuario, necesitarías:

1. **Backend con base de datos** (Firebase, Supabase, MongoDB, etc.)
2. **Autenticación real** (tokens, JWT)
3. **API REST** para guardar/cargar datos
4. **Sincronización en tiempo real** (WebSockets o polling)

¿Quieres que implemente sincronización con backend?

