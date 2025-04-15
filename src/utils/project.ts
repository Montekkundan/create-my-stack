import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ora from 'ora';
import chalk from 'chalk';
import Handlebars from 'handlebars';
import { deepMerge, commandExists } from './helpers.js';
import { execSync } from 'child_process';

Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to templates 
const templatesDir = path.resolve(__dirname, '../../templates');

interface ProjectConfig {
  name: string;
  database: 'none' | 'prisma' | 'drizzle';
  auth: boolean;
  mailing: boolean;
  ui: 'none' | 'shadcn' | 'chakra' | 'mantine' | 'nextui';
  installDeps?: boolean;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
}

/**
 * Create a new project with the specified configuration
 */
export async function createProject(config: ProjectConfig): Promise<void> {
  const projectDir = path.resolve(process.cwd(), config.name);
  
  // Create the project directory
  await fs.ensureDir(projectDir);
  
  // Check if directory is empty
  const dirContents = await fs.readdir(projectDir);
  if (dirContents.length > 0) {
    throw new Error(`Directory ${config.name} is not empty. Please choose a different name or clear the directory.`);
  }
  
  // Copy base template
  const baseSpinner = ora('Adding base Next.js template...').start();
  await fs.copy(path.join(templatesDir, 'base'), projectDir);
  baseSpinner.succeed(chalk.blue('🔨 Added base Next.js template'));
  
  // Copy database template if selected
  if (config.database !== 'none') {
    const dbSpinner = ora(`Adding ${config.database} setup...`).start();
    await fs.copy(path.join(templatesDir, config.database), projectDir, { overwrite: true });
    dbSpinner.succeed(chalk.blue(`🔨 Added ${config.database} setup`));
  }
  
  // Copy auth template if selected
  if (config.auth) {
    const authSpinner = ora('Adding NextAuth setup...').start();
    await fs.copy(path.join(templatesDir, 'nextauth'), projectDir, { overwrite: true });
    authSpinner.succeed(chalk.blue('🔨 Added NextAuth setup'));
  }
  
  // Copy mailing template if selected
  if (config.mailing) {
    const mailingSpinner = ora('Adding mailing capabilities...').start();
    await fs.copy(path.join(templatesDir, 'mailing'), projectDir, { overwrite: true });
    mailingSpinner.succeed(chalk.blue('🔨 Added mailing capabilities'));
  }
  
  // Add UI library if selected
  if (config.ui !== 'none') {
    const uiSpinner = ora(`Setting up ${config.ui} UI library...`).start();
    await fs.copy(path.join(templatesDir, config.ui), projectDir, { overwrite: true });
    uiSpinner.succeed(chalk.blue(`🔨 Set up ${config.ui} UI library`));
  }
  
  // Copy shared template to glue everything together
  const sharedSpinner = ora('Adding shared components...').start();
  await fs.copy(path.join(templatesDir, 'shared'), projectDir, { overwrite: true });
  sharedSpinner.succeed(chalk.blue('🔨 Added shared components'));
  
  // Process template files like .env, package.json, and README.md
  await processTemplateFiles(projectDir, config);
  
  // Save configuration for future reference
  const stackConfigPath = path.join(projectDir, '.stackrc');
  await fs.writeJson(stackConfigPath, {
    createdAt: new Date().toISOString(),
    features: {
      database: config.database,
      auth: config.auth,
      mailing: config.mailing,
    }
  }, { spaces: 2 });
  
  const projectSpinner = ora('Project structure creation').succeed(chalk.green('✅ Project structure created successfully!'));
  
  // Install dependencies if requested
  if (config.installDeps && config.packageManager) {
    const installSpinner = ora(`Installing dependencies with ${config.packageManager}...`).start();
    try {
      // Check if the selected package manager exists
      const packageManagerCmd = config.packageManager === 'yarn' ? 'yarn' :
                                config.packageManager === 'pnpm' ? 'pnpm' :
                                config.packageManager === 'bun' ? 'bun' : 'npm';
      
      if (!commandExists(packageManagerCmd)) {
        installSpinner.fail(chalk.red(`Package manager '${packageManagerCmd}' is not installed on your system`));
        throw new Error(`Package manager '${packageManagerCmd}' is not installed on your system. Please install it or choose a different package manager.`);
      }
      
      // Change directory to the project
      process.chdir(projectDir);
      
      // Construct and execute installation command
      const installCommand = config.packageManager === 'yarn' ? 'yarn' :
                             config.packageManager === 'pnpm' ? 'pnpm install' :
                             config.packageManager === 'bun' ? 'bun install' : 'npm install';
                             
      execSync(installCommand, { stdio: 'inherit' });
      installSpinner.succeed(chalk.green('✅ Dependencies installed successfully!'));
      
      // Change back to original directory
      process.chdir('..');
    } catch (error) {
      if (!installSpinner.isSpinning) {
        ora().fail(chalk.red(`Error installing dependencies: ${error instanceof Error ? error.message : String(error)}`));
      } else {
        installSpinner.fail(chalk.red(`Error installing dependencies: ${error instanceof Error ? error.message : String(error)}`));
      }
      const helpSpinner = ora().info(chalk.yellow('You can install dependencies manually by running:'));
      ora().info(`cd ${config.name} && ${config.packageManager} install`);
    }
  }
}

