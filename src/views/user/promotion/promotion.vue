<template>
  <x-page>
    <template #title>Promotion</template>
    <div class="pt-contennt">
      <div class="bonus-box">
        <div class="b-title">Enjoy a variety of activities and gifts non-stop</div>

        <div class="bonus-list">
          <template v-for="item in conf.bonusList" :key="item.name">
            <div class="bouns-item flex-b-c" :style="{ 'background': item.bg }">
              <div class="l-name">
                <span>{{ item.name }} BONUS</span>
                <div class="l-btn flex-center">{{ item.lable }} Deposit</div>
              </div>
              <img class="bonus-img" :src="`/static/theme/black/bonus/bonus${item.imgUrl}.png`" />
            </div>
          </template>
        </div>

        <div class="b-btn">
          <div class="btn">
            <greenBtn>
              <span style="font-size: 28rem;">Deposit Now</span>
            </greenBtn>
          </div>
          <div class="btn more-btn flex-center" @click="conf.rulesShow = true">More Details</div>
        </div>
      </div>
      <div style="margin: 20rem 0rem;">
        <custNav :dataArr="conf.navList" />
      </div>
      <template v-for="item in conf.activityList" :key="item.id">
        <div class="pt-item" @click="conf.goContent(item)">
          <img class="pt-img" :src="item.coverUrl" />
          <div class="pt-txt flex-b-c">
            <div class="l-name">
              <div class="ellipsis">{{ item.activityName }}</div>
              <div class="time">
                <span>Ends </span>
                {{ Date.Format(item.endTime, 'yyyy/MM/dd hh:mm:ss') }}
              </div>
            </div>
            <div class="event-item flex-center">Event End</div>
          </div>
        </div>
      </template>
      <x-no-data v-if="!conf.isLoading && !conf.activityList.length" :top="40"></x-no-data>
    </div>
    <custPopup :show="conf.rulesShow" title="Deposit Bonus Rules" @close="conf.rulesShow = false">
      <ruules :bonusList="conf.bonusList" />
    </custPopup>
  </x-page>
</template>
<script setup lang="ts">
import greenBtn from '@/views/home/theme/black/components/greenBtn.vue';
import custPopup from '../setting/com/custPopup.vue';
import custNav from '../setting/com/custNav.vue';
import ruules from './com/rules.vue'
import { onMounted, reactive } from 'vue';
import { svalue } from '@/sstore/svalue';
import System from '@/utils/System';
import { apis } from '@/api';
import { Scope } from 'tools-vue3';
import { EPage } from '@/enum/Enum';
import sweb from '@/sstore/sweb';


const conf = reactive({
  bonusList: [
    {
      name: '180%',
      lable: '1st',
      imgUrl: 1,
      money: '$873.25',
      bg: 'linear-gradient(180deg, #A37B21 0%, #242726 100%)'
    },
    {
      name: '240%',
      lable: '2nd',
      imgUrl: 2,
      money: '$4,366.27',
      bg: 'linear-gradient(180deg, #7CA52C 0%, #242726 100%)'
    },
    {
      name: '300%',
      lable: '2rd',
      imgUrl: 3,
      money: '$8732.25',
      bg: 'linear-gradient(180deg, #A54A2C 0%, #242726 100%)'
    },
    {
      name: '360%',
      lable: '4th',
      imgUrl: 4,
      money: '$17,465.11',
      bg: 'linear-gradient(180deg, #9330A7 0%, #242726 100%)'
    }
  ],

  navList: [
    {
      name: 'Latest Promotion'
    },
    {
      name: 'Archived'
    }
  ],
  rulesShow: false,
  activityList: [] as any[],
  pageNum: 1,
  pageSize: 20,
  total: 0,
  languageId: '',
  isLoading: true,
  // 获取当前语言
  async getLanguageList() {
    let current: any = await svalue.currentLanguage()
    conf.getActivityList(current.id)
  },
  // 获取活动列表
  async getActivityList(languageId: string) {
    conf.languageId = languageId
    System.loading()
    apis.activityList({
      current: conf.pageNum,
      size: conf.pageSize,
      languageId,
      success: (res: any) => {
        if (res.data) {
          console.log(res);

          conf.activityList = [...conf.activityList, ...res.data.records]
          conf.total = res.data.total
        }
      },
      final: () => {
        System.loading(false)
        conf.isLoading = false
      }
    })
  },
  // 活动详情
  goContent(item: any) {
    if (item.activityType !== 2) return System.router.push('/user/promotion/detail?id=' + item.id)
    let str = item.pathUrl.charAt(0)
    if (str == '/') {
      System.router.push(item.pathUrl)
    } else {
      if (item.pathUrl.indexOf('http') != -1) {
        sweb.open(item.pathUrl)
      }
    }
  },
  moreMessage() {
    if (conf.pageSize * conf.pageNum >= conf.total) return
    conf.pageNum++
    conf.getActivityList(conf.languageId)
  }
})
const event = Scope.Event()
event.on(EPage.scrollBottom, () => {
  conf.moreMessage()
})

onMounted(() => {
  conf.getLanguageList()
})

</script>

<style lang="less" scoped>
.pt-contennt {
  padding: 24rem;

  .bonus-box {
    padding: 20rem;
    background: linear-gradient(270deg, #323738 0%, #323738 46.38%, #677332 98.56%);
    border-radius: 20rem;
    font-family: Poppins;
    font-weight: 600;
    color: #fff;

    .b-title {
      font-size: 40rem;
      padding-right: 80rem;
    }

    .bonus-list {
      display: flex;
      flex-wrap: wrap;

      .bouns-item {
        border-radius: 16rem;
        width: 48%;
        padding: 10rem 0rem 10rem 16rem;
        height: 110rem;
        margin-right: 4%;
        margin-top: 20rem;

        &:nth-child(2n + 2) {
          margin-right: 0rem;
        }

        .l-name {
          font-size: 24rem;

          .l-btn {
            background: #323738;
            height: 48rem;
            border-radius: 10rem;
            color: #BFBFBF;
            padding: 0rem 6rem;
            margin: 4rem;
          }
        }

        .bonus-img {
          height: 100%;
        }
      }
    }

    .b-btn {
      display: flex;
      height: 80rem;
      margin: 30rem 0rem 20rem;

      .btn {
        flex: 1;
      }

      .more-btn {
        border: 2rem solid #414648;
        border-radius: 12rem;
        background: #2F3435;
        font-size: 28rem;
        margin-left: 20rem;
      }
    }
  }
}

.pt-item {
  background: #292D2E;
  border-radius: 20rem;
  margin-bottom: 20rem;

  .pt-img {
    height: 280rem;
    width: 100%;
    border-radius: 20rem;
  }

  .pt-txt {
    padding: 20rem 12rem;
    font-family: Poppins;
    font-weight: 600;
    font-size: 28rem;
    color: #fff;

    .l-name {
      flex: 1;

      .ellipsis {
        white-space: nowrap;
        /* 防止文本换行 */
        overflow: hidden;
        /* 隐藏溢出的内容 */
        text-overflow: ellipsis;
        width: 480rem;
      }

      .time {
        color: #BFBFBF;
        font-size: 24rem;
        margin-top: 4rem;
      }
    }

    .event-item {
      background: #3A4142;
      border-radius: 12rem;
      font-size: 24rem;
      height: 68rem;
      padding: 0rem 30rem;
    }
  }
}
</style>