<template>
  <div>
    <span
        :id="randomId"
        ref="trigger"
        tabindex="-1"
        @click.capture="interceptEvent"
    >
      <slot></slot>
    </span>
    <b-popover
        :target="randomId"
        :show.sync="isOpen"
        :placement="placement"
        :title="messages.title"
        triggers="blur"
        class="click-confirm"
        ref="popover"
        @hidden="onHidden"
    >
      <div class="text-center">
        <button
            :class="[yesClass, buttonSizeClass]"
            @click.prevent="onOk"
            ref="buttonYes"
        >
          <span v-if="yesIcon" :class="yesIcon" aria-hidden="true"></span> {{ messages.yes }}
        </button>
        <button
            :class="[noClass, buttonSizeClass]"
            @click.prevent="onCancel"
            ref="buttonNo"
        >
          <span v-if="noIcon" :class="noIcon" aria-hidden="true"></span> {{ messages.no }}
        </button>
      </div>
    </b-popover>
  </div>
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
                isOpen: false,
                randomId: 'clickConfirm' + this._uid,
                target: null,
                allow: false
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

            messagesMerged() {
                return Object.assign({}, messagesDefault, this.messages);
            }
        },

        methods: {
            onHidden() {
                this.target = null;
            },

            onOk() {
                if (this.target !== null) {
                    this.allow = true;
                    const mouseClick = new MouseEvent('click', {
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

            onCancel() {
                this.isOpen = false;
            },

            interceptEvent(e) {
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

            setFocusOnButtonYes() {
                this.$nextTick(() => {
                    this.$nextTick(() => {
                        if (this.isOpen) {
                            this.$refs.buttonYes.focus();
                        }
                    });
                });
            }
        },

        beforeDestroy() {
            if (this.isOpen) {
                this.onCancel();
            }
        }
    }
</script>