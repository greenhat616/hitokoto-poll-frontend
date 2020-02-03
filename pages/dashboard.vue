<template>
  <div>
    <b-row>
      <b-col md="8" offset-md="2">
        <b-card
          title="歡迎您使用一言投票服務（内測版）"
          img-src="https://piccdn.freejishu.com/images/2016/04/27/15fc1a3bafc5d8b6fad2f0557efb232c.jpg"
          img-alt="Image"
          img-top
          class="mb-3"
        >
          <b-card-text>
            由於本系統還處於研發階段，功能并未完全繼承。目前，您可以通過下方的“獲取新投票”按鈕發起投票，然後使用相關按鈕投票，投票系統娘會自動處理。
          </b-card-text>
        </b-card>

        <b-card
          header="正在進行中的投票"
          class="mb-3"
          no-body
        >
          <b-list-group flush>
            <b-list-group-item v-for="(poll, index) in pollList" :key="index" class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">
                  #{{ poll.id }}
                </h5>
                <small>發起于：{{ formatTime(poll.created_at) }}</small>
              </div>
              <div>
                <ul style="list-style: none;margin:0px;padding:0px;" class="mb-2">
                  <li>標識：{{ poll.sentence_uuid }} </li>
                  <li>句子：{{ poll.pending.hitokoto }}</li>
                  <li>來源：{{ poll.pending.from }}</li>
                  <li>作者：{{ poll.pending.from_who || '未填寫' }}</li>
                  <li>分類：{{ formatType(poll.pending.type) }}</li>
                  <li>提交者：{{ poll.pending.creator }}</li>
                  <li><b>當前投票：批准 {{ poll.accept }} 票，駁回 {{ poll.reject }} 票，需要更改 {{ poll.need_edited }} 票</b></li>
                </ul>
              </div>
              <b-button-group>
                <b-button @click="requestPoll(poll.sentence_uuid, 1, index)" :disabled="requestPollLock" size="sm" variant="success">
                  <b-spinner v-show="requestPollLock" small />
                  <b-icon v-show="!requestPollLock" icon="check-circle" /> {{ requestPollLock ? '請求中...' : '批准' }}
                </b-button>
                <b-button @click="requestPoll(poll.sentence_uuid, 2, index)" :disabled="requestPollLock" size="sm" variant="outline-danger">
                  <b-spinner v-show="requestPollLock" small variant="danger" />
                  <b-icon v-show="!requestPollLock" icon="x" /> {{ requestPollLock ? '請求中...' : '駁回' }}
                </b-button>
                <b-button @click="requestPoll(poll.sentence_uuid, 3, index)" :disabled="requestPollLock" size="sm" variant="outline-secondary">
                  <b-spinner v-show="requestPollLock" small variant="secondary" />
                  <b-icon v-show="!requestPollLock" icon="flag-fill" /> {{ requestPollLock ? '請求中...' : '需要更改' }}
                </b-button>
              </b-button-group>
            </b-list-group-item>
          </b-list-group>

          <b-card-body>
            <b-button :disabled="!!requestNewPollLock" @click="requestNewPoll" variant="primary" pill>
              <b-spinner v-show="requestNewPollLock" type="grow" small />
              {{ !requestNewPollLock ? '發起新投票' : '正在請求中...' }}
            </b-button>
          </b-card-body>
        </b-card>

        <b-card
          header="您的個人資訊"
          class="mb-3"
          no-body
        >
          <b-list-group flush>
            <b-list-group-item>
              標識：{{ user.id }}
            </b-list-group-item>
            <b-list-group-item>
              名稱：{{ user.name }}
            </b-list-group-item>
            <b-list-group-item>
              郵箱：{{ user.email }}
            </b-list-group-item>
            <b-list-group-item>
              角色：{{ user.role }}
            </b-list-group-item>
            <b-list-group-item>
              投票概覽：
              <ul>
                <li>總計 {{ user.poll.points }} 票</li>
                <li>批准 {{ user.poll.accept }} 票</li>
                <li>駁回 {{ user.poll.reject }} 票</li>
                <li>需要修改 {{ user.poll.need_edited }} 票</li>
              </ul>
            </b-list-group-item>
            <b-list-group-item>
              建檔時間：{{ formatTime(user.created_at) }}
            </b-list-group-item>
            <b-list-group-item>
              最後操作：{{ formatTime(user.updated_at) }}
            </b-list-group-item>
          </b-list-group>
        </b-card>

        <b-card
          header="您的投票紀錄"
          class="mb-3"
          no-body
        >
          <b-list-group flush>
            <b-list-group-item v-for="(log, index) in user.poll.pollLog" :key="index" class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">
                  #{{ log.id }}
                </h5>
                <small>操作于：{{ formatTime(log.created_at) }}</small>
              </div>
              <div>
                <ul style="list-style: none;margin:0px;padding:0px;" class="mb-2">
                  <li>標識：{{ log.sentence_uuid }} </li>
                  <template v-if="getPollSentence(log)">
                    <li>句子：{{ getPollSentence(log).hitokoto }}</li>
                    <li>來源：{{ getPollSentence(log).from }}</li>
                    <li>作者：{{ getPollSentence(log).from_who || '未填寫' }}</li>
                    <li>分類：{{ formatType(getPollSentence(log).type) }}</li>
                    <li>提交者：{{ getPollSentence(log).creator }}</li>
                  </template>
                  <template v-else>
                    <li><i>句子消失不見啦！</i></li>
                  </template>
                  <li><b>您投了<i>{{ formatPollType(log.type) }}</i> {{ log.point }} 票</b></li>
                </ul>
              </div>
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </b-col>
    </b-row>
    <notifications group="request-result" position="bottom right" />
  </div>
