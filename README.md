# Create My Stack

A CLI-based meta-framework for scaffolding Next.js apps with custom stacks. Build your projects faster with an opinionated setup that includes your choice of database ORM, authentication, and mailing capabilities.

## Features

- **Next.js** - Start with a modern Next.js 14+ app using the App Router
- ️ **Database Options** - Choose between Prisma (type-safe ORM) or Drizzle (lightweight SQL ORM)
-  **Authentication** - Optional NextAuth.js integration with database adapters
-  **Mailing** - Optional email capabilities with React Email and Nodemailer
-  **Styling** - Tailwind CSS pre-configured and ready to use
-  **Modular** - Add features to existing projects when you need them

## Installation

```bash
# Install globally using pnpm
pnpm add -g create-my-stack

# Or run directly with pnpm
pnpm dlx create-my-stack
```

## Usage

### Create a new project

```bash
# Run the CLI and follow the interactive prompts
create-my-stack
```

You'll be guided through a series of prompts to customize your stack:

1. Project name
2. Database ORM (Prisma or Drizzle)
3. Authentication with NextAuth.js (optional)
4. Mailing capabilities (optional)

### Add features to an existing project

You can add features to an existing Next.js project:

```bash
# Add NextAuth to an existing project
create-my-stack add nextauth

# Add mailing capabilities to an existing project
create-my-stack add mailing
```

### Using the --yes flag for automation

For CI/CD or automation, you can skip prompts with the `--yes` flag and provide options directly:

```bash
create-my-stack --yes --name=my-app --db=prisma --auth --mailing
```

### Save your preferred configuration

Your configuration is saved as a `.stackrc` file in the project directory. You can reuse this for future projects.

## What's Included

### Base Template
- Next.js 14+ with App Router
- TypeScript configuration
- ESLint setup
- Tailwind CSS

### Database Options
- **Prisma**: Type-safe ORM with auto-generated migrations
- **Drizzle**: Lightweight SQL ORM with type safety

### Authentication (Optional)
- NextAuth.js with GitHub and Google providers
- Database adapter integration (Prisma or Drizzle)
- Sign-in page

### Mailing (Optional)
- React Email components
- Nodemailer integration
- Sample email templates

### UI Libraries (Optional)
- **shadcn/ui**: Beautifully designed components built with Radix UI and Tailwind CSS
- **Chakra UI**: Simple, modular component library with great accessibility

## Available Templates

The CLI is built with a modular template system that combines different features based on user selection:

```
templates/
├── base/             # Base Next.js template with Tailwind CSS
├── prisma/           # Prisma ORM configuration and schema
├── drizzle/          # Drizzle ORM setup and schema
├── nextauth/         # NextAuth.js authentication
├── mailing/          # Email capabilities with React Email
├── shadcn/           # shadcn/ui components configuration
├── chakra/           # Chakra UI provider setup
├── nextui/           # NextUI components and theme setup
└── shared/           # Common files for all templates
```

## Development

### Running Locally

To develop and test the CLI locally:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/create-my-stack.git
cd create-my-stack
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the project:
```bash
pnpm run build
```

4. Test the CLI locally (using the built-in script):
```bash
pnpm run local-test
```

5. For testing the add command:
```bash
pnpm run local-add-test
```

### Available Scripts

Here's a description of all available scripts in the project:

- `dev`: Watch for file changes and compile TypeScript in real-time
- `build`: Compile TypeScript to JavaScript
- `start`: Run the compiled CLI directly
- `lint`: Run ESLint on all TypeScript files
- `test`: Run all tests using Vitest
- `test:watch`: Run tests in watch mode during development
- `local-test`: Build the project and run the CLI locally
- `local-add-test`: Build the project and test the "add" command
- `link`: Build and create a global symlink for testing
- `changeset`: Create a new changeset to record changes
- `version`: Update versions and changelogs based on changesets
- `release`: Build the project and publish to npm registry

### Multiple Ways to Test the CLI

#### Option 1: Run directly using the script
```bash
pnpm run local-test
```

#### Option 2: Set up PNPM global bin directory and link
```bash
# One-time setup for pnpm global bin directory
pnpm setup

# Restart your terminal or source your profile
source ~/.zshrc  # for zsh users

# Then link the package
pnpm run link
```

#### Option 3: Use npm for linking (alternative)
```bash
# Build the project
pnpm run build

# Link using npm instead
npm link
```

#### Option 4: Execute the built file directly
```bash
# Build first
pnpm run build

# Run directly with Node
node dist/index.js
```

#### Option 5: Create a test directory
```bash
# Create and enter a test directory
mkdir test-dir && cd test-dir

# Run the CLI from parent directory
node ../dist/index.js
```

## Testing

The project uses Vitest for testing. To run tests:

```bash
# Run all tests once
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Run a specific test file
pnpm test -- tests/stackrc.test.ts

# Run a specific test suite (describe block)
pnpm test -- -t "stackrc configuration"

# Run a specific test (it block)
pnpm test -- -t "should load configuration from a .stackrc file"

# Run tests with coverage report
pnpm test -- --coverage
```

### Test Structure

- `tests/cli.test.ts` - Tests for core CLI functionality
- `tests/args.test.ts` - Tests for command-line argument parsing
- `tests/stackrc.test.ts` - Tests for .stackrc configuration loading and usage

## Contributing

Contributions are welcome! Here's how you can contribute:

### Adding New Templates

1. Create a new folder in the `templates/` directory
2. Add the necessary files and configurations
3. Update the template selection in `src/index.ts`
4. Add the template merging logic in `src/utils/project.ts`

### Creating Tests

1. Add new test files in the `tests/` directory
2. Follow the existing test patterns using Vitest
3. Test different combinations of features and edge cases
4. Run the test suite to verify your changes

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Add your changes and tests
4. Submit a pull request with a clear description of your changes

## Publishing to npm

This project uses [changesets](https://github.com/changesets/changesets) to manage versions, create changelogs, and publish to npm. Here's how the publishing workflow works:

### 1. Creating a Changeset

When you make changes to the codebase that require a version bump, create a changeset:

```bash
pnpm changeset
```

This command will prompt you to:
- Select which packages need to be updated (select `create-my-stack`)
- Choose the type of version bump (major, minor, or patch)
- Write a summary of the changes

The command creates a markdown file in the `.changeset` directory with your changelog entry.

### 2. Updating Versions

When you're ready to release, update the versions based on the changesets:

```bash
pnpm version
```

This command:
- Removes the changeset files
- Updates `package.json` with the new version
- Updates the `CHANGELOG.md` file with the changes

### 3. Publishing to npm

Finally, to publish to npm:

```bash
# Make sure you're logged in to npm
npm login

# Build and publish
pnpm release
```

This will build the package and publish it to the npm registry.

### Complete Release Process

Here's the complete process for releasing a new version:

1. Create changesets for your changes (`pnpm changeset`)
2. Update versions based on changesets (`pnpm version`) 
3. Commit the version updates (`git commit -am "Version packages"`)
4. Tag the release (`git tag v0.1.1`)
5. Push changes and tags (`git push && git push --tags`)
6. Publish to npm (`pnpm release`)

## License

MIT
