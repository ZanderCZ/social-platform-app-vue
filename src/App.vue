<script setup>
  import {ref, watch} from "vue";
  import Hello from './components/Hello.vue';
  import Index from './components/Index.vue';

  const userName = ref(null);
  const getUserName = (returnedUserName) => {
    userName.value = returnedUserName;
  }

  const isLogin = ref(false);
  provide('isLogin', isLogin);
  // watch(isLogin, (newVal) => {
  // if (!newVal) {
  //     console.log("用户已退出，将跳转到登录页")
  //   }
  // })

</script>

<template>
  <header>
  </header>
  <div v-if="!isLogin">
    <Hello @emit-user-name="getUserName" />
  </div>
  <div v-else>
    <Index :userName="userName"/>
  </div>
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