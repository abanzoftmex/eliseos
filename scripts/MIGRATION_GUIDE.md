# Guía de Migración: Drafts a Consultas Completadas

## ⚠️ IMPORTANTE

Esta migración debe ejecutarse **UNA SOLA VEZ** después de desplegar los cambios que eliminan la funcionalidad de drafts.

## 📋 Pre-requisitos

1. Tener el archivo `.env.local` configurado con las credenciales de Firebase Admin
2. Tener Node.js instalado
3. Tener instaladas las dependencias:
   ```bash
   npm install firebase-admin dotenv
   ```

## 🚀 Pasos para Ejecutar la Migración

### 1. Verificar que tienes las variables de entorno

El script usa las siguientes variables de `.env.local`:
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### 2. Ejecutar el script de migración

```bash
node scripts/migrate-drafts-to-completed.js
```

### 3. Verificar los resultados

El script mostrará:
- ✅ Número de drafts migrados exitosamente
- ❌ Número de errores (si los hay)
- 📊 Resumen total

Ejemplo de salida:
```
🚀 Iniciando migración de drafts a consultas completadas...

📊 Se encontraron 15 drafts para migrar.

📝 Migrando draft: draft_normal_abc123_1234567890
   - Cliente ID: abc123
   - Tipo: normal
   ✅ Migrado exitosamente

...

============================================================
📊 RESUMEN DE MIGRACIÓN
============================================================
✅ Drafts migrados exitosamente: 15
❌ Errores: 0
📈 Total procesados: 15

✅ Migración completada.
```

## 🔍 Qué hace el script

1. **Busca** todos los documentos en la colección `consultas` con `status: 'draft'`
2. **Actualiza** cada draft a `status: 'completed'`
3. **Agrega** campos de auditoría:
   - `migratedFromDraft: true` - Flag para identificar que fue migrado
   - `migratedAt: timestamp` - Fecha de migración
   - `updatedAt: timestamp` - Actualiza la fecha de modificación

## ✅ Después de la Migración

Una vez ejecutada la migración:

1. **Dashboard actualizado**: El conteo de "Pacientes/Atletas" ahora se basa en consultas completadas
2. **Datos preservados**: Toda la información de los drafts (expedientes, datos parciales, etc.) se mantiene
3. **Consultas editables**: Todas las consultas migradas son editables como cualquier otra consulta completada

## 🔄 Cambios en el Sistema

### Antes (con drafts):
- Dashboard contaba drafts
- Cada cliente podía tener 1 draft normal + 1 draft atleta
- Drafts se guardaban automáticamente

### Después (sin drafts):
- Dashboard cuenta consultas completadas
- Cada cliente puede tener múltiples consultas completadas
- Solo se guarda al finalizar la consulta
- Todas las consultas son editables

## ⚠️ Notas Importantes

- **Ejecutar solo una vez**: No es necesario ejecutar el script múltiples veces
- **Backup recomendado**: Aunque el script solo actualiza campos, se recomienda tener un backup de Firestore
- **Reversible**: Si algo sale mal, los drafts originales siguen en la base de datos, solo con `status: 'completed'`

## 🆘 Solución de Problemas

### Error: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Error: "serviceAccountKey.json not found"
Asegúrate de tener el archivo en la raíz del proyecto. Puedes descargarlo desde:
Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### Error de permisos
Verifica que el serviceAccountKey.json tenga permisos de lectura/escritura en Firestore.

## 📞 Soporte

Si encuentras algún problema durante la migración, revisa los logs del script para identificar qué drafts fallaron y por qué.