</template>
<script>
import moment from 'moment'
export default {
  head () {
    return {
      title: '面板 | 一言投票服務'
    }
  },
  data () {
    return {
      requestNewPollLock: false,
      requestPollLock: false
    }
  },
  computed: {
    getToken () {
      return this.$store.state.token.token
    }
  },
  async asyncData ({ app, store }) {
    const token = store.state.token.token
    const pollResponse = await app.$axios.get(`https://poll.hitokoto.cn/v1/poll/get/${token}`)
    const userResponse = await app.$axios.get(`https://poll.hitokoto.cn/v1/user/${token}`)
    return {
      pollList: pollResponse.data.Data,
      user: userResponse.data.Data[0]
    }
  },
  methods: {
    formatTime (input) {
      return moment(input).format('YYYY-MM-DD HH:mm')
    },
    formatPollType (input) {
      const output = []
      output[1] = '批准'
      output[2] = '駁回'
      output[3] = '需要修改'
      output[4] = '需要用戶補充投票'
      return output[input] || '未知操作'
    },
    formatType (input) {
      const output = {
        a: '動畫',
        b: '漫畫',
        c: '游戲',
        d: '文學',
        e: '原創',
        f: '來自網絡',
        g: '其他',
        h: '影視',
        i: '詩詞',
        j: '網易雲音樂',
        k: '哲學',
        l: '抖機靈（笑話，腦經急轉彎，段子等）'
      }

      return output[input] || '位置分類'
    },
    getPollSentence (data) {
      if (data.pending) {
        return data.pending
      } else if (data.refuse) {
        return data.refuse
      } else if (data.sentence) {
        return data.sentence
      }
      return false
    },
    async requestPoll (sentenceUUID, method, index) {
      if (this.requestPollLock) { return }
      this.requestPollLock = true
      const token = this.$store.state.token.token
      const { data } = await this.$axios.get(`https://poll.hitokoto.cn/v1/poll/${token}?sentence_uuid=${sentenceUUID}&method=${method}`)
      if (data.Code === 403) {
        this.$notify({
          type: 'warn',
          group: 'request-result',
          title: '無法進行投票操作',
          text: '此令牌雖然已經證明了您的身份，但是您當前無權限對句子：' + sentenceUUID + ' 進行投票。'
        })
        this.requestPollLock = false
        return
      } else if (data.Code === -2) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '無法進行投票操作',
          text: '您已對句子：' + sentenceUUID + ' 投過票了，請勿重複投票。'
        })
        this.requestPollLock = false
        return
      } else if (data.Code === -4) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '無法進行投票操作',
          text: '句子：' + sentenceUUID + ' 尚未開放投票。'
        })
        this.requestPollLock = false
        return
      } else if (data.Code !== 200) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '無法進行投票操作',
          text: '對句子：' + sentenceUUID + ' 發起投票操作時出現未知錯誤，詳情咨詢管理員。'
        })
        this.requestPollLock = false
        return
      }
      // 成功了
      const point = this.user.role === '管理员' ? 2 : 1
      if (method === 1) { // 更新投票數據
        this.pollList[index].accept = this.pollList[index].accept + point
      } else if (method === 2) {
        this.pollList[index].reject = this.pollList[index].reject + point
      } else if (method === 3) {
        this.pollList[index].need_edited = this.pollList[index].need_edited + point
      }

      // 更新用戶數據
      const userResponse = await this.$axios.get(`https://poll.hitokoto.cn/v1/user/${token}`)
      this.user = userResponse.data.Data[0]
      this.$notify({
        type: 'success',
        group: 'request-result',
        title: '成功進行投票操作',
        text: '成功對句子：' + sentenceUUID + ' 投票，頁面數據已更新。'
      })
      this.requestPollLock = false
    },
    async requestNewPoll () {
      if (this.requestNewPollLock) { return }
      this.requestNewPollLock = true
      const token = this.$store.state.token.token
      const { data } = await this.$axios.get(`https://poll.hitokoto.cn/v1/poll/new/${token}`)
      window.console.log(data)
      if (data.Code === 403) {
        this.$notify({
          type: 'warn',
          group: 'request-result',
          title: '無法發起新投票',
          text: '此令牌雖然已經證明了您的身份，但是您當前無權限。'
        })
        this.requestNewPollLock = false
        return
      } else if (data.Code === -1) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '無法發起新投票',
          text: '當前正在進行中的投票已達上限，暫時無法發起投票。'
        })
        this.requestNewPollLock = false
        return
      }
      this.$notify({
        type: 'success',
        group: 'request-result',
        title: '您已成功發起新投票',
        text: '已將新投票添加到投票隊列，您可以開始投票了。'
      })
      this.pollList.push(data.Data[0])
      this.requestNewPollLock = false
    }
  }
}
</script>
