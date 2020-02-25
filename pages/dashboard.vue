<template>
  <div>
    <b-row>
      <b-col md="8" offset-md="2">
        <b-card
          title="欢迎您使用一言投票服务（内测版）"
          img-src="https://piccdn.freejishu.com/images/2016/04/27/15fc1a3bafc5d8b6fad2f0557efb232c.jpg"
          img-alt="Image"
          img-top
          class="mb-3"
        >
          <b-card-text>
            由于本系统还处于研发阶段，因此部分功能还未实现。您可以通过下方的“获取新投票”按钮获取一个新的句子以开始审核，点击句子下方的相关按钮提交您的审核意见。
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
                <ul class="mb-2" style=" margin: 0; padding: 0; list-style: none;">
                  <li>标识：{{ poll.sentence_uuid }} </li>
                  <li class="text-wrapper">句子：{{ poll.pending.hitokoto }}</li>
                  <li class="text-wrapper">来源：{{ poll.pending.from }}</li>
                  <li class="text-wrapper">作者：{{ poll.pending.from_who || '未填写' }}</li>
                  <li>分类：{{ formatType(poll.pending.type) }}</li>
                  <li class="text-wrapper">提交者：{{ poll.pending.creator }}</li>
                  <li v-if="poll.isPolled[0]">
                    投票记录：您投了 <b style="color: #1a9e0f;">{{ formatPollType(poll.isPolled[2]) }}</b> <i>{{ poll.isPolled[1] }}</i> 票
                  </li>
                  <li v-if="user.role === '管理员'"><b>当前投票：批准 {{ poll.accept }} 票，驳回 {{ poll.reject }} 票，需要更改 {{ poll.need_edited }} 票</b></li>
                </ul>
              </div>
              <b-button-group v-if="!poll.isPolled[0]">
                <b-button @click="requestPoll(poll.sentence_uuid, 1, index)" :disabled="!!requestPollLock[index]" size="sm" variant="success">
                  <b-spinner v-show="!!requestPollLock[index]" small />
                  <b-icon v-show="!requestPollLock[index]" icon="check-circle" /> {{ !!requestPollLock[index] ? '请求中...' : '批准' }}
                </b-button>
                <b-button @click="requestPoll(poll.sentence_uuid, 2, index)" :disabled="!!requestPollLock[index]" size="sm" variant="outline-danger">
                  <b-spinner v-show="!!requestPollLock[index]" small variant="danger" />
                  <b-icon v-show="!requestPollLock[index]" icon="x" /> {{ requestPollLock[index] ? '请求中...' : '驳回' }}
                </b-button>
                <b-button @click="requestPoll(poll.sentence_uuid, 3, index)" :disabled="!!requestPollLock[index]" size="sm" variant="outline-secondary">
                  <b-spinner v-show="!!requestPollLock[index]" small variant="secondary" />
                  <b-icon v-show="!requestPollLock[index]" icon="flag-fill" /> {{ !!requestPollLock[index] ? '请求中...' : '需要更改' }}
                </b-button>
              </b-button-group>
              <b-button v-else @click="requestCancel(poll.sentence_uuid, index)" :disabled="!!requestPollLock[index]" size="sm" variant="primary">
                <b-spinner v-show="!!requestPollLock[index]" small />
                <b-icon v-show="!requestPollLock[index]" icon="arrow-counterclockwise" /> {{ !!requestPollLock[index] ? '请求中...' : '撤回意见' }}
              </b-button>
            </b-list-group-item>
          </b-list-group>

          <b-card-body>
            <b-button :disabled="!!requestNewPollLock" @click="requestNewPoll" variant="primary" pill>
              <b-spinner v-show="requestNewPollLock" type="grow" small />
              {{ !requestNewPollLock ? '发起新投票' : '请求中...' }}
            </b-button>

            <b-button @click="viewResultAndLog" variant="outline-secondary" pill>
              查看结果与记录
            </b-button>
          </b-card-body>
        </b-card>

        <b-card
          header="您的个人资料"
          class="mb-3"
          no-body
        >
          <b-list-group flush>
            <b-list-group-item>
              标识：{{ user.id }}
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
              建档时间：{{ formatTime(user.created_at) }}
            </b-list-group-item>
            <b-list-group-item>
              最后操作：{{ formatTime(user.updated_at) }}
            </b-list-group-item>
          </b-list-group>
        </b-card>
      </b-col>
    </b-row>
    <notifications group="request-result" position="bottom right" />
    <notifications group="top-notification" position="top center" />
  </div>
