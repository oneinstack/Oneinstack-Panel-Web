<template>
    <div class="item">
        <div class="avatar-img">
            <headImg :src="getAvatarUrl" />
        </div>
        <div class="item_content">
            <div class="left_info">
                <div>{{ getShowName }}</div>
                <div class="message">
                    <van-text-ellipsis rows="1" :content="application.reqMsg || ''" expand-text="展开" />
                </div>
            </div>
            <div class="right_status">
                <span v-if="showStateStr">{{ getStateStr }}</span>
                <span v-if="showGreet" @click.stop="conf.greetToUser" style="color: #07c261;">{{ $t('chatRoom.GreetSb')
                    }}</span>
                <div style="display: flex;align-items: center;">
                    <van-button v-if="showAccept" style="background: #ededed;" type="success"
                        @click.stop="conf.acceptApplication" plain size="small" :loading="conf.accessLoading">
                        {{ isGroupApplication ? $t('chatRoom.Agree') : $t('chatRoom.Accept') }}
                    </van-button>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import i18n from '@/lang';
import { computed, onMounted, reactive } from 'vue';
import IMSDK, { SessionType } from "openim-uniapp-polyfill";
import System from '@/utils/System';
import cscontact from '@/modules/chat/sstore/cscontact';
import headImg from '../../components/headImg.vue';
import { navigateToDesignatedConversation } from '@/modules/chat/utils/cUtil';
const props = defineProps({
    application: {
        default: {} as any
    },
    isRecv: {
        default: false
    }
})

const conf = reactive({
    accessLoading: false,
    clickItem() {
        if (showAccept) {
            // uni.navigateTo({
            //   url: `/chatRoom/contact/applicationDetails/index?application=${JSON.stringify(
            //     this.application,
            //   )}`,
            // });
        } else {
            let sourceID =
                props.application.groupID ??
                (props.isRecv
                    ? props.application.fromUserID
                    : props.application.toUserID);
            let cardType = isGroupApplication.value ? "groupCard" : "userCard";
            const url = `/chatRoom/common/${cardType}/index?sourceID=${sourceID}`;
            // uni.navigateTo({
            //   url,
            // });
        }
    },
    acceptApplication() {
        conf.accessLoading = true;
        let func;
        if (isGroupApplication.value) {
            func = IMSDK.asyncApi(
                IMSDK.IMMethods.AcceptGroupApplication,
                IMSDK.uuid(),
                {
                    groupID: props.application.groupID,
                    fromUserID: props.application.userID,
                    handleMsg: "",
                },
            );
        } else {
            func = IMSDK.asyncApi(
                IMSDK.IMMethods.AcceptFriendApplication,
                IMSDK.uuid(),
                {
                    toUserID: props.application.fromUserID,
                    handleMsg: "",
                },
            );
        }
        func
            .then(() => {
                System.toast(i18n.t('chatRoom.SuccessfulOperation'), 'success')
                props.application.handleResult = 1
            })
            .catch(() => System.toast(i18n.t('chatRoom.OperationFailure')))
            .finally(() => (this.accessLoading = false));
    },
    greetToUser() {
        navigateToDesignatedConversation(
            props.application[props.isRecv ? "fromUserID" : "toUserID"],
            SessionType.Single,
        ).catch(() => System.toast(i18n.t('chatRoom.DescriptionFailed')));
    },
})

const isGroupApplication = computed(() => {
    return props.application.groupID !== undefined;
})
const getShowName = computed(() => {
    if (props.isRecv) {
        return props.application[
            isGroupApplication.value ? "nickname" : "fromNickname"
        ];
    }
    return props.application[
        isGroupApplication.value ? "groupName" : "toNickname"
    ];
})
const showGreet = computed(() => {
    return !isGroupApplication.value && props.application.handleResult === 1;
})
const showStateStr = computed(() => {
    if (
        (props.isRecv && props.application.handleResult === 0) ||
        showGreet
    ) {
        return false;
    }
    return true;
})
const showAccept = computed(() => {
    return props.application.handleResult === 0 && props.isRecv;
})
const getStateStr = computed(() => {
    if (props.application.handleResult === -1) {
        return i18n.t('chatRoom.Declined');
    }
    if (props.application.handleResult === 0) {
        return i18n.t('chatRoom.PendingVerification');
    }
    return i18n.t('chatRoom.Agreed');
})
const getAvatarUrl = computed(() => {
    if (isGroupApplication.value) {
        return props.application.groupFaceURL;
    }
    return props.application[props.isRecv ? "fromFaceURL" : "toFaceURL"];
})
onMounted(() => {
    console.log(cscontact.recvFriendApplications);
})
</script>
<style lang="less" scoped>
.item {
    padding: 20rem 0rem 0rem 30rem;
    display: flex;

    .avatar-img {
        width: 80rem;
        height: 80rem;
        border-radius: 8rem;
        overflow: hidden;
    }

    .item_content {
        flex: 1;
        margin-left: 16rem;
        display: flex;
        justify-content: space-between;
        border-bottom: 2rem #F6F7FA solid;
        padding-bottom: 10rem;
        padding-right: 30rem;

        .left_info {
            color: #333;
            font-size: 30rem;
            width: 100%;

            .message {
                width: 75%;
                color: #666;
                font-size: 26rem;
                margin-top: 2rem;
                font-weight: normal;
            }
        }

        .right_status {
            flex-shrink: 0;
            color: #666;
            font-size: 26rem;
        }
    }
}

.van-button--success {
    border: none;
}

.van-button--small {
    height: 55rem;
}
</style>
