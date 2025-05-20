<script setup>
  import {ref, watch, provide} from "vue";
  import Hello from './components/Hello.vue';
  import Index from './components/Index.vue';
  import { useUserStore } from './stores/user'

  const userName = ref(null);
  const getUserName = (returnedUserName) => {
    userName.value = returnedUserName;
  }
  const userStore = useUserStore();

</script>

<template>
  <header>
  </header>
  <router-view></router-view>
  <!-- <div v-if="!userStore.isLogin">
    <Hello @emit-user-name="getUserName" />
  </div>
  <div v-else>
    <Index :userName="userName"/>
  </div> -->
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>