</template>
<script>
import moment from 'moment'
import _ from 'lodash'
export default {
  head () {
    return {
      title: '控制台 | 一言投票服务'
    }
  },
  data () {
    return {
      requestNewPollLock: false,
      requestPollLock: [],
      // eslint-disable-next-line vue/no-reserved-keys
      _timer () {}
    }
  },
  computed: {
    getToken () {
      return this.$store.state.token.token
    }
  },
  watch: {

  },
  async asyncData ({ app, store }) {
    const token = store.state.token.token
    const queue = []
    const poll = app.$axios.get(`https://poll.hitokoto.cn/v1/poll/get/${token}?need_polled_flag=true`)
    const user = app.$axios.get(`https://poll.hitokoto.cn/v1/user/${token}`)
    queue.push(poll, user)
    const data = await Promise.all(queue)
    return {
      pollList: data[0].data.Data,
      user: data[1].data.Data[0]
    }
  },
  mounted () {
    this.timer()
  },
  destroyed () {
    clearInterval(this._timer)
  },
  methods: {
    formatTime (input) {
      return moment(input).format('YYYY-MM-DD HH:mm')
    },
    formatPollType (input) {
      const output = []
      output[1] = '批准'
      output[2] = '驳回'
      output[3] = '需要更改'
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

      return output[input] || '未知分类'
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
      if (this.requestPollLock[index]) { return }
      this.$set(this.requestPollLock, index, true)
      const token = this.$store.state.token.token
      const { data } = await this.$axios.get(`https://poll.hitokoto.cn/v1/poll/${token}?sentence_uuid=${sentenceUUID}&method=${method}`)
      if (data.Code === 403) {
        this.$notify({
          type: 'warn',
          group: 'request-result',
          title: '无法进行投票操作',
          text: '此令牌权限不足以对句子：' + sentenceUUID + ' 进行投票。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      } else if (data.Code === -2) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '无法进行投票操作',
          text: '您已经对句子：' + sentenceUUID + ' 投过票了，请勿重复投票。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      } else if (data.Code === -4) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '无法进行投票操作',
          text: '句子：' + sentenceUUID + ' 还未开放投票。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      } else if (data.Code !== 200) {
        this.$notify({
          type: 'error',
          group: 'request-result',
          title: '无法进行投票操作',
          text: '对句子：' + sentenceUUID + ' 发起投票时出现未知错误，建议联系管理员。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      }
      // 成功了
      const point = data.Data[0].pollData.point
      if (method === 1) { // 更新投票數據
        this.pollList[index].accept = this.pollList[index].accept + point
      } else if (method === 2) {
        this.pollList[index].reject = this.pollList[index].reject + point
      } else if (method === 3) {
        this.pollList[index].need_edited = this.pollList[index].need_edited + point
      }
      // 更新投票状态
      this.pollList[index].isPolled = [true, point, method]

      // 更新用戶數據
      this.user.poll.points += point
      if (method === 1) {
        this.user.poll.accept += point
      } else if (method === 2) {
        this.user.poll.reject += point
      } else if (method === 3) {
        this.user.poll.need_edited += point
      }
      this.user.updated_at = data.Data[0].updated_at
      this.$notify({
        type: 'success',
        group: 'request-result',
        title: '成功进行投票操作',
        text: '成功对句子：' + sentenceUUID + ' 投票，投票数据已经更新。'
      })
      this.$set(this.requestPollLock, index, false)
    },
    async requestCancel (sentenceUUID, index) {
      if (this.requestPollLock[index]) { return }
      this.$set(this.requestPollLock, index, true)
      const token = this.$store.state.token.token
      const { data } = await this.$axios.get(`https://poll.hitokoto.cn/v1/poll/cancel/${token}?sentence_uuid=${sentenceUUID}`)
      if (data.Code === -3) {
        this.$notify({
          type: 'danger',
          group: 'request-result',
          title: '无法撤回投票',
          text: '您尚未对此投票发表意见，无需撤回。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      } else if (data.Code === -4) {
        this.$notify({
          type: 'danger',
          group: 'request-result',
          title: '无法撤回投票',
          text: '此投票已结束投票阶段，无法撤回投票。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      } else if (data.Code === -6) {
        this.$notify({
          type: 'danger',
          group: 'request-result',
          title: '无法撤回投票',
          text: '投票不存在。可能是系统问题，建议联系管理员。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      } else if (data.Code !== 200) {
        window.console.log(data)
        this.$notify({
          type: 'danger',
          group: 'request-result',
          title: '无法撤回投票',
          text: '未知状态码。可能是系统问题，建议联系管理员。'
        })
        this.$set(this.requestPollLock, index, false)
        return
      }
      window.console.log(data)
      // 更新数据
      const point = data.Data[0].cancelData.point
      const method = data.Data[0].cancelData.type
      // window.console.log(point, method)
      if (method === 1) { // 更新投票數據
        this.pollList[index].accept = this.pollList[index].accept - point
      } else if (method === 2) {
        this.pollList[index].reject = this.pollList[index].reject - point
      } else if (method === 3) {
        this.pollList[index].need_edited = this.pollList[index].need_edited - point
      }
      // 更新投票状态
      this.pollList[index].isPolled = [false]

      // 更新用戶數據
      this.user.poll.points = this.user.poll.points - point
      if (method === 1) {
        this.user.poll.accept = this.user.poll.accept - point
      } else if (method === 2) {
        this.user.poll.reject = this.user.poll.reject - point
      } else if (method === 3) {
        this.user.poll.need_edited = this.user.poll.need_edited - point
      }
      this.user.updated_at = data.Data[0].updated_at
      this.$notify({
        type: 'success',
        group: 'request-result',
        title: '成功撤回投票',
        text: '成功对句子：' + sentenceUUID + ' 撤回投票，投票数据已经更新。'
      })
      this.$set(this.requestPollLock, index, false)
    },
    async requestNewPoll () {
      if (this.requestNewPollLock) { return }
      this.requestNewPollLock = true
      const token = this.$store.state.token.token
      const { data } = await this.$axios.get(`https://poll.hitokoto.cn/v1/poll/new/${token}`)
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
      } else if (data.Code === -2) {
        this.$notify({
          type: 'info',
          group: 'request-result',
          title: '无法发起新投票',
          text: '当前没有句子等待投票。十分感谢各位审核员的努力，一言有你才精彩！'
        })
        this.requestNewPollLock = false
        return
      }
      this.$notify({
        type: 'success',
        group: 'request-result',
        title: '您已成功发起新投票',
        text: '待投票队列还剩 ' + data.Data[0].remain_pending + '个。\n已将新投票添加到投票队列，您现在可以开始投票了。'
      })
      data.Data[0].isPolled = [false] // 手动添加 flag
      if (_.last(this.pollList).sentence_uuid !== data.Data[0].sentence_uuid) {
        this.pollList.push(data.Data[0]) // 尝试修复同步问题
      }
      this.requestNewPollLock = false
    },
    timer () {
      this.$notify({
        // type: 'success',
        group: 'request-result',
        title: '已激活自动刷新任务',
        text: '为了保障数据的及时、有效，每 30 秒我们会更新投票队列。当前有 ' + this.pollList.length + ' 个句子正在投票。'
      })
      this._timer = setInterval(this.updatePollList, 1000 * 30)
    },
    updatePollList () {
      const _this = this
      const token = this.$store.state.token.token
      this.$axios.get(`https://poll.hitokoto.cn/v1/poll/get/${token}?need_polled_flag=true`)
        .then(({ data }) => {
          if (data.Code !== 200) {
            throw new Error(`${data.Code}：${data.Message}`)
          }
          // 验证数据
          const result = data.Data
          result.map((v) => {
            const r = _.find(_this.pollList, { sentence_uuid: v.sentence_uuid }) // 得到老列表的参数
            // 对比时间
            if (r) {
              const rTS = new Date(r.updated_at).getTime() // 本地记录更新记录的时间戳
              const vTS = new Date(v.updated_at).getTime() // 本次同步更新记录的时间戳
              if (rTS > vTS) {
                return r
              }
            }
            return v
          })
          _this.pollList = result
          _this.$notify({
            type: 'success',
            group: 'request-result',
            title: '投票队列已更新',
            text: '已将投票队列数据更新，当前进行中的投票有 ' + data.Data.length + ' 个。'
          })
        })
    },
    viewResultAndLog () {
      this.$router.push('report')
    }
  }
}
</script>

<style lang="scss">
.text-wrapper {
  white-space: pre-wrap;
}
</style>
