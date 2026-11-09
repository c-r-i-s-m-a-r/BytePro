<template>
  <span class="app-icon" :style="estilo" aria-hidden="true"></span>
</template>

<script setup>
import { computed } from 'vue';
import angleLeft from '../assets/icons/icon-angle-left.svg';
import angleRight from '../assets/icons/icon-angle-right.svg';
import bell from '../assets/icons/icon-bell.svg';
import camera from '../assets/icons/icon-camera.svg';
import cube from '../assets/icons/icon-cube.svg';
import download from '../assets/icons/icon-download.svg';
import duplicate from '../assets/icons/icon-duplicate.svg';
import help from '../assets/icons/icon-help.svg';
import map from '../assets/icons/icon-map.svg';
import marker from '../assets/icons/icon-marker.svg';
import modeLandscape from '../assets/icons/icon-mode-landscape.svg';
import power from '../assets/icons/icon-power.svg';
import print from '../assets/icons/icon-print.svg';
import shoppingCart from '../assets/icons/icon-shopping-cart.svg';
import shoppingCartAdd from '../assets/icons/icon-shopping-cart-add.svg';
import signIn from '../assets/icons/icon-sign-in.svg';
import signOut from '../assets/icons/icon-sign-out.svg';
import star from '../assets/icons/icon-star.svg';
import transfer from '../assets/icons/icon-transfer.svg';
import truckSide from '../assets/icons/icon-truck-side.svg';

const ICONOS = {
  'angle-left': angleLeft,
  'angle-right': angleRight,
  bell,
  camera,
  cube,
  download,
  duplicate,
  help,
  map,
  marker,
  'mode-landscape': modeLandscape,
  power,
  print,
  cart: shoppingCart,
  'cart-add': shoppingCartAdd,
  'shopping-cart': shoppingCart,
  'sign-in': signIn,
  'sign-out': signOut,
  star,
  transfer,
  truck: truckSide,
  'truck-side': truckSide,
};

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
});

const src = computed(() => ICONOS[props.name] || '');

const estilo = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  '--icon-url': `url("${src.value}")`,
}));
</script>

<style scoped>
.app-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
  background-color: currentColor;
  -webkit-mask-image: var(--icon-url);
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-image: var(--icon-url);
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
}
</style>
