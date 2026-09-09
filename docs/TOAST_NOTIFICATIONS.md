# Sistema de Notificaciones Toast

Este proyecto utiliza `react-hot-toast` para mostrar notificaciones elegantes y consistentes en toda la aplicación.

## 📦 Instalación

La biblioteca ya está instalada. Si necesitas reinstalarla:

```bash
npm install react-hot-toast
```

## 🎨 Configuración

El componente `<Toaster>` está configurado globalmente en el `Layout.jsx` con estilos personalizados:

- **Posición**: Top-right
- **Duración por defecto**: 4 segundos
- **Success**: 3 segundos (verde)
- **Error**: 5 segundos (rojo)
- **Loading**: Hasta que se actualice o cierre

## 🚀 Uso Básico

### Importar toast

```javascript
import toast from 'react-hot-toast';
```

### Notificaciones Simples

```javascript
// Success
toast.success('¡Operación exitosa!');

// Error
toast.error('Ocurrió un error');

// Loading
toast.loading('Cargando...');

// Info
toast('Información importante');
```

## 🎯 Uso Avanzado

### Con Loading State

```javascript
const loadingToast = toast.loading('Guardando...');

try {
  await saveData();
  toast.success('¡Guardado exitosamente!', { id: loadingToast });
} catch (error) {
  toast.error('Error al guardar', { id: loadingToast });
}
```

### Con Promesas

```javascript
toast.promise(
  saveData(),
  {
    loading: 'Guardando...',
    success: '¡Guardado!',
    error: 'Error al guardar',
  }
);
```

### Toast Personalizado

```javascript
toast('Custom message', {
  icon: '👏',
  style: {
    borderRadius: '10px',
    background: '#333',
    color: '#fff',
  },
  duration: 4000,
});
```

## 🛠️ Utilidades Helper

Hemos creado utilidades en `src/utils/toast.js`:

```javascript
import toastUtils from '@/utils/toast';

// O importar funciones específicas
import { showSuccessToast, showErrorToast } from '@/utils/toast';

// Usar las utilidades
toastUtils.success('¡Éxito!');
toastUtils.error('Error');
toastUtils.warning('Advertencia');
toastUtils.info('Información');

// Actualizar un toast existente
const id = toastUtils.loading('Procesando...');
toastUtils.update(id, '¡Completado!', 'success');

// Cerrar toasts
toastUtils.dismiss(id); // Cerrar uno específico
toastUtils.dismissAll(); // Cerrar todos
```

## 📋 Ejemplos de Uso en el Proyecto

### Crear Clase

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  const loadingToast = toast.loading('Creando clase...');

  try {
    const result = await createClass(classData);
    
    if (imageFile) {
      toast.loading('Subiendo imagen...', { id: loadingToast });
      await uploadClassImage(result.classId, imageFile);
    }
    
    toast.success('¡Clase creada exitosamente!', { id: loadingToast });
    router.push(`/clases/${result.classId}`);
  } catch (error) {
    toast.error(error.message, { id: loadingToast });
  }
};
```

### Eliminar Clase

```javascript
const handleDelete = async (classId) => {
  if (!window.confirm('¿Estás seguro?')) return;
  
  const loadingToast = toast.loading('Eliminando...');
  
  try {
    await deleteClass(classId);
    toast.success('Clase eliminada', { id: loadingToast });
  } catch (error) {
    toast.error('Error al eliminar', { id: loadingToast });
  }
};
```

## 🎨 Personalización de Estilos

### Estilos Globales (en Layout.jsx)

```javascript
<Toaster
  position="top-right"
  toastOptions={{
    style: {
      background: '#fff',
      color: '#363636',
      padding: '16px',
      borderRadius: '8px',
    },
    success: {
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    },
  }}
/>
```

### Estilos por Toast

```javascript
toast.success('Mensaje', {
  style: {
    background: '#10b981',
    color: '#fff',
  },
});
```

## 🔧 Opciones Disponibles

| Opción | Tipo | Por Defecto | Descripción |
|--------|------|-------------|-------------|
| `duration` | number | 4000 | Duración en ms |
| `position` | string | 'top-right' | Posición del toast |
| `style` | object | {} | Estilos CSS personalizados |
| `icon` | string/element | auto | Icono personalizado |
| `id` | string | auto | ID para actualizar el toast |

## 📍 Posiciones Disponibles

- `top-left`
- `top-center`
- `top-right` (por defecto)
- `bottom-left`
- `bottom-center`
- `bottom-right`

## ✅ Mejores Prácticas

1. **Usa loading state para operaciones asíncronas**
   ```javascript
   const toastId = toast.loading('Procesando...');
   // ... operación
   toast.success('¡Listo!', { id: toastId });
   ```

2. **Mensajes claros y concisos**
   - ✅ "Clase creada exitosamente"
   - ❌ "La operación de crear la clase se completó con éxito"

3. **Duración apropiada**
   - Success: 2-3 segundos
   - Error: 4-5 segundos (más tiempo para leer)
   - Info/Warning: 3-4 segundos

4. **Manejo de errores consistente**
   ```javascript
   catch (error) {
     toast.error(error.message || 'Ocurrió un error inesperado');
   }
   ```

## 🔗 Documentación Oficial

Para más detalles: [react-hot-toast docs](https://react-hot-toast.com/)
