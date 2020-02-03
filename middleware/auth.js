const axios = require('axios')
export default async function ({ req, app, store, redirect, route }) {
  let token
  if (process.server) {
    token = app.$cookies.get('token')
  } else {
    token = store.state.token.token
  }
  if (!token || token.length !== 40) {
    // console.log('無 token')
    return redirect('/')
  }

  const response = await axios.get('https://poll.hitokoto.cn/v1/user/' + token)
  if (response.data.Code !== 200) {
    // console.log('令牌失效')
    store.commit('token/unset')
    return redirect('/')
  }
  store.commit('token/set', token)
}
