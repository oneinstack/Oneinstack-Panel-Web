<template>
    <div class="no-data">
        <img src="/static/theme/black/bonus/empty-no.png" />
        <span>There is no data yet!</span>
    </div>
</template>
<script setup lang="ts">

</script>
<style lang="less" scoped>
.no-data {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    img {
        height: 270rem;
    }

    span {
        font-size: 24rem;
        color: #fff;
        margin-top: 40rem;
    }
}
</style>