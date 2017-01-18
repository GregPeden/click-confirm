import Vue from 'vue'
import ClickConfirm from '../src/ClickConfirm.vue'

Vue.use('clickConfirm', ClickConfirm);

new Vue({
  el: '#app',
  methods: {
    successAlert() {
      alert('It worked!');
    }
  }
});
