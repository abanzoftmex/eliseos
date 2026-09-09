# FMSForm Component

## Descripción
Componente reutilizable para el formulario FMS (Functional Movement Screen). Este componente encapsula toda la interfaz y lógica de visualización del test FMS, permitiendo su uso en diferentes contextos de la aplicación.

## Instalación
El componente ya está disponible en `src/components/FMSForm.jsx`

## Uso Básico

```jsx
import FMSForm from '@/components/FMSForm';

function MiComponente() {
  const [formData, setFormData] = useState({
    fmsSuperiorDominante: '',
    fmsInferiorDominante: '',
    fmsDeepSquat: { /* ... */ },
    // ... otros campos FMS
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleFMSSubtestChange = (test, subtest, field, value) => {
    setFormData(prev => ({
      ...prev,
      [test]: {
        ...prev[test],
        [subtest]: { ...prev[test][subtest], [field]: value }
      }
    }));
  };

  return (
    <FMSForm
      formData={formData}
      handleInputChange={handleInputChange}
      handleNestedChange={handleNestedChange}
      handleFMSSubtestChange={handleFMSSubtestChange}
    />
  );
}
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `formData` | Object | Sí | Objeto que contiene todos los datos del formulario FMS |
| `handleInputChange` | Function | Sí | Función para actualizar campos simples: `(field, value) => void` |
| `handleNestedChange` | Function | Sí | Función para actualizar campos anidados: `(parent, field, value) => void` |
| `handleFMSSubtestChange` | Function | Sí | Función para actualizar subtests: `(test, subtest, field, value) => void` |

## Estructura de formData

El objeto `formData` debe contener los siguientes campos:

```javascript
{
  // Dominancia
  fmsSuperiorDominante: '', // 'derecha' | 'izquierda'
  fmsInferiorDominante: '', // 'derecha' | 'izquierda'
  
  // Tests FMS
  fmsDeepSquat: {
    dorsiflexionTobillos: { comentariosDerecho: '', comentariosIzquierdo: '' },
    flexionRodillasCaderas: { comentariosDerecho: '', comentariosIzquierdo: '' },
    extensionColumnaToracica: { comentarios: '' },
    flexionAbduccionHombros: { comentariosDerecho: '', comentariosIzquierdo: '' },
    activacionMusculaturaCentral: { comentarios: '' },
    tipoPuntuacionBruta: 'neutral', // 'neutral' | 'lateral'
    puntuacionBruta: '',
    puntuacionBrutaDerecha: '',
    puntuacionBrutaIzquierda: '',
    puntuacionFinal: ''
  },
  
  fmsHurdleStep: { /* Similar a fmsDeepSquat */ },
  fmsInlineLunge: { /* Similar a fmsDeepSquat */ },
  fmsShoulderMobility: { /* Similar a fmsDeepSquat */ },
  fmsImpingementClearingTest: '',
  fmsActiveStraightLegRaise: { /* Similar a fmsDeepSquat */ },
  fmsTrunkStabilityPushup: { /* Similar a fmsDeepSquat */ },
  fmsPressUpClearingTest: '',
  fmsRotaryStability: { /* Similar a fmsDeepSquat */ },
  fmsPosteriorRockingClearingTest: '',
  
  // Puntuación total
  fmsTotalPuntuacion: 0
}
```

## Funciones Handler

### handleInputChange(field, value)
Actualiza un campo simple del formulario.

**Parámetros:**
- `field` (string): Nombre del campo a actualizar
- `value` (any): Nuevo valor del campo

**Ejemplo:**
```javascript
handleInputChange('fmsSuperiorDominante', 'derecha');
```

### handleNestedChange(parent, field, value)
Actualiza un campo dentro de un objeto anidado.

**Parámetros:**
- `parent` (string): Nombre del objeto padre
- `field` (string): Nombre del campo dentro del objeto padre
- `value` (any): Nuevo valor del campo

**Ejemplo:**
```javascript
handleNestedChange('fmsDeepSquat', 'tipoPuntuacionBruta', 'lateral');
```

### handleFMSSubtestChange(test, subtest, field, value)
Actualiza un campo dentro de un subtest específico de un test FMS.

**Parámetros:**
- `test` (string): Nombre del test FMS (ej: 'fmsDeepSquat')
- `subtest` (string): Nombre del subtest (ej: 'dorsiflexionTobillos')
- `field` (string): Nombre del campo dentro del subtest (ej: 'comentariosDerecho')
- `value` (any): Nuevo valor del campo

**Ejemplo:**
```javascript
handleFMSSubtestChange(
  'fmsDeepSquat', 
  'dorsiflexionTobillos', 
  'comentariosDerecho', 
  'Buena movilidad'
);
```

## Características

- ✅ **Reutilizable**: Puede usarse en cualquier parte de la aplicación
- ✅ **Validación de Props**: Incluye PropTypes para validación en desarrollo
- ✅ **Documentación JSDoc**: Documentación completa en el código
- ✅ **Responsive**: Diseño adaptable a diferentes tamaños de pantalla
- ✅ **Tests Completos**: Incluye todos los 7 tests del FMS oficial
- ✅ **Clearing Tests**: Incluye los 3 clearing tests requeridos

## Tests Incluidos

1. **Deep Squat** - Sentadilla profunda
2. **Hurdle Step** - Paso de valla
3. **In-line Lunge** - Zancada en línea
4. **Shoulder Mobility** - Movilidad de hombro (+ Impingement Clearing Test)
5. **Active Straight-Leg Raise** - Elevación activa de pierna recta
6. **Trunk Stability Push-up** - Flexión de estabilidad del tronco (+ Press Up Clearing Test)
7. **Rotary Stability** - Estabilidad rotatoria (+ Posterior Rocking Clearing Test)

## Estilos

El componente utiliza Tailwind CSS para los estilos. Asegúrate de tener Tailwind configurado en tu proyecto.

## Ejemplo Completo

Ver implementación completa en: `src/pages/usuarios/[id]/citas/index.js`

## Notas

- Cada test puede tener puntuación **neutral** (un solo valor) o **lateral** (valores para derecho/izquierdo)
- La puntuación total se calcula sumando las puntuaciones finales de cada test
- Los clearing tests son campos de texto libre para anotaciones del evaluador
