import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import Handlebars from 'handlebars';
import { deepMerge, commandExists } from './helpers.js';
import { execSync } from 'child_process';

Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

function getTemplatesDir() {
  let candidate = path.resolve(__dirname, '../../templates');
  if (fs.existsSync(candidate)) return candidate;
  candidate = path.resolve(__dirname, '../templates');
  if (fs.existsSync(candidate)) return candidate;
  candidate = path.resolve(process.cwd(), 'templates');
  if (fs.existsSync(candidate)) return candidate;
  throw new Error('Could not find templates directory.');
}

const templatesDir = getTemplatesDir();

interface ProjectConfig {
  name: string;
  databaseType: 'none' | 'postgresql' | 'mysql' | 'sqlite';
  databaseProvider: string;
  orm: 'none' | 'prisma' | 'drizzle';
  auth: boolean;
  authProvider?: 'nextauth' | 'lucia' | 'clerk'; 
  baas?: 'none' | 'supabase';
  mailing: boolean;
  mailingProvider?: 'nodemailer' | 'resend' | 'sendgrid' | 'postmark';
  ui: 'none' | 'shadcn' | 'chakra';
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
  
  // Copy base template (including package.json and .env)
  const baseSpinner = ora('Adding base Next.js template...').start();
  try {
    await fs.copy(path.join(templatesDir, 'base'), projectDir);
    baseSpinner.succeed(chalk.blue('🔨 Added base Next.js template'));
  } catch (err) {
    baseSpinner.fail(chalk.red('❌ Failed to copy base template.'));
    throw new Error('Failed to copy base template: ' + (err instanceof Error ? err.message : String(err)));
  }

