import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'en-US',
  base: '/doc-test/',

  title: 'Coins APIs',
  description: 'Coins.ph APIs Documentation',

  // Markdown配置
  markdown: {
    headers: {
      level: [1, 2, 3, 4, 5, 6], // 提取所有级别的标题
    },
  },

  theme: defaultTheme({
    logo: 'https://static.pro.coins.xyz/static_web/static_pro/images/logo_icon.svg',

    navbar: [
      { text: 'Rest API', link: '/rest-api' },
      { text: 'Web Socket Streams', link: '/web-socket-streams' },
      { text: 'User Data Stream', link: '/user-data-stream' },
      { text: 'Errors', link: '/errors' }
    ],
    
    sidebar: [
      {
        text: 'API Documentation',
        children: [
          '/rest-api',
          '/web-socket-streams',
          '/user-data-stream',
          '/errors'
        ]
      }
    ],

    // 启用编辑此页
    editLink: false,
    
    // 启用上次更新时间
    lastUpdated: true,
    
    // 启用贡献者
    contributors: false,

    // 自定义容器
    tip: 'TIP',
    warning: 'WARNING',
    danger: 'DANGER',
  }),

  bundler: viteBundler(),
})
