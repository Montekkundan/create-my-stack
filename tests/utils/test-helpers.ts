import { afterEach, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { createProject } from '../../src/utils/project';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type UIOption = 'none' | 'shadcn' | 'chakra'; 
export type DBType = 'none' | 'postgresql' | 'mysql' | 'sqlite';
export type ORMOption = 'none' | 'prisma' | 'drizzle';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export const testDir = path.join(__dirname, '../test-output');

export async function createAndValidateProject(config: {
  name: string;
  ui: UIOption;
  databaseType: DBType;
  databaseProvider: string;
  orm: ORMOption;
  auth: boolean;
  mailing: boolean;
  installDeps?: boolean;
  packageManager?: PackageManager;
}) {
  const projectDir = path.join(testDir, config.name);
  
  if (await fs.pathExists(projectDir)) {
    await fs.rm(projectDir, { recursive: true, force: true });
  }
  
  await fs.ensureDir(testDir);
  
  const originalCwd = process.cwd();
  
  try {
    process.chdir(testDir);
    
    await createProject({...config, installDeps: config.installDeps ?? false});
    
    expect(await fs.pathExists(projectDir)).toBe(true);
    
    if (config.installDeps && config.packageManager) {
      process.chdir(projectDir);
      const installCommands: Record<PackageManager, string> = {
        npm: 'npm install',
        pnpm: 'pnpm install',
        yarn: 'yarn',
        bun: 'bun i'
      };
      
      const installCommand = installCommands[config.packageManager];
      console.log(`Installing dependencies with: ${installCommand}`);
      execSync(installCommand, { stdio: 'inherit' });
      process.chdir(testDir);
    }
  } finally {
    process.chdir(originalCwd);
  }
  expect(await fs.pathExists(path.join(projectDir, 'package.json'))).toBe(true);
  
  return {
    projectDir,
    packageJson: await fs.readJson(path.join(projectDir, 'package.json'))
  };
}

export async function cleanupProjectDir(projectName: string) {
  const projectDir = path.join(testDir, projectName);
  if (await fs.pathExists(projectDir)) {
    try {
      await fs.rm(projectDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Warning: Failed to clean up ${projectDir}:`, err);
    }
  }
}

// Optionally, keep cleanupTestDir for manual or global cleanup
export async function cleanupTestDir() {
  if (await fs.pathExists(testDir)) {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Warning: Failed to clean up ${testDir}:`, err);
    }
  }
}