  // Ensure package.json exists after all template copies
  const ensurePackageJson = async () => {
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      await fs.writeJson(packageJsonPath, {}, { spaces: 2 });
    }
  };
  await ensurePackageJson();

  // Helper: files to skip for merging
  const configFilesToMerge = ['package.json', 'tsconfig.json', '.env'];

  // Copy database template if selected
  if (config.orm !== 'none') {
    const dbSpinner = ora(`Adding ${config.orm} setup...`).start();
    const dbTemplatePath = path.join(templatesDir, config.orm);
    const dbFiles = await fs.readdir(dbTemplatePath);
    for (const file of dbFiles) {
      if (configFilesToMerge.includes(file)) continue;
      await fs.copy(path.join(dbTemplatePath, file), path.join(projectDir, file), { overwrite: true });
    }
    dbSpinner.succeed(chalk.blue(`🔨 Added ${config.orm} setup`));
    await ensurePackageJson();
  }
  
  // Copy auth template if selected
  if (config.auth) {
    // Default to NextAuth if no specific provider is selected
    const authProvider = config.authProvider || 'nextauth';
    const authSpinner = ora(`Adding ${authProvider} authentication setup...`).start();
    
    // Check if the template directory for the selected provider exists
    const authTemplatePath = path.join(templatesDir, authProvider);
    if (await fs.pathExists(authTemplatePath)) {
      const authFiles = await fs.readdir(authTemplatePath);
      for (const file of authFiles) {
        if (configFilesToMerge.includes(file)) continue;
        await fs.copy(path.join(authTemplatePath, file), path.join(projectDir, file), { overwrite: true });
      }
      authSpinner.succeed(chalk.blue(`🔨 Added ${authProvider} authentication setup`));
    } else {
      // Fallback to NextAuth if the selected provider template doesn't exist yet
      const fallbackPath = path.join(templatesDir, 'nextauth');
      const fallbackFiles = await fs.readdir(fallbackPath);
      for (const file of fallbackFiles) {
        if (configFilesToMerge.includes(file)) continue;
        await fs.copy(path.join(fallbackPath, file), path.join(projectDir, file), { overwrite: true });
      }
      authSpinner.succeed(chalk.blue(`🔨 Added NextAuth.js setup (${authProvider} template not available yet)`));
    }
    await ensurePackageJson();
  }
  
  // Copy BaaS template if selected
  if (config.baas === 'supabase') {
    const supabaseSpinner = ora('Adding Supabase BaaS setup...').start();
    const supabaseTemplatePath = path.join(templatesDir, 'supabase');
    if (await fs.pathExists(supabaseTemplatePath)) {
      const supabaseFiles = await fs.readdir(supabaseTemplatePath);
      for (const file of supabaseFiles) {
        if (configFilesToMerge.includes(file)) continue;
        await fs.copy(path.join(supabaseTemplatePath, file), path.join(projectDir, file), { overwrite: true });
      }
      supabaseSpinner.succeed(chalk.blue('🔨 Added Supabase BaaS setup'));
    } else {
      supabaseSpinner.warn(chalk.yellow('Supabase template not found, skipping Supabase BaaS setup.'));
    }
    await ensurePackageJson();
  }

  // Copy mailing template if selected
  if (config.mailing) {
    // Default to standard mailing if no specific provider is selected
    const mailingProvider = config.mailingProvider || 'nodemailer';
    const mailingSpinner = ora(`Adding ${mailingProvider} mailing capabilities...`).start();
    const mailingDir = mailingProvider === 'nodemailer' ? 'mailing' : `mailing-${mailingProvider}`;
    const mailingTemplatePath = path.join(templatesDir, mailingDir);
    if (await fs.pathExists(mailingTemplatePath)) {
      const mailingFiles = await fs.readdir(mailingTemplatePath);
      for (const file of mailingFiles) {
        if (configFilesToMerge.includes(file)) continue;
        await fs.copy(path.join(mailingTemplatePath, file), path.join(projectDir, file), { overwrite: true });
      }
      mailingSpinner.succeed(chalk.blue(`🔨 Added ${mailingProvider} mailing capabilities`));
    } else {
      // Fallback to standard mailing if the selected provider template doesn't exist yet
      const fallbackPath = path.join(templatesDir, 'mailing');
      const fallbackFiles = await fs.readdir(fallbackPath);
      for (const file of fallbackFiles) {
        if (configFilesToMerge.includes(file)) continue;
        await fs.copy(path.join(fallbackPath, file), path.join(projectDir, file), { overwrite: true });
      }
      mailingSpinner.succeed(chalk.blue(`🔨 Added basic mailing capabilities (${mailingProvider} template not available yet)`));
    }
    await ensurePackageJson();
  }
  
  // Add UI library if selected
  if (config.ui !== 'none') {
    const uiSpinner = ora(`Setting up ${config.ui} UI library...`).start();
    const uiTemplatePath = path.join(templatesDir, config.ui);
    const uiFiles = await fs.readdir(uiTemplatePath);
    for (const file of uiFiles) {
      if (configFilesToMerge.includes(file)) continue;
      await fs.copy(path.join(uiTemplatePath, file), path.join(projectDir, file), { overwrite: true });
    }
    uiSpinner.succeed(chalk.blue(`🔨 Set up ${config.ui} UI library`));
    await ensurePackageJson();
  }
  
  // Merge .env from all templates before processing template files
  await mergeEnvFiles(projectDir, config);

  // Merge and process config files (package.json, .env, etc.)
  await processTemplateFiles(projectDir, config);
  
  // Save configuration for future reference
  const stackConfigPath = path.join(projectDir, '.stackrc');
  await fs.writeJson(stackConfigPath, {
    createdAt: new Date().toISOString(),
    features: {
      databaseType: config.databaseType,
      databaseProvider: config.databaseProvider,
      orm: config.orm,
      auth: config.auth,
      authProvider: config.authProvider || (config.auth ? 'nextauth' : undefined),
      mailing: config.mailing,
      mailingProvider: config.mailingProvider || (config.mailing ? 'nodemailer' : undefined),
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
  databaseType: string,
  providerName?: string
): Promise<void> {
  // Validate base feature name
  const baseFeatures = ['auth', 'mailing'];
  const authProviders = ['nextauth', 'lucia', 'clerk', 'supabase'];
  const mailingProviders = ['nodemailer', 'resend', 'sendgrid', 'postmark'];
  
  // Determine the actual feature and provider
  let actualFeature = featureName;
  let actualProvider = providerName;
  
  // Handle case where featureName includes provider info
  if (featureName === 'nextauth') {
    actualFeature = 'auth';
    actualProvider = 'nextauth';
  } else if (featureName === 'mailing') {
    actualFeature = 'mailing';
    actualProvider = 'nodemailer';
  }
  
  // Validate feature
  if (!baseFeatures.includes(actualFeature)) {
    throw new Error(`Unsupported feature: ${actualFeature}`);
  }
  
  // Validate provider based on feature
  if (actualFeature === 'auth' && actualProvider && !authProviders.includes(actualProvider)) {
    throw new Error(`Unsupported auth provider: ${actualProvider}`);
  }
  
  if (actualFeature === 'mailing' && actualProvider && !mailingProviders.includes(actualProvider)) {
    throw new Error(`Unsupported mailing provider: ${actualProvider}`);
  }
  
  // Default providers if not specified
  if (!actualProvider) {
    actualProvider = actualFeature === 'auth' ? 'nextauth' : 'nodemailer';
  }
  
  console.log("FEATURE SELECTED", actualFeature, "PROVIDER:", actualProvider);
  console.log(chalk.blue(`🔨 Adding ${actualProvider} ${actualFeature} to your project...`));
   // Determine template directory
  let templateDirName: string;
  if (actualFeature === 'auth') {
    templateDirName = actualProvider || 'nextauth';
  } else {
    templateDirName = actualProvider === 'nodemailer' ? 'mailing' : `mailing-${actualProvider}`;
  }
  
  // Check if template exists
  const templatePath = path.join(templatesDir, templateDirName);
  if (!await fs.pathExists(templatePath)) {
    if (actualFeature === 'auth') {
      console.log(chalk.yellow(`Template for ${actualProvider} not found. Falling back to NextAuth...`));
      templateDirName = 'nextauth';
    } else {
      console.log(chalk.yellow(`Template for ${actualProvider} not found. Falling back to standard mailing...`));
      templateDirName = 'mailing';
    }
  }
  
  await fs.copy(path.join(templatesDir, templateDirName), projectDir, { overwrite: false });

  // Handle package.json merging
  const packageJsonPath = path.join(projectDir, 'package.json');
  let packageJson = await fs.readJson(packageJsonPath);
  
  const featurePackagePath = path.join(templatesDir, templateDirName, 'package.json');
  if (await fs.pathExists(featurePackagePath)) {
    const featurePackage = await fs.readJson(featurePackagePath);
    packageJson = deepMerge(packageJson, featurePackage);
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
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
    databaseType: config.databaseType,
    databaseProvider: config.databaseProvider,
    orm: config.orm,
    hasAuth: config.auth,
    hasMailing: config.mailing,
    currentYear: new Date().getFullYear(),
  };
  
  // Merge package.json files from different templates
  await mergeConfigFile(projectDir, config, 'package.json');
  
  // Merge tsconfig.json files from different templates
  await mergeConfigFile(projectDir, config, 'tsconfig.json');
  
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
      const processed = template({ ...templateData, projectName: config.name });
      
      // Write processed content back
      await fs.writeFile(filePath, processed, 'utf8');
    }
  }
}

