<template>
  <router-view :key="$route.fullPath" />
</template>

<script>
// import { useRoute } from "vue-router";
// const route = useRoute();
export default {
  name: 'App',
}
</script>
