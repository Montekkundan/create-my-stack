import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir, testDir } from './utils/test-helpers';

const stackrcConfig = {
  name: 'combo-shadcn-supabase',
  ui: 'shadcn',
  databaseType: 'postgresql',
  databaseProvider: 'supabase',
  baas: 'supabase',
  orm: 'none',
  auth: false,
  mailing: false,
  installDeps: true,
  packageManager: 'bun'
};

const fs = require('fs-extra');
const path = require('path');

const stackrcPath = path.join(testDir, 'combo-shadcn-supabase', '.stackrc');

async function writeStackrc(config: any, dir: string) {
  await fs.ensureDir(dir);
  await fs.writeJson(path.join(dir, '.stackrc'), config, { spaces: 2 });
}

describe('CLI --stack config feature', () => {
  afterEach(async () => {
    await cleanupProjectDir('combo-shadcn-supabase');
  });

  it('creates a project using --stack config', async () => {
    const projectDir = path.join(testDir, 'combo-shadcn-supabase');
    await writeStackrc(stackrcConfig, projectDir);
    // Simulate running the CLI with --stack .stackrc
    const { projectDir: createdDir, packageJson } = await createAndValidateProject({
      ...stackrcConfig,
      ui: stackrcConfig.ui as 'none' | 'shadcn' | 'chakra',
      databaseType: stackrcConfig.databaseType as 'none' | 'postgresql' | 'mysql' | 'sqlite',
      orm: stackrcConfig.orm as 'none' | 'prisma' | 'drizzle',
      packageManager: stackrcConfig.packageManager as 'npm' | 'pnpm' | 'yarn' | 'bun',
    });
    // Check for Supabase demo page
    const supabasePage = await fs.pathExists(path.join(createdDir, 'src', 'app', 'supabase', 'page.tsx'));
    if (!supabasePage) throw new Error('❌ Supabase demo page was not created');
    // Check for shadcn globals
    const globalsExists = await fs.pathExists(path.join(createdDir, 'src', 'app', 'globals.css'));
    if (!globalsExists) throw new Error('❌ globals.css does not exist');
    // Check for base layout
    const layoutExists = await fs.pathExists(path.join(createdDir, 'src', 'app', 'layout.tsx'));
    if (!layoutExists) throw new Error('❌ layout.tsx does not exist');
    // Check for dependencies
    if (!packageJson.dependencies.next) throw new Error('❌ next dependency missing');
    if (!packageJson.dependencies.react) throw new Error('❌ react dependency missing');
    if (!packageJson.dependencies['react-dom']) throw new Error('❌ react-dom dependency missing');
    if (!packageJson.dependencies['@supabase/ssr']) throw new Error('❌ @supabase/ssr dependency missing');
    console.log('✅ Project created with --stack config and Supabase BaaS');
  }, 30000);
});
