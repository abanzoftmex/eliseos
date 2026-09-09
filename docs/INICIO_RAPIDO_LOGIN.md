# 🚀 Inicio Rápido - Sistema de Usuarios

## ⚡ Problema Actual

Tu navegador muestra el dashboard pero **no tienes un usuario autenticado**, por eso:
- ❌ El sidebar solo muestra "GESTIÓN" sin opciones
- ❌ No puedes acceder a `/configuracion`
- ❌ El sistema no reconoce tu rol

## 🔧 Solución en 3 Pasos

### Paso 1: Verifica las Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga las credenciales de Firebase Admin SDK:

```env
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----\n"
```

### Paso 2: Crear Usuario Administrador Inicial

**Opción A: Usando el endpoint automático (RECOMENDADO)**

1. Abre tu navegador
2. Ve a: `http://localhost:3000/api/init-admin`
3. Verás una respuesta JSON con las credenciales:
   ```json
   {
     "success": true,
     "usuario": {
       "email": "admin@scienceinmotion.com",
       "password": "Admin123456",
       "rol": "admin"
     }
   }
   ```

**Opción B: Crear manualmente en Firebase Console**

1. Ve a Firebase Console → Authentication
2. Crea un usuario con email y contraseña
3. Copia el UID del usuario
4. Ve a Firestore → Crea colección `users`
5. Crea documento con ID = UID del usuario:
   ```json
   {
     "uid": "el-uid-copiado",
     "nombre": "Administrador",
     "email": "admin@tudominio.com",
     "rol": "admin",
     "activo": true
   }
   ```

### Paso 3: Iniciar Sesión

1. Ve a `http://localhost:3000` (página de login)
2. Ingresa las credenciales:
   - **Email:** `admin@scienceinmotion.com`
   - **Password:** `Admin123456`
3. Click en "Iniciar Sesión"
4. Serás redirigido al dashboard con **todas las opciones del menú**

### Paso 4 (Opcional): Acceso Rápido en Desarrollo

Si estás en modo desarrollo (npm run dev), verás un botón:
**"Acceder como Admin (desarrollo)"** que autocompleta las credenciales.

## ✅ Verificar que Funciona

Después de iniciar sesión, deberías ver:

### En el Sidebar:
- ✅ Dashboard
- ✅ Directorio Interno
- ✅ Clientes
- ✅ Gestión de Paquetes
- ✅ Configuración (solo admin)

### Puedes Acceder a:
- ✅ `http://localhost:3000/dashboard`
- ✅ `http://localhost:3000/directorio`
- ✅ `http://localhost:3000/clientes`
- ✅ `http://localhost:3000/paquetes`
- ✅ `http://localhost:3000/configuracion` ← **Ahora sí funciona**

## 🔍 Verificar Tu Rol Actual

Para ver qué rol tienes actualmente, abre la consola del navegador (F12) y ejecuta:

```javascript
// Ver estado completo del auth
console.log(JSON.parse(localStorage.getItem('auth-storage')));

// Ver solo el rol
console.log(JSON.parse(localStorage.getItem('auth-storage'))?.state?.userRole);
```

**Resultado esperado:**
```javascript
{
  state: {
    currentUser: { /* datos del usuario */ },
    userRole: "admin",  // ← Aquí está tu rol
    isAuthenticated: true
  }
}
```

## 🐛 Solución de Problemas

### Problema: "El sidebar sigue vacío después de login"

**Solución:**
```javascript
// En la consola del navegador:
localStorage.clear();
// Luego recarga la página y vuelve a iniciar sesión
```

### Problema: "Cannot find module 'firebase-admin'"

**Solución:**
```bash
npm install firebase-admin zustand
```

### Problema: "Invalid credentials" al crear admin

**Solución:**
Verifica que `.env.local` tenga las variables correctas y reinicia el servidor:
```bash
# Detener el servidor (Ctrl+C)
npm run dev
```

### Problema: "Permission denied" en Firestore

**Solución:**
Temporalmente, configura las reglas de Firestore en modo test:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Solo para desarrollo
    }
  }
}
```

⚠️ **IMPORTANTE:** Cambia esto a producción después de probar.

## 📝 Credenciales por Defecto

```
Email: admin@scienceinmotion.com
Password: Admin123456
Rol: admin (acceso completo)
```

**⚠️ CAMBIA LA CONTRASEÑA** después del primer login yendo a tu perfil.

## 🎯 Siguiente Paso

Una vez que inicies sesión correctamente:

1. Ve a `/configuracion`
2. Crea usuarios adicionales con diferentes roles
3. Prueba cerrar sesión e iniciar con cada usuario
4. Verifica que cada rol vea solo sus secciones permitidas

## 🔐 Seguridad

Después de crear tu usuario admin:

1. ❌ **ELIMINA** el archivo `/src/pages/api/init-admin.js`
2. ✅ Cambia la contraseña del admin
3. ✅ Configura las reglas de Firestore correctamente
4. ✅ No compartas las credenciales de admin

## 📞 ¿Necesitas Ayuda?

Si después de seguir estos pasos sigues sin poder acceder:

1. Verifica la consola del navegador (F12 → Console)
2. Verifica la terminal del servidor (busca errores)
3. Revisa que Firebase esté configurado correctamente

---

**¡Ya deberías poder usar el sistema completo!** 🎉
