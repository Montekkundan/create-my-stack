import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir } from './utils/test-helpers';

describe('UI Library - Shadcn Test', () => {
  afterEach(async () => {
    await cleanupProjectDir('ui-shadcn');
  });

  it('creates a project with Shadcn UI', async () => {
    const config = {
      name: 'ui-shadcn',
      ui: 'shadcn' as const,
      databaseType: 'none' as const,
      databaseProvider: 'none',
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
    // Verify Shadcn specific files under src
    const utilsExists = await fs.pathExists(path.join(projectDir, 'src', 'lib', 'utils.ts'));
    const globalsExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'globals.css'));
    const appPageExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'page.tsx'));
    const layoutExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'layout.tsx'));
    if (!utilsExists) throw new Error('❌ src/lib/utils.ts does not exist');
    if (!globalsExists) throw new Error('❌ src/app/globals.css does not exist');
    if (!appPageExists) throw new Error('❌ src/app/page.tsx does not exist');
    if (!layoutExists) throw new Error('❌ src/app/layout.tsx does not exist');
    // Shadcn doesn't have a direct dependency but should have tailwind and clsx
    if (!packageJson.dependencies.tailwindcss && !packageJson.dependencies.clsx) throw new Error('❌ tailwindcss or clsx dependency missing');
    console.log(`✅ Project created at: ${projectDir}`);
    console.log(`✅ Utils file exists: ${utilsExists}`);
    console.log(`✅ globals.css exists: ${globalsExists}`);
    console.log(`✅ App page exists: ${appPageExists}`);
    console.log(`✅ layout.tsx exists: ${layoutExists}`);
    console.log(`✅ Deps check - tailwindcss or clsx: ${!!packageJson.dependencies.tailwindcss || !!packageJson.dependencies.clsx}`);
  }, 30000);
});
