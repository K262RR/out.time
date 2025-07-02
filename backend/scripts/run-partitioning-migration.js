const path = require('path');
const MigrationRunner = require('../utils/migration-runner');

async function runPartitioningMigration() {
  const runner = new MigrationRunner();
  
  try {
    const migrationPath = path.join(__dirname, '../migrations/004_table_partitioning.sql');
    await runner.runMigration(migrationPath);
    console.log('Partitioning migration completed successfully');
  } catch (error) {
    console.error('Failed to run partitioning migration:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

runPartitioningMigration(); 