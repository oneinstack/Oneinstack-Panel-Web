<template>
	<div class="d5-history">
    <div class="d5-history-title flex-bw">
            <div class="d5-period flex-center">{{ $t('game.drawID') }}</div>
            <div class="d5-result flex-center">{{ $t('game.result') }}</div>
            <div class="d5-sum flex-center">{{ $t('game.sum') }}</div>
        </div>
        <template v-if="conf.resultList.length > 0">
            <div class="d5-history-num flex-bw" v-for="(item,itemIndex) in conf.resultList" :key="itemIndex">
                <div class="d5-period flex-center">
                    <div class="period">{{ item.openExpect }}</div>
                </div>
                <div class="d5-result flex-center">
                    <div class="result-list" style="gap: 4rem">
                        <template v-for="into in item.openCodeArr">
                            <resultBall :num="into" :size="42"/>
                        </template>
                    </div>
                </div>
                <div class="d5-sum flex-center">
                    <div class="sum flex-center">
                        {{ item.sum || '--' }}</div>
                </div>
            </div>
            <div class="more" v-if="conf.isShowMore">
                <div class="more-btn" @click="conf.moreMessage">
                    <span>{{ $t('game.showMore') }}</span>
                    <img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
                </div>
            </div>
            <div class="more-not" v-else>
                <span>{{ $t('user.noMore') }}</span>
            </div>
        </template>
        <x-no-data v-if="conf.resultList.length == 0"></x-no-data>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { apis } from '@/api'
import System from '@/utils/System'
import resultBall from './components/resultBall.vue'


import { Scope } from 'tools-vue3'
const {lottery} = Scope.getConf()
const conf = reactive({
    resultList:[] as any,
    pageSize:20 as number,
    pageNum:1 as number,
    total:0 as number,
    lotteryId: '' as string,
    isShowMore: true as boolean,
    //获取result数据
    getLotteryResult() {
      apis.lotteryOpenResult({
        current: conf.pageNum,
        size: conf.pageSize,
        lotteryId: lottery.play.item.id,
        success: (res: any) => {
          conf.resultList = [...conf.resultList, ...res.data.records]
          conf.resultList?.forEach((item: any) => {
            item.openCodeArr = item.openCode ? item.openCode.split(',') : []
            item.sum = item.openCodeArr.map(Number).reduce((acc:any, curr:any) => acc + curr, 0);
          })
          conf.total = res.data.total
          if (conf.pageSize * conf.pageNum >= conf.total) return conf.isShowMore = false
        },
        final: () => {
          System.loading(false)
        }
      })
    },

    moreMessage(){
        if (conf.pageSize * conf.pageNum >= conf.total) return conf.isShowMore = false
        conf.pageNum ++
		conf.getLotteryResult();
    },

})
onMounted(async () => {
    await conf.getLotteryResult()
})
</script>

<style lang="less" scoped>
.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-bw {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.d5-history {
	background: #fff;
	border-bottom-right-radius: 20rem;
	border-bottom-left-radius: 20rem;

	.d5-history-title {
        background: #FFE5C7;
		font-weight: 600;
		height: 64rem;
        position: sticky;
        top: 0;
        width: 100%;
        z-index: 1000;
	}

	.d5-period {
		width: 33%;
	}

	.d5-result {
		width: 57%;
	}

	.d5-sum {
		width: 20%;
	}

	.d5-history-num {
		height: 74rem;
		font-size: 25rem;
		color: #414141;

		&:nth-child(2n + 1) {
			background: #FFFBF5;
		}

		.result-list {
			display: flex;

			.result-num {
				height: 38rem;
				width: 38rem;
				border: 2rem solid #404653;
				color: #404653;
				background: #f4f4f4;
				border-radius: 50%;
				margin-right: 8rem;

				&:last-of-type {
					margin-right: 0rem;
				}
			}

            :deep(.ball-box) {
              position: relative !important;
            }
		}

		.sum {
			height: 38rem;
			width: 38rem;
			// color: #fff;
			// background-color: #F6843F;
			// border-radius: 50%;
		}
	}

    .more {
			background: #FFF;
			padding: 24rem 24rem 0rem;

			.more-btn {
				box-shadow: rgba(0, 0, 0, 0.1) 0rem 1.06667vw 1.06667vw;
				border-radius: 2.13333vw;
				height: 78rem;
				display: flex;
				align-items: center;
				justify-content: center;

				span {
					margin-right: 20rem;
					font-size: 24rem;
					font-weight: 700;
				}
			}
		}

		.more-not {
			padding: 24rem 0rem 36rem;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rem;
			color: #707070;
		}
}

.num_blue {
	background: linear-gradient(90deg, #00bdff 0%, #5bcdff 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}

.num_yellow {
	background: linear-gradient(90deg, #ff9000 0%, #ffd000 100%);
	box-shadow: 0rem 0rem 20rem 0rem rgba(0, 0, 0, 0.15);
}
</style>