# 🔧 Scripts de Utilidad

Este directorio contiene scripts de utilidad y mantenimiento del sistema.

## 📋 Scripts Disponibles

### 1. `audit-duplicate-october-31.js`
**Propósito:** Auditoría de transacciones recurrentes duplicadas.

**Uso:**
```bash
node scripts/audit-duplicate-october-31.js
```

**Funcionalidad:**
- Detecta transacciones duplicadas en un rango de fechas
- Genera archivo CSV con duplicados encontrados (si existen)
- Muestra resumen detallado en consola
- ⚠️ **Solo audita, NO elimina datos**

**Salida:**
- 📄 CSV: `audit-reports/duplicados-octubre-31-YYYY-MM-DD.csv` (si hay duplicados)
- 📊 Console: Resumen detallado

---

### 2. `simulate-october-2025.cjs`
**Propósito:** Script de simulación para pruebas.

---

## 📚 Documentación

Para información sobre el sistema de suscripciones mensuales, consulta:
- � `MONTHLY_SUBSCRIPTION_FIX.md` - Documentación de la corrección del sistema mensual
- � `src/lib/services/recurringExpenseService.js` - Lógica de gastos recurrentes

---

## � Troubleshooting

### Error: "Cannot find module"
```bash
# Asegúrate de estar en la raíz del proyecto
cd /Users/gabrielhernandez/Projects/chago
npm install
```

### Error: "Firebase not configured"
```bash
# Verificar configuración de Firebase
cat .env.local | grep FIREBASE
```

---

**Última actualización:** 4 de noviembre de 2025
