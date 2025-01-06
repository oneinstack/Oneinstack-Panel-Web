<template>
	<div class="bet_record_filter">
		<div class="bet_record_filter_bar">
			<bet-record-filter-item v-for="(item, index) in conf.filters" :key="index" :isActive="item.isActive"
				:text="item.currentSelect.label" @change-active="conf.hanldeShowDropdown(item, item.isActive)" />
		</div>
		<div v-if="conf.isShowDropdown" class="bet_record_filter_dropdown">
			<!-- 下拉菜单内容 -->
			<div class="filter_button_container">
				<div class="scroll_wrap">
					<van-button v-for="item in activeFilter.options" :key="item.value" size="small"
						class="filter_button" :class="{ active: activeFilter.currentSelect.value === item.value }"
						@click="conf.hanldeFileter(item, true)">
						<span>{{ item.label }}</span>
					</van-button>
				</div>
			</div>
		</div>
		<div v-if="conf.isShowDropdown" class="mask_layer" @click="conf.hanldeShowDropdown(activeFilter, activeFilter.isActive)">
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import BetRecordFilterItem from './BetRecordFilterItem.vue'
import { Scope } from 'tools-vue3';

const emit = defineEmits(['filter'])
const mconf = Scope.getConf()
const conf = reactive({
	isShowDropdown: false, // 是否显示下拉菜单
	filters: [{
		isActive: false,
		currentSelect: {
			label: '',
			value: 1
		},
		options: [] as any[]
	},
	{
		isActive: false,
		currentSelect: {
			label: '',
			value: 1
		},
		options: []
	}
	],
	selectIndex: 0,
	async hanldeShowDropdown(item:any, active:any) {
		conf.filters.forEach((filter) => (filter.isActive = false)) // 重置其他选项为非激活
		item.isActive = !active
		conf.isShowDropdown = !active // 切换下拉菜单显隐
	},

	hanldeFileter(item:any, val:any) {
		if (item.data) {
			conf.filters[1].options = item.data.map((into:any) => {
				return {
					label: into.lotteryShowname,
					value: into.id,
					...into
				}
			})
			conf.filters[1].currentSelect = conf.filters[1].options[0]
		}
		if (val) {
			activeFilter.currentSelect = item
			activeFilter.isActive = false
			conf.isShowDropdown = false // 切换下拉菜单显隐
		}
		let obj = {
			typeId: conf.filters[0].currentSelect.value,
			playId: conf.filters[1].currentSelect.value,
			playName: conf.filters[1].currentSelect.label,
			lotteryTypeCode: mconf.lotteryList.find((into:any) => into.lotteryTypeVO.lotteryTypeId == conf.filters[0].currentSelect.value)?.lotteryTypeVO.lotteryTypeCode || ''
		}
		emit('filter', obj)
	}
})
onMounted(() => {
	console.log(mconf);
	
	conf.filters[0].options = mconf.lotteryList.map((item:any) => {
		return {
			label: item.lotteryTypeVO.lotteryTypeName,
			value: item.lotteryTypeVO.lotteryTypeId,
			data: item.lotteryVOList.map((v:any) => {
				v.lotteryName = item.lotteryTypeVO.lotteryTypeName
				return v
			})
		}
	})
	conf.filters[0].currentSelect = conf.filters[0].options[0]
	conf.hanldeFileter(conf.filters[0].options[0], false)
})
const activeFilter:any = computed(() => {
	console.log(conf.filters);
	
	return conf.filters.find((filter) => filter.isActive)
})
</script>

<style lang="less" scoped>
.bet_record_filter {
	position: relative;
}

.bet_record_filter_bar {
	width: 100%;
	display: flex;
	gap: 16rem;
	justify-content: space-between;
	align-items: center;
	padding: 18rem 24rem;
	background-color: #fff;
	position: relative;
	z-index: 999;
}

.bet_record_filter_dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	width: 100%;
	background-color: #fff;
	padding: 16rem;
	z-index: 999;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 95%;
		height: 2rem;
		background-color: #eee;
	}

	.filter_button_container {
		max-height: 500rem;
		overflow-y: scroll;
	}

	.scroll_wrap {
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16rem;
	}

	.filter_button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
		color: #000;
		font-size: 24rem;
		border-radius: 4rem;

		&.active {
			background: #0fc05f;
			color: #fff;
		}
	}
}

.mask_layer {
	position: fixed;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 90%;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 1;
}
</style>