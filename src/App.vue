<script setup>
import billAnalizer from "./components/billAnalizer.vue";
import {ref} from "vue";

const number = ref(0);

function addNumb (){
  number.value++
}
function subTract(){
  number.value--
}

</script>

<template>
  <div class="home">
    <billAnalizer></billAnalizer>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}
.container{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>