/**
 * Generic function for merging configuration files from all templates
 * @param projectDir The project directory
 * @param config The project configuration
 * @param configFileName The name of the configuration file (e.g., "package.json", "tsconfig.json")
 * @param additionalMergeActions Optional callback for additional processing after merge
 */
async function mergeConfigFile(
  projectDir: string, 
  config: ProjectConfig, 
  configFileName: string,
  additionalMergeActions?: (mergedConfig: Record<string, any>, config: ProjectConfig) => Record<string, any>
): Promise<void> {
  const configPath = path.join(projectDir, configFileName);
  if (!await fs.pathExists(configPath)) return;
  let mergedConfig = await fs.readJson(configPath);

  const mergeDeps = (target: any, source: any, key: string) => {
    if (target[key] && source[key]) {
      target[key] = deepMerge(target[key], source[key]);
    } else if (source[key]) {
      target[key] = source[key];
    }
  };

  const mergeFrom = async (templateDir: string) => {
    const filePath = path.join(templateDir, configFileName);
    if (await fs.pathExists(filePath)) {
      const tpl = await fs.readJson(filePath);
      mergeDeps(mergedConfig, tpl, 'dependencies');
      mergeDeps(mergedConfig, tpl, 'devDependencies');
      // Merge other top-level keys except name/version/scripts if not present
      for (const key of Object.keys(tpl)) {
        if (['dependencies', 'devDependencies', 'name', 'version', 'scripts'].includes(key)) continue;
        if (!(key in mergedConfig)) mergedConfig[key] = tpl[key];
      }
      // Merge scripts
      if (tpl.scripts) {
        mergedConfig.scripts = { ...tpl.scripts, ...mergedConfig.scripts };
      }
    }
  };

  // Merge in order: ORM, auth, mailing, UI
  if (config.orm !== 'none') await mergeFrom(path.join(templatesDir, config.orm));
  if (config.auth) await mergeFrom(path.join(templatesDir, 'nextauth'));
  if (config.mailing) {
    const provider = config.mailingProvider || 'nodemailer';
    const mailingDir = provider === 'nodemailer' ? 'mailing' : `mailing-${provider}`;
    await mergeFrom(path.join(templatesDir, mailingDir));
  }
  if (config.ui !== 'none') await mergeFrom(path.join(templatesDir, config.ui));
  // Merge from supabase BaaS template if selected
  if (config.baas === 'supabase') await mergeFrom(path.join(templatesDir, 'supabase'));

  if (additionalMergeActions) {
    mergedConfig = additionalMergeActions(mergedConfig, config);
  }
  await fs.writeJson(configPath, mergedConfig, { spaces: 2 });
}

