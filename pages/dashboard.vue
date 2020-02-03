<template>
  <div>
    <b-row>
      <b-col md="8" offset-md="2">
        <b-card
          title="欢迎您使用一言投票系统（beta）"
          img-src="https://piccdn.freejishu.com/images/2016/04/27/15fc1a3bafc5d8b6fad2f0557efb232c.jpg"
          img-alt="Image"
          img-top
          class="mb-3"
        >
          <b-card-text>
            由于本系统还处于研发阶段，因而部分功能还未实现。您可以通过下方的“获取新投票”按钮获取一个新的句子以开始审核，点击句子下方的相关按钮将提交您的审核意见。
          </b-card-text>
        </b-card>

        <b-card
          header="正在进行中的投票"
          class="mb-3"
          no-body
        >
          <b-list-group flush>
            <b-list-group-item v-for="(poll, index) in pollList" :key="index" class="flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">
                  #{{ poll.id }}
                </h5>
                <small>发起于：{{ formatTime(poll.created_at) }}</small>
              </div>
              <div>
                <ul style="list-style: none;margin:0px;padding:0px;" class="mb-2">
                  <li>UUID：{{ poll.sentence_uuid }} </li>
                  <li>句子：{{ poll.pending.hitokoto }}</li>
                  <li>来源：{{ poll.pending.from }}</li>
                  <li>作者：{{ poll.pending.from_who || '未填写作者' }}</li>
                  <li>分类：{{ formatType(poll.pending.type) }}</li>
                  <li>提交者：{{ poll.pending.creator }}</li>
                  <li><b>当前投票：批准 {{ poll.accept }} 票，驳回 {{ poll.reject }} 票，需要更改 {{ poll.need_edited }} 票</b></li>
                </ul>
              </div>
              <b-button-group>
                <b-button @click="requestPoll(poll.sentence_uuid, 1, index)" :disabled="requestPollLock" size="sm" variant="success">
                  <b-spinner v-show="requestPollLock" small />
                  <b-icon v-show="!requestPollLock" icon="check-circle" /> {{ requestPollLock ? '请求中...' : '批准' }}
                </b-button>
                <b-button @click="requestPoll(poll.sentence_uuid, 2, index)" :disabled="requestPollLock" size="sm" variant="outline-danger">
                  <b-spinner v-show="requestPollLock" small variant="danger" />
                  <b-icon v-show="!requestPollLock" icon="x" /> {{ requestPollLock ? '请求中...' : '驳回' }}
                </b-button>
                <b-button @click="requestPoll(poll.sentence_uuid, 3, index)" :disabled="requestPollLock" size="sm" variant="outline-secondary">
                  <b-spinner v-show="requestPollLock" small variant="secondary" />
                  <b-icon v-show="!requestPollLock" icon="flag-fill" /> {{ requestPollLock ? '请求中...' : '需要更改' }}
                </b-button>
              </b-button-group>
            </b-list-group-item>
          </b-list-group>

          <b-card-body>
            <b-button :disabled="!!requestNewPollLock" @click="requestNewPoll" variant="primary" pill>
              <b-spinner v-show="requestNewPollLock" type="grow" small />
              {{ !requestNewPollLock ? '发起新投票' : '请求中...' }}
            </b-button>
          </b-card-body>
        </b-card>

        <b-card
          header="个人资料"
          class="mb-3"
          no-body
        >
          <b-list-group flush>
            <b-list-group-item>
              标题：{{ user.id }}
            </b-list-group-item>
            <b-list-group-item>
              名称：{{ user.name }}
            </b-list-group-item>
            <b-list-group-item>
              邮箱：{{ user.email }}
            </b-list-group-item>
            <b-list-group-item>
              权限：{{ user.role }}
            </b-list-group-item>
            <b-list-group-item>
              投票统计：
              <ul>
                <li>共计 {{ user.poll.points }} 票</li>
                <li>批准 {{ user.poll.accept }} 票</li>
                <li>驳回 {{ user.poll.reject }} 票</li>
                <li>需要修改 {{ user.poll.need_edited }} 票</li>
              </ul>
            </b-list-group-item>
            <b-list-group-item>
              创建时间：{{ formatTime(user.created_at) }}
            </b-list-group-item>
            <b-list-group-item>
              最后操作：{{ formatTime(user.updated_at) }}
            </b-list-group-item>
          </b-list-group>
        </b-card>

        <b-card
          header="投票记录"
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
                  <li>UUID：{{ log.sentence_uuid }} </li>
                  <template v-if="getPollSentence(log)">
                    <li>句子：{{ getPollSentence(log).hitokoto }}</li>
                    <li>来源：{{ getPollSentence(log).from }}</li>
                    <li>作者：{{ getPollSentence(log).from_who || '未填写作者' }}</li>
                    <li>分类：{{ formatType(getPollSentence(log).type) }}</li>
                    <li>提交者：{{ getPollSentence(log).creator }}</li>
                  </template>
                  <template v-else>
                    <li><i>句子消失不见啦！</i></li>
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
      title: '控制台 | 一言投票系统'
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
      output[2] = '驳回'
      output[3] = '需要修改'
      output[4] = '需要用户补充投票'
      return output[input] || '未知操作'
    },
    formatType (input) {
      const output = {
        a: '动画',
        b: '漫画',
        c: '游戏',
        d: '文学',
        e: '原创',
        f: '来自网络',
        g: '其他',
        h: '影视',
        i: '诗词',
        j: '网易云音乐',
        k: '哲学',
        l: '抖机灵（笑话，脑筋急转弯，段子等）'
      }

      return output[input] || '位置分类'
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
          title: '无法进行投票操作',
          text: '此令牌权限不足以对句子：' + sentenceUUID + ' 进行投票。'
        })
        this.requestPollLock = false
        return
      } else if (data.Code === -2) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '无法进行投票操作',
          text: '您已经对句子：' + sentenceUUID + ' 投过票了，请勿重复投票。'
        })
        this.requestPollLock = false
        return
      } else if (data.Code === -4) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '无法进行投票操作',
          text: '句子：' + sentenceUUID + ' 还未开放投票。'
        })
        this.requestPollLock = false
        return
      } else if (data.Code !== 200) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '无法进行投票操作',
          text: '对句子：' + sentenceUUID + ' 发起投票时出现错误，请重试。'
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
        title: '成功进行投票操作',
        text: '成功对句子：' + sentenceUUID + ' 投票，页面数据已经更新。'
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
          title: '无法发起新投票',
          text: '此令牌虽然已经证明了您的身份，但是您当前无权发起投票。'
        })
        this.requestNewPollLock = false
        return
      } else if (data.Code === -1) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '无法发起新投票',
          text: '当前进行中的投票已经到达上限，暂时无法开启新投票。'
        })
        this.requestNewPollLock = false
        return
      }
      this.$notify({
        type: 'success',
        group: 'request-result',
        title: '您已成功发起新投票',
        text: '已将新投票添加到投票队列，您现在可以开始投票了。'
      })
      this.pollList.push(data.Data[0])
      this.requestNewPollLock = false
    }
  }
}
</script>
