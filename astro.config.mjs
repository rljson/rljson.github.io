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
      customCss: ['./src/styles/angular.css'],
      // Round and outline each code frame as a whole, so titles and tabs
      // stay attached to their code.
      expressiveCode: {
        styleOverrides: {
          borderRadius: '0.5rem',
          borderColor: 'var(--sl-color-hairline-shade)',
        },
      },
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: true,
          },
        },
        {
          // The three faces angular.dev uses: Inter for text, Inter Tight for
          // headings, DM Mono for code.
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href:
              'https://fonts.googleapis.com/css2?' +
              'family=Inter+Tight:wght@500;600&' +
              'family=Inter:wght@400;500;600&' +
              'family=DM+Mono:ital@0;1&display=swap',
          },
        },
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
            { label: 'What is Rljson?', slug: 'guides/old/what-is-rljson' },
            { label: 'Principles', slug: 'guides/old/principles' },
          ],
        },
        {
          label: 'Data Types',
          items: [
            { label: 'Components', slug: 'guides/data_types/components' },
            { label: 'Layers', slug: 'guides/data_types/layers' },
            { label: 'Cake', slug: 'guides/data_types/cake' },
            { label: 'Tree', slug: 'guides/data_types/tree' },
            { label: 'TableCfg', slug: 'guides/data_types/table-cfg' },
            { label: 'Revision', slug: 'guides/data_types/revision' },
          ],
        },
        {
          label: 'Format',
          items: [
            { label: 'Tables, rows and hashes', slug: 'guides/old/tables' },
            { label: 'Data types', slug: 'guides/old/data-types' },
            { label: 'Schema and validation', slug: 'guides/old/schema' },
          ],
        },
        {
          label: 'Protocols',
          items: [
            { label: 'Edit protocol', slug: 'guides/old/edit-protocol' },
            { label: 'Routing', slug: 'guides/old/routing' },
            { label: 'Sync protocol', slug: 'guides/old/sync-protocol' },
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
