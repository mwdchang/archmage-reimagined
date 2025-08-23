<template>
  <div id="menu-toggle" class="menu-toggle">☰ Actions</div>
  <div class="sidenav" id="mySidenav">
    <a href="javascript:void(0)" class="closebtn" id="closebtn">&times; Close</a>
    <router-link to="/about">Kingdom</router-link>
    <router-link to="/status">Status</router-link>
    <router-link to="/chronicles">Chronicles</router-link>
    <router-link to="/rankList">Ranking</router-link>
    <router-link to="/assignment">Assignment</router-link>
    <div class="divider"></div>

    <router-link to="/battle">Battle</router-link>
    <router-link to="/spell">Cast Spells</router-link>
    <router-link to="/dispel">Dispel Enchantments</router-link>
    <router-link to="/item">Use Items</router-link>
    <div class="divider"></div>

    <router-link to="/research">Research</router-link>
    <router-link to="/explore">Explore</router-link>
    <router-link to="/geld">Geld</router-link>
    <router-link to="/build">Building</router-link> 
    <router-link to="/destroy">Destroy</router-link> 
    <router-link to="/recruit">Recruit</router-link> 
    <router-link to="/disband">Disband</router-link> 
    <div class="divider"></div>
    <div>
      <a href="#" @click="logout()">Logout</a>
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

  mageStore.setMage(null as any)
  router.push({ name: 'home' });
};

onMounted(() => {
  // Open the side navigation
  document.getElementById("menu-toggle")!.onclick = function() {
    document.getElementById("mySidenav")!.style.width = "180px";
  }

  // Close the side navigation
  document.getElementById("closebtn")!.onclick = function() {
    document.getElementById("mySidenav")!.style.width = "0";
  }
});


</script>


<style scoped>
.divider {
  border-bottom: 1px solid #888;
  margin-top: 2px;
  margin-bottom: 2px;
}

.menu-toggle {
    font-size: 16px;
    cursor: pointer;
    padding: 5px;
    background-color: #333;
    color: white;
    /* position: absolute; */
    position: fixed;
    top: 10px;
    left: 10px;
}

.sidenav {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 2;
  top: 0;
  left: 0;
  background-color: #111;
  overflow-x: hidden;
  transition: 0.3s;
  padding-top: 35px;
}

.sidenav a {
  padding: 4px 4px 4px 20px;
  text-decoration: none;
  line-height: 1.2;
  font-size: 16px;
  color: #b1b1b1;
  display: block;
  transition: 0.3s;
}

.sidenav a:hover {
  color: #f1f1f1;
}

.sidenav .closebtn {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 18px;
  margin-left: 50px;
}
</style>
