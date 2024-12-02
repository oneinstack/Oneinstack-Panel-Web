<template>
	<x-page :no-footer="true">
		<template #title>
			{{ $t('consumptionDetails.titleName') }}
		</template>
		<!-- content -->
		<div class="content-div">
			<div class="top-content">
				<div class="type-div">
					<div class="type-name">{{ conf.divInfo.tradeTypeName || '' }}{{ conf.divInfo.firstRecharge == 1 ? ' (' +
						$t('wallet.FirstRecharge') + ')' : '' }}</div>
					<div class="type-value" v-if="conf.divInfo.recordMark == 1">

						{{ conf.divInfo.symbol + conf.divInfo.coinSymbol + ' ' + conf.divInfo.actualMoney || '--' }}
					</div>
					<div class="type-value" v-else>

						{{ conf.divInfo.coinSymbol == 'USDT' ? conf.divInfo.symbol + conf.divInfo.coinSymbol + ' ' + conf.divInfo.money
							:
							conf.divInfo.symbol + conf.divInfo.coinSymbol + conf.divInfo.money }}
					</div>
				</div>
				<div class="info-div">
					<div class="cu-form-group">
						<div class="info-title">{{ $t('consumptionDetails.TransactionStatus') }}</div>
						<span class="info-value"
							:class="{ 'green': conf.divInfo.tradeStatus == 1, 'red': conf.divInfo.tradeStatus == -1 }"
							style="color: #3C80F5;">{{ conf.divInfo.tradeStatusName || '--' }}</span>
					</div>
					<!-- 提现 -->
					<template v-if="conf.divInfo.tradeType == 2">
						<div class="cu-form-group">
							<div class="info-title">{{ $t('consumptionDetails.WithdrawalAmount') }}</div>
							<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.payCoin == 'USDT' ?
								sutil.numsub(conf.divInfo.money, conf.divInfo.premium) + ' ' + conf.divInfo.walletCoin :
								conf.divInfo.changeMoney + ' ' + conf.divInfo.walletCoin }}</span>
						</div>
						<div class="cu-form-group" v-if="conf.divInfo.tradeObjPaymentInfo.payCoin == 'USDT'">
							<div class="info-title">{{ $t('consumptionDetails.actualAmount') }}</div>
							<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.payCoin == 'USDT' ?
								conf.divInfo.changeMoney + ' ' + 'USDT' : conf.divInfo.changeMoney + ' ' +
								conf.divInfo.walletCoin }}</span>
						</div>
						<div class="cu-form-group">
							<div class="info-title">{{ $t('rechargeModule.ServiceCharge') }}</div>
							<span class="info-value">{{ conf.divInfo.premium + ' ' + conf.divInfo.walletCoin || '--' }}</span>
						</div>
						<!-- <div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentVendor')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.platformName || '--'}}</span>
						</div>
						<div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentChannel')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.appShowName || divInfo.tradeObjPaymentInfo.USDTAgreement || '--'}}</span>
						</div> -->
						<!-- 支付通道类型 -- BANK_CARD_PAYMENT -->
						<div v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'BANK_CARD_PAYMENT'">
							<div class="cu-form-group">
								<div class="info-title">{{ $t('addBankCradModule.BankCode') }}</div>
								<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.bankCode || '--' }}</span>
							</div>
							<div class="cu-form-group">
								<div class="info-title">{{ $t('addBankCradModule.BankNumber') }}</div>
								<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.bankCardNum || '--' }}</span>
							</div>
							<div class="cu-form-group">
								<div class="info-title">{{ $t('addBankCradModule.AccountName') }}</div>
								<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.bankCardUserName ||
									'--' }}</span>
							</div>
						</div>
						<!-- 支付通道类型 -- ONLINE_PAYMENT -->
						<div v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'ONLINE_PAYMENT'">
							<div class="cu-form-group">
								<div class="info-title">{{ $t('addBankCradModule.PaymentAddress') + '000' }}</div>
								<div class="info-value">
									<span>{{ conf.divInfo.tradeObjPaymentInfo.newOnlinePayUrl || '--' }}</span>
									<img class="copy-img" src="/static/img/copyImg.png"
										@click="conf.handleCopyCode(conf.divInfo.tradeObjPaymentInfo.onlinePayUrl)" />
								</div>
							</div>
							<div class="cu-form-group">
								<div class="info-title">{{ $t('addBankCradModule.AccountName') }}</div>
								<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.onlinePayName || '--' }}</span>
							</div>
						</div>
						<!-- 支付通道类型 -- SCAN_CODE_PAYMENT -->
						<div v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'SCAN_CODE_PAYMENT'">
							<div class="cu-form-group">
								<div class="info-title">{{ $t('addBankCradModule.AccountName') }}</div>
								<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.paymentName || '--' }}</span>
							</div>
						</div>
					</template>
					<!-- 充值 -->
					<template v-if="conf.divInfo.tradeType == 1">
						<!-- <div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentVendor')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.platformName || '--'}}</span>
						</div>
						<div class="cu-form-group">
							<div class="info-title">{{$t('addBankCradModule.PaymentChannel')}}</div>
							<span class="info-value">{{divInfo.tradeObjPaymentInfo.appShowName || '--'}}</span>
						</div> -->
						<div class="cu-form-group" v-if="conf.divInfo.tradeObjPaymentInfo.payDataType == 'USDT_PAYMENT'">
							<div class="info-title">{{ $t('consumptionDetails.ActualCollectionUSDT') }}</div>
							<span class="info-value">{{ conf.divInfo.changeMoney + ' USDT' || '--' }}</span>
						</div>

					</template>
					<!-- 汇率 -->
					<div class="cu-form-group" v-if="conf.divInfo.exchangeRateNum">
						<div class="info-title">{{ $t('rechargeModule.TransactionRate') }}</div>
						<span class="info-value">{{ conf.divInfo.exchangeRateNum || '--' }}</span>
					</div>
					<!-- 汇兑手续费 -->
					<div class="cu-form-group" v-if="conf.divInfo.exchangeSxf && conf.divInfo.exchangeSxf > 0">
						<div class="info-title">{{ $t('rechargeModule.ExchangeCharge') }}</div>
						<span class="info-value">{{ conf.divInfo.exchangeSxf + ' ' + conf.divInfo.walletCoin || '--' }}</span>
					</div>
					<!-- <div class="cu-form-group">
						<div class="info-title">{{$t('consumptionDetails.Coin')}}</div>
						<span class="info-value">{{divInfo.walletCoin || '--'}}</span>
					</div> -->
					<!-- 充值 -->
					<template v-if="conf.divInfo.tradeType == 1">
						<div class="cu-form-group">
							<div class="info-title">{{ $t('rechargeModule.PaymentInformation') }}</div>
							<div class="info-value">
								<span>{{ conf.divInfo.tradeObjPaymentInfo.userName || '--' }}</span>
								<img class="copy-img" src="/static/img/copyImg.png"
									@click="conf.handleCopyCode(conf.divInfo.tradeObjPaymentInfo.userName)" />
							</div>
						</div>
						<div class="cu-form-group">
							<div class="info-title">{{ $t('rechargeModule.PaymentNote') }}</div>
							<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.userRemark || '--' }}</span>
						</div>

					</template>
					<!--提现 -> 异常订单 -->
					<template v-if="conf.divInfo.recordMark == 1">
						<div class="cu-form-group">
							<div class="info-title">{{ $t('rechargeModule.transactionAmount') }}</div>
							<span class="info-value">{{ conf.divInfo.coinSymbol + ' ' + conf.divInfo.money || '--' }}</span>
						</div>
						<div class="cu-form-group">
							<div class="info-title">{{ $t('rechargeModule.AmountReceived') }}</div>
							<span class="info-value">{{ conf.divInfo.coinSymbol + ' ' + conf.divInfo.actualMoney || '--'
								}}</span>
						</div>

						<div class="cu-form-group">
							<div class="info-title">{{ $t('rechargeModule.AbnormalRemarks') }}</div>
							<span class="info-value">{{ conf.divInfo.tradeObjPaymentInfo.recordMarkNotes || '--' }}</span>
						</div>

					</template>
					<div class="cu-form-group">
						<div class="info-title">{{ $t('consumptionDetails.BilINo') }}</div>
						<span class="info-value">{{ conf.divInfo.billNo || '--' }}</span>
					</div>
					<div class="cu-form-group" v-if="conf.divInfo.remark">
						<div class="info-title">{{ $t('consumptionDetails.Remark') }}</div>
						<span class="info-value">{{ conf.divInfo.remark || '--' }}</span>
					</div>
					<div class="cu-form-group">
						<div class="info-title">{{ $t('consumptionDetails.TradeTime') }}</div>
						<span class="info-value">{{ conf.divInfo.tradeTime || '--' }}</span>
					</div>
				</div>
			</div>
		</div>
	</x-page>
