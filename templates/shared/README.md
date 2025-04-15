# Project Name: {{projectName}}

This project was bootstrapped with [Create My Stack](https://github.com/yourusername/create-my-stack).

## About

A modern Next.js application with the following stack:
- Next.js 14+ with App Router
- {{#if database}}{{database}} ({{#eq database "prisma"}}Type-safe ORM with auto-generated migrations{{else}}Lightweight SQL ORM with type safety{{/eq}}){{/if}}
{{#if hasAuth}}
- NextAuth.js for authentication
{{/if}}
{{#if hasMailing}}
- Mailing capabilities
{{/if}}

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project follows the Next.js 14+ App Router structure:

```
app/
├── api/                 # API routes
{{#if hasAuth}}
│   ├── auth/            # NextAuth.js API routes
{{/if}}
├── (routes)/            # App routes/pages
components/              # Shared React components
lib/                     # Utility functions and libraries
{{#if (eq database 'prisma')}}
prisma/                  # Prisma schema and migrations
{{else if (eq database 'drizzle')}}
drizzle/                 # Drizzle schema and migrations
{{/if}}
public/                  # Static files
```

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
{{#if (eq database 'prisma')}}
- [Prisma Documentation](https://prisma.io/docs)
{{else if (eq database 'drizzle')}}
- [Drizzle Documentation](https://orm.drizzle.team)
{{/if}}
{{#if hasAuth}}
- [NextAuth.js Documentation](https://next-auth.js.org)
{{/if}}

## License

MIT © {{currentYear}}
