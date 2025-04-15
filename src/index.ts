import { intro, outro, text, select, confirm, spinner, log } from '@clack/prompts';
import chalk from 'chalk';
import { z } from 'zod';
import path from 'path';
import { createProject } from './utils/project.js';
import { parseArgs } from './utils/args.js';
import { saveStackConfig, loadStackConfig } from './utils/stackConfig.js';

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  ui: z.enum(["none", "shadcn", "chakra", "mantine", "nextui"]),
  database: z.enum(["none", "prisma", "drizzle"]),
  auth: z.boolean(),
  mailing: z.boolean(),
  installDeps: z.boolean(),
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).optional(),
});

type ProjectInput = z.infer<typeof projectSchema>;

async function main() {
  intro(chalk.bold.cyan('Create My Stack'));
  
  const { skipPrompts, options, useStackFile } = parseArgs();
  let projectConfig: ProjectInput;
  
  // Check if we should load from a .stack file
  if (useStackFile) {
    const stackFilePath = path.isAbsolute(useStackFile) 
      ? useStackFile 
      : path.join(process.cwd(), useStackFile);
      
    log.info(`Loading configuration from ${chalk.cyan(stackFilePath)}`);
    
    const loadedConfig = await loadStackConfig(stackFilePath);
    if (loadedConfig) {
      projectConfig = loadedConfig;
      log.info(chalk.green('Successfully loaded stack configuration!'));
    } else {
      log.error(`Couldn't load configuration from ${stackFilePath}`);
      process.exit(1);
    }
  } else if (skipPrompts) {
    try {
      // Default values if not provided via CLI
      const name = (options.name as string) || 'my-app';
      const ui = (options.ui as ProjectInput['ui']) || 'none';
      const database = (options.db as "none" | "prisma" | "drizzle") || 'none';
      const auth = options.auth === true;
      const mailing = options.mailing === true;
      const installDeps = options.install === true;
      const packageManager = options.pm as "npm" | "pnpm" | "yarn" | "bun" || "npm";
      
      projectConfig = projectSchema.parse({
        name,
        ui,
        database,
        auth,
        mailing,
        installDeps,
        packageManager: installDeps ? packageManager : undefined,
      });
      
      log.info(chalk.bold('Using automated configuration with --yes flag:'));
      log.info(`- Project: ${chalk.cyan(projectConfig.name)}`);
      log.info(`- UI Library: ${chalk.cyan(projectConfig.ui)}`);
      log.info(`- Database: ${chalk.cyan(projectConfig.database)}`);
      log.info(`- Auth: ${chalk.cyan(projectConfig.auth ? 'Yes' : 'No')}`);
      log.info(`- Mailing: ${chalk.cyan(projectConfig.mailing ? 'Yes' : 'No')}`);
      log.info(`- Install Dependencies: ${chalk.cyan(projectConfig.installDeps ? 'Yes' : 'No')}`);
      if (projectConfig.installDeps) {
        log.info(`- Package Manager: ${chalk.cyan(projectConfig.packageManager)}`);
      }
    } catch (error) {
      log.error('Invalid options provided with --yes flag');
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          log.error(`${err.path.join('.')}: ${err.message}`);
        });
      } else {
        log.error(String(error));
      }
      process.exit(1);
    }
  } else {
    // Interactive configuration with prompts
    const name = await text({
      message: 'What is your project name?',
      placeholder: 'my-app',
      validate(value) {
        if (value.length === 0) return 'Project name is required!';
        if (!/^[a-z0-9-_]+$/.test(value)) return 'Project name can only contain lowercase letters, numbers, dashes and underscores!';
        return;
      },
    }) as string;
    
    // UI selection
    const ui = await select({
      message: 'Select a UI library:',
      options: [
        { value: 'none', label: 'None - Plain Tailwind CSS' },
        { value: 'shadcn', label: 'shadcn/ui - Beautifully designed components' },
        { value: 'chakra', label: 'Chakra UI - Simple, modular component library' },
        { value: 'mantine', label: 'Mantine - React components with native dark theme' },
        { value: 'nextui', label: 'NextUI - Beautiful, modern React UI library' },
      ],
    }) as ProjectInput['ui'];
    
    // Database 
    const database = await select({
      message: 'Select your database ORM:',
      options: [
        { value: 'none', label: 'None - I will add my own database solution' },
        { value: 'prisma', label: 'Prisma - Type-safe ORM with auto-generated migrations' },
        { value: 'drizzle', label: 'Drizzle - Lightweight SQL ORM with type safety' },
      ],
    }) as "none" | "prisma" | "drizzle";
    
    // Only ask about auth if database is selected
    let auth = false;
    if (database !== 'none') {
      const authResponse = await confirm({
        message: 'Do you want to include NextAuth.js?',
      });
      auth = authResponse === true;
    }
    
    const mailingResponse = await confirm({
      message: 'Do you want to include mailing capabilities?',
      initialValue: false,
    });
    const mailing = mailingResponse === true;
    
    // Ask about installing dependencies
    const installDepsResponse = await confirm({
      message: 'Do you want to install dependencies after project creation?',
    });
    const installDeps = installDepsResponse === true;
    
    // If installing deps, ask about package manager preference
    let packageManager: "npm" | "pnpm" | "yarn" | "bun" | undefined;
    
    if (installDeps) {
      packageManager = await select({
        message: 'Select your preferred package manager:',
        options: [
          { value: 'npm', label: 'npm' },
          { value: 'pnpm', label: 'pnpm' },
          { value: 'yarn', label: 'yarn' },
          { value: 'bun', label: 'bun' },
        ],
      }) as "npm" | "pnpm" | "yarn" | "bun";
    }
    
    projectConfig = {
      name,
      ui,
      database,
      auth,
      mailing,
      installDeps,
      packageManager,
    };
  }

  // Show the project config preview
  log.info(chalk.bold('Here\'s your stack configuration:'));
  log.info(`- Project: ${chalk.cyan(projectConfig.name)}`);
  log.info(`- UI Library: ${chalk.cyan(projectConfig.ui)}`);
  log.info(`- Database: ${chalk.cyan(projectConfig.database)}`);
  log.info(`- Auth: ${chalk.cyan(projectConfig.auth ? 'Yes' : 'No')}`);
  log.info(`- Mailing: ${chalk.cyan(projectConfig.mailing ? 'Yes' : 'No')}`);
  log.info(`- Install Dependencies: ${chalk.cyan(projectConfig.installDeps ? 'Yes' : 'No')}`);
  if (projectConfig.installDeps && projectConfig.packageManager) {
    log.info(`- Package Manager: ${chalk.cyan(projectConfig.packageManager)}`);
  }
  
  // Final confirmation if not using --yes flag
  if (!skipPrompts) {
    const proceed = await confirm({
      message: 'Does this look correct?',
    });
    
    if (!proceed) {
      outro(chalk.yellow('Operation cancelled. Run the command again to restart.'));
      process.exit(0);
    }
  }
  
  const spin = spinner();
  spin.start('Creating your project...');
  
  try {
    const projectDir = path.join(process.cwd(), projectConfig.name);
    
    // The createProject function handles dependency installation internally
    await createProject(projectConfig);
    spin.stop('Project created successfully!');
    
    // Save the configuration as a .stackrc file in the project directory
    await saveStackConfig(projectConfig, projectDir);
    log.info(chalk.cyan('Created .stackrc file in project directory for future reference'));
    
    // Final message
    outro(
      chalk.green(`
✅ All done! Your Next.js app is ready.

To get started:
  cd ${projectConfig.name}
  ${!projectConfig.installDeps ? `${projectConfig.packageManager || 'pnpm'} install` : ''}
  ${projectConfig.packageManager || 'pnpm'} dev

The project configuration has been saved to ${chalk.cyan(`.stackrc`)} file.
You can reuse this configuration with:
  ${chalk.cyan(`create-my-stack --stack ${projectConfig.name}/.stackrc`)}

Enjoy building with your custom stack! 🎉
      `)
    );
  } catch (error) {
    spin.stop('Failed to create project');
    log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  log.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
