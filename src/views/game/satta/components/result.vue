<template>
	<div class="result">
		<div class="result-title">
			<div style="width: 28%;">{{ $t('game.drawID') }}</div>
			<div style="width: 35%;">{{ $t('game.result') }}</div>
			<div style="width: 37%;">{{ $t('game.sum') }}</div>
		</div>
		<div class="result-list">
			<template v-for="(item, index) in resultList" :key="index">
				<div class="result-ltem" v-if="item.openCode">
					<div style="width: 28%;word-break:break-all;font-size: 27rem;">{{ item.openExpect }}</div>
					<div style="width: 35%;display: flex;justify-content: center;"> 
						<div class="sum">
							<img class="sum-img" src="/static/img/color-red.webp" />
							<div class="sum-num">{{ item.openCode }}</div>
						</div>
					</div>
					<div style="width: 37%;display: flex;justify-content: center;"> 
						<div class="sum-num">{{ new Date(item.openTime).Format('MM/dd/yyyy hh:mm:ss') }}</div>
					</div>
				</div>
				<div class="result-ltem" v-else>
					<div style="width: 30%;word-break:break-all;font-size: 27rem;">{{ item.openExpect }}</div>
					<div style="width: 35%;">
						<div class="sum">
							<img class="sum-img" src="/static/img/color-red.webp" />
							<div class="sum-num">?</div>
						</div>
					</div>
					<div style="width: 37%;display: flex;justify-content: center;"> 
						<div class="sum-num">{{ new Date(item.openTime).Format('MM/dd/yyyy hh:mm:ss') }}</div>
					</div>
				</div>
			</template>
			<div v-if="resultList.length > 0">
				<div class="more" v-if="!isTips">
					<div class="more-btn" @click="emit('change')">
						<span>{{ $t('game.showMore') }}</span>
						<img src="/static/img/show-more.png" style="width: 20rem;height: 12rem;" />
					</div>
				</div>
				<div class="more-not" v-else>
					<span>{{ $t('user.noMore') }}</span>
				</div>
			</div>
			<x-no-data v-if="resultList.length == 0"></x-no-data>
		</div>
	</div>
</template>

<script setup lang="ts">
import { apis } from '@/api';
import sutil from '@/sstore/sutil';
import { onMounted, reactive, watch } from 'vue';
const props = defineProps({
	resultList: {
		default: [] as any[]
	},
	isTips: {
		default: false
	}
})

const emit = defineEmits(['change'])
</script>

<style lang="less" scoped>
.result {
	// margin: 0rem 20rem 124rem;
	overflow: hidden;

	// padding-bottom: 24rem;
	.result-title {
		display: flex;
		padding: 0rem 24rem;
		background: #FFE5C7;

		div {
			font-size: 24rem;
			color: #45454d;
			padding: 16rem 0rem;
			display: flex;
			justify-content: center;
		}
	}

	.result-list {
		margin-bottom: 24rem;
		padding-bottom: 24rem;
		background: #FFF;

		.result-ltem {
			padding: 24rem 22rem;
			display: flex;
			flex-wrap: wrap;
			justify-content: space-between;
			align-items: center;

			.share-point {
				display: flex;
				justify-content: center;

				.point-img {
					width: 48rem;
					height: 48rem;
					margin-left: 6rem;
					&:first-of-type{
						margin-left: 0rem;
					}
				}
			}

			.img {
				width: 48rem;
				height: 48rem;
			}

			.sum {
				width: 48rem;
				height: 48rem;
				position: relative;

				.sum-img {
					width: 100%;
					height: 100%;
				}

				.sum-num {
					position: absolute;
					top: 0rem;
					bottom: 0rem;
					width: 100%;
					display: flex;
					justify-content: center;
					align-items: center;
					font-size: 26rem;
					color: #fff;
				}
			}

			&:nth-child(2n) {
				background: #FFFBF5;
			}
		}

		.more {
			background: #FFF;
			padding: 24rem 24rem 0rem;

			.more-btn {
				// box-shadow: rgba(0, 0, 0, 0.1) 0rem 1.06667vw 1.06667vw;
				// border-radius: 2.13333vw;
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
}
</style>