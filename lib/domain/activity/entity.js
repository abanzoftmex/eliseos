/**
 * Activity Domain Entity
 * Encapsulates business logic for sessions, classes and payments.
 */
export class Activity {
  constructor(data) {
    this.id = data.id || data._id; // Prioridad al ID pasado explícitamente
    this.name = data.nombre || data.name;
    this.type = data.tipo || 'sesion';
    this.instructor = data.instructor || '';
    this.location = data.ubicacion || '';
    this.duration = data.duracion || 60;
    this.status = data.estado || 'programada';
    
    // Scheduling
    this.mode = data.modoProgramacion || (data.fechaEspecifica ? 'especifica' : 'recurrente');
    this.specificDate = data.fechaEspecifica || (data.fechasEspecificas?.[0]?.fecha) || data.fechaAsignacion || null;
    this.specificTime = data.horaEspecifica || (data.fechasEspecificas?.[0]?.hora) || data.horaInicio || null;
    this.daysOfWeek = data.diasSemana || [];
    
    // Pricing Logic (DDD: Value Objects / Logic)
    this.paymentMode = data.paymentMode || (data.packageId ? 'package' : 'custom'); // 'package' or 'custom'
    this.price = Number(data.precio || data.price || 0);
    this.packageId = data.packageId || null;
    this.packageName = data.packageName || null;
    
    // Payment Status
    this.isPaid = data.isPaid || false;
    this.paymentPendingValidation = data.paymentPendingValidation || false;
    this.paymentEvidenceUrl = data.paymentEvidenceUrl || null;
    this.paymentAmountReported = data.paymentAmountReported || 0;
  }

  /**
   * Business Rule: Calculate if an activity should be in the account statement
   */
  requiresPayment() {
    return this.paymentMode === 'custom' && this.price > 0;
  }

  /**
   * Business Rule: Format display date to avoid timezone shifts
   */
  getDisplayDate() {
    if (this.mode === 'recurrente' && this.daysOfWeek?.length > 0) {
      return this.daysOfWeek.join(', ');
    }
    if (!this.specificDate) return 'N/A';

    // If it's exactly YYYY-MM-DD, use manual split to avoid timezone shifts
    if (typeof this.specificDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(this.specificDate)) {
      const [y, m, d] = this.specificDate.split('-');
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Otherwise (ISO strings, Dates, etc.), parse normally
    const date = (this.specificDate?.toDate && typeof this.specificDate.toDate === 'function')
      ? this.specificDate.toDate()
      : new Date(this.specificDate);
      
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getDisplayTime() {
    return this.specificTime || 'N/A';
  }
}
