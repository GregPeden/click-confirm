import Vue from 'vue/dist/vue.js'
import ClickConfirmation from '../src/ClickConfirmation.vue'

new Vue({
  el: '#app',
  components: { ClickConfirmation },
  methods: {
    successAlert() {
      alert('It worked!');
    }
  }
});