/**
 * Merge .env files from all relevant templates (base, ORM, auth, mailing provider, UI, baas)
 * Writes the merged .env to the project directory. First occurrence of a variable wins.
 */
async function mergeEnvFiles(projectDir: string, config: ProjectConfig) {
  const envSources: string[] = [
    path.join(templatesDir, 'base', '.env'),
  ];
  if (config.orm !== 'none') {
    envSources.push(path.join(templatesDir, config.orm, '.env'));
  }
  if (config.auth) {
    envSources.push(path.join(templatesDir, 'nextauth', '.env'));
  }
  if (config.mailing) {
    const provider = config.mailingProvider || 'nodemailer';
    const mailingDir = provider === 'nodemailer' ? 'mailing' : `mailing-${provider}`;
    envSources.push(path.join(templatesDir, mailingDir, '.env'));
  }
  if (config.ui !== 'none') {
    envSources.push(path.join(templatesDir, config.ui, '.env'));
  }

  if (config.baas === 'supabase') {
    envSources.push(path.join(templatesDir, 'supabase', '.env'));
  }

  const mergedVars: Record<string, string> = {};
  for (const envPath of envSources) {
    if (await fs.pathExists(envPath)) {
      const content = await fs.readFile(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (match) {
          const [_, key, value] = match;
          if (!(key in mergedVars)) {
            mergedVars[key] = value;
          }
        }
      }
    }
  }
  // Write merged .env
  const mergedEnv = Object.entries(mergedVars).map(([k, v]) => `${k}=${v}`).join('\n');
  await fs.writeFile(path.join(projectDir, '.env'), mergedEnv);
}
