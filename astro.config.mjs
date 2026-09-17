// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://rljson.github.io',
  integrations: [
    starlight({
      title: 'Rljson',
      description:
        'A JSON-based, relational, normalized and deeply hashed exchange ' +
        'format for the efficient synchronization of large datasets.',
      logo: {
        src: './src/assets/logo/rljson-logo.webp',
        alt: 'Rljson',
      },
      favicon: '/favicon.png',
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'apple-touch-icon',
            href: '/apple-touch-icon.png',
            sizes: '180x180',
          },
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/rljson',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/rljson/rljson.github.io/edit/main/',
      },
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'What is Rljson?', slug: 'guides/what-is-rljson' },
            { label: 'Getting started', slug: 'guides/getting-started' },
            { label: 'Principles', slug: 'guides/principles' },
          ],
        },
        {
          label: 'Format',
          items: [
            { label: 'Tables, rows and hashes', slug: 'guides/tables' },
            { label: 'Data types', slug: 'guides/data-types' },
            { label: 'Schema and validation', slug: 'guides/schema' },
          ],
        },
        {
          label: 'Protocols',
          items: [
            { label: 'Edit protocol', slug: 'guides/edit-protocol' },
            { label: 'Routing', slug: 'guides/routing' },
            { label: 'Sync protocol', slug: 'guides/sync-protocol' },
          ],
        },
        {
          label: 'Reference',
          items: [{ autogenerate: { directory: 'reference' } }],
        },
      ],
    }),
  ],
});
