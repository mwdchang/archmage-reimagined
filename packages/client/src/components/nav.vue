<template>
  <div id="menu-toggle" class="absolute top-[10px] left-[10px] p-[5px] text-[15px] text-white cursor-pointer max-sm:hidden">Menu</div>
  <div class="absolute top-0 left-0 h-full w-0 z-[2] bg-[#1c1c1c] overflow-x-hidden transition-all duration-300 pt-[40px]" id="mySidenav">
    <a href="javascript:void(0)" class="absolute top-[10px] block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300" id="closebtn">&times; Close</a>

    <!--
    <router-link to="/about" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Kingdom</router-link>
    <router-link to="/status" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Status</router-link>
    <div class="border-b-2 border-[#333] my-[2px]"></div>
    -->

    <!--
    <router-link to="/chronicles" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Chronicles</router-link>
    <router-link to="/rankList" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Ranking</router-link>
    -->

    <!--
    <router-link to="/battle" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Battle</router-link>
    <router-link to="/spell" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Cast Spells</router-link>
    <router-link to="/dispel" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Dispel Magic</router-link>
    <router-link to="/item" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Use Item</router-link>
    <div class="border-b-2 border-[#333] my-[2px]"></div>

    <router-link to="/assignment" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Assignment</router-link>
    <router-link to="/research" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Research</router-link>
    <router-link to="/explore" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Explore</router-link>
    <router-link to="/geld" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Geld</router-link>
    <router-link to="/charge" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Mana Charge</router-link>
    <router-link to="/build" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Building</router-link> 
    <router-link to="/destroy" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Destroy</router-link> 
    <router-link to="/recruit" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Recruit</router-link> 
    <router-link to="/disband" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Disband</router-link> 
    <div class="border-b-2 border-[#333] my-[2px]"></div>
    -->
    <div>
      <a href="#" @click="logout()" class="block py-[4px] pr-[4px] pl-[20px] text-[15px] leading-none no-underline text-[#b1b1b1] hover:text-[#f1f1f1] transition-all duration-300">Logout</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { API } from '@/api/api';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMageStore } from '@/stores/mage';

const router = useRouter();
const mageStore = useMageStore();

const logout = async () => {
  console.log('log out...')
  await API.post('/logout');

  mageStore.setMage(null)
  router.push({ name: 'home' });
};

onMounted(() => {
  // Open the side navigation
  document.getElementById("menu-toggle")!.onclick = function() {
    document.getElementById("mySidenav")!.style.width = "140px";
  }

  // Close the side navigation
  document.getElementById("closebtn")!.onclick = function() {
    document.getElementById("mySidenav")!.style.width = "0";
  }
});


</script>