</template>
<script setup lang="ts">
import i18n from '@/lang';
import sutil from '@/sstore/sutil';
import System from '@/utils/System';
import { onMounted, onUnmounted, reactive } from 'vue';

const conf = reactive({
	divInfo: {} as any,
	tradeStatusList: [{
		name: i18n.t('otcOrderModule.statusList[2]'),
		value: -1
	},
	{
		name: i18n.t('consumptionDetails.trading'),
		value: 0
	},
	{
		name: i18n.t('otcOrderModule.statusList[1]'),
		value: 1
	},
	{
		name: i18n.t('consumptionDetails.BeingProcessed'),
		value: 3
	},
	{
		name: i18n.t('consumptionDetails.expired'),
		value: 4
	}
	],
	//复制
	async handleCopyCode(val:any) {
		await StrUtil.copyText(val)
		System.toast(i18n.t('invite.CopySuccessful'), 'success')
	}
})
const init = () => {
	conf.divInfo = Cookie.get('DetailViewInfo') //取出缓存数据
	
	//计算汇率
	let tradeObjPaymentInfo = JSON.parse(conf.divInfo.tradeObjPaymentInfo)
	conf.divInfo.exchangeRateNum = null
	if (tradeObjPaymentInfo.changeExchangeRate) {
		//当前
		let curren = Number(tradeObjPaymentInfo.walletExchangeRate)
		//目标
		let change = Number(tradeObjPaymentInfo.changeExchangeRate)
		let num:any = sutil.division(change, curren, false)
		let numTotal = parseFloat(num)
		num = tradeObjPaymentInfo.walletCoin == "IDR" ? sutil.formatNumber(numTotal, 5) : sutil.formatNumber(numTotal)
		if (conf.divInfo.tradeType == 1 && (tradeObjPaymentInfo.changeWalletCoin == "USDT" || tradeObjPaymentInfo.walletCoin == "USDT")) {
			conf.divInfo.exchangeRateNum = tradeObjPaymentInfo.walletCoin + '/' + tradeObjPaymentInfo.changeWalletCoin + ' ' + num
		} else if (conf.divInfo.tradeType == 4 || conf.divInfo.tradeType == 5) {
			conf.divInfo.exchangeRateNum = tradeObjPaymentInfo.walletCoin + '/' + tradeObjPaymentInfo.changeWalletCoin + ' ' + num
		}
	}

	// USDT提现
	if (conf.divInfo.tradeType == 2 && tradeObjPaymentInfo.payCoin == "USDT") {
		let num:any = sutil.division(conf.divInfo.changeExchangeRate, conf.divInfo.walletExchangeRate, false)
		let numTotal = parseFloat(num)
		num = conf.divInfo.walletCoin == "IDR" ? sutil.formatNumber(numTotal, 5) : sutil.formatNumber(numTotal)
		conf.divInfo.exchangeRateNum = conf.divInfo.walletCoin + '/' + 'USDT' + ' ' + num
	}

	if (conf.divInfo?.tradeObjPaymentInfo) {
		conf.divInfo.tradeObjPaymentInfo = JSON.parse(conf.divInfo?.tradeObjPaymentInfo) || ''
		if (conf.divInfo.tradeObjPaymentInfo.onlinePayUrl) {

			let str = conf.divInfo.tradeObjPaymentInfo.onlinePayUrl
			conf.divInfo.tradeObjPaymentInfo.newOnlinePayUrl = str.substr(0, 3) + '***' + str.substr(str.split('')
				.length - 3, str.split('').length)
		}
	} else {
		conf.divInfo.tradeObjPaymentInfo = ''
	}

	// tradeType == 1 => 充值状态
	if (conf.divInfo.tradeType == 1) {
		if (conf.divInfo.tradeStatus == 2 || conf.divInfo.tradeStatus == 0 || conf.divInfo.tradeStatus == 4 ||
			conf.divInfo.tradeStatus == 3 || conf.divInfo.tradeStatus == 5 || conf.divInfo.tradeStatus == 7) {
			conf.divInfo.tradeStatusName = i18n.t('consumptionDetails.trading')
		} else if (conf.divInfo.tradeStatus == 1) {
			conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[1]')
		} else if (conf.divInfo.tradeStatus == 1 && conf.divInfo.recordMark == 1) {
			conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.dispute')
		}
		else {
			conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[2]')
		}
	} else if (conf.divInfo.tradeType == 2) { // tradeType == 2 => 提现状态
		if (conf.divInfo.tradeStatus == 0 || conf.divInfo.tradeStatus == 2 || conf.divInfo.tradeStatus == 3 ||
			conf.divInfo.tradeStatus == 4 || conf.divInfo.tradeStatus == 5) {
			conf.divInfo.tradeStatusName = i18n.t('consumptionDetails.trading')
		} else if (conf.divInfo.tradeStatus == 1) {
			conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[1]')
		} else {
			conf.divInfo.tradeStatusName = i18n.t('otcOrderModule.statusList[2]')
		}
	} else {
		conf.divInfo.tradeStatusName = conf.tradeStatusList.find(item => item.value == conf.divInfo.tradeStatus)
			?.name || ''
	}

	if (Number(conf.divInfo.tradeExamineStatus) == 0) {
		conf.divInfo.tradeExamineStatusName = i18n.t('consumptionDetails.InProgress')
	} else {
		conf.divInfo.tradeExamineStatusName = conf.tradeStatusList.find(item => item.value == conf.divInfo
			.tradeExamineStatus)?.name || ''
	}
}
onMounted(() => {
	init()
})
onUnmounted(() => {
	Cookie.remove('DetailViewInfo') //销毁缓存数据
})
</script>

