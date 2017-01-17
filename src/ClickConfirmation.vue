<template>
  <b-popover triggers="" :placement="placement" :title="messages.title" :show="target != null"
             @showChange="popoverChange" @focus="setFocus('popover')" @blur="clearFocus">
        <span tabindex="-1" @click.capture="interceptEvent" @focus.capture="setFocus('target')" @blur="clearFocus" ref="target">
            <slot></slot>
        </span>
    <div class="text-xs-center" slot="content">
      <a href="#" class="btn btn-primary" @click="confirmEvent" @focus="setFocus('buttonYes')" @blur="clearFocus"
              ref="buttonYes">
        <span :class="yesIcon"></span> {{ messages.yes }}
      </a>
      <a href="#" class="btn btn-secondary" @click.prevent="cancelEvent" @focus="setFocus('buttonNo')" @blur="clearFocus"
              ref="buttonNo">
        <span :class="noIcon"></span> {{ messages.no }}
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
        localFocus: false
      }
    },

    props: {
      placement: {
        type: String,
        default: 'top',
      },

      copyAttributes: {
        type: [String, Array],
        default: ['href', 'target']
      },

      messages: {
        type: Object,
        default() {
          return messagesDefault;
        }
      },

      yesIcon: {
        type: [String, Array, Object],
        default: "fa fa-check"
      },

      noIcon: {
        type: [String, Array, Object],
        default: "fa fa-times"
      }
    },

    computed: {
      groupFocus() {
        return this.localFocus != false;
      },

      messagesMerged() {
        return Object.assign({}, messagesDefault, this.messages);
      },

      confirmAttributes() {
        let attributes = typeof this.copyAttributes === 'string' ? this.copyAttributes.split(' ') : this.copyAttributes;
        
        this.copyAttributes.forEach(row => {

        });
      },
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

      target(newValue) {
        console.log('Target change...');
        console.log(newValue);
      }
    },

    methods: {
      interceptEvent(e) {
        console.log('Event observed: ' + e.type);
        if (this.target == null)
          this.target = e.target;
        else
          this.setFocusOnButtonYes();

        if (!this.allow) {
          console.log('Stopping propagation.');
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
      }
    },

    mounted() {
      this._target = this.$refs.target.children[0];
    },

    beforeDestroy() {
      clearTimeout(this._groupFocusTimer);
      this._groupFocusTimer = null;
    }
  }
</script>