<template>
	<x-page :no-footer="true" :bgcolor="'#eff1f5'">
		<template #title>
			{{ $t('scratch.scratch') }}
		</template>
		<template #right>
			<div class="right-content">
				<div class="right-text">{{ $t('wallet.balance') }}</div>
				<div class="right-icon">{{ conf.walletMoney }}</div>
			</div>
			<img class="wallet-img" src="/static/img/wallet.webp" />
		</template>
		<div class="main-img">
			<img src="/static/img/home-banner.png" />
		</div>
		<div class="nav-list-box">
			<div class="nav-title">
				<div class="offs">{{ $t('scratch.scratchOffs') }}</div>
				<div class="history" @click="conf.goHisTory">
					<img class="history-img" src="/static/img/history.png" />
					<span>{{ $t('scratch.history') }}</span>
				</div>
			</div>
			<div class="num-list">
				<div class="num-item" :class="{ 'num-active': conf.price == '' }" @click="conf.changePrice('')">
					{{ $t('scratch.all') }}</div>
				<template v-for="item in conf.typeList">
					<div class="num-item" :class="{ 'num-active': conf.price == item.scratchTicketPrice }"
						@click="conf.changePrice(item.scratchTicketPrice)">{{ item.newScratchTicketPrice }}</div>
				</template>
			</div>
			<div class="select-box">
				<div class="select-item" :class="{ 'active': conf.priceType == 0 }" @click="conf.changeType(0)">
					{{ $t('scratch.prizeAmount') }}
					<div class="select-img">
						<div class="select-up" :style="{ background: conf.prizeAsc == 1 ? '#CF0000' : '' }"></div>
						<div class="select-down" :style="{ background: conf.prizeAsc == 0 ? '#CF0000' : '' }"></div>
					</div>
				</div>
				<div class="select-item" style="margin-right: 0rem;" :class="{ 'active': conf.priceType == 1 }"
					@click="conf.changeType(1)">
					{{ $t('scratch.price') }}
					<div class="select-img">
						<div class="select-up" :style="{ background: conf.priceAsc == 1 ? '#CF0000' : '' }"></div>
						<div class="select-down" :style="{ background: conf.priceAsc == 0 ? '#CF0000' : '' }"></div>
					</div>
				</div>
			</div>
		</div>
		<div class="scratch">
			<div class="scratch-title">
				<div class="title">{{ $t('scratch.ywiw') }}</div>
				<div class="tips-item">{{ $t('scratch.wmshb') }}</div>
				<div class="tips-item">{{ $t('scratch.ctabt') }}</div>
				<div class="tips-item">{{ $t('scratch.ewms') }}</div>
			</div>
			<div class="scratch-list">
				<template v-for="(item, index) in conf.scratchList" :key="index">
					<div class="scratch-item" @click="conf.goPurchase(item)">
						<div class="item-img">
							<scratch-img :item="item" :paddingNum="28"></scratch-img>
						</div>
						<div class="item-content">
							<div>
								<img class="heat-img" src="/static/img/scratch-heat.png" />{{ conf.coinSymbol +
									item.newScratchTicketPrice }}
							</div>
						</div>
					</div>
				</template>
			</div>
			<div class="no-data">{{ $t('user.noMore') }}</div>
		</div>
	</x-page>
</template>

<script setup lang="ts">
import { svalue } from '@/sstore/svalue'
import scratchImg from './components/scratchImg.vue'
import { onMounted, reactive } from 'vue';
import System from '@/utils/System';
import { apis } from '@/api';
import sutil from '@/sstore/sutil';
import sconfig from '@/sstore/sconfig';
const conf = reactive({
	price: '',
	prizeAsc: 0,
	priceAsc: -1 as any,
	priceType: 0,
	scratchList: [] as any[],
	coinSymbol: '',
	typeList: [] as any[],
	defaultCoin: {} as any,
	defaultWalletInfo: {} as any,
	walletMoney: '-',
	goPurchase(item: any) {
		System.router.push('/user/scratch/purchase?id=' + item.id)
	},
	changePrice(num: any) {
		conf.price = num
		conf.getScratchTicketlList()
	},
	changeType(type: any) {
		conf.priceType = type
		if (type == 0) {
			conf.priceAsc = ''
		}
		if (type == 1) {
			conf.prizeAsc = -1
			conf.priceAsc == 0 ? conf.priceAsc = 1 : conf.priceAsc = 0
		}
		conf.getScratchTicketlList()
	},
	getScratchTicketlList() {
		System.loading()
		apis.scratchTicketlList({
			price: conf.price,
			priceAsc: conf.priceAsc,
			prizeAsc: conf.prizeAsc,
			success: (res: any) => {
				conf.scratchList = res.data
				conf.coinSymbol = conf.defaultWalletInfo.coinSymbol
				conf.scratchList?.forEach((item: any) => {
					if (conf.defaultCoin.coinCode != conf.defaultWalletInfo.walletCoin) {
						let moneyResult = sutil.division(sutil.Mul(item.scratchTicketPrice, conf.defaultWalletInfo.coinTousdt), conf.defaultCoin.coinTousdt, false)
						let num = parseFloat(moneyResult)
						item.newScratchTicketPrice = sutil.formatNumber(num)
					} else {
						item.newScratchTicketPrice = parseFloat(item.scratchTicketPrice)
					}
				})

				if (!conf.price) {
					conf.typeList = conf.scratchList
				}
			},
			final: () => {
				System.loading(false)
			}
		});
	},
	getFixed(num: any) {
		if (!num) return '-';
		let n = parseFloat(num)
		return n.toFixed(2)
	},
	goHisTory() {
		let userInfo = sconfig.userInfo
		if (userInfo && userInfo.userId) {
			System.router.push('/user/scratch/history')
		} else {
			System.router.replace('/login')
		}
	}
})
onMounted(async () => {
	let coinlist = await svalue.getCoinlist()
	conf.defaultCoin = coinlist.find((item: any) => item.isDefault)

	if (!sconfig.userInfo) return conf.walletMoney = '-'
	let item = await svalue.getDefaultWallet()
	conf.defaultWalletInfo = item
	if (item.hasOwnProperty('coinSymbol')) {
		conf.defaultWalletInfo = item
		let m = parseFloat(item.walletMoney)
		conf.walletMoney = (item.coinSymbol || '₹') + sutil.dataHandling(m)
	}
	conf.getScratchTicketlList()
})
</script>

