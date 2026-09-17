'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var bPopover = _interopDefault(require('bootstrap-vue'));

var messagesDefault = {
    title: 'Are you sure?',
    yes: 'Yes',
    no: 'No'
};

var component$1 = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('span',{ref:"trigger",attrs:{"id":_vm.randomId,"tabindex":"-1"},on:{"!click":function($event){return _vm.interceptEvent($event)}}},[_vm._t("default")],2),_vm._v(" "),_c('b-popover',{ref:"popover",staticClass:"click-confirm",attrs:{"container":_vm.container,"target":_vm.randomId,"show":_vm.isOpen,"placement":_vm.placement,"title":_vm.messages.title,"triggers":"blur"},on:{"update:show":function($event){_vm.isOpen=$event;},"hidden":_vm.onHidden}},[_c('div',{staticClass:"text-center"},[_c('button',{ref:"buttonYes",class:[_vm.yesClass, _vm.buttonSizeClass],on:{"click":function($event){$event.preventDefault();return _vm.onOk($event)}}},[_vm._t("confirm-yes-icon",[(_vm.yesIcon)?_c('span',{class:_vm.yesIcon,attrs:{"aria-hidden":"true"}}):_vm._e()]),_vm._v(" "+_vm._s(_vm.messages.yes)+" ")],2),_vm._v(" "),_c('button',{ref:"buttonNo",class:[_vm.noClass, _vm.buttonSizeClass],on:{"click":function($event){$event.preventDefault();return _vm.onCancel($event)}}},[_vm._t("confirm-no-icon",[(_vm.noIcon)?_c('span',{class:_vm.noIcon,attrs:{"aria-hidden":"true"}}):_vm._e()]),_vm._v(" "+_vm._s(_vm.messages.no)+" ")],2)])])],1)},staticRenderFns: [],
    components: { bPopover: bPopover },

    data: function data() {
        return {
            isOpen: false,
            randomId: 'clickConfirm' + this._uid,
            target: null,
            allow: false
        }
    },

    props: {
        container: {
            type: String,
            default: null,
        },

        buttonSize: {
            type: String,
            default: "",
            validator: function validator(value) {
                return ['lg', '', 'sm'].includes(value);
            }
        },

        disabled: {
            type: Boolean,
            default: false
        },

        messages: {
            type: Object,
            default: function default$1() {
                return messagesDefault;
            }
        },

        noClass: {
            type: [String, Array, Object],
            default: "btn btn-secondary"
        },

        noIcon: {
            type: [String, Array, Object],
            default: "fa fa-times"
        },

        placement: {
            type: String,
            default: 'top',
        },

        yesClass: {
            type: [String, Array, Object],
            default: "btn btn-primary"
        },

        yesIcon: {
            type: [String, Array, Object],
            default: "fa fa-check"
        }
    },

    computed: {
        buttonSizeClass: function buttonSizeClass() {
            return this.buttonSize ? 'btn-' + this.buttonSize : '';
        },

        messagesMerged: function messagesMerged() {
            return Object.assign({}, messagesDefault, this.messages);
        }
    },

    watch: {
        disabled: function disabled(newValue) {
            if (newValue && this.isOpen) {
                this.onCancel();
            }
        }
    },

    methods: {
        onHidden: function onHidden() {
            this.target = null;
        },

        onOk: function onOk() {
            if (this.target !== null) {
                this.allow = true;
                var mouseClick = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    composed: true
                });
                if (!this.target.dispatchEvent(mouseClick)) {
                    console.error('Confirmed event failed to dispatch');
                }
                this.allow = false;
            }
            this.onCancel();
        },

        onCancel: function onCancel() {
            this.isOpen = false;
        },

        interceptEvent: function interceptEvent(e) {
            if (this.disabled) {
                return;
            }

            this.target = e.target;

            if (!this.allow) {
                this.isOpen = true;
                this.setFocusOnButtonYes();
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        },

        setFocusOnButtonYes: function setFocusOnButtonYes() {
            var this$1 = this;

            this.$nextTick(function () {
                this$1.$nextTick(function () {
                    if (this$1.isOpen) {
                        this$1.$refs.buttonYes.focus();
                    }
                });
            });
        }
    },

    beforeDestroy: function beforeDestroy() {
        if (this.isOpen) {
            this.onCancel();
        }
    }
};

var clickConfirmPlugin = function (Vue, params) {
    var name = 'click-confirm';
    if (typeof params === 'string') { name = params; }

    Vue.component(name, component$1);
};

component$1.install = clickConfirmPlugin;

exports['default'] = component$1;
exports.component = component$1;
exports.clickConfirmPlugin = clickConfirmPlugin;
