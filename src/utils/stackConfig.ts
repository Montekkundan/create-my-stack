import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { z } from 'zod';
import { log } from '@clack/prompts';

const stackConfigSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  ui: z.enum(["none", "shadcn", "chakra", "mantine", "nextui"]),
  database: z.enum(["none", "prisma", "drizzle"]),
  auth: z.boolean(),
  mailing: z.boolean(),
  installDeps: z.boolean(),
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).optional(),
});

export type StackConfig = z.infer<typeof stackConfigSchema>;

/**
 * Save the current configuration to a .stackrc file
 */
export async function saveStackConfig(config: StackConfig, projectDir: string): Promise<void> {
  try {
    const stackFilePath = path.join(projectDir, '.stackrc');
    await fs.writeJson(stackFilePath, config, { spaces: 2 });
    log.info(chalk.green(`Configuration saved to ${stackFilePath}`));
  } catch (error) {
    log.error(`Failed to save stack configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load a stack configuration from a .stack file
 */
export async function loadStackConfig(stackFilePath: string): Promise<StackConfig | null> {
  try {
    if (await fs.pathExists(stackFilePath)) {
      const rawConfig = await fs.readJson(stackFilePath);
      const parsedConfig = stackConfigSchema.safeParse(rawConfig);
      
      if (parsedConfig.success) {
        return parsedConfig.data;
      } else {
        log.error('Invalid .stack file format');
        parsedConfig.error.errors.forEach(err => {
          log.error(`${err.path.join('.')}: ${err.message}`);
        });
        return null;
      }
    }
  } catch (error) {
    log.error(`Failed to load stack configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return null;
}
