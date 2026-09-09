import { recurringExpenseService } from "@/modules/finanzas/services/recurringExpenseService";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Basic security check
    const { authorization } = req.headers;
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🚀 Starting migration of recurring expenses...');
    
    // Run the migration
    const migratedCount = await recurringExpenseService.migrateExistingExpenses();

    console.log(`🎉 Migration completed! Migrated ${migratedCount} recurring expenses.`);

    res.status(200).json({
      success: true,
      message: `Migration completed successfully. Migrated ${migratedCount} recurring expenses.`,
      migratedCount
    });

  } catch (error) {
    console.error('❌ Error during migration:', error);
    res.status(500).json({
      success: false,
      message: 'Error during migration',
      error: error.message
    });
  }
}
