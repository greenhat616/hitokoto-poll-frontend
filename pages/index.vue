<template>
  <div>
    <b-row>
      <b-col md="6" offset-md="3">
        <b-card
          title="须要验证您的身份"
          class="mb-2"
        >
          <b-card-text>
            请输入您在 <a href="https://hitokoto.cn/api/v1/user/getToken" target="_blank">hitokoto.cn</a> 获得的令牌（<code>token</code>）以验证身份。
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
                placeholder="Token"
              />
              <b-form-invalid-feedback>
                {{ feedback }}
              </b-form-invalid-feedback>
            </b-form-group>
            <b-button :disabled="requestLock" type="submit" variant="primary">
              <b-spinner v-show="requestLock" type="grow" small />
              {{ !requestLock ? '身份验证' : '请求中...' }}
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
      title: '身份验证 | 一言投票服务'
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
        '令牌长度存在问题，请检查您的输入！',
        '无法验证您的身份，请检查您输入的令牌！'
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
        title: '检索到本地存储存在令牌',
        text: '我们将尝试使用此凭据进行身份验证。'
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
              title: '身份验证成功',
              text: '现在，我们将转跳至控制台。'
            })
            _this.$router.push('/dashboard')
          } else {
            _this.$notify({
              type: 'error',
              group: 'token-validation',
              title: '令牌失效',
              text: '无法验证您的身份，您需要更新您的令牌。'
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
          title: '令牌错误',
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
          title: '令牌错误',
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
        title: '身份验证成功',
        text: '现在，我们将转跳至控制台。'
      })
      this.requestLock = false
      this.$router.push('dashboard')
    }
  }
}
</script>
