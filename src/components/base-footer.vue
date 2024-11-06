<script setup></script>

<template>
  <footer class="base-footer-conainer">
    <div class="copyright">
      Copyright © 2023 JDB Just Do The Best ALL RIGHTS RESERVED.
    </div>
  </footer>
</template>

<style scoped lang="scss">
.base-footer-conainer {
  background-color: #0f0d08;
  width: 100%;
  --bs-gutter-x: 1.5rem;
  --bs-gutter-y: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: calc(-1 * var(--bs-gutter-y));
  margin-right: calc(-0.5 * var(--bs-gutter-x));
  margin-left: calc(-0.5 * var(--bs-gutter-x));

  .copyright {
    padding: 24px;
    width: 1320px;
    border-top: 1px solid rgba(255, 255, 255, 0.24);
    color: #fff9;
    line-height: 180%;
    font-size: 0.875rem;
    font-weight: 300;
  }
}
</style>
