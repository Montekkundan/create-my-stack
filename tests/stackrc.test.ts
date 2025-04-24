import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { loadStackConfig } from '../src/utils/stackConfig.js';

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    copy: vi.fn().mockResolvedValue(undefined),
    pathExists: vi.fn().mockResolvedValue(true),
    readJson: vi.fn().mockImplementation((filePath) => {
      if (filePath.includes('.stackrc')) {
        return Promise.resolve({
          name: 'stackrc-test-project',
          databaseType: 'postgresql',
          databaseProvider: 'supabase',
          orm: 'prisma',
          auth: true,
          authProvider: 'nextauth',
          mailing: true,
          mailingProvider: 'nodemailer',
          ui: 'shadcn',
          packageManager: 'pnpm',
          installDeps: false
        });
      }
      return Promise.resolve({});
    }),
    writeJson: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('path', () => {
  const pathMock = {
    resolve: vi.fn().mockImplementation((...args) => args.join('/')),
    join: vi.fn().mockImplementation((...args) => args.join('/')),
    dirname: vi.fn().mockReturnValue('/mock-dir')
  };
  return {
    default: pathMock,
    ...pathMock
  };
});

vi.mock('chalk', () => ({
  default: {
    blue: vi.fn(text => `BLUE: ${text}`),
    green: vi.fn(text => `GREEN: ${text}`),
    red: vi.fn(text => `RED: ${text}`),
    yellow: vi.fn(text => `YELLOW: ${text}`),
    cyan: vi.fn(text => `CYAN: ${text}`)
  }
}));

describe('stackrc configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load configuration from a .stackrc file', async () => {
    const projectPath = 'test-project';
    const stackrcPath = path.join(projectPath, '.stackrc');
    
    const config = await loadStackConfig(stackrcPath);
    
    expect(config).toBeDefined();
    expect(config!.name).toBe('stackrc-test-project');
    expect(config!.orm).toBe('prisma');
    expect(config!.databaseType).toBe('postgresql');
    expect(config!.databaseProvider).toBe('supabase');
    expect(config!.auth).toBe(true);
    expect(config!.authProvider).toBe('nextauth');
    expect(config!.mailing).toBe(true);
    expect(config!.mailingProvider).toBe('nodemailer');
    expect(config!.ui).toBe('shadcn');
    expect(config!.packageManager).toBe('pnpm');
    expect(config!.installDeps).toBe(false);
    
    expect(fs.readJson).toHaveBeenCalledWith(stackrcPath);
  });

  it('should handle missing .stackrc file gracefully', async () => {
    vi.mocked(fs.pathExists).mockImplementationOnce(() => Promise.resolve(false));
    
    const nonExistentPath = 'non-existent/.stackrc';
    
    const config = await loadStackConfig(nonExistentPath);
    
    expect(config).toBeNull();
    expect(fs.pathExists).toHaveBeenCalledWith(nonExistentPath);
  });

  it('should handle invalid .stackrc file format', async () => {
    vi.mocked(fs.pathExists).mockImplementationOnce(() => Promise.resolve(true));
    
    vi.mocked(fs.readJson).mockRejectedValueOnce(new Error('Invalid JSON'));
    
    const invalidPath = 'invalid/.stackrc';
    
    const config = await loadStackConfig(invalidPath);
    
    expect(config).toBeNull();
    expect(fs.pathExists).toHaveBeenCalledWith(invalidPath);
    expect(fs.readJson).toHaveBeenCalledWith(invalidPath);
  });
});
