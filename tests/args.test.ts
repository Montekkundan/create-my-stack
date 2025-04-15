import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseArgs } from '../src/utils/args';

describe('CLI Arguments Parsing', () => {
  let originalArgv;
  
  beforeEach(() => {
    originalArgv = process.argv;
  });
  
  afterEach(() => {
    process.argv = originalArgv;
  });
  
  it('should detect --yes flag', () => {
    process.argv = ['node', 'index.js', '--yes'];
    const { skipPrompts, options } = parseArgs();
    expect(skipPrompts).toBe(true);
    expect(options).toEqual({});
  });
  
  it('should detect -y flag as alias for --yes', () => {
    process.argv = ['node', 'index.js', '-y'];
    const { skipPrompts, options } = parseArgs();
    expect(skipPrompts).toBe(true);
    expect(options).toEqual({});
  });
  
  it('should parse options with values using equals sign', () => {
    process.argv = ['node', 'index.js', '--yes', '--name=my-project', '--db=drizzle'];
    const { skipPrompts, options } = parseArgs();
    expect(skipPrompts).toBe(true);
    expect(options).toEqual({
      name: 'my-project',
      db: 'drizzle'
    });
  });
  
  it('should parse boolean flags', () => {
    process.argv = ['node', 'index.js', '--yes', '--auth', '--mailing'];
    const { skipPrompts, options } = parseArgs();
    expect(skipPrompts).toBe(true);
    expect(options).toEqual({
      auth: true,
      mailing: true
    });
  });
  
  it('should handle mixed options types', () => {
    process.argv = ['node', 'index.js', '--yes', '--name=test-app', '--auth', '--db=prisma', '--ui=shadcn'];
    const { skipPrompts, options } = parseArgs();
    expect(skipPrompts).toBe(true);
    expect(options).toEqual({
      name: 'test-app',
      auth: true,
      db: 'prisma',
      ui: 'shadcn'
    });
  });
});
