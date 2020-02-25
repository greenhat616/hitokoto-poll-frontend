<template>
  <b-row>
    <b-col md="8" offset-md="2">
      <b-card
        header="投票状态（结果）"
        class="mb-3"
        no-body
      >
        <b-list-group flush>
          <b-list-group-item v-for="(item, index) in result" :key="index" class="flex-column align-items-start">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">
                #{{ item.id }}
              </h5>
              <small>操作于：{{ formatTime(item.created_at) }}</small>
            </div>
            <div>
              <ul style="margin: 0; padding: 0; list-style: none;" class="mb-2">
                <li>标识：{{ item.sentence_uuid }} </li>
                <template v-if="getPollSentence(item)">
                  <li>句子：{{ getPollSentence(item).hitokoto }}</li>
                  <li>来源：{{ getPollSentence(item).from }}</li>
                  <li>作者：{{ getPollSentence(item).from_who || '未填写' }}</li>
                  <li>分类：{{ formatType(getPollSentence(item).type) }}</li>
                  <li>提交者：{{ getPollSentence(item).creator }}</li>
                </template>
                <template v-else>
                  <li><i>句子消失不见啦！</i></li>
                </template>
                <li>
                  投票状态：<em><b style="color: #ef8719;">{{ formatStatus(item.poll.status) }}</b></em>
                </li>
                <li><b>投票结果：批准 {{ item.poll.accept }} 票，驳回 {{ item.poll.reject }} 票，需要更改 {{ item.poll.need_edited }} 票</b></li>
                <li>
                  投票记录：您投了 <b style="color: #1a9e0f;">{{ formatPollType(item.type) }}</b> <i>{{ item.point }}</i> 票
                </li>
              </ul>
            </div>
          </b-list-group-item>
        </b-list-group>
      </b-card>
    </b-col>
  </b-row>
</template>
<script>
import moment from 'moment'
export default {
  head () {
    return {
      title: '结果与记录 | 一言投票服务'
    }
  },
  async asyncData ({ app, store }) {
    const queue = []
    const token = store.state.token.token || app.$cookies.get('token')
    queue.push(app.$axios.get(`https://poll.hitokoto.cn/v1/user/result/poll/${token}?limit=15`)) // 获取投票结果
    const result = await Promise.all(queue)
    return {
      // logs: result[0].data.Data,
      result: result[0].data.Data
    }
  },
  methods: {
    formatStatus (statusNumber) {
      const desc = []
      desc[1] = '进行中'
      desc[2] = '处理中（停止投票）'
      desc[100] = '投票暂停'
      desc[101] = '投票关闭'
      desc[200] = '已入库'
      desc[201] = '已驳回'
      desc[202] = '需要修改'
      return desc[statusNumber]
    },
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
    }
  }
}
</script>
