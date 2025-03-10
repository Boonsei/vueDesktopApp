<script setup>
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
    <div class="container">
      <button @click="addNumb">Add Number</button>
      <button @click="subTract">Subtract Number</button>
      <div>{{ number }}</div>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vw;
}
.container{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
</style>
