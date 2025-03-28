<template>
  <div class="box">
    <div class="lineOrange" style="margin-top: 20px; margin-right: 2%;" />
    <el-collapse v-model="activeNames" @change="handleChange" class="coll">
      <el-collapse-item :title="t('management')" name="1" :icon="CaretRight">
        <div class="text">
          <div class="text-left">
          </div>
          <div class="text-right">
            <div class="text-right-top"><span>{{ t('management') }}</span></div>
            <div class="text-right-center"><span>{{ t('Nologinrequired') }}</span></div>
            <el-button type="primary" class="custom-buttons">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <img src="/public/images/dowon.png" alt="" class="custom-icon" />
                {{t('download')}}
              </div>
            </el-button>
            <div class="text-right-bottom">({{ t('CorrespondingDownloadVersion') }})</div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
  <div class="box">
    <div class="lineOrange" style="margin-top: 20px; margin-right: 2%;" />
    <el-collapse v-model="activeNames" @change="handleChange" class="coll">
      <el-collapse-item :title="t('installationScript')" name="2" :icon="CaretRight">
        <div class="editiontwo">
          <div class="edition-bottom" style="color: #515151; font-weight: bold; "><span>{{ t('sshTool') }}</span></div>
        </div>
        <div class="rund">
          <div class="w25 pr15">
            <div class="text-right-top ma-bottom0">{{ t('MasterInstallationScript') }}</div>
            <div class="text-right-bottom">({{ t('ControlledScript') }})</div>
          </div>
          <div class="string">
            <span>{{text}}</span>
          </div>
          <el-button type="primary" class="custom-buttons ones">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <img src="/public/images/copy.png" alt="" class="custom-iconcopy" />
              {{ t('copy') }}
            </div>
          </el-button>

        </div>
      </el-collapse-item>
    </el-collapse>
  </div>

  <div class="box">
    <div class="lineOrange" style="margin-top: 20px; margin-right: 2%;" />
    <el-collapse v-model="activeNames" @change="handleChange">
      <el-collapse-item title="Oneinstack APP" name="3" :icon="CaretRight" class="coll">
        <div class="app-content">
          <div class="app-screenshot">
            <img src="../../public/images/phone.png" alt="Oneinstack APP Screenshot" />
          </div>
          <div class="app-qr">
            <div class="qr-title">
              <img src="../../public/images/logomini.png" alt="" />
              <div class="qr-text">
                <h2>Oneinstack APP</h2>
                <div class="fz24 qr-text-color">{{ t('phoneManagement') }}</div>
              </div>
            </div>
            <div class="qr-code">
              <img src='../../public/images/code.png' alt="QR Code" />
              <p>{{ t('ScanCodeDownload') }}</p>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>

</template>

<script setup>
  import {
    useI18n
  } from 'vue-i18n'
  import {
    ref
  } from 'vue';
  import {
    CaretRight
  } from '@element-plus/icons-vue'
  const {
    t
  } = useI18n()
  const activeNames = ref([]); // 绑定当前展开的面板名称

  const handleChange = (value) => {
    activeNames.value = value; // 更新当前选中的面板名称
  };

  const text = ref(
    'if [ -f /usr/bin/curl ];then curl -sSO https://download.bt.cn/install/install_btmonitor.sh;else wget -O install_btmonitor.sh https://download.bt.cn/install/install_btmonitor.sh;fi;bash install_btmonitor.sh'
  )
</script>

<style scoped lang="scss">
  @import url('../styles/css/game.scss');
  @import url('../styles/css/line.css');
  @import url('../styles/css/cos.css');

  .rund{
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    margin-top: 40px;
  }

  .ones{
    width: 181px;
    height: 69px;
  }

  .text {
    width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    margin-top: 50px;
  }

  @media(max-width: 961px) {

    .rund{
      width: 100%;
      height: auto;
      display: flex;
      align-items: center;
      flex-flow: column;
      margin-top: -1px;
    }

    .text-right-bottom {
      margin: 12px 0 10px 0;
      font-size: 14px;
      font-weight: bold;
      color: #a7a7a7;
      text-align: center;
    }
    .custom-buttons{
      margin-top: 0px;
    }
    .text-right-top{
      font-size: 24px;
      margin: 22px 0;
      text-align: center;
     }
     .text-right-center {
      font-size: 14px;
      margin-bottom: 10px;
     }
    .text-right {
      display: flex;
      margin-left: 0px;
      flex-flow: column;
      flex: 1;
      align-items: center;
      margin-top: 10px;
     }
    .text{
      width: 100%;
      flex-flow: column;
    }
    .text-left{
      width: 304px;
      height: 250px;
    }
    .box {
      display: flex;
      padding-top: 22px;
    }
    .string{
      padding: 20px;
      margin-right: 0;
      display: -webkit-box;
      align-items: center;
      width: 80%;
      height: 100%;
      background-color: #F9F6F0;
      color: #616161;
      font-size: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-all;
    }
    .editiontwo {
      font-size: 20px;
      margin-top: 20px;
    }
    .w25 {
      width: 100%;
     }
     .ones{
      margin-top: 40px;
     }
     .app-content{
      flex-flow: column;
     }
     .app-screenshot{
      display: flex;
      justify-content: center;
     }
     .app-screenshot img{
      width: 345px;
      margin-bottom: 15px;
     }
     .app-qr{
      margin-left:0;
     }
     .qr-title{
      flex-flow: column;
      align-items: center;
      margin-bottom: 20px;
     }
     .qr-text{
      margin: 10px 0 10px 0;
     }
     .qr-text h2{
      font-size: 24px;
      text-align: center;
     }
     .fz24 {
      font-size: 20px;
      text-align: center;
    }
    ::v-deep(.el-collapse-item__header){
      line-height: 22px;
      text-align: left;
    }

  }

</style>
