import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir } from './utils/test-helpers';

describe('Database - Drizzle Test', () => {
  afterEach(async () => {
    await cleanupProjectDir('db-drizzle-test');
  });

  it('creates a project with Drizzle', async () => {
    const config = {
      name: 'db-drizzle-test',
      ui: 'none' as const,
      databaseType: 'postgresql' as const,
      databaseProvider: 'supabase',
      orm: 'drizzle' as const,
      auth: false,
      mailing: false,
      installDeps: false,
      packageManager: 'bun' as const 
    };
    
    const { projectDir, packageJson } = await createAndValidateProject(config);
    const fs = await import('fs-extra');
    const path = await import('path');

    // Assertions
    if (!projectDir) throw new Error('❌ Project directory was not created');

    // Verify Drizzle specific files
    const schemaExists = await fs.pathExists(path.join(projectDir, 'src', 'lib', 'db', 'schema.ts'));
    const migrateExists = await fs.pathExists(path.join(projectDir, 'src', 'lib', 'db', 'migrate.ts'));
    const queriesExists = await fs.pathExists(path.join(projectDir, 'src', 'lib', 'db', 'queries.ts'));

    if (!schemaExists) throw new Error('❌ Drizzle schema.ts does not exist');
    if (!migrateExists) throw new Error('❌ Drizzle migrate.ts does not exist');
    if (!queriesExists) throw new Error('❌ Drizzle queries.ts does not exist');

    console.log(`✅ Project created at: ${projectDir}`);
    console.log(`✅ Drizzle schema exists: ${schemaExists}`);
    console.log(`✅ Drizzle migrate exists: ${migrateExists}`);
    console.log(`✅ Drizzle queries exists: ${queriesExists}`);
    // Check for Drizzle dependencies
    console.log(`✅ Deps check - drizzle-orm: ${!!packageJson.dependencies['drizzle-orm']}`);
  }, 30000);
});
