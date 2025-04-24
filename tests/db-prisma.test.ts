import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir } from './utils/test-helpers';

describe('Database - Prisma Test', () => {
  afterEach(async () => {
    await cleanupProjectDir('db-prisma-test');
  });

  it('creates a project with Prisma', async () => {
    const config = {
      name: 'db-prisma-test',
      ui: 'none' as const,
      databaseType: 'postgresql' as const,
      databaseProvider: 'supabase',
      orm: 'prisma' as const,
      auth: true,
      mailing: false,
      installDeps: false,
      packageManager: 'bun' as const 
    };
    
    const { projectDir, packageJson } = await createAndValidateProject(config);
    // Assertions
    if (!projectDir) throw new Error('❌ Project directory was not created');
    const fs = await import('fs-extra');
    const path = await import('path');
    // Verify Prisma specific files
    const schemaExists = await fs.pathExists(path.join(projectDir, 'prisma', 'schema.prisma'));
    const envExists = await fs.pathExists(path.join(projectDir, '.env'));
    if (!schemaExists) throw new Error('❌ prisma/schema.prisma does not exist');
    if (!envExists) throw new Error('❌ .env does not exist');
    // Check for Prisma dependencies
    if (!packageJson.dependencies['@prisma/client']) throw new Error('❌ @prisma/client dependency missing');
    if (!packageJson.devDependencies?.prisma) throw new Error('❌ prisma devDependency missing');
    console.log(`✅ Project created at: ${projectDir}`);
    console.log(`✅ Prisma schema exists: ${schemaExists}`);
    console.log(`✅ .env exists: ${envExists}`);
    console.log(`✅ Deps check - @prisma/client: ${!!packageJson.dependencies['@prisma/client']}`);
    console.log(`✅ Deps check - prisma (dev): ${!!packageJson.devDependencies?.prisma}`);
  }, 30000);
});
