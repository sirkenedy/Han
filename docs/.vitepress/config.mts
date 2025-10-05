import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Han Framework',
  description: 'A modern, developer-friendly Node.js framework',
  base: '/Han/', // Change this to '/your-repo-name/' if deploying to a project repo
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/Han/favicon.svg' }],
    ['link', { rel: 'alternate icon', href: '/Han/logo.svg' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/Han/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#E63946' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'Han Framework' }],
    ['meta', { name: 'og:description', content: 'A modern, developer-friendly Node.js framework' }],
    ['meta', { name: 'og:image', content: '/Han/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/introduction/what-is-han', activeMatch: '/introduction/' },
      { text: 'Fundamentals', link: '/fundamentals/controllers', activeMatch: '/fundamentals/' },
      { text: 'Techniques', link: '/techniques/middleware', activeMatch: '/techniques/' },
      { text: 'OpenAPI', link: '/openapi/introduction', activeMatch: '/openapi/' },
      { text: 'CLI', link: '/cli/overview', activeMatch: '/cli/' },
      {
        text: 'v1.0',
        items: [
          { text: 'Changelog', link: '/about/changelog' },
          { text: 'Contributing', link: '/about/contributing' },
        ]
      }
    ],

    sidebar: {
      '/introduction/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Han?', link: '/introduction/what-is-han' },
            { text: 'Getting Started', link: '/introduction/getting-started' },
            { text: 'First Steps', link: '/introduction/first-steps' },
          ]
        }
      ],

      '/fundamentals/': [
        {
          text: 'Fundamentals',
          items: [
            { text: 'Controllers', link: '/fundamentals/controllers' },
            { text: 'Providers', link: '/fundamentals/providers' },
            { text: 'Modules', link: '/fundamentals/modules' },
            { text: 'Dependency Injection', link: '/fundamentals/dependency-injection' },
            { text: 'Middleware', link: '/fundamentals/middleware' },
            { text: 'Exception Filters', link: '/fundamentals/exception-filters' },
            { text: 'Pipes', link: '/fundamentals/pipes' },
            { text: 'Guards', link: '/fundamentals/guards' },
            { text: 'Interceptors', link: '/fundamentals/interceptors' },
          ]
        },
        {
          text: 'Advanced Concepts',
          items: [
            { text: 'Dynamic Modules', link: '/fundamentals/dynamic-modules' },
            { text: 'Lifecycle Hooks', link: '/fundamentals/lifecycle-hooks' },
            { text: 'Circular Dependency', link: '/fundamentals/circular-dependency' },
          ]
        }
      ],

      '/techniques/': [
        {
          text: 'Techniques',
          items: [
            { text: 'Middleware', link: '/techniques/middleware' },
            { text: 'Module Middleware', link: '/techniques/module-middleware' },
            { text: 'Database (Mongoose)', link: '/techniques/mongoose' },
            { text: 'Configuration', link: '/techniques/configuration' },
            { text: 'Validation', link: '/techniques/validation' },
            { text: 'Caching', link: '/techniques/caching' },
            { text: 'Security', link: '/techniques/security' },
            { text: 'Task Scheduling', link: '/techniques/task-scheduling' },
          ]
        }
      ],

      '/cli/': [
        {
          text: 'CLI',
          items: [
            { text: 'Overview', link: '/cli/overview' },
            { text: 'Usage', link: '/cli/usage' },
            { text: 'Generators', link: '/cli/generators' },
          ]
        }
      ],

      '/openapi/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/openapi/introduction' },
            { text: 'Auto Type Detection', link: '/openapi/auto-detection' },
            { text: 'Types and Parameters', link: '/openapi/types-and-parameters' },
            { text: 'Operations', link: '/openapi/operations' },
          ]
        },
        {
          text: 'Testing & Validation',
          items: [
            { text: 'Live Contract Testing', link: '/openapi/live-contract-testing' },
            { text: 'Example Harvester', link: '/openapi/example-harvester' },
            { text: 'Performance Budgets', link: '/openapi/performance-budgets' },
          ]
        },
        {
          text: 'Advanced Topics',
          items: [
            { text: 'Security', link: '/openapi/security' },
            { text: 'Decorators Reference', link: '/openapi/decorators' },
            { text: 'vs NestJS Swagger', link: '/openapi/comparison-with-nestjs' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/han-framework' },
      { icon: 'twitter', link: 'https://twitter.com/hanframework' },
      { icon: 'discord', link: 'https://discord.gg/hanframework' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Han Framework Team'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/sirkenedy/Han/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true,
  }
})
