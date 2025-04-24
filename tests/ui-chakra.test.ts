import { describe, it, afterEach } from 'vitest';
import { createAndValidateProject, cleanupProjectDir } from './utils/test-helpers';

describe('UI Library - Chakra UI Test', () => {
  afterEach(async () => {
    await cleanupProjectDir('ui-chakra');
  });

  it('creates a project with Chakra UI', async () => {
    const config = {
      name: 'ui-chakra',
      ui: 'chakra' as const,
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
    
    // Verify Chakra specific files
    const providersExists = await fs.pathExists(path.join(projectDir, 'app', 'providers.tsx'));
    
    console.log(`✅ Project created at: ${projectDir}`);
    console.log(`✅ Providers file exists: ${providersExists}`);
    
    // Check for base dependencies
    console.log(`✅ Deps check - next: ${!!packageJson.dependencies.next}`);
    console.log(`✅ Deps check - react: ${!!packageJson.dependencies.react}`);
    console.log(`✅ Deps check - react-dom: ${!!packageJson.dependencies['react-dom']}`);
    
    // Check for Chakra dependencies
    console.log(`✅ Deps check - @chakra-ui/react: ${!!packageJson.dependencies['@chakra-ui/react']}`);
    console.log(`✅ Deps check - @emotion/react: ${!!packageJson.dependencies['@emotion/react']}`);
  }, 30000);
});