<style lang="less" scoped>
.right-content {
	text-align: right;
	letter-spacing: -0.3px;
	font-size: 22rem;
}

.wallet-img {
	width: 72rem;
	height: 72rem;
	margin-right: 20rem;
}

.main-img {
	width: 100%;
	height: 638rem;
	padding: 20rem 0rem;

	img {
		width: 100%;
		height: 100%;
		border-radius: 10rem;
	}
}

.nav-list-box {
	position: sticky;
	top: 105rem;
	left: 0;
	background: #fff;
	padding: 22rem 0rem;
	z-index: 1;
	border-radius: 10rem 10rem 0px 0px;
	background: linear-gradient(180deg, #FFF0D9 0%, rgba(255, 255, 255, 1) 33.85%);

	.nav-title {
		border-radius: 12rem 12rem 0 0;
		padding: 0rem 30rem;
		height: 88rem;
		display: flex;
		// flex-direction: column;
		justify-content: space-between;
		align-items: center;

		.offs {
			color: #cf0000;
			font-weight: 800;
			font-size: 32rem;
		}

		.history {
			color: #EB602D;
			font-weight: 600;
			font-size: 24rem;
			display: flex;
			align-items: center;

			.history-img {
				width: 21rem;
				height: 27rem;
				margin-right: 8rem;
			}
		}

		.main {
			width: 52rem;
			height: 8rem;
			border-radius: 12rem;
			background: #cf0000;
			margin-top: 12rem;
		}
	}

	.num-list {
		color: #333;
		font-size: 24rem;
		height: 50rem;
		margin: 32rem 30rem;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.num-item {
			background: #FFE8C0;
			font-weight: 500;
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;

			&.num-active {
				height: 58rem;
				background: #cf0000;
				border-radius: 8rem;
				font-weight: 700;
				color: #FFF;
			}
		}
	}

	.select-box {
		display: flex;
		justify-content: center;

		.select-item {
			display: flex;
			justify-content: center;
			align-items: center;
			padding: 0rem 10rem;
			height: 48rem;
			border-radius: 10rem;
			border: 2rem solid #CFCFCF;
			color: rgba(00, 00, 00, 0.7);
			font-size: 20rem;
			margin-right: 24rem;

			.select-img {
				margin-left: 10rem;
				height: 100%;
				display: flex;
				flex-direction: column;
				justify-content: center;

				.select-up {
					clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
					background: #909090;
					width: 12rem;
					height: 6rem;
				}

				.select-down {
					clip-path: polygon(0% 0%, 50% 100%, 100% 0%);
					background: #909090;
					width: 12rem;
					height: 6rem;
					margin-top: 5rem;
				}
			}

			&.active {
				border: 2rem solid #CF0000;
			}
		}
	}
}

.scratch {
	background: linear-gradient(180deg, #FFF0D9 0%, rgba(255, 255, 255, 0.00) 33.85%);
	padding-bottom: 80rem;

	.scratch-title {
		text-align: center;
		color: #000;
		font-weight: 600;
		padding-top: 26rem;

		.title {
			font-size: 32rem;
			margin-bottom: 10rem;
		}

		.tips-item {
			font-size: 22rem;
			opacity: 0.6;
			margin-top: 6rem;
		}
	}

	.scratch-list {
		padding: 0rem 30rem;
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		margin-top: 30rem;

		.scratch-item {
			width: 48%;
			border-radius: 10rem;
			background: #FFF;
			box-shadow: 4rem 4rem 8rem 0px rgba(0, 0, 0, 0.05);
			padding: 12rem;
			margin-top: 24rem;

			.item-img {
				width: 100%;
				height: 340rem;
				border-radius: 10rem;
			}

			.item-content {
				text-align: center;
				// display: flex;
				// justify-content: space-between;
				// align-items: center;
				margin-top: 10rem;
				color: #000;
				font-weight: 600;
				font-size: 24rem;

				.heat-img {
					width: 22rem;
					height: 20rem;
					margin-right: 6rem;
				}

				// .item-heat{
				// 	font-size: 21rem;
				// 	color: rgba(00, 00, 00, 0.5);
				// 	.heat-img{
				// 		width: 22rem;
				// 		height: 20rem;
				// 	}
				// }
			}
		}
	}

	.no-data {
		color: #000;
		font-size: 28rem;
		font-weight: 500;
		opacity: 0.3;
		text-align: center;
		margin-top: 40rem;
	}
}
</style>