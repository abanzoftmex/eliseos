# 🔐 Configuración de Firebase Storage

## ⚠️ Problema Actual

Al intentar subir imágenes de clases, recibes este error:
```
Firebase Storage: User does not have permission to access 'clases/xxx/imagen.jpg'. (storage/unauthorized)
```

## 🔧 Solución

Necesitas configurar las reglas de Firebase Storage para permitir la subida de archivos.

### Opción 1: Configuración en Firebase Console (RECOMENDADO)

1. **Ve a Firebase Console:**
   - Abre https://console.firebase.google.com
   - Selecciona tu proyecto

2. **Navega a Storage:**
   - En el menú lateral, click en "Storage"
   - Click en la pestaña "Rules"

3. **Actualiza las Reglas:**

   **Para Desarrollo (permite todo):**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   ⚠️ Esto permite lectura/escritura solo a usuarios autenticados

   **Para Producción (más restrictivo):**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Permitir lectura pública de imágenes
       match /{allPaths=**} {
         allow read: if true;
       }
       
       // Permitir escritura solo a usuarios autenticados en carpeta de clases
       match /clases/{claseId}/{fileName} {
         allow write: if request.auth != null;
       }
       
       // Permitir escritura solo a usuarios autenticados en carpeta de perfil
       match /profile/{userId}/{fileName} {
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Publica las Reglas:**
   - Click en "Publicar"
   - Espera unos segundos

### Opción 2: Usando Firebase CLI

Si tienes Firebase CLI instalado:

1. **Crea/Edita el archivo `storage.rules` en la raíz del proyecto:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. **Despliega las reglas:**
```bash
firebase deploy --only storage
```

## ✅ Verificar que Funciona

1. **Intenta subir una imagen:**
   - Ve a `/clases/nueva`
   - Crea una nueva clase
   - Sube una imagen
   - Si funciona, verás la imagen en la vista de clases

2. **Verifica en Firebase Console:**
   - Ve a Storage → Files
   - Deberías ver la carpeta `clases/` con las imágenes subidas

## 🔍 Verificar Autenticación

Si las reglas requieren autenticación (`request.auth != null`), asegúrate de:

1. **Estar logueado:**
   - Verifica en la consola del navegador:
   ```javascript
   console.log(JSON.parse(localStorage.getItem('auth-storage')));
   ```

2. **Tener un token válido:**
   - Firebase maneja esto automáticamente si usas `firebase.auth()`

## 📝 Estructura de Archivos en Storage

Después de configurar correctamente, tus archivos se guardarán así:

```
storage/
├── clases/
│   ├── [claseId1]/
│   │   └── imagen.jpg
│   ├── [claseId2]/
│   │   └── foto.png
│   └── ...
└── profile/ (futuro)
    ├── [userId1]/
    │   └── avatar.jpg
    └── ...
```

## 🚨 Seguridad

**IMPORTANTE para Producción:**

❌ **NUNCA uses en producción:**
```javascript
allow read, write: if true; // Cualquiera puede leer/escribir
```

✅ **SÍ usa:**
```javascript
allow read, write: if request.auth != null; // Solo usuarios autenticados
```

✅ **AÚN MEJOR:**
```javascript
// Verificar tamaño de archivo
allow write: if request.auth != null 
            && request.resource.size < 5 * 1024 * 1024 // Máximo 5MB
            && request.resource.contentType.matches('image/.*'); // Solo imágenes
```

## 🎯 Próximos Pasos

Una vez configurado Firebase Storage:

1. ✅ Podrás subir imágenes al crear clases
2. ✅ Las imágenes se mostrarán en las cards
3. ✅ Podrás editar y actualizar imágenes de clases existentes

---

**¿Necesitas ayuda?** Verifica:
1. Que estés autenticado en la app
2. Que las reglas de Storage estén publicadas
3. La consola del navegador para más detalles del error
