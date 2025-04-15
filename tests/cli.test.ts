import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import { createProject } from '../src/utils/project.js';

vi.mock('fs-extra', () => ({
  default: {
    ensureDir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    copy: vi.fn().mockResolvedValue(undefined),
    pathExists: vi.fn().mockResolvedValue(true),
    readJson: vi.fn().mockResolvedValue({}),
    writeJson: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('path', () => ({
  resolve: vi.fn().mockImplementation((...args) => args.join('/')),
  join: vi.fn().mockImplementation((...args) => args.join('/')),
  dirname: vi.fn().mockReturnValue('/mock-dir')
}));

vi.mock('chalk', () => ({
  default: {
    blue: vi.fn(text => `BLUE: ${text}`),
    green: vi.fn(text => `GREEN: ${text}`),
    red: vi.fn(text => `RED: ${text}`),
    yellow: vi.fn(text => `YELLOW: ${text}`),
    cyan: vi.fn(text => `CYAN: ${text}`)
  }
}));

describe('create-my-stack CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a project with Prisma, NextAuth, and mailing', async () => {
    const config = {
      name: 'test-project',
      database: 'prisma' as const,
      auth: true,
      mailing: true,
      ui: 'none' as const
    };

    await createProject(config);

    // Verify project directory was created
    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('test-project'));
    
    // Verify base template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('base'),
      expect.any(String),
      expect.any(Object)
    );
    
    // Verify Prisma template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('prisma'),
      expect.any(String),
      expect.any(Object)
    );
    
    // Verify NextAuth template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('nextauth'),
      expect.any(String),
      expect.any(Object)
    );
    
    // Verify mailing template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('mailing'),
      expect.any(String),
      expect.any(Object)
    );
    
    // Verify shared template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('shared'),
      expect.any(String),
      expect.any(Object)
    );
  });

  it('should create a project with Drizzle and shadcn/ui', async () => {
    const config = {
      name: 'test-project',
      database: 'drizzle' as const,
      auth: false,
      mailing: false,
      ui: 'shadcn' as const
    };

    await createProject(config);

    // Verify project directory was created
    expect(fs.ensureDir).toHaveBeenCalledWith(expect.stringContaining('test-project'));
    
    // Verify base template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('base'),
      expect.any(String),
      expect.any(Object)
    );
    
    // Verify Drizzle template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('drizzle'),
      expect.any(String),
      expect.any(Object)
    );
    
    // Verify shadcn template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('shadcn'),
      expect.any(String),
      expect.any(Object)
    );
    
    // Verify shared template was copied
    expect(fs.copy).toHaveBeenCalledWith(
      expect.stringContaining('shared'),
      expect.any(String),
      expect.any(Object)
    );
    
    // NextAuth and mailing should not be copied
    expect(fs.copy).not.toHaveBeenCalledWith(
      expect.stringContaining('nextauth'),
      expect.any(String),
      expect.any(Object)
    );
    
    expect(fs.copy).not.toHaveBeenCalledWith(
      expect.stringContaining('mailing'),
      expect.any(String),
      expect.any(Object)
    );
  });

  // TODO: add more cases 
});
