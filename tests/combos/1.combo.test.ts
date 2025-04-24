import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir } from '../utils/test-helpers';

describe('Combo Test - Shadcn UI + Supabase (BaaS)', () => {
  afterEach(async () => {
    await cleanupProjectDir('combo-shadcn-supabase');
  });

  it('creates a project with Shadcn UI and Supabase BaaS (no ORM)', async () => {
    const config = {
      name: 'combo-shadcn-supabase',
      ui: 'shadcn' as const,
      databaseType: 'postgresql' as const,
      databaseProvider: 'supabase',
      baas: 'supabase' as const,
      orm: 'none' as const,
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

    // Check for Shadcn UI files
    const utilsExists = await fs.pathExists(path.join(projectDir, 'src', 'lib', 'utils.ts'));
    const shadcnGlobalsExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'globals.css'));
    const shadcnAppPageExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'page.tsx'));
    // Check for Supabase BaaS files
    const supabaseClientExists = await fs.pathExists(path.join(projectDir, 'src', 'utils', 'supabase', 'client.ts'));
    const supabaseUtilsDirExists = await fs.pathExists(path.join(projectDir, 'src', 'utils', 'supabase'));

    // Should not have ORM files
    const prismaExists = await fs.pathExists(path.join(projectDir, 'prisma', 'schema.prisma'));
    const drizzleExists = await fs.pathExists(path.join(projectDir, 'src', 'lib', 'db', 'schema.ts'));

    if (!utilsExists) throw new Error('❌ Shadcn utils file does not exist');
    if (!shadcnGlobalsExists) throw new Error('❌ Shadcn globals.css does not exist');
    if (!shadcnAppPageExists) throw new Error('❌ Shadcn app page does not exist');
    if (!supabaseClientExists) throw new Error('❌ Supabase client file does not exist');
    if (!supabaseUtilsDirExists) throw new Error('❌ Supabase utils directory does not exist');
    if (prismaExists) throw new Error('❌ Prisma schema should not exist');
    if (drizzleExists) throw new Error('❌ Drizzle schema should not exist');
    if (!packageJson.dependencies['@supabase/ssr']) throw new Error('❌ @supabase/ssr dependency missing');

    console.log(`✅ Project created at: ${projectDir}`);
    console.log(`✅ Shadcn utils file exists: ${utilsExists}`);
    console.log(`✅ Shadcn globals.css exists: ${shadcnGlobalsExists}`);
    console.log(`✅ Shadcn app page exists: ${shadcnAppPageExists}`);
    console.log(`✅ Supabase client file exists: ${supabaseClientExists}`);
    console.log(`✅ Supabase utils directory exists: ${supabaseUtilsDirExists}`);
    console.log(`✅ Prisma schema exists: ${prismaExists}`);
    console.log(`✅ Drizzle schema exists: ${drizzleExists}`);
    console.log(`✅ Deps check - @supabase/ssr: ${!!packageJson.dependencies['@supabase/ssr']}`);
  }, 30000);
});
