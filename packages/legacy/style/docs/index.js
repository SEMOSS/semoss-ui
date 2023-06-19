// import libraries
import 'angular';

// import the libray
import '../src/index.js';

// import components
import './components/dynamic/dynamic.directive.js';
import './components/home/home.directive.js';
import './components/block/block.directive.js';

//import style components
import './components/color/color.directive.js';
import './components/button/button.directive.js';
import './components/tab/button-tab.directive.js';
import './components/button/rules.directive.js';
import './components/popover/popover.directive.js';
import './components/list/list.directive.js';
import './components/date-picker/date-picker.directive.js';
import './components/color-picker/color-picker.directive.js';
import './components/toggle/toggle.directive.js';
import './components/radio/radio.directive.js';
import './components/checkbox/checkbox.directive.js';
import './components/checkbox/rules.directive.js';
import './components/typeahead/typeahead.directive.js';
import './components/dropdown/dropdown.directive.js';
import './components/multiselect/multiselect.directive.js';
import './components/checklist/checklist.directive.js';
import './components/input/input.directive.js';
import './components/search/search.directive.js';
import './components/textarea/textarea.directive.js';
import './components/overlay/overlay.directive.js';
import './components/accordion/accordion.directive.js';
import './components/slider/num-slider.directive.js';
import './components/slider/cat-slider.directive.js';
import './components/slider/date-slider.directive.js';
import './components/typography/typography.directive.js';
import './components/typography/typography-title.directive.js';
import './components/typography/typography-label.directive.js';
import './components/typography/typography-message.directive.js';
import './components/layout/column.directive.js';
import './components/alignment/alignment.directive.js';
import './components/logo/logo.directive.js';
import './components/iconography/iconography.directive.js';
import './components/alert/alert.directive.js';
import './components/scroll/scroll.directive.js';
import './components/typography/rules/title.directive.js';
import './components/typography/rules/label.directive.js';
import './components/variables/variables.directive.js';
import './components/typography/typography-standard.directive.js';
import './components/editor/editor.directive.js';
import './components/stepper/stepper.directive.js';
import './components/tag/tag.directive.js';
import './components/breadcrumb/breadcrumb.directive.js';
import './components/multistepper/multistepper.directive.js';
import './components/time-picker/time-picker.directive.js';

// mount
angular.module('app', [
    'smss-style',
    'docs.dynamic',
    'docs.home',
    'docs.block',
    'docs.color',
    'docs.typography',
    'docs.title',
    'docs.label',
    'docs.message',
    'docs.button',
    'docs.button-tab',
    'docs.buttonRules',
    'docs.popover',
    'docs.list',
    'docs.date-picker',
    'docs.color-picker',
    'docs.toggle',
    'docs.radio',
    'docs.checkbox',
    'docs.checkboxRules',
    'docs.typeahead',
    'docs.dropdown',
    'docs.multiselect',
    'docs.checklist',
    'docs.input',
    'docs.search',
    'docs.textarea',
    'docs.overlay',
    'docs.accordion',
    'docs.num-slider',
    'docs.cat-slider',
    'docs.date-slider',
    'docs.column',
    'docs.alignment',
    'docs.logo',
    'docs.iconography',
    'docs.alert',
    'docs.scroll',
    'docs.title-rules',
    'docs.label-rules',
    'docs.variables',
    'docs.standard',
    'docs.editor',
    'docs.stepper',
    'docs.tag',
    'docs.breadcrumb',
    'docs.multistepper',
    'docs.time-picker',
]);