/**
 * Add a feature to an existing project
 */
export async function addFeatureToProject(
  projectDir: string, 
  featureName: string,
  databaseType: string
): Promise<void> {
  // Validate feature name
  if (!['nextauth', 'mailing'].includes(featureName)) {
    throw new Error(`Unsupported feature: ${featureName}`);
  }
  
  // Copy feature template
  console.log(chalk.blue(`🔨 Adding ${featureName} to your project...`));
  await fs.copy(path.join(templatesDir, featureName), projectDir, { overwrite: false });
  
  // Handle package.json merging
  const packageJsonPath = path.join(projectDir, 'package.json');
  let packageJson = await fs.readJson(packageJsonPath);
  
  const featurePackagePath = path.join(templatesDir, featureName, 'package.json');
  if (await fs.pathExists(featurePackagePath)) {
    const featurePackage = await fs.readJson(featurePackagePath);
    packageJson = deepMerge(packageJson, featurePackage);
    
    // Special handling for NextAuth with database adapters
    if (featureName === 'nextauth' && ['prisma', 'drizzle'].includes(databaseType)) {
      if (databaseType === 'prisma') {
        packageJson.dependencies['@auth/prisma-adapter'] = '^5.0.0';
      } else if (databaseType === 'drizzle') {
        packageJson.dependencies['@auth/drizzle-adapter'] = '^0.3.5';
      }
      
      // Update the auth route file with the correct adapter
      const authRoutePath = path.join(projectDir, 'app/api/auth/[...nextauth]/route.ts');
      if (await fs.pathExists(authRoutePath)) {
        let content = await fs.readFile(authRoutePath, 'utf8');
        
        if (databaseType === 'prisma') {
          content = content.replace(
            '// DATABASE_ADAPTER_IMPORT',
            'import { PrismaAdapter } from "@auth/prisma-adapter";'
          ).replace(
            '// DATABASE_ADAPTER_CONFIG',
            'adapter: PrismaAdapter(prisma),'
          );
        } else if (databaseType === 'drizzle') {
          content = content.replace(
            '// DATABASE_ADAPTER_IMPORT',
            'import { DrizzleAdapter } from "@auth/drizzle-adapter";'
          ).replace(
            '// DATABASE_ADAPTER_CONFIG',
            'adapter: DrizzleAdapter(db),'
          );
        }
        
        await fs.writeFile(authRoutePath, content, 'utf8');
      }
    }
    
    // Write the updated package.json
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
  
  // Update .env file if it exists
  const envPath = path.join(projectDir, '.env');
  if (await fs.pathExists(envPath)) {
    let envContent = await fs.readFile(envPath, 'utf8');
    
    // Add appropriate environment variables based on the feature
    if (featureName === 'nextauth' && !envContent.includes('NEXTAUTH_SECRET')) {
      envContent += '\n\n# NextAuth\nNEXTAUTH_URL=http://localhost:3000\nNEXTAUTH_SECRET="your-nextauth-secret"\n';
      envContent += '\n# Auth Providers (add as needed)\n# GITHUB_ID="your-github-id"\n# GITHUB_SECRET="your-github-secret"\n';
    } else if (featureName === 'mailing' && !envContent.includes('SMTP_HOST')) {
      envContent += '\n\n# Email settings\nSMTP_HOST="smtp.example.com"\nSMTP_PORT=587\nSMTP_USER="your-smtp-username"\n';
      envContent += 'SMTP_PASSWORD="your-smtp-password"\nEMAIL_FROM="your-email@example.com"\n';
    }
    
    await fs.writeFile(envPath, envContent, 'utf8');
  }
  
  // Update .stackrc if it exists, or create it
  const stackConfigPath = path.join(projectDir, '.stackrc');
  let stackConfig: Record<string, any> = { features: {} };
  
  if (await fs.pathExists(stackConfigPath)) {
    try {
      stackConfig = await fs.readJson(stackConfigPath);
    } catch (error) {
      console.error('Error reading .stackrc file:', error);
    }
  }
  
  // Update the features
  if (!stackConfig.features) {
    stackConfig.features = {};
  }
  
  stackConfig.features[featureName] = true;
  stackConfig.lastUpdated = new Date().toISOString();
  
  await fs.writeJson(stackConfigPath, stackConfig, { spaces: 2 });
}

/**
 * Process any template files that need variable substitution
 */
async function processTemplateFiles(projectDir: string, config: ProjectConfig): Promise<void> {
  const templateData = {
    projectName: config.name,
    database: config.database,
    hasAuth: config.auth,
    hasMailing: config.mailing,
    currentYear: new Date().getFullYear(),
  };
  
  // Merge package.json files from different templates
  await mergePackageJson(projectDir, config);
  
  // Files to process with handlebars
  const filesToProcess = [
    '.env',
    'package.json',
    'README.md',
  ];
  
  for (const file of filesToProcess) {
    const filePath = path.join(projectDir, file);
    if (await fs.pathExists(filePath)) {
      // Read template content
      const content = await fs.readFile(filePath, 'utf8');
      
      // Process with handlebars
      const template = Handlebars.compile(content);
      const processed = template(templateData);
      
      // Write processed content back
      await fs.writeFile(filePath, processed, 'utf8');
    }
  }
}

/**
 * Merge package.json files from all selected templates
 */
async function mergePackageJson(projectDir: string, config: ProjectConfig): Promise<void> {
  // Start with base package.json
  const packageJsonPath = path.join(projectDir, 'package.json');
  let packageJson = await fs.readJson(packageJsonPath);
  
  // Database-specific packages
  const dbTemplatePath = path.join(templatesDir, config.database, 'package.json');
  if (await fs.pathExists(dbTemplatePath)) {
    const dbPackageJson = await fs.readJson(dbTemplatePath);
    packageJson = deepMerge(packageJson, dbPackageJson);
  }
  
  // Auth packages
  if (config.auth) {
    const authTemplatePath = path.join(templatesDir, 'nextauth', 'package.json');
    if (await fs.pathExists(authTemplatePath)) {
      const authPackageJson = await fs.readJson(authTemplatePath);
      packageJson = deepMerge(packageJson, authPackageJson);
      
      // Add database adapter for auth based on database choice
      if (config.database === 'prisma') {
        packageJson.dependencies['@auth/prisma-adapter'] = '^5.0.0';
      } else if (config.database === 'drizzle') {
        packageJson.dependencies['@auth/drizzle-adapter'] = '^0.3.5';
      }
    }
  }
  
  // Mailing packages
  if (config.mailing) {
    const mailingTemplatePath = path.join(templatesDir, 'mailing', 'package.json');
    if (await fs.pathExists(mailingTemplatePath)) {
      const mailingPackageJson = await fs.readJson(mailingTemplatePath);
      packageJson = deepMerge(packageJson, mailingPackageJson);
    }
  }
  
  // UI library packages
  if (config.ui !== 'none') {
    const uiTemplatePath = path.join(templatesDir, config.ui, 'package.json');
    if (await fs.pathExists(uiTemplatePath)) {
      const uiPackageJson = await fs.readJson(uiTemplatePath);
      packageJson = deepMerge(packageJson, uiPackageJson);
      
      // Add extra dependencies based on UI library choice
      if (config.ui === 'nextui') {
        // NextUI requires next-themes for dark mode
        packageJson.dependencies['next-themes'] = '^0.2.1';
      }
      
      // For shadcn/ui we need to add a post-install script to set it up
      if (config.ui === 'shadcn') {
        if (!packageJson.scripts.postinstall) {
          packageJson.scripts.postinstall = "npx shadcn-ui init --yes";
        }
      }
    }
  }
  
  // Write the merged package.json
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  
  // Special handling for database adapter in NextAuth if both are selected
  if (config.auth && (config.database === 'prisma' || config.database === 'drizzle')) {
    const authConfigPath = path.join(projectDir, 'app/api/auth/[...nextauth]/route.ts');
    if (await fs.pathExists(authConfigPath)) {
      let content = await fs.readFile(authConfigPath, 'utf8');
      
      // Update adapter based on database choice
      if (config.database === 'prisma') {
        content = content.replace(
          '// DATABASE_ADAPTER_IMPORT',
          'import { PrismaAdapter } from "@auth/prisma-adapter";'
        ).replace(
          '// DATABASE_ADAPTER_CONFIG',
          'adapter: PrismaAdapter(prisma),'
        );
      } else if (config.database === 'drizzle') {
        content = content.replace(
          '// DATABASE_ADAPTER_IMPORT',
          'import { DrizzleAdapter } from "@auth/drizzle-adapter";'
        ).replace(
          '// DATABASE_ADAPTER_CONFIG',
          'adapter: DrizzleAdapter(db),'
        );
      }
      
      await fs.writeFile(authConfigPath, content, 'utf8');
    }
  }
}
