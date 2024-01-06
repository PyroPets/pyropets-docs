// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'PyroPets Docs',
  tagline:
    'PyroPets is an extensible, deflationary, completely open-source permanent MRC721 NFT collectable game deployed on the MetrixCoin blockchain.',
  favicon: 'img/pyro.png',

  // Set the production url of your site here
  url: 'https://wiki.pyropets.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'PyroPets', // Usually your GitHub org/user name.
  projectName: 'pyropets-docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
          //  'https://github.com/PyroPets/pyropets-docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/pyropets-social-card.jpg',
      navbar: {
        title: 'PyroPets Docs',
        logo: {
          alt: 'PyroPets logo',
          src: 'img/pyro.png',
        },
        items: [
          /*{
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Tutorial',
          },
          {to: '/blog', label: 'Blog', position: 'left'},*/
          {
            href: 'https://github.com/PyroPets/pyropets-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'PyroPets Website',
                to: '/category/pyropets-website',
              },
              {
                label: 'PYRO Token',
                to: '/category/pyro',
              },
              {
                label: 'MBRS Token',
                to: '/tokens/mbrs/about',
              },
              {
                label: 'Whitepaper',
                to: '/whitepaper',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discordapp.com/invite/RMewD6KheR',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/PyroPetsNFT',
              },
              {
                label: 'social.mrx',
                href: 'https://social.metrix.network/@pyropets',
              },
              {
                label: 'YouTube',
                href: 'https://www.youtube.com/@pyropets',
              },
            ],
          },
          {
            title: 'MetrixCoin Wallets',
            items: [
              {
                label: 'MetriMask - Chrome',
                href: 'https://chromewebstore.google.com/detail/metrimask/pgjlaaokfffcapdcakncnhpmigjlnpei',
              },
              {
                label: 'MetriMask - Android',
                href: 'https://play.google.com/store/apps/details?id=com.metrimask_mobile',
              },
              {
                label: 'Altitude - Computer',
                href: 'https://github.com/TheLindaProjectInc/Altitude/releases/latest',
              },
              {
                label: 'MetrixCore - Computer',
                href: 'https://github.com/TheLindaProjectInc/Metrix/releases/latest',
              },
            ],
          },
        ],
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
