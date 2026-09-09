/**
 * Payment Domain Entity
 */
export class PaymentEvidence {
  constructor(data) {
    this.id = data.id;
    this.activityId = data.assignmentId || data.activityId;
    this.amount = Number(data.amount || 0);
    this.evidenceUrl = data.evidenceUrl || null;
    this.status = data.status || 'pending_validation';
    this.notes = data.notes || '';
    this.reportedAt = data.reportedAt || new Date();
  }

  isValid() {
    return this.amount > 0 && Boolean(this.evidenceUrl);
  }
}
