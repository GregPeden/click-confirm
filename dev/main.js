import Vue from 'vue'
import App from './App.vue'
import ClickConfirm from './../src/index'
import './style.css'

Vue.use(ClickConfirm);

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
    el: '#app',
    render: h => h(App)
});