<template>
  <div>
    <b-row>
      <b-col md="6" offset-md="3">
        <b-card
          title="須要驗明您的身份"
          class="mb-2"
        >
          <b-card-text>
            在下方填寫您從 <a href="https://hitokoto.cn/api/v1/user/getToken" target="_blank">hitokoto.cn</a> 獲得的令牌，單機按鈕驗證身份。
          </b-card-text>
          <b-form @submit="onSubmit">
            <b-form-group
              id="token-group"
              label-for="token"
            >
              <b-form-input
                id="token"
                v-model="form.token"
                :state="validation"
                type="text"
                placeholder="請輸入您獲得的令牌……"
              />
              <b-form-invalid-feedback>
                {{ feedback }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-button :disabled="requestLock" type="submit" variant="primary">
              <b-spinner v-show="requestLock" type="grow" small />
              {{ !requestLock ? '證明身份' : '正在請求中...' }}
            </b-button>
          </b-form>
        </b-card>
      </b-col>
    </b-row>
    <notifications group="token-validation" position="bottom right" />
  </div>
</template>

<script>
export default {
  auth: false,
  head () {
    return {
      title: '身份驗證 | 一言投票服務'
    }
  },
  data () {
    return {
      form: {
        token: ''
      },
      validation: null,
      feedback: '',
      errMsg: [
        '令牌長度存在問題，請檢查！',
        '您無法證明您的身份，請檢查您輸入的令牌！'
      ],
      requestLock: false
    }
  },
  computed: {
    getToken () {
      return this.$store.state.token.token
    }
  },
  mounted () {
    if (this.getToken && this.getToken.length === 40) {
      this.$notify({
        // type: 'warn',
        group: 'token-validation',
        title: '檢索到本地存儲有令牌',
        text: '我們將嘗試使用該令牌進行身份認證。'
      })
      const _this = this
      this.$axios.get(`https://poll.hitokoto.cn/v1/user/${this.getToken}`)
        .then((response) => {
          if (response.data.Code && response.data.Code === 200) {
            this.$cookies.set('token', this.form.token, {
              maxAge: 60 * 60 * 24 * 30
            })
            _this.$notify({
              type: 'success',
              group: 'token-validation',
              title: '驗證成功',
              text: '現在，我們將跳轉至面板頁。'
            })
            _this.$router.push('/dashboard')
          } else {
            _this.$notify({
              type: 'error',
              group: 'token-validation',
              title: '令牌已失效',
              text: '此令牌現無法證明您的身份，您需要更新您的令牌。'
            })
          }
        })
    }
  },
  methods: {
    async onSubmit (event) {
      event.preventDefault()
      this.requestLock = true
      this.form.token = this.form.token.trim()
      if (!this.form.token || this.form.token.length !== 40) {
        this.feedback = this.errMsg[0]
        this.validation = false
        this.$notify({
          type: 'error',
          group: 'token-validation',
          title: '令牌錯誤',
          text: this.errMsg[0]
        })
        this.requestLock = false
        return
      }
      const result = await this.$axios.get(`https://poll.hitokoto.cn/v1/user/${this.form.token}`)
      const data = result.data
      window.console.log(data)
      if (data.Code !== 200) {
        this.feedback = this.errMsg[1]
        this.validation = false
        this.$notify({
          type: 'error',
          group: 'token-validation',
          title: '令牌錯誤',
          text: this.errMsg[1]
        })
        this.requestLock = false
        return
      }
      this.validation = true
      this.$store.commit('token/set', this.form.token)
      this.$cookies.set('token', this.form.token, {
        maxAge: 60 * 60 * 24 * 30
      })
      this.$notify({
        type: 'success',
        group: 'token-validation',
        title: '驗證成功',
        text: '現在，我們將跳轉至面板頁。'
      })
      this.requestLock = false
      this.$router.push('dashboard')
    }
  }
}
</script>
