<template>
  <b-popover class="click-confirm" :triggers="false" :placement="placement" :title="messages.title"
             :show="target !== null"
             @shown="setFocus('popover')" @hidden="clearFocus">
    <span tabindex="-1" @click.capture="interceptEvent" @shown.capture="setFocus('target')"
          @hidden="clearFocus" ref="trigger">
      <slot></slot>
    </span>
    <div class="text-center" slot="content">
      <a href="#" v-bind="confirmationAttributes" :class="[yesClass, buttonSizeClass]"
         @click.prevent="confirmEvent" @shown="setFocus('buttonYes')" @hidden="clearFocus" ref="buttonYes">
        <span v-if="yesIcon" :class="yesIcon"></span> {{ messages.yes }}
      </a>
      <a href="#" :class="[noClass, buttonSizeClass]" @click.prevent="cancelEvent"
         @shown="setFocus('buttonNo')" @hidden="clearFocus" ref="buttonNo">
        <span v-if="noIcon" :class="noIcon"></span> {{ messages.no }}
      </a>
    </div>
  </b-popover>
</template>

<script>
    import bPopover from 'bootstrap-vue/es/components/popover/popover'

    const messagesDefault = {
        title: 'Are you sure?',
        yes: 'Yes',
        no: 'No'
    };

    export default {
        components: { bPopover },

        data() {
            return {
                target: null,
                allow: false,
                localFocus: false,
                confirmationAttributes: {}
            }
        },

        props: {
            buttonSize: {
                type: String,
                default: "",
                validator(value) {
                    return ['lg', '', 'sm'].includes(value);
                }
            },

            copyAttributes: {
                type: [String, Array],
                default() {
                    return ['href', 'target'];
                }
            },

            disabled: {
                type: Boolean,
                default: false
            },

            messages: {
                type: Object,
                default() {
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
            buttonSizeClass() {
                return this.buttonSize ? 'btn-' + this.buttonSize : '';
            },

            groupFocus() {
                return Boolean(this.localFocus) !== false;
            },

            messagesMerged() {
                return Object.assign({}, messagesDefault, this.messages);
            }
        },

        watch: {
            copyAttributes(newValue) {
                this.updateConfirmAttributes(newValue);
            },

            groupFocus(newValue, oldValue) {
                if (oldValue && !newValue) {
                    clearTimeout(this._groupFocusTimer);
                    this._groupFocusTimer = setTimeout(() => {
                        if (!this.groupFocus) {
                            this.target = null;
                        }
                    }, 20);
                }
            }
        },

        methods: {
            cancelEvent() {
                this.target = null;
            },

            clearFocus(e) {
                this.localFocus = false;
            },

            confirmEvent() {
                if (this.target !== null) {
                    this.allow = true;
                    const mouseClick = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        composed: true
                    });
                    if (!this.target.dispatchEvent(mouseClick))
                        console.error('Confirmed event failed to dispatch');
                    this.allow = false;
                }
                this.cancelEvent();
            },

            interceptEvent(e) {
                if (this.disabled) {
                    return;
                }

                if (this.target === null) {
                    this.target = e.target;
                }

                this.setFocusOnButtonYes();

                if (!this.allow) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            },

            setFocus(focusName, e) {
                this.localFocus = focusName
            },

            setFocusOnButtonYes() {
                this.$nextTick(() => {
                    this.$refs.buttonYes.focus();
                });
            },

            updateConfirmAttributes(copyAttributes) {
                if (typeof this._trigger !== 'object')
                    return {};

                let attributeValuesArray = typeof copyAttributes === 'string' ? copyAttributes.split(' ') : copyAttributes;
                let attributesList = {};

                attributeValuesArray.forEach(attribute => {
                    if (this._trigger.hasAttribute(attribute))
                        attributesList[attribute] = this._trigger.getAttribute(attribute);
                });

                this.confirmationAttributes = attributesList;
            }
        },

        mounted() {
            this._trigger = this.$refs.trigger.children[0];
            this.updateConfirmAttributes(this.copyAttributes);
        },

        beforeDestroy() {
            clearTimeout(this._groupFocusTimer);
            this._groupFocusTimer = null;
        }
    }
</script>