#!/usr/bin/env node
import { intro, outro, text, select, confirm, spinner, log } from '@clack/prompts';
import chalk from 'chalk';
import { z } from 'zod';
import path from 'path';
import { createProject } from './utils/project.js';
import { parseArgs } from './utils/args.js';
import { saveStackConfig, loadStackConfig } from './utils/stackConfig.js';

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  ui: z.enum(["none", "shadcn", "chakra"]),
  databaseType: z.enum(["none", "postgresql", "mysql", "sqlite"]).default("none"),
  databaseProvider: z.string().default("none"),
  baas: z.enum(["none", "supabase"]).default("none"),
  orm: z.enum(["none", "prisma", "drizzle"]).default("none"),
  auth: z.boolean(),
  authProvider: z.enum(["nextauth", "lucia", "clerk"]).optional(), // Remove 'supabase' from here
  mailing: z.boolean(),
  mailingProvider: z.enum(["nodemailer", "resend", "sendgrid", "postmark"]).optional(),
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
      // Remove 'supabase' from authProvider if present (backward compatibility)
      let authProvider = loadedConfig.authProvider;
      if (authProvider === 'supabase') authProvider = undefined;
      // Ensure 'baas' is present in loaded config for backward compatibility
      const baas = Object.prototype.hasOwnProperty.call(loadedConfig, 'baas') && (loadedConfig as any).baas
        ? (loadedConfig as any).baas
        : 'none';
      const configWithBaas = {
        ...loadedConfig,
        baas,
        authProvider,
      };
      projectConfig = configWithBaas;
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
      
      // Parse database options
      let databaseType: 'none' | 'postgresql' | 'mysql' | 'sqlite' = 'none';
      let databaseProvider = 'none';
      let orm: 'none' | 'prisma' | 'drizzle' = 'none';
      
      // Set database options from CLI parameters
      if (options.dbType) {
        databaseType = options.dbType as 'none' | 'postgresql' | 'mysql' | 'sqlite';
      }
      
      if (options.dbProvider) {
        databaseProvider = options.dbProvider as string;
      }
      
      if (options.orm) {
        orm = options.orm as 'none' | 'prisma' | 'drizzle';
      }
      
      const auth = options.auth === true;
      const mailing = options.mailing === true;
      const installDeps = options.install === true;
      const packageManager = options.pm as "npm" | "pnpm" | "yarn" | "bun" || "npm";
      
      projectConfig = projectSchema.parse({
        name,
        ui,
        databaseType,
        databaseProvider,
        orm,
        auth,
        mailing,
        installDeps,
        packageManager: installDeps ? packageManager : undefined,
      });
      
      log.info(chalk.bold('Using automated configuration with --yes flag:'));
      log.info(`- Project: ${chalk.cyan(projectConfig.name)}`);
      log.info(`- UI Library: ${chalk.cyan(projectConfig.ui)}`);
      
      // Display database information
      if (projectConfig.databaseType !== 'none') {
        log.info(`- Database Type: ${chalk.cyan(projectConfig.databaseType)}`);
        log.info(`- Database Provider: ${chalk.cyan(projectConfig.databaseProvider)}`);
        log.info(`- ORM: ${chalk.cyan(projectConfig.orm)}`);
      } else {
        log.info(`- Database: ${chalk.cyan('None')}`);
      }
      
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
        // { value: 'heroui', label: 'HeroUI - Beautiful, modern React UI library' },
      ],
    }) as ProjectInput['ui'];
    
    // First ask about database type
    const databaseType = await select({
      message: 'Select your database type:',
      options: [
        { value: 'none', label: 'None - I will add my own database solution' },
        { value: 'postgresql', label: 'PostgreSQL' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'sqlite', label: 'SQLite' },
      ],
    }) as "none" | "postgresql" | "mysql" | "sqlite";
    
    // If a database type is selected, ask about specific provider
    let databaseProvider = 'none';
    if (databaseType !== 'none') {
      const providerOptions = {
        postgresql: [
          { value: 'default', label: 'PostgreSQL - Default' },
          { value: 'neon', label: 'Neon - Serverless Postgres' },
          { value: 'vercel', label: 'Vercel Postgres' },
          { value: 'supabase', label: 'Supabase' },
          { value: 'xata', label: 'Xata' },
          { value: 'pglite', label: 'PGLite' },
          { value: 'nile', label: 'Nile' },
          { value: 'bun-sql', label: 'Bun SQL' },
        ],
        mysql: [
          { value: 'default', label: 'MySQL - Default' },
          { value: 'planetscale', label: 'PlanetScale' },
          { value: 'tidb', label: 'TiDB' },
          { value: 'singlestore', label: 'SingleStore' },
        ],
        sqlite: [
          { value: 'default', label: 'SQLite - Default' },
          { value: 'turso', label: 'Turso' },
          { value: 'cloudflare-d1', label: 'Cloudflare D1' },
          { value: 'bun-sqlite', label: 'Bun SQLite' },
          { value: 'native', label: 'Native SQLite' },
          { value: 'expo', label: 'Expo SQLite' },
          { value: 'op', label: 'OP SQLite' },
        ],
      };
      
      databaseProvider = await select({
        message: `Select your ${databaseType} provider:`,
        options: providerOptions[databaseType],
      }) as string;
    }

    // Ask about BaaS if databaseProvider is supabase (or in future, others)
    let baas: 'none' | 'supabase' = 'none';
    if (databaseProvider === 'supabase') {
      baas = await select({
        message: 'Do you want to use Supabase as a Backend-as-a-Service (BaaS)?',
        options: [
          { value: 'supabase', label: 'Yes, use Supabase BaaS' },
          { value: 'none', label: 'No, just use as a database' },
        ],
      }) as 'none' | 'supabase';
    }
    
    // Now ask about ORM if a database is selected
    let orm: ProjectInput['orm'] = 'none';
    if (databaseType !== 'none') {
      orm = await select({
        message: 'Select your database ORM:',
        options: [
          { value: 'prisma', label: 'Prisma - Type-safe ORM with auto-generated migrations' },
          { value: 'drizzle', label: 'Drizzle - Lightweight SQL ORM with type safety' },
        ],
      }) as ProjectInput['orm'];
    }
    
    // Only ask about auth if a database is selected
    let auth = false;
    let authProvider = undefined;
    if (databaseType !== 'none') {
      const authResponse = await confirm({
        message: 'Do you want to include authentication?',
      });
      auth = authResponse === true;
      
      // If auth is enabled, ask which provider to use
      if (auth) {
        authProvider = await select({
          message: 'Select your authentication provider:',
          options: [
            { value: 'nextauth', label: 'NextAuth.js - Complete auth solution for Next.js' },
            { value: 'lucia', label: 'Lucia Auth - Flexible auth library with database adapters' },
            { value: 'clerk', label: 'Clerk - Auth & user management solution with components' },
          ],
        }) as ProjectInput['authProvider'];
      }
    }
    
    const mailingResponse = await confirm({
      message: 'Do you want to include mailing capabilities?',
      initialValue: false,
    });
    const mailing = mailingResponse === true;
    
    // If mailing is enabled, ask which provider to use
    let mailingProvider = undefined;
    if (mailing) {
      mailingProvider = await select({
        message: 'Select your mailing provider:',
        options: [
          { value: 'nodemailer', label: 'Nodemailer - Classic email sending library' },
          { value: 'resend', label: 'Resend - Modern email API for developers' },
          { value: 'sendgrid', label: 'SendGrid - Email delivery service' },
          { value: 'postmark', label: 'Postmark - Transactional email delivery service' },
        ],
      }) as ProjectInput['mailingProvider'];
    }
    
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
      databaseType,
      databaseProvider,
      baas,
      orm,
      auth,
      authProvider,
      mailing,
      mailingProvider,
      installDeps,
      packageManager,
    };
  }

  // Show the project config preview
  log.info(chalk.bold('Here\'s your stack configuration:'));
  log.info(`- Project: ${chalk.cyan(projectConfig.name)}`);
  log.info(`- UI Library: ${chalk.cyan(projectConfig.ui)}`);
  
  // Display database information
  if (projectConfig.databaseType !== 'none') {
    log.info(`- Database Type: ${chalk.cyan(projectConfig.databaseType)}`);
    log.info(`- Database Provider: ${chalk.cyan(projectConfig.databaseProvider)}`);
    log.info(`- ORM: ${chalk.cyan(projectConfig.orm)}`);
  } else {
    log.info(`- Database: ${chalk.cyan('None')}`);
  }
  
  log.info(`- Auth: ${chalk.cyan(projectConfig.auth ? 'Yes' : 'No')}`);
  if (projectConfig.auth && projectConfig.authProvider) {
    log.info(`  Auth Provider: ${chalk.cyan(projectConfig.authProvider)}`);
  }
  log.info(`- Mailing: ${chalk.cyan(projectConfig.mailing ? 'Yes' : 'No')}`);
  if (projectConfig.mailing && projectConfig.mailingProvider) {
    log.info(`  Mailing Provider: ${chalk.cyan(projectConfig.mailingProvider)}`);
  }
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
✅ All done! Your Stack app is ready.

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
