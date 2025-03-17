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
  <div>
    <billAnalizer></billAnalizer>
  </div>
</template>

<style scoped>
</style>
