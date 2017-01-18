<template>
  <b-popover class="click-confirm" triggers="" :placement="placement" :title="messages.title" :show="target != null"
             @showChange="popoverChange" @focus="setFocus('popover')" @blur="clearFocus">
    <span tabindex="-1" @click.capture="interceptEvent" @focus.capture="setFocus('target')"
          @blur="clearFocus" ref="trigger">
      <slot></slot>
    </span>
    <div class="text-center" slot="content">
      <a href="#" v-bind="confirmationAttributes" class="btn btn-primary" :class="buttonSizeClass"
         @click.prevent="confirmEvent" @focus="setFocus('buttonYes')" @blur="clearFocus" ref="buttonYes">
        <span v-if="yesIcon" :class="yesIcon"></span> {{ messages.yes }}
      </a>
      <a href="#" class="btn btn-secondary" :class="buttonSizeClass" @click.prevent="cancelEvent"
         @focus="setFocus('buttonNo')" @blur="clearFocus" ref="buttonNo">
        <span v-if="noIcon" :class="noIcon"></span> {{ messages.no }}
      </a>
    </div>
  </b-popover>
</template>

<script>
  import Popover from 'bootstrap-vue/components/popover.vue'

  const messagesDefault = {
    title: 'Are you sure?',
    yes: 'Yes',
    no: 'No'
  };

  export default {
    components: {
      bPopover: Popover
    },

    data() {
      return {
        target: null,
        allow: false,
        localFocus: false,
        confirmationAttributes: {}
      }
    },

    props: {
      placement: {
        type: String,
        default: 'top',
      },

      copyAttributes: {
        type: [String, Array],
        default() { return ['href', 'target']; }
      },

      messages: {
        type: Object,
        default() { return messagesDefault; }
      },

      yesIcon: {
        type: [String, Array, Object],
        default: "fa fa-check"
      },

      noIcon: {
        type: [String, Array, Object],
        default: "fa fa-times"
      },

      buttonSize: {
        type: String,
        default: "",
        validator(value) {
          return ['lg', '', 'sm'].includes(value);
        }
      }
    },

    computed: {
      groupFocus() {
        return this.localFocus != false;
      },

      messagesMerged() {
        return Object.assign({}, messagesDefault, this.messages);
      },

      buttonSizeClass() {
        return this.buttonSize ? 'btn-' + this.buttonSize : '';
      }
    },

    watch: {
      groupFocus(newValue, oldValue) {
        if (oldValue && !newValue) {
          clearTimeout(this._groupFocusTimer);
          this._groupFocusTimer = setTimeout(() => {
            if (!this.groupFocus)
              this.target = null;
          }, 20);
        }
      },

      copyAttributes(newValue) {
        this.updateConfirmAttributes(newValue);
      }
    },

    methods: {
      interceptEvent(e) {
        if (this.target == null)
          this.target = e.target;
        else
          this.setFocusOnButtonYes();

        if (!this.allow) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      },

      confirmEvent() {
        if (this.target != null) {
          this.allow = true;
          let cancelled = !this.target.dispatchEvent(new MouseEvent('click'));
          this.allow = false;
          if (cancelled)
            console.error('Confirmed event failed to dispatch');
        }
        this.cancelEvent();
      },

      cancelEvent() {
        this.target = null;
      },

      popoverChange(newShow) {
        if (!newShow && this.target != null)
          this.cancelEvent();
        else
          this.setFocusOnButtonYes()
      },

      setFocus(focusName, e) {
        this.localFocus = focusName
      },

      clearFocus(e) {
        this.localFocus = false;
      },

      setFocusOnButtonYes() {
        this.$nextTick(() => {
          this.$refs.buttonYes.focus();
        });
      },

      updateConfirmAttributes(copyAttributes) {
        if(typeof this._trigger !== 'object')
          return {};

        let attributeValuesArray = typeof copyAttributes === 'string' ? copyAttributes.split(' ') : copyAttributes;
        let attributesList = {};

        attributeValuesArray.forEach(attribute => {
          if(this._trigger.hasAttribute(attribute))
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