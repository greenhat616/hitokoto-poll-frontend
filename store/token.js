const moment = require('moment')
export const state = () => ({
  token: '',
  expired_at: 0
})

export const mutations = {
  set (state, token) {
    state.token = token
    state.expired_at = moment().add(1, 'months').valueOf()
  },
  unset (state) {
    state.token = ''
    state.expired_at = 0
  }
}
