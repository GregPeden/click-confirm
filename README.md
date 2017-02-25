# Click Confirm

> Convenient and elegant inline user confirmation of UI events.

## Dependencies
- [VueJS](https://vuejs.org/) v2.0+
- [Bootstrap](https://v4-alpha.getbootstrap.com/) v4 (tested on alpha 6)
- [Font Awesome](http://fontawesome.io/) v4 (optional, for displaying default button icons)

## Build Setup
``` bash
npm install click-confirm --save
```

## Basic Usage
``` html
<click-confirm>
  <button class="btn btn-primary" @click="successAction">Click me</button>
</click-confirm>
```

## Documentation
See [Official documentation](https://sirlamer.github.io/click-confirm/) for detailed usage information.

## Accreditations
- This component relies on [Bootstrap Vue's](https://github.com/bootstrap-vue/bootstrap-vue) Popover component. If you
are already using Bootstrap Vue, then Click Confirm is even lighter! Check it out.
- Design and functionality is closely inspired by [Boostrap Confirmation](http://bootstrap-confirmation.js.org/).