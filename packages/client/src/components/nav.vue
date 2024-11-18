<template>
  <div id="menu-toggle" class="menu-toggle">☰</div>
  <div class="sidenav" id="mySidenav">
    <a href="javascript:void(0)" class="closebtn" id="closebtn">&times;</a>
    <router-link to="/about">Kingdom</router-link>
    <router-link to="/status">Status</router-link>
    <router-link to="/chronicles">Chronicles</router-link>
    <router-link to="/rankList">Ranking</router-link>
    <router-link to="/assignment">Assignment</router-link>
    <div class="divider"></div>

    <router-link to="/battle">Battle</router-link>
    <router-link to="/spell">Cast Spells</router-link>
    <router-link to="/item">Use Items</router-link>
    <div class="divider"></div>

    <router-link to="/research">Research</router-link>
    <router-link to="/explore">Explore</router-link>
    <router-link to="/geld">Geld</router-link>
    <router-link to="/build">Building</router-link> 
    <router-link to="/destroy">Destroy</router-link> 
    <router-link to="/recruit">Recruit</router-link> 
    <router-link to="/disband">Disband</router-link> 
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // Open the side navigation
  document.getElementById("menu-toggle").onclick = function() {
    document.getElementById("mySidenav").style.width = "225px";
  }

  // Close the side navigation
  document.getElementById("closebtn").onclick = function() {
    document.getElementById("mySidenav").style.width = "0";
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
    font-size: 20px;
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
  padding-top: 30px;
}

.sidenav a {
  padding: 4px 4px 4px 20px;
  text-decoration: none;
  line-height: 1.2;
  font-size: 18px;
  color: #818181;
  display: block;
  transition: 0.3s;
}

.sidenav a:hover {
    color: #f1f1f1;
}

.sidenav .closebtn {
    position: absolute;
    top: 0;
    right: 15px;
    font-size: 25px;
    margin-left: 50px;
}
</style>
