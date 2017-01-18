import Vue from 'vue'
import ClickConfirm from '../src/ClickConfirm.vue'

Vue.component('clickConfirm', ClickConfirm);

new Vue({
  el: '#app',
  methods: {
    successAlert() {
      alert('It worked!');
    }
  }
});
