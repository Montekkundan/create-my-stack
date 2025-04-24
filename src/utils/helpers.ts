import { execSync } from 'child_process';

/**
 * Check if a command is available in the system
 */
export function commandExists(command: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep merge of objects, useful for merging template files
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key as keyof typeof source])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof typeof source] });
        } else {
          output[key as keyof T] = deepMerge(
            target[key as keyof T] as Record<string, any>,
            source[key as keyof typeof source] as Record<string, any>
          ) as T[keyof T];
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof typeof source] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}
