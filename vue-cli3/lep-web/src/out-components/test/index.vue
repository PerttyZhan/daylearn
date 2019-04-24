<template>
  <div class="async-component">
    <h1>{{title}}</h1>
  </div>
</template>

<script>
export default {
  name: 'test',
  data () {
    return {
      title: '测试模块'
    }
  }
}
</script>

<style scoped>
  .async-component {
    width: 100%;
    height: 200px;
    background: red;
  }
</style>
