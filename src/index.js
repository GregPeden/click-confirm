import component from './components/ClickConfirm.vue';

const clickConfirmPlugin = (Vue, params) => {
    let name = 'click-confirm';
    if (typeof params === 'string') name = params;

    Vue.component(name, component);
};

component.install = clickConfirmPlugin;

export default component;
export {component, clickConfirmPlugin};