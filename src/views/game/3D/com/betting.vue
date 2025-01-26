<template>
	<div style="position: relative;">
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.sumType') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': bconf.disabledShow }">
				<template v-for="item in sconf.list[0].sizeList" :key="item.oddsCode">
					<div class="type-item betting-tem" :class="{'active': item.isActive}" @click="conf.changeBet(item,1)">
						<img :src="`/static/img/${item.imgUrl}.webp`" />
						<span>{{ sconf.oddsInfo[item.oddsCode] || 0 }}</span>
					</div>
				</template>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.sumPoints') }}</span>
			</div>
			<div class="betting-list" :class="{ 'disabled': bconf.disabledShow }">
				<template v-for="item in sconf.list[0].poinits" :key="item.oddsCode">
					<div class="points-item betting-tem" :class="{'active': item.isActive}" @click="conf.changeBet(item,2)">
						<div class="points-top">
							<img class="points-img" src="/static/img/poinits.webp" />
							<div class="num">{{ item.imgUrl }}</div>
						</div>
						<span>{{ sconf.oddsInfo[item.oddsCode] || 0 }}</span>
					</div>
				</template>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.single') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': bconf.disabledShow }">
				<template v-for="item in sconf.list[0].singleList" :key="item.oddsCode">
					<div class="single-item betting-tem" :class="{'active': item.isActive}" @click="conf.changeBet(item,3)">
						<img class="single-img" :src="`static/img/share-${item.imgUrl}.webp`" />
						<span>{{ sconf.oddsInfo[item.oddsCode] || 0 }}</span>
					</div>
				</template>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.pair') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': bconf.disabledShow }">
				<template v-for="item in sconf.list[0].pairList" :key="item.oddsCode">
					<div class="pair-item betting-tem" :class="{'active': item.isActive}" @click="conf.changeBet(item,4)">
						<div class="pair-img">
							<img class="pair-img-item" :src="`static/img/share-${item.imgUrl}.webp`" />
							<img class="pair-img-item" :src="`static/img/share-${item.imgUrl}.webp`" />
						</div>
						<span>{{ sconf.oddsInfo[item.oddsCode] || 0 }}</span>
					</div>
				</template>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.triple') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': bconf.disabledShow }">
				<template v-for="item in sconf.list[0].tripleList" :key="item.oddsCode">
					<div class="triple-item betting-tem" :class="{'active': item.isActive}" @click="conf.changeBet(item,5)">
						<div class="triple-img">
							<img class="pair-img-item" :src="`static/img/share-${item.imgUrl}.webp`" />
							<div class="img-bottom">
								<img class="pair-img-item" :src="`static/img/share-${item.imgUrl}.webp`" />
								<img class="pair-img-item" :src="`static/img/share-${item.imgUrl}.webp`" />
							</div>
						</div>
						<span>{{ sconf.oddsInfo[item.oddsCode] || 0 }}</span>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import sconfig from '@/sstore/sconfig';
import System from '@/utils/System';
import { Scope } from 'tools-vue3';
import { reactive } from 'vue';
import { dConfInter } from '../3D';
const mconf = Scope.getConf<dConfInter>()
const sconf = mconf.conf.betting.tabs
const bconf = mconf.conf.betting
const props = defineProps({
	timeClose: {
		default: true
	}
})
const emit = defineEmits(['changeBet'])
const conf = reactive({
	addsItem: {} as any,
	current: {},
	odds: {} as any,
	lotteryOdds: [] as any[],
	leopard_any: '',
	money: 0,
	isWinBet: false,
	betShare: false,
	changeBet(item: any,type: number) {
		if (!sconfig.userInfo) return System.router.push('/login')
		if (bconf.disabledShow) return;
		item.isActive = !item.isActive
		emit('changeBet', {info: item,type})
	}
})

</script>

<style lang="less" scoped>
.betting {
	padding-bottom: 24rem;
	background: linear-gradient(180deg, #FFFCF5 0%, #FFF6E5 100%);

	.betting-title {
		padding: 24rem;
		// background: linear-gradient(180deg,#FFF 0%,#f5f5fa 100%);
		display: flex;
		align-items: center;

		img {
			width: 24rem;
			height: 24rem;
		}

		span {
			margin-left: 8rem;
			font-weight: 700;
			font-size: 28rem;
		}
	}

	.betting-list {
		margin-bottom: 32rem;
		padding: 0rem 24rem;
		display: flex;
		flex-wrap: wrap;

		.betting-tem {
			margin-top: 16rem;
			display: flex;
			flex-direction: column;
			align-items: center;
			background: #FFF;
			padding: 24rem 0rem;
			border-radius: 16rem;
			box-shadow: 0 1.06667vw 1.06667vw #00000040;
			border: 2rem solid transparent;

			&.active {
                border: 2rem solid #ff7502;
                background: #fff2e9;
            }

			span {
				margin-top: 16rem;
				color: #45454d;
				font-size: 24rem;
			}
		}

		.type-item {
			width: 23%;

			img {
				width: 96rem;
				height: 96rem;
			}
		}

		.points-item {
			width: 15%;
			margin-right: 2%;

			.points-top {
				position: relative;

				.points-img {
					width: 72rem;
					height: 72rem;
				}

				.num {
					position: absolute;
					top: 0;
					bottom: 8rem;
					width: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 36rem;
					color: #2c2e36;
					font-weight: 900;
				}
			}

			&:nth-child(6n + 6) {
				margin-right: 0rem;
			}
		}

		.single-item {
			width: 15%;

			.single-img {
				width: 72rem;
				height: 72rem;
			}
		}

		.pair-item {
			width: 15%;

			.pair-img {
				display: flex;

				.pair-img-item {
					width: 40rem;
					height: 40rem;
				}
			}
		}

		.triple-item {
			width: 15%;
			padding: 12rem 0rem;

			.triple-img {
				display: flex;
				flex-direction: column;
				align-items: center;

				.pair-img-item {
					width: 40rem;
					height: 40rem;
				}

				.img-bottom {
					display: flex;
				}
			}
		}
	}

	.between {
		justify-content: space-between;
	}

	.disabled {
		filter: grayscale(1);
	}
}
</style>