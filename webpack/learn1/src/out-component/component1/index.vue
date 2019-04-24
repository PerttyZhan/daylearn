<template>
  <div class="web-comp">
    <h1>{{name}}</h1>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        name: '模块1'
      }
    }
  }
</script>

<style scoped>
  .web-comp {
    width: 200px;
  }
</style>