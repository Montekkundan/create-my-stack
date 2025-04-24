import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir, testDir } from './utils/test-helpers';

describe('Base Template Test', () => {
  afterEach(async () => {
    await cleanupProjectDir('base-no-addons');
  });

  it('creates a basic project with no add-ons', async () => {
    const config = {
      name: 'base-no-addons',
      ui: 'none' as const,
      databaseType: 'none' as const,
      databaseProvider: 'none',
      orm: 'none' as const,
      auth: false,
      mailing: false,
      installDeps: false,
      packageManager: 'bun' as const 
    };
    
    const { projectDir, packageJson } = await createAndValidateProject(config);
    // Assertions
    if (!projectDir) throw new Error('❌ Project directory was not created');
    // Verify basic files exist
    const fs = await import('fs-extra');
    const path = await import('path');
    // Check for all relevant files under src
    const appPageExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'page.tsx'));
    const globalsExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'globals.css'));
    const layoutExists = await fs.pathExists(path.join(projectDir, 'src', 'app', 'layout.tsx'));
    if (!appPageExists) throw new Error('❌ src/app/page.tsx does not exist');
    if (!globalsExists) throw new Error('❌ src/app/globals.css does not exist');
    if (!layoutExists) throw new Error('❌ src/app/layout.tsx does not exist');
    // Verify package.json contains expected content
    if (!packageJson.dependencies.next) throw new Error('❌ next dependency missing');
    if (!packageJson.dependencies.react) throw new Error('❌ react dependency missing');
    if (!packageJson.dependencies['react-dom']) throw new Error('❌ react-dom dependency missing');
    console.log(`✅ Project created at: ${projectDir}`);
    console.log(`✅ App page exists: ${appPageExists}`);
    console.log(`✅ globals.css exists: ${globalsExists}`);
    console.log(`✅ layout.tsx exists: ${layoutExists}`);
    console.log(`✅ Deps check - next: ${!!packageJson.dependencies.next}`);
    console.log(`✅ Deps check - react: ${!!packageJson.dependencies.react}`);
    console.log(`✅ Deps check - react-dom: ${!!packageJson.dependencies['react-dom']}`);
  }, 30000);
});
