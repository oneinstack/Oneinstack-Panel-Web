<template>
  <div>
    <div class="search-view">
      <div class="search-select" :class="{ open }" @click="open = !open">
        <span>{{ inputValue }}</span>
      </div>
      <div class="search-btn" @click="handleSearch">{{ $t('uView.search.actionText') }}</div>
    </div>
    <transition name="slide-top" mode="out-in">
      <div v-if="open" class="search-panel">
        <div v-for="(item, key) in options" :key="key" class="search-type">
          <div class="label">{{ key === 'interval' ? $t('invite.SearchInterval') : $t('invite.Levels') }}</div>
          <div class="search-content">
            <div
              v-for="val in item"
              :key="val.label"
              class="search-item"
              :class="{
                active:
                  key === 'interval'
                    ? val.value === currentSelected.interval.value
                    : currentSelected.levels.includes(val) ||
                      (currentSelected.levels.some((v) => !v.value) && val.value === null),
                small: val.label.length > 10
              }"
              @click="handleSelect(key, val)"
            >
              {{ val.label }}
            </div>
          </div>
        </div>
        <div class="search-bottom">
          <span @click="handleReset">{{ $t('invite.cleanUp') }}</span>
          <span @click="handleSearch">{{ $t('uView.search.actionText') }}</span>
        </div>
      </div>
      <slot v-else />
    </transition>
  </div>
</template>

<script>
import useDateInterval from '../hooks/useDateInterval'

export default {
  model: {
    prop: 'value',
    event: 'update:value'
  },

  props: {
    value: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    open: {
      get() {
        return this.value
      },
      set(val) {
        if (!val) this.$emit('close')
        this.$emit('update:value', val)
      }
    },
    inputValue() {
      const levels = this.currentSelected.levels.sort((a, b) => a.value - b.value).map((item) => item.label)
      return [this.currentSelected.interval.label]
        .concat(levels)
        .filter((item) => item)
        .join(',')
    }
  },

  data() {
    return {
      options: {
        interval: useDateInterval(),
        levels: [
          {
            label: this.$t('invite.AllLevels'),
            value: null
          },
          {
            label: 'Lv.1',
            value: 1
          },
          {
            label: 'Lv.2',
            value: 2
          },
          {
            label: 'Lv.3',
            value: 3
          },
          {
            label: 'Lv.4',
            value: 4
          }
        ]
      },
      currentSelected: {
        interval: {
          label: this.$t('invite.AllDates'),
          value: null
        },
        levels: [
          {
            label: this.$t('invite.AllLevels'),
            value: null
          }
        ]
      }
    }
  },

  methods: {
    handleReset() {
      this.currentSelected = {
        interval: {
          label: this.$t('invite.AllDates'),
          value: null
        },
        levels: [
          {
            label: this.$t('invite.AllLevels'),
            value: null
          }
        ]
      }
      this.$emit('change', this.currentSelected)
      this.open = false
      this.$emit('reset')
    },

    handleSelect(type, item) {
      switch (type) {
        case 'interval':
          this.currentSelected.interval = item
          break

        case 'levels':
          if (!item.value) {
            this.currentSelected.levels = [
              {
                label: this.$t('invite.AllLevels'),
                value: null
              }
            ]
          } else if (this.currentSelected.levels.includes(item)) {
            this.currentSelected.levels = this.currentSelected.levels.filter((val) => val !== item)
          } else {
            this.currentSelected.levels = this.currentSelected.levels.filter((val) => val.value)
            this.currentSelected.levels.push(item)
          }
          break
      }
      this.$emit('change', this.currentSelected)
    },

    handleSearch() {
      if (this.open) this.open = false
      this.$emit('search')
    }
  }
}
</script>

<style scoped lang="less">
.slide-top-enter-active,
.slide-top-leave-active {
  transition: all 0.25s;
}

.slide-top-enter,
.slide-top-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.search-view {
  padding: 32rem 12rem;
  height: 112rem;
  border-bottom: 1px solid #f6f7fa;
  font-family: PingFang SC;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;

  .search-select {
    padding: 0 50rem 0 20rem;
    width: 492rem;
    height: 52rem;
    line-height: 48rem;
    border-radius: 10rem;
    background-color: #fff2e9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #fc9b01;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      right: 20rem;
      top: 24rem;
      border-left: 10rem solid transparent;
      border-right: 10rem solid transparent;
      border-top: 10rem solid #fc9b01;
      transition: transform 0.1s linear;
    }

    &.open {
      &::after {
        transform: rotate(180deg);
      }
    }

    span {
      font-size: 24rem;
      font-weight: 500;
    }
  }

  .search-btn {
    width: 138rem;
    height: 52rem;
    border-radius: 10rem;
    background: linear-gradient(328.56deg, #ff7502 18.81%, #fc9b01 77.66%);
    font-size: 28rem;
    font-weight: 500;
    line-height: 48rem;
    text-align: center;
    color: #fff;
  }
}

.search-panel {
  padding: 18rem 20rem;
  width: 100%;
  height: 620rem;
  background-color: #fff;
  border-radius: 10rem;

  .label {
    font-size: 28rem;
    font-weight: 500;
    color: #999;
    margin-bottom: 20rem;
  }

  .search-type {
    padding-bottom: 20rem;
    margin-bottom: 20rem;
    border-bottom: 1px solid #f6f7fa;
  }

  .search-content {
    display: flex;
    justify-content: flex-start;
    flex-flow: row wrap;
    gap: 16rem 12rem;

    .search-item {
      font-size: 28rem;
      width: 32%;
      height: 76rem;
      border: 1px solid transparent;
      border-radius: 8rem;
      background-color: #f9f9f9;
      text-align: center;
      line-height: 76rem;

      &.active {
        border: 1px solid #ff7502;
        background-color: #fff2e9;
        color: #ff7502;
      }

      &.small {
        font-size: 24rem;
      }
    }

    @media screen and (min-width: 500px) {
      .search-item {
        width: 32%;
      }
    }
  }

  .search-bottom {
    display: flex;
    justify-content: space-between;

    span {
      font-size: 36rem;
      font-weight: 600;
      background: linear-gradient(180deg, #eb602d 12%, #ffa64f 76%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}
</style>