<style lang="less" scoped>
.content-div {
	height: auto;

	.top-content {
		background: #fff;
	}
}

.type-div {
	text-align: center;
	border-bottom: #DCDCDC30 2rem solid;
	padding: 50rem 0rem;
	font-size: 32rem;
	font-weight: 500;
	color: #000000;

	.type-name {
		opacity: 0.8;
	}

	.type-value {
		margin-top: 20rem;
		font-size: 48rem;
	}
}

.info-div {
	padding: 30rem;
	width: 100%;

	.cu-form-group {
		padding: 20rem;
		color: #A8A8A8;
		font-size: 32rem;
		min-height: 60rem;
		width: 100%;
		border-bottom: #DCDCDC 1px dashed;
		align-items: self-start;

		// justify-content: flex-start !important;
		// .title {
		// 	// white-space: nowrap !important;
		// 	white-space: pre-wrap !important;
		// 	padding-right: 10rem !important;
		// 	width: 35%;
		// 	background: yellow;
		// }
		.info-title {
			// margin-left: 10rem;
			// color: #373737;
			width: 45%;
			padding-right: 10rem !important;
			// background: yellow;
			// text-align: right;
		}

		.info-value {
			margin-left: 10rem;
			color: #373737;
			width: 55%;
			// background: red;
			text-align: right;
			word-wrap: break-word !important;
		}
	}

	.cu-form-group+.cu-form-group {
		border-top: none !important;
	}

}

.service-div {
	margin-top: 20rem;
	padding: 30rem;
	background: #fff;
	color: #000000 !important;
	font-weight: 500;

	.service-name {
		font-size: 32rem;
	}

	.service-info {
		margin-top: 30rem;
		font-size: 24rem;
		color: #000000;
		opacity: 0.6;

		.cuIcon-questionfill {
			padding-right: 10rem;
			font-size: 22rem;
		}
	}

}

.blue {
	color: #3C80F5 !important;
}

.green {
	color: #2AA855 !important;
}

.red {
	color: #E20000 !important;
}

.copy-img {
	width: 28rem;
	height: 28rem;
	margin-left: 20rem;
	color: #EB602D;
}
</style>