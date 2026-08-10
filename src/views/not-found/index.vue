<template>
  <section class="not-found">
    <div class="not-found__halo not-found__halo--left"></div>
    <div class="not-found__halo not-found__halo--right"></div>
    <div class="not-found__card">
      <div class="not-found__code">404</div>
      <h1>{{ $t('notFound.title') }}</h1>
      <p>{{ $t('notFound.description') }}</p>
    </div>
  </section>
</template>

<style scoped lang="less">
.not-found {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(var(--primary-color), 0.16), transparent 34%),
    linear-gradient(180deg, #081120 0%, #0f172a 100%);
}

.not-found__halo {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 999px;
  filter: blur(42px);
  opacity: 0.5;

  &--left {
    top: -140px;
    left: -100px;
    background: rgba(var(--primary-color), 0.28);
  }

  &--right {
    right: -120px;
    bottom: -180px;
    background: rgba(59, 130, 246, 0.2);
  }
}

.not-found__card {
  position: relative;
  z-index: 1;
  width: min(100%, 520px);
  padding: 56px 40px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  text-align: center;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.76);
  box-shadow: 0 32px 90px rgba(8, 15, 31, 0.42);
  backdrop-filter: blur(14px);

  h1 {
    margin: 0;
    font-size: 34px;
    font-weight: 720;
    letter-spacing: -0.04em;
  }

  p {
    margin: 14px 0 0;
    color: #94a3b8;
    font-size: 15px;
    line-height: 1.8;
  }
}

.not-found__code {
  margin-bottom: 16px;
  color: var(--primary-color-light);
  font-size: 76px;
  font-weight: 820;
  letter-spacing: 0.08em;
}
</style>
