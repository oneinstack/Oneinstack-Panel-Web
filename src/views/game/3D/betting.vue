<template>
	<div style="position: relative;">
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.sumType') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': timeClose }">
				<div class="type-item betting-tem" @click="conf.changeBet(conf.odds.sum_big_status, 'big.webp', 'sum_big')"
					:class="{ 'disabled': conf.odds.sum_big_status == 0 }">
					<img src="/static/img/big.webp" />
					<span>{{ conf.odds.sum_big || 0 }}</span>
				</div>
				<div class="type-item betting-tem" @click="conf.changeBet(conf.odds.sum_small_status, 'small.webp', 'sum_small')"
					:class="{ 'disabled': conf.odds.sum_small_status == 0 }">
					<img src="/static/img/small.webp" />
					<span>{{ conf.odds.sum_small || 0 }}</span>
				</div>
				<div class="type-item betting-tem" @click="conf.changeBet(conf.odds.sum_odd_status, 'odd.webp', 'sum_odd')"
					:class="{ 'disabled': conf.odds.sum_odd_status == 0 }">
					<img src="/static/img/odd.webp" />
					<span>{{ conf.odds.sum_odd || 0 }}</span>
				</div>
				<div class="type-item betting-tem" @click="conf.changeBet(conf.odds.sum_even_status, 'even.webp', 'sum_even')"
					:class="{ 'disabled': conf.odds.sum_even_status == 0 }">
					<img src="/static/img/even.webp" />
					<span>{{ conf.odds.sum_even || 0 }}</span>
				</div>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.sumPoints') }}</span>
			</div>
			<div class="betting-list" :class="{ 'disabled': timeClose }">
				<template v-for="(item, index) in poinits" :key="index">
					<div class="points-item betting-tem"
						@click="conf.changeBet(conf.odds[item.name + '_status'], 'poinits.webp', item.name, 'point', item.num)"
						:class="{ 'disabled': conf.odds[item.name + '_status'] == 0 }">
						<div class="points-top">
							<img class="points-img" src="/static/img/poinits.webp" />
							<div class="num">{{ item.num }}</div>
						</div>
						<span>{{ conf.odds[item.name] }}</span>
					</div>
				</template>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.single') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': timeClose }">
				<template v-for="(item, index) in shareList" :key="index">
					<div class="single-item betting-tem"
						@click="conf.changeBet(conf.odds[item.single + '_status'], item.betImg, item.single)"
						:class="{ 'disabled': conf.odds[item.single + '_status'] == 0 }">
						<img class="single-img" :src="item.src" />
						<span>{{ conf.odds[item.single] }}</span>
					</div>
				</template>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.pair') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': timeClose }">
				<template v-for="(item, index) in shareList" :key="index">
					<div class="pair-item betting-tem"
						@click="conf.changeBet(conf.odds[item.double + '_status'], item.betImg, item.double, 'dice', 2)"
						:class="{ 'disabled': conf.odds[item.double + '_status'] == 0 }">
						<div class="pair-img">
							<img class="pair-img-item" :src="item.src" />
							<img class="pair-img-item" :src="item.src" />
						</div>
						<span>{{ conf.odds[item.double] }}</span>
					</div>
				</template>
			</div>
		</div>
		<div class="betting">
			<div class="betting-title">
				<img src="/static/img/betting-icon.png" />
				<span>{{ $t('game.triple') }}</span>
			</div>
			<div class="betting-list between" :class="{ 'disabled': timeClose }">
				<template v-for="(item, index) in shareList" :key="index">
					<div class="triple-item betting-tem"
						@click="conf.changeBet(conf.odds[item.leopard + '_status'], item.betImg, item.leopard, 'dice', 3)"
						:class="{ 'disabled': conf.odds[item.leopard + '_status'] == 0 }">
						<div class="triple-img">
							<img class="pair-img-item" :src="item.src" />
							<div class="img-bottom">
								<img class="pair-img-item" :src="item.src" />
								<img class="pair-img-item" :src="item.src" />
							</div>
						</div>
						<span>{{ conf.odds[item.leopard] }}</span>
					</div>
				</template>
				<div class="triple-item betting-tem" :class="{ 'disabled': timeClose }">
					<div class="triple-img"
						@click="conf.changeBet(conf.odds[conf.leopard_any + '_status'], 'share-0.webp', 'leopard_any', 'dice', 3)"
						:class="{ 'disabled': conf.odds[conf.leopard_any + '_status'] == 0 }">
						<img class="pair-img-item" src="/static/img/share-0.webp" />
						<div class="img-bottom">
							<img class="pair-img-item" src="/static/img/share-0.webp" />
							<img class="pair-img-item" src="/static/img/share-0.webp" />
						</div>
					</div>
					<span>{{ conf.leopard_any }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import sconfig from '@/sstore/sconfig';
import System from '@/utils/System';
import { reactive, watch } from 'vue';
const props = defineProps({
	poinits: {
		default: [] as any[]
	},
	shareList: {
		default: [] as any[]
	},
	oddsArr: {
		default: [] as any[]
	},
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
	getLotteryOdds(arr: any) {
		conf.lotteryOdds = arr
		arr.forEach((item: any) => {
			conf.odds[item.oddsCode] = parseFloat(item.odds)
			conf.odds[item.oddsCode + '_status'] = item.oddsStatus
		})
		conf.leopard_any = conf.odds.leopard_any
	},
	changeBet(status: any, n: any, adds: any, t = '', s=0) {
		if (!sconfig.userInfo) return System.router.push('/login')
		if (status == 0 || props.timeClose) return;
		conf.lotteryOdds.forEach((item:any) => {
			if (item.oddsCode == adds) {
				conf.addsItem = item
				return
			}
		})
		conf.addsItem['betImg'] = n
		conf.addsItem['betType'] = t || ''
		conf.addsItem['betNum'] = s || 0
		emit('changeBet', conf.addsItem)
	}
})
watch(
    () => props.oddsArr,
    (val) => {
		if (val.length > 0) conf.getLotteryOdds(val)
    },
	{ deep: true,immediate: true }
)
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

			text {
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