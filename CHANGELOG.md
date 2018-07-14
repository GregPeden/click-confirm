# Click Confirm changelog

## v2.1.1 - 2018-07-14
- New feature: Optionally replace CSS-based yes/no button icons with any custom solution via slots 'confirm-yes-icon' and 'confirm-no-icon'.

## v2.1.0 - 2018-04-18
- Potentially breaking change: Make popover hide when 'disable' is toggled to "true" while the popover is shown.

## v2.0.2 - 2018-01-25
- Update dependencies to coincide with Bootstrap 4 production launch.

## v2.0.1 - 2017-11-24
- Restored 'yes' button receiving focus automatically.

## v2.0.0 - 2017-11-21
- Updated to bootstrap-vue 1.0.x branch, based on Bootstrap 4-beta2, which uses Popper.js for much improved reliability.
- New development environment.
- Back-end redesign.

## v1.1.0 - 2017-08-15
- Added new property "disabled" which programmatically suppresses the click-confirm dialogue when true.
- Base classes for the dialogue buttons are accessible via new properties "yes-class" and "no-class".
- Correct some documentation errors concerning some properties.

Changes should be non-breaking for code produced for the previous release. The version iteration was done to emphasize previous documentation errors.

## v1.0.4 - 2017-05-01
- Update bootstrap-vue package.
- Switch to Yarn (from NPM).
- Fix input event response error.

## v1.0.3 - 2017-02-24
- Corrects a bug where an event triggered on a nested element is not fired upon confirmation.

## v1.0.2 - 2017-02-24
- Update package dependencies. Fixes an erroneous 'triggers' validation error from bootstrap-vue.

## v1.0.1 - 2017-02-10
- Bootstrap Vue has updated its Popover component to correct an occasional positioning error related to Tether not responding to JavaScript-initiated events. This update only adopts the latest Bootstrap Vue package to correct this.

## v1.0.0 - 2017-01-18
- Initial release.