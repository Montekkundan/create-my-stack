/**
 * Parse command line arguments for the CLI
 */
export function parseArgs() {
  const args = process.argv.slice(2);
  const options: Record<string, string | boolean> = {};
  
  let skipPrompts = false;
  let useStackFile: string | null = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--yes' || arg === '-y') {
      skipPrompts = true;
      continue;
    }
    
    if (arg === '--stack' || arg === '-s') {
      // Get the stack file path from the next argument
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        useStackFile = args[i + 1];
        i++; // Skip the next argument since we've used it
      } else {
        // Default to .stack in current directory if no path is provided
        useStackFile = '.stack';
      }
      skipPrompts = true; 
      continue;
    }
    
    if (arg.startsWith('--')) {
      const equalSignIndex = arg.indexOf('=');
      if (equalSignIndex !== -1) {
        const key = arg.slice(2, equalSignIndex);
        const value = arg.slice(equalSignIndex + 1);
        options[key] = value;
      } else {
        const key = arg.slice(2);
        options[key] = true;
      }
    }
  }
  
  return { skipPrompts, options, useStackFile };
}
