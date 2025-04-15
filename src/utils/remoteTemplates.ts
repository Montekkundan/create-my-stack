import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import https from 'https';
import ora from 'ora';

const REPO_OWNER = 'montekkundan';
const REPO_NAME = '';
const BRANCH = 'main';

// TODO: think about this later.

const CACHE_DIR = path.join(os.tmpdir(), 'create-my-stack-templates');

/**
 * Fetch a template from GitHub and save it to the local cache
 */
export async function fetchRemoteTemplate(templateName: string): Promise<string> {
  const spinner = ora(`Fetching template '${templateName}' from GitHub...`).start();
  
  await fs.ensureDir(CACHE_DIR);
  
  const templateCacheDir = path.join(CACHE_DIR, templateName);
  const cacheInfoPath = path.join(templateCacheDir, '.cache-info.json');
  
  const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
  let useCache = false;
  
  if (await fs.pathExists(cacheInfoPath)) {
    try {
      const cacheInfo = await fs.readJson(cacheInfoPath);
      const cacheAge = Date.now() - cacheInfo.timestamp;
      
      if (cacheAge < CACHE_EXPIRY) {
        useCache = true;
        spinner.succeed(`Using cached template '${templateName}'`);
        return templateCacheDir;
      }
    } catch (error) {
      // Cache info is invalid, will re-download
    }
  }
  
  // If not cached or cache expired, download from GitHub
  if (!useCache) {
    try {
      await fs.emptyDir(templateCacheDir);
      
      const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/templates/${templateName}?ref=${BRANCH}`;
      
      const files = await fetchJsonFromGitHub(apiUrl);
      
      for (const file of files) {
        await downloadFileOrDirectory(file, templateCacheDir);
      }
      
      await fs.writeJson(cacheInfoPath, { timestamp: Date.now() });
      
      spinner.succeed(`Template '${templateName}' fetched successfully`);
      return templateCacheDir;
    } catch (error) {
      spinner.fail(`Failed to fetch template '${templateName}': ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to fetch template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return templateCacheDir;
}

/**
 * List available remote templates
 */
export async function listRemoteTemplates(): Promise<string[]> {
  const spinner = ora('Fetching available templates...').start();
  try {
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/templates?ref=${BRANCH}`;
    const directories = await fetchJsonFromGitHub(apiUrl);
    const templateNames = directories
      .filter((item: any) => item.type === 'dir')
      .map((item: any) => item.name);
    
    spinner.succeed('Available remote templates fetched successfully');
    return templateNames;
  } catch (error) {
    spinner.fail(`Failed to fetch template list: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Helper to fetch JSON from GitHub API
 */
async function fetchJsonFromGitHub(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'create-my-stack',
        //  authorization if needed for private repos or higher rate limits
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    };
    
    https.get(url, options, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        // Handle redirects
        https.get(res.headers.location, options, (redirectRes) => {
          handleResponse(redirectRes, resolve, reject);
        }).on('error', reject);
      } else {
        handleResponse(res, resolve, reject);
      }
    }).on('error', reject);
  });
}

/**
 * Handle HTTP response and parse JSON
 */
function handleResponse(res: any, resolve: Function, reject: Function): void {
  let data = '';
  
  if (res.statusCode !== 200) {
    reject(new Error(`GitHub API returned status code ${res.statusCode}`));
    return;
  }
  
  res.on('data', (chunk: any) => data += chunk);
  res.on('end', () => {
    try {
      resolve(JSON.parse(data));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download file or recursively download directory
 */
async function downloadFileOrDirectory(item: any, destDir: string): Promise<void> {
  if (item.type === 'file') {
    const filePath = path.join(destDir, item.name);
    await fs.ensureDir(path.dirname(filePath));
    
    const content = await fetchFileContent(item.download_url);
    await fs.writeFile(filePath, content);
  } else if (item.type === 'dir') {
    const dirPath = path.join(destDir, item.name);
    await fs.ensureDir(dirPath);
    
    const contents = await fetchJsonFromGitHub(item.url);
    for (const content of contents) {
      await downloadFileOrDirectory(content, dirPath);
    }
  }
}

/**
 * Fetch file content from GitHub
 */
async function fetchFileContent(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${res.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}
