import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir } from '../utils/test-helpers';

describe('Combo Test - Shadcn + NextAuth + Drizzle + Resend + Postgres', () => {
  afterEach(async () => {
    await cleanupProjectDir('combo-shadcn-nextauth-drizzle-resend');
  });

  it('creates a project with Shadcn UI, NextAuth, Drizzle ORM, Resend mailing, and Postgres', async () => {
    const config = {
      name: 'combo-shadcn-nextauth-drizzle-resend',
      ui: 'shadcn' as const,
      databaseType: 'postgresql' as const,
      databaseProvider: 'default',
      orm: 'drizzle' as const,
      auth: true,
      authProvider: 'nextauth' as const,
      mailing: true,
      mailingProvider: 'resend' as const,
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
    // Check for Drizzle ORM files
    const drizzleSchemaExists = await fs.pathExists(path.join(projectDir, 'src', 'lib', 'db', 'schema.ts'));
    // Check for NextAuth route (remains the same if correct)
    const nextAuthRouteExists = await fs.pathExists(path.join(projectDir, 'src', 'app', '(auth)', 'api', 'auth', '[...nextauth]', 'route.ts'));
    // Check for Resend mailing file (look for src/app/api/send/index.ts or similar)
    const resendMailFileExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'api', 'send', 'route.ts'));

    if (!utilsExists) throw new Error('❌ Shadcn utils file does not exist');
    if (!drizzleSchemaExists) throw new Error('❌ Drizzle schema does not exist');
    if (!nextAuthRouteExists) throw new Error('❌ NextAuth route does not exist');
    if (!resendMailFileExists) throw new Error('❌ Resend mail file does not exist');
    if (!packageJson.dependencies['resend']) throw new Error('❌ resend dependency missing');

    console.log(`✅ Project created at: ${projectDir}`);
    console.log(`✅ Shadcn utils file exists: ${utilsExists}`);
    console.log(`✅ Drizzle schema exists: ${drizzleSchemaExists}`);
    console.log(`✅ NextAuth route exists: ${nextAuthRouteExists}`);
    console.log(`✅ Resend mail file exists: ${resendMailFileExists}`);
    // Check for Resend dependency
    console.log(`✅ Deps check - resend: ${!!packageJson.dependencies['resend']}`);
  }, 40000);
});
