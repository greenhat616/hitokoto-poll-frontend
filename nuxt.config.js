
module.exports = {
  mode: 'universal',
  /*
  ** Headers of the page
  */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
  ** Global CSS
  */
  css: [
    { src: '~/assets/scss/core.scss', lang: 'scss' }
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    { src: '~/plugins/notifications-ssr', mode: 'server' },
    { src: '~/plugins/notifications-client', mode: 'client' },
    '~/plugins/icon'
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module',
    ['@nuxtjs/google-analytics', {
      id: 'UA-158766433-3'
    }]
  ],
  manifest: {
    name: "一言投票服务",
    short_name: "一言投票",
    description: "一言审核员投票模块。在这里，你可以为你喜欢的句子投出赞成票；对自己厌恶的句子投出否决票。公开透明，共同维护。你们是一言前进的动力与榜样，一言有你们更精彩！",
    background_color: "#ebebeb",
    theme_color: "#343a40",
    lang: "zh",
    start_url: "/"
  },
  render: {
    http2: {
      push: true
    },
    static: {
      maxAge: "1y",
      setHeaders(res, path) {
        if (path.includes("sw.js")) {
          res.setHeader("Cache-Control", `public, max-age=${15 * 60}`);
        }
      }
    }
  },
// resourceHints 提升页面加载性能与体验
  render: {
    resourceHints: false
  },
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://bootstrap-vue.js.org
    'bootstrap-vue/nuxt',
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    // '@nuxtjs/pwa',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    ['nuxt-vuex-localstorage', {
      localStorage: ['localStorage', 'token'], //  If not entered, “localStorage” is the default value
      sessionStorage: ['sessionStorage'] //  If not entered, “sessionStorage” is the default value
    }],
    'cookie-universal-nuxt',
    '@nuxtjs/pwa'
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend (config, ctx) {
    }
  },
  router: {
    middleware: ['auth']
  },
  loading: {
    color: '#61A6FF',
    height: '3px'
  },
  loadingIndicator: {
    name: 'fading-circle',
    color: '#61A6FF',
    background: 'transparent'
  }
}
