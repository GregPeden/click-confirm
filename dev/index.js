import Vue from 'vue/dist/vue.js'
import ClickConfirm from '../src/ClickConfirm.vue'

new Vue({
  el: '#app',
  components: { ClickConfirm },
  methods: {
    successAlert() {
      alert('It worked!');
    }
  }
});
