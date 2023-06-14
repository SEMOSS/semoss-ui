export default angular.module('docs.home', []).directive('home', homeDirective);

import './home.scss';

homeDirective.$inject = ['$location', '$anchorScroll', '$timeout'];

function homeDirective($location, $anchorScroll, $timeout) {
    homeLink.$inject = ['scope', 'element'];
    return {
        restrict: 'E',
        template: require('./home.directive.html'),
        replace: true,
        link: homeLink,
    };

    function homeLink(scope, element) {
        scope.home = {};
        scope.home.scrollTo = scrollTo;
        scope.home.sectionsByLocation = {};
        scope.home.intervals = [];
        scope.home.previousLocation;
        scope.home.rendered = [
            {
                title: 'Typography',
                id: 'typographySection',
                components: [
                    {
                        title: 'Standard Elements',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/typography/typography-standard.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/typography/typography-standard.directive.js')
                            .default,
                        directive: 'standardSection',
                        properties: [],
                    },
                    {
                        title: 'Title',
                        description:
                            'Use a title to inform the user of what page they are on and its purpose.',
                        html: require('!!raw-loader!@/docs/components/typography/typography-title.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/typography/typography-title.directive.js')
                            .default,
                        directive: 'titleSection',
                        properties: [],
                        rulesDirective: 'titleRules',
                    },
                    {
                        title: 'Text',
                        description:
                            'Text on light backgrounds should use the text color. Text on dark backgrounds should use the text-invert color.',
                        html: require('!!raw-loader!@/docs/components/typography/typography.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/typography/typography.directive.js')
                            .default,
                        directive: 'typographySection',
                        properties: [],
                    },
                    {
                        title: 'Message',
                        description:
                            'Use a message to display more information in the center of an element.',
                        html: require('!!raw-loader!@/docs/components/typography/typography-message.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/typography/typography-message.directive.js')
                            .default,
                        directive: 'messageSection',
                        properties: [],
                    },
                    {
                        title: 'Form Elements',
                        description:
                            'Use a label next to an input and dropdown to inform the user the purpose of the component.',
                        html: require('!!raw-loader!@/docs/components/typography/typography-label.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/typography/typography-label.directive.js')
                            .default,
                        directive: 'labelSection',
                        properties: [],
                        rulesDirective: 'labelRules',
                    },
                ],
            },
            {
                title: 'Layout',
                id: 'layoutSection',
                components: [
                    {
                        title: 'Columns',
                        description:
                            'Use to layout items in a row and column format. Each row is made up of a total of 12 columns. Columns can vary in width from 1-12, BUT all the columns in the row must add up to 12.',
                        html: require('!!raw-loader!@/docs/components/layout/column.directive.html')
                            .default,
                        scss: require('!!raw-loader!@/docs/components/layout/column.scss')
                            .default,
                        js: require('!!raw-loader!@/docs/components/layout/column.directive.js')
                            .default,
                        directive: 'columnSection',
                        properties: [],
                    },
                ],
            },
            {
                title: 'Alignment',
                id: 'alignmentSection',
                components: [
                    {
                        title: '',
                        description:
                            'To align items, you can add the following classnames: smss-left, smss-right, smss-center. When using "smss-left" and "smss-right", add "smss-clear" to get rid of the float property.',
                        html: require('!!raw-loader!@/docs/components/alignment/alignment.directive.html')
                            .default,
                        scss: require('!!raw-loader!@/docs/components/alignment/alignment.scss')
                            .default,
                        js: require('!!raw-loader!@/docs/components/alignment/alignment.directive.js')
                            .default,
                        directive: 'alignmentSection',
                        properties: [],
                    },
                ],
            },
            {
                title: 'Button',
                id: 'buttonSection',
                components: [
                    {
                        title: '',
                        description:
                            'Buttons are used for clickable user actions.',
                        html: require('!!raw-loader!@/docs/components/button/button.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/button/button.directive.js')
                            .default,
                        directive: 'buttonSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from clicking the button.',
                            },
                            {
                                property: 'smss-btn--selected',
                                type: 'classname',
                                values: '',
                                desc: 'Add this class to give the button a selected state. This should be used for buttons in groups where only one option can be selected at a time.',
                            },
                            {
                                property: 'smss-btn--text',
                                type: 'classname',
                                values: '',
                                desc: 'Flat buttons appear only as text (there is no border or background color). These have the least amount of emphasis.',
                            },
                            {
                                property: 'smss-btn--error',
                                type: 'classname',
                                values: '',
                                desc: 'Use for actions that are destructive and requires caution such as deleting.',
                            },
                            {
                                property: 'smss-btn--block',
                                type: 'classname',
                                values: '',
                                desc: 'Block buttons will fill the width of its container. You can used them stacked on top of one another to provide a menu-like appearance.',
                            },
                            {
                                property: 'smss-btn--icon',
                                type: 'classname',
                                values: '',
                                desc: 'Use for buttons that only contain an icon as content. All icon buttons will have a width of 32px.',
                            },
                            {
                                property: 'smss-btn--outline',
                                type: 'classname',
                                values: '',
                                desc: 'Add to make the button outlined.',
                            },
                            {
                                property: 'smss-btn-group',
                                type: 'smss component',
                                values: '',
                                desc: 'Wrap the group of buttons in a <smss-btn-group> element.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                        rulesDirective: 'buttonRules',
                    },
                ],
            },
            {
                title: 'Tab',
                id: 'tabSection',
                components: [
                    {
                        title: '',
                        description:
                            'Use tabs when the user needs to switch different content/pages. Adding the classname "smss-tab--selected" will update the styling accordingly.',
                        html: require('!!raw-loader!@/docs/components/tab/button-tab.directive.html')
                            .default,
                        scss: require('!!raw-loader!@/docs/components/tab/button-tab.scss')
                            .default,
                        js: require('!!raw-loader!@/docs/components/tab/button-tab.directive.js')
                            .default,
                        directive: 'buttonTabSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from clicking the tab.',
                            },
                            {
                                property: 'smss-tab-group',
                                type: 'smss component',
                                values: '',
                                desc: 'Wrap the group of tabs in a <smss-tab-group> element.',
                            },
                            {
                                property: 'smss-tab--selected',
                                type: 'classname',
                                values: '',
                                desc: 'To show the selected tab, add "smss-tab--selected" to the active button tab.',
                            },
                            {
                                property: 'smss-tab--sheet',
                                type: 'classname',
                                values: '',
                                desc: 'For sheet-style tabs, use add the "smss-tab--sheet" class.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Popover',
                id: 'popoverSection',
                components: [
                    {
                        title: '',
                        description:
                            'Popovers are used to temporarily display extra information to the user. Popovers must be triggered by clicking on an element. Any element (<button>, <p>, <i>, etc.) inside the <smss-popover> element will become the trigger.',
                        html: require('!!raw-loader!@/docs/components/popover/popover.directive.html')
                            .default,
                        scss: require('!!raw-loader!@/docs/components/popover/popover.scss')
                            .default,
                        js: require('!!raw-loader!@/docs/components/popover/popover.directive.js')
                            .default,
                        directive: 'popoverSection',
                        properties: [
                            {
                                property: 'position',
                                type: 'array of strings',
                                values: 'NW, N, NE, W, E, SW, S, SE',
                                desc: "Property on <smss-popover-content>. Positions the popover around it's trigger.",
                            },
                            {
                                property: 'vertical-align',
                                type: 'string',
                                values: 'top, middle, bottom',
                                desc: "Property on <smss-popover-content>. Aligns the popover vertically along it's trigger.",
                            },
                            {
                                property: 'horizontal-align',
                                type: 'string',
                                values: 'left, middle, right',
                                desc: "Property on <smss-popover-content>. Aligns the popover horizontally along it's trigger.",
                            },
                            {
                                property: 'model',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-popover-content>. Controls whether the popover is visible. If true, then the popover will be shown. If false, then the popover will be hidden.',
                            },
                            {
                                property: 'show',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-popover-content>. Use to pass in a function that will be called when the popover opens.',
                            },
                            {
                                property: 'hide',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-popover-content>. Use to pass in a function that will be called when the popover closes.',
                            },
                            {
                                property: 'target',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-popover-content>. Use to specify the id or className of the element that the popup will orient around. If this is not specified, it will use the parent element that contains the smss-popover directive.',
                            },
                            {
                                property: 'spacing',
                                type: 'number',
                                values: '',
                                desc: 'Set the space between the target and popover.',
                            },
                            {
                                property: 'disable-document-click',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-popover-content>. If set to true, the popover will not close when clicking on the document. The default value is false.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Property on <smss-popover-content>. Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'List',
                id: 'listSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/list/list.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/list/list.directive.js')
                            .default,
                        directive: 'listSection',
                        properties: [
                            {
                                property: 'header',
                                type: 'string',
                                values: '',
                                desc: 'Use this property to add a header to your list.',
                            },
                            {
                                property: 'filter',
                                type: 'string',
                                values: '',
                                desc: 'Pass in the name of the filter function to format your data.',
                            },
                            {
                                property: 'options',
                                type: 'array',
                                values: '',
                                desc: 'These are the items that will show in your list.',
                            },
                            {
                                property: 'scroll',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the list is scrolling.',
                            },
                            {
                                property: 'loading',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to specify if the list is loading.',
                            },
                            {
                                property: 'mouseover',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the mouseover event is triggered.',
                            },
                            {
                                property: 'mouseleave',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the mouseleave event is triggered.',
                            },
                            {
                                property: 'keydown',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the keydown event is triggered.',
                            },
                            {
                                property: 'keyup',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the keyup event is triggered.',
                            },
                            {
                                property: 'click',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the click event is triggered.',
                            },
                            {
                                property: 'display',
                                type: 'string',
                                values: '',
                                desc: 'If your options is an array of objects, use this property to set which value to display.',
                            },
                            {
                                property: 'option-height',
                                type: 'number',
                                values: '',
                                desc: 'This changes the height of each option in the list. Default is 28.',
                            },
                            {
                                property: 'offset-top',
                                type: 'number',
                                values: '',
                                desc: 'This changes how many pixels from the top where the list begins. Default is 0.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Accordion',
                id: 'accordionSection',
                components: [
                    {
                        title: '',
                        description:
                            'Accordions are created using the <smss-accordion> tag. To create the individual accordion tabs, use the <smss-accordion-item> tag.',
                        html: require('!!raw-loader!@/docs/components/accordion/accordion.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/accordion/accordion.directive.js')
                            .default,
                        directive: 'accordionSection',
                        properties: [
                            {
                                property: 'resizable',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-accordion>.',
                            },
                            {
                                property: 'resize',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-accordion>. Use to pass in a function that is called when the accordion is resized.',
                            },
                            {
                                property: 'rotated',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-accordion>. If set to true, the accordion tabs are rotated and content will open from the sides instead from the bottom.',
                            },
                            {
                                property: 'name',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-accordion-item>. This will be the title of the accordion tab.',
                            },
                            {
                                property: 'size',
                                type: 'number',
                                values: '0-100',
                                desc: 'Property on <smss-accordion-item>. This sets the initial height of the accordion item.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-accordion-item>. Add "disabled" as a property on the element to prevent users from clicking on the accordion tab.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Overlay',
                id: 'overlaySection',
                components: [
                    {
                        title: '',
                        description:
                            "Overlays are components that sit a layer above the main window. Use overlays to grab the user's attention and temporarily block them from using the main screen. In the example below, the overlays are triggered by buttons.",
                        html: require('!!raw-loader!@/docs/components/overlay/overlay.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/overlay/overlay.directive.js')
                            .default,
                        directive: 'overlaySection',
                        properties: [
                            {
                                property: 'size',
                                type: 'attribute',
                                values: '"sm", "md", "lg"',
                                desc: 'Sets the size of the overlay modal. Default is set to "md".',
                            },
                            {
                                property: 'restrict',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If set to true, will restrict the overlay to cover only its container. If set to false, the overlay will cover the whole screen.',
                            },
                            {
                                property: 'open',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to open and close the overlay.',
                            },
                            {
                                property: 'disable-click',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Disables closing the overlay when clicking the background and removes the close button.',
                            },
                            {
                                property: 'exit',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that overrides the exit function for the overlay. The exit function is called when the user clicks the background (outside the overlay) or the close button.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Input',
                id: 'inputSection',
                components: [
                    {
                        title: '',
                        description:
                            'Use the input in a form when you need to get information from the user. Do not use this for search (use smss-search instead).',
                        html: require('!!raw-loader!@/docs/components/input/input.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/input/input.directive.js')
                            .default,
                        directive: 'inputSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from typing in the input.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Search',
                id: 'searchSection',
                components: [
                    {
                        title: '',
                        description:
                            'Use the search component when you need an input to search through items.',
                        html: require('!!raw-loader!@/docs/components/search/search.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/search/search.directive.js')
                            .default,
                        directive: 'searchSection',
                        properties: [
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the model changes.',
                            },
                            {
                                property: 'keydown',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the keydown event is triggered.',
                            },
                            {
                                property: 'keyup',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the keyup event is triggered.',
                            },
                            {
                                property: 'clear',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called when the input is cleared.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from typing in the input.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                            {
                                property: 'inline',
                                type: 'attribute',
                                values: '',
                                desc: 'Use to display the inline style version.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Text Area',
                id: 'textareaSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/textarea/textarea.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/textarea/textarea.directive.js')
                            .default,
                        directive: 'textareaSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from typing in the text area.',
                            },
                            {
                                property: 'smss-textarea--resize-none',
                                type: 'classname',
                                values: '',
                                desc: 'Add to prevent the user from resizing the text area component.',
                            },
                            {
                                property: 'smss-textarea--bordered',
                                type: 'classname',
                                values: '',
                                desc: 'Makes the text area completely bordered.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Dropdown',
                id: 'dropdownSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/dropdown/dropdown.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/dropdown/dropdown.directive.js')
                            .default,
                        directive: 'dropdownSection',
                        properties: [
                            {
                                property: 'model',
                                type: 'string, number, object',
                                values: 'The selected value from the list of options.',
                                desc: 'Property on <smss-dropdown>.',
                            },
                            {
                                property: 'options',
                                type: 'array',
                                values: '',
                                desc: 'This is an array of items that will be displayed in the dropdown list. Can be an array of strings or an array of objects.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever a user selects an option.',
                            },
                            {
                                property: 'filter',
                                type: 'string',
                                values: '',
                                desc: 'Pass in the name of a filter function to format the options.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-dropdown>. Add "disabled" as a property on the element to prevent users from clicking the dropdown.',
                            },
                            {
                                property: 'display',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-dropdown>. If your options property is an array of objects, set "display" to the key name of the value you want to display to the user.',
                            },
                            {
                                property: 'value',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-dropdown>. If your options property is an array of objects, set "value" to the key name of the value you want to be used as the value.',
                            },
                            {
                                property: 'loading',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-dropdown>. Use to specify if the dropdown list is loading.',
                            },
                            {
                                property: 'search',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that overides the default search function. This is called whenever a user searches the list.',
                            },
                            {
                                property: 'scroll',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-dropdown>. Use to pass in a function that is called whenever the user scrolls.',
                            },
                            {
                                property: 'mouseover',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-dropdown>. Use to pass in a function that is called on the mouseover event for each list option.',
                            },
                            {
                                property: 'mouseleave',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-dropdown>.Use to pass in a function that is called on the mouseleave event for each list option.',
                            },
                            {
                                property: 'placeholder',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-dropdown>. Use to add placeholder text to the dropdown.',
                            },
                            {
                                property: 'compact',
                                type: 'attribute',
                                values: '',
                                desc: 'Add to make the dropdown toggle compact.',
                            },
                            {
                                property: 'bordered',
                                type: 'attribute',
                                values: '',
                                desc: 'Changes the style of the dropdown to be bordered.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Multiselect',
                id: 'multiselectSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/multiselect/multiselect.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/multiselect/multiselect.directive.js')
                            .default,
                        directive: 'multiselectSection',
                        properties: [
                            {
                                property: 'model',
                                type: 'array',
                                values: '',
                                desc: 'The values the user has selected from the list of options or added by typing new options.',
                            },
                            {
                                property: 'options',
                                type: 'array',
                                values: '',
                                desc: 'This is an array of items that will be displayed in the list. Can be an array of strings or an array of objects.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever a user types or selects an option.',
                            },
                            {
                                property: 'filter',
                                type: 'string',
                                values: '',
                                desc: 'Pass in the name of a filter function to format the options.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from clicking the dropdown.',
                            },
                            {
                                property: 'display',
                                type: 'string',
                                values: '',
                                desc: 'If your options property is an array of objects, set "display" to the key name of the value you want to display to the user.',
                            },
                            {
                                property: 'value',
                                type: 'string',
                                values: '',
                                desc: 'If your options property is an array of objects, set "display" to the key name of the value you want to be used as the value.',
                            },
                            {
                                property: 'loading',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to specify if the list options are loading or not.',
                            },
                            {
                                property: 'search',
                                type: 'function',
                                values: '',
                                desc: 'Pass in a function to be called whenever the user searches.',
                            },
                            {
                                property: 'scroll',
                                type: 'function',
                                values: '',
                                desc: 'Pass in a function to be called whenever the list is scrolled.',
                            },
                            {
                                property: 'nowrap',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to stop items from wrapping to the next line. By adding this attribute, all items will be on a single line and will scroll when overflowed.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Typeahead',
                id: 'typeaheadSection',
                components: [
                    {
                        title: '',
                        description:
                            'Typeaheads are input components that will show suggestions to the user as they type.',
                        html: require('!!raw-loader!@/docs/components/typeahead/typeahead.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/typeahead/typeahead.directive.js')
                            .default,
                        directive: 'typeaheadSection',
                        properties: [
                            {
                                property: 'model',
                                type: 'object',
                                values: '',
                                desc: 'Property on <smss-typeahead>. The value the user typed in or selected from the list of options.',
                            },
                            {
                                property: 'options',
                                type: 'array',
                                values: '',
                                desc: 'Property on <smss-typeahead>. This is an array of items that will be displayed in the typeahead list. Can be an array of strings or an array of objects.',
                            },
                            {
                                property: 'placeholder',
                                type: 'object',
                                values: '',
                                desc: 'Property on <smss-typeahead>. Use to add placeholder text.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-typeahead>. Use to pass in a function that is called whenever a user types or selects an option.',
                            },
                            {
                                property: 'search',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-typeahead>. Use to pass in a function that overides the default search function. This is called whenever a user searches the list (types in the typeahead). Parameters: search (the search term)',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: '',
                                desc: 'Property on <smss-typeahead>. Use to disable the typeahead component.',
                            },
                            {
                                property: 'loading',
                                type: 'boolean',
                                values: '',
                                desc: 'Property on <smss-typeahead-list>. Use to specify if the typeahead is loading.',
                            },
                            {
                                property: 'scroll',
                                type: 'function',
                                values: '',
                                desc: 'Property on <smss-typeahead-list>. Use to pass in a function that is called whenever the user scrolls.',
                            },
                            {
                                property: 'display',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-typeahead-list>. If your options property is an array of objects, set "display" to the key name of the value you want to display to the user.',
                            },
                            {
                                property: 'value',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-typeahead-list>. If your options property is an array of objects, set "value" to the key name of the value you want to be used as the value.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Checkbox',
                id: 'checkboxSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/checkbox/checkbox.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/checkbox/checkbox.directive.js')
                            .default,
                        directive: 'checkboxSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from clicking the checkbox.',
                            },
                            {
                                property: 'name',
                                type: 'string',
                                values: '',
                                desc: 'Use to add a name attribute.',
                            },
                            {
                                property: 'model',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Keeps track of whether the checkbox is checked or not.',
                            },
                            {
                                property: 'required',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Specifies whether the checkbox is required or not.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the checkbox state changes.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Checklist',
                id: 'checklistSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/checklist/checklist.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/checklist/checklist.directive.js')
                            .default,
                        directive: 'checklistSection',
                        properties: [
                            {
                                property: 'quickselect',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If true, adds a checkbox to allow the user to "Select All".',
                            },
                            {
                                property: 'multiple',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If true, allows the user to select multiple values.',
                            },
                            {
                                property: 'searchable',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If true, allows the user to search the list.',
                            },
                            {
                                property: 'model',
                                type: 'array',
                                values: '',
                                desc: 'This keeps track of the values that have been checked.',
                            },
                            {
                                property: 'options',
                                type: 'array',
                                values: '',
                                desc: 'This is a list of the options that the user can choose from. Can be an array of strings or an array of objects.',
                            },
                            {
                                property: 'display',
                                type: 'string',
                                values: '',
                                desc: 'If your options is a list of objects, then use this value to specify what should be displayed for the option.',
                            },
                            {
                                property: 'value',
                                type: 'string',
                                values: '',
                                desc: "If your options is a list of objects, then use this value to specify what the option's value.",
                            },
                            {
                                property: 'select-all',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to specify whether the Select All checkbox is checked initially or not.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function whenever values are checked/unchecked.',
                            },
                            {
                                property: 'search',
                                type: 'function',
                                values: '',
                                desc: 'Use to override the search function.',
                            },
                            {
                                property: 'scroll',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the list is scrolled.',
                            },
                            {
                                property: 'loading',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to indicate whether the checklist is loading or not.',
                            },
                            {
                                property: 'filter',
                                type: 'string',
                                values: '',
                                desc: 'Pass in the name of a filter function to format the options.',
                            },
                            {
                                property: 'mouseover',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called on the mouseover event for each list option.',
                            },
                            {
                                property: 'mouseleave',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called on the mouseleave event for each list option.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Slider',
                id: 'sliderSection',
                components: [
                    {
                        title: 'Numerical',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/slider/num-slider.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/slider/num-slider.directive.js')
                            .default,
                        directive: 'numSliderSection',
                        properties: [
                            {
                                property: 'numerical',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add this property when the values used in the slider are numerical.',
                            },
                            {
                                property: 'invert',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'This inverts the direction of the slider.',
                            },
                            {
                                property: 'multiple',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If set to true, then the slider will have 2 thumbs that can be utilized for ranges.',
                            },
                            {
                                property: 'min',
                                type: 'number',
                                values: '',
                                desc: 'Set the min value of the slider.',
                            },
                            {
                                property: 'max',
                                type: 'number',
                                values: '',
                                desc: 'Set the max value of the slider.',
                            },
                            {
                                property: 'sensitivity',
                                type: 'number',
                                values: '',
                                desc: 'Set the value the slider increase/decreases by.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: "Use to pass in a function that is called whenever the slider's value changes.",
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to disable the slider.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                    {
                        title: 'Categorical',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/slider/cat-slider.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/slider/cat-slider.directive.js')
                            .default,
                        directive: 'catSliderSection',
                        properties: [
                            {
                                property: 'categorical',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add this property when the values used in the slider are categorical (string values).',
                            },
                            {
                                property: 'invert',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'This inverts the direction of the slider.',
                            },
                            {
                                property: 'multiple',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If set to true, then the slider will have 2 thumbs that can be utilized for ranges.',
                            },
                            {
                                property: 'options',
                                type: 'array',
                                values: '',
                                desc: 'The list of options that are used as the values on the slider. Can be an array of strings or an array of objects.',
                            },
                            {
                                property: 'display',
                                type: 'string',
                                values: '',
                                desc: 'If your options is a list of objects, then use this value to specify what should be displayed for the option.',
                            },
                            {
                                property: 'value',
                                type: 'string',
                                values: '',
                                desc: "If your options is a list of objects, then use this value to specify what the option's value.",
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the slider value changes.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to disable the slider.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                    {
                        title: 'Date',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/slider/date-slider.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/slider/date-slider.directive.js')
                            .default,
                        directive: 'dateSliderSection',
                        properties: [
                            {
                                property: 'date',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add this property when the values used in the slider are dates.',
                            },
                            {
                                property: 'invert',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'This inverts the direction of the slider.',
                            },
                            {
                                property: 'multiple',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If set to true, then the slider will have 2 thumbs that can be utilized for ranges.',
                            },
                            {
                                property: 'start',
                                type: 'date',
                                values: '',
                                desc: 'Start date of the slider.',
                            },
                            {
                                property: 'end',
                                type: 'date',
                                values: '',
                                desc: 'End date of the slider.',
                            },
                            {
                                property: 'format',
                                type: 'string',
                                values: '',
                                desc: 'Use to specify the format of the date.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the slider value changes.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to disable the slider.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Radio',
                id: 'radioSection',
                components: [
                    {
                        title: '',
                        description:
                            'Use radio buttons when a user needs to select one item from a list of options. In order for radio buttons to be a part of the same group, they must be set to the same model.',
                        html: require('!!raw-loader!@/docs/components/radio/radio.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/radio/radio.directive.js')
                            .default,
                        directive: 'radioSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Add "disabled" as a property on the element to prevent users from clicking the radio button.',
                            },
                            {
                                property: 'name',
                                type: 'string',
                                values: '',
                                desc: 'Use to add a name attribute to the radio.',
                            },
                            {
                                property: 'value',
                                type: 'string',
                                values: '',
                                desc: 'This is the value of the radio button.',
                            },
                            {
                                property: 'model',
                                type: '',
                                values: '',
                                desc: 'This is the selected value.',
                            },
                            {
                                property: 'required',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Specifies whether the radio is required or not.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the radio selection changes.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Toggle',
                id: 'toggleSection',
                components: [
                    {
                        title: '',
                        description:
                            'Use a toggle when a user should turn something on/off.',
                        html: require('!!raw-loader!@/docs/components/toggle/toggle.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/toggle/toggle.directive.js')
                            .default,
                        directive: 'toggleSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to prevent users from clicking the toggle button.',
                            },
                            {
                                property: 'model',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Specifies whether the toggle is on or off',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: "Use to pass in a function that is called whenever the toggle's state changes.",
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Date Picker',
                id: 'datePickerSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/date-picker/date-picker.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/date-picker/date-picker.directive.js')
                            .default,
                        directive: 'datePickerSection',
                        properties: [
                            {
                                property: 'model',
                                type: 'string',
                                values: '',
                                desc: 'This is the selected date.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to disable the date picker.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the date is changed.',
                            },
                            {
                                property: 'format',
                                type: 'string',
                                values: 'Accepted Values: YYYY, YY, MMMM, MMM, MM, DD',
                                desc: 'Use to specify the format of the date.',
                            },
                            {
                                property: 'compact',
                                type: 'attribute',
                                values: '',
                                desc: 'Add to make the date picker compact.',
                            },
                            {
                                property: 'bordered',
                                type: 'attribute',
                                values: '',
                                desc: 'Adds a border to the date picker input.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Time Picker',
                id: 'timePickerSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/time-picker/time-picker.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/time-picker/time-picker.directive.js')
                            .default,
                        directive: 'timePickerSection',
                        properties: [
                            {
                                property: 'model',
                                type: 'string',
                                values: '',
                                desc: 'This is the selected time.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to disable the time picker.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever the time is changed.',
                            },
                            {
                                property: 'format',
                                type: 'string',
                                values: 'Combination of the following: HH, H, hh, h, mm, ss, a',
                                desc: 'Use to specify the format of the time.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Color Picker',
                id: 'colorPickerSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/color-picker/color-picker.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/color-picker/color-picker.directive.js')
                            .default,
                        directive: 'colorPickerSection',
                        properties: [
                            {
                                property: 'name',
                                type: 'string',
                                values: '',
                                desc: 'Use to add a name attribute.',
                            },
                            {
                                property: 'model',
                                type: 'string',
                                values: '',
                                desc: 'This is the color that is picked.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to disable the color picker.',
                            },
                            {
                                property: 'change',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function that is called whenever a new color is accepted. Parameters: color, model.',
                            },
                            {
                                property: 'color-theme',
                                type: 'array of hex code strings',
                                values: 'e.g. ["#ffffff", "#000000", "#e7e7e7"]',
                                desc: 'Sets the colors the user can choose from, otherwise will use a default color theme.',
                            },
                            {
                                property: 'required',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Specifies whether the checkbox is required or not.',
                            },
                            {
                                property: 'compact',
                                type: 'attribute',
                                values: '',
                                desc: 'Add to make the color picker compact.',
                            },
                            {
                                property: 'bordered',
                                type: 'attribute',
                                values: '',
                                desc: 'Adds a border to the color picker input.',
                            },
                            {
                                property: 'autofocus',
                                type: 'attribute',
                                values: '',
                                desc: 'Add this attribute to automatically focus on the element on page load.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Alert',
                id: 'alertSection',
                components: [
                    {
                        title: '',
                        description:
                            'Use alerts to show temporary messages to the user. They should be used to provide feedback about the status of an action.',
                        html: require('!!raw-loader!@/docs/components/alert/alert.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/alert/alert.directive.js')
                            .default,
                        directive: 'alertSection',
                        properties: [
                            {
                                property: 'ng-model',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Specifies whether the alert message is shown or hidden.',
                            },
                            {
                                property: 'color',
                                type: 'string',
                                values: 'primary, success, warn, error',
                                desc: 'Use to change the color of the alert.',
                            },
                            {
                                property: 'closable',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-alert>. If set to false, then the close icon will be hidden in the alert. The default is true.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Tag',
                id: 'tagSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/tag/tag.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/tag/tag.directive.js')
                            .default,
                        directive: 'tagSection',
                        properties: [
                            {
                                property: 'label',
                                type: 'string',
                                values: '',
                                desc: "The tag's label.",
                            },
                            {
                                property: 'click',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function to call when the tag is clicked.',
                            },
                            {
                                property: 'on-close',
                                type: 'function',
                                values: '',
                                desc: 'Use to pass in a function to call when the tag is closed.',
                            },
                            {
                                property: 'show-close',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If true, will show a close icon.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Scroll',
                id: 'scrollSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/scroll/scroll.directive.html')
                            .default,
                        scss: require('!!raw-loader!@/docs/components/scroll/scroll.scss')
                            .default,
                        js: require('!!raw-loader!@/docs/components/scroll/scroll.directive.js')
                            .default,
                        directive: 'scrollSection',
                        properties: [
                            {
                                property: 'scroll-y',
                                type: 'function',
                                values: '',
                                desc: '',
                            },
                            {
                                property: 'scroll-x',
                                type: 'function',
                                values: '',
                                desc: '',
                            },
                            {
                                property: 'static-y',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If true, then only add a scrollbar in the x direction (horizontal scrolling).',
                            },
                            {
                                property: 'static-x',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'If true, then only add a scrollbar in the y direction (vertical scrolling).',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Editor',
                id: 'editorSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/editor/editor.directive.html')
                            .default,
                        scss: require('!!raw-loader!@/docs/components/editor/editor.scss')
                            .default,
                        js: require('!!raw-loader!@/docs/components/editor/editor.directive.js')
                            .default,
                        directive: 'editorSection',
                        properties: [
                            {
                                property: 'model',
                                type: 'html',
                                values: '',
                                desc: 'HTML to edit and render.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Use to disable the editor.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Stepper',
                id: 'stepperSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/stepper/stepper.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/stepper/stepper.directive.js')
                            .default,
                        directive: 'stepperSection',
                        properties: [
                            {
                                property: 'name',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-stepper-item>. Determines the name of the step.',
                            },
                            {
                                property: 'section',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-stepper-item>. Unique id for the the step.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-stepper-item>. Use to disable the stepper item.',
                            },
                            {
                                property: 'smss-stepper--navigate',
                                type: 'event',
                                values: '',
                                desc: 'Event to navigate to a specific section. Pass in the section to navigate to.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Breadcrumb',
                id: 'breadcrumbSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/breadcrumb/breadcrumb.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/breadcrumb/breadcrumb.directive.js')
                            .default,
                        directive: 'breadcrumbSection',
                        properties: [
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-breadcrumb-item>. Use to disable the breadcrumb item.',
                            },
                        ],
                    },
                ],
            },
            {
                title: 'Multistepper',
                id: 'multistepperSection',
                components: [
                    {
                        title: '',
                        description: '',
                        html: require('!!raw-loader!@/docs/components/multistepper/multistepper.directive.html')
                            .default,
                        js: require('!!raw-loader!@/docs/components/multistepper/multistepper.directive.js')
                            .default,
                        directive: 'multistepperSection',
                        properties: [
                            {
                                property: 'name',
                                type: 'string',
                                values: '',
                                desc: 'Property on <smss-multistepper-item>. Determines the name of the step.',
                            },
                            {
                                property: 'state',
                                type: 'string',
                                values: "'default', 'active', 'completed', 'error', 'optional'",
                                desc: 'Required property on <smss-multistepper-item>. State of the step within the multistepper.',
                            },
                            {
                                property: 'ng-disabled',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-multistepper-item>. Use to disable the multistepper item.',
                            },
                            {
                                property: 'vertical',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-multistepper>. Displays the multistepper vertically if true (default is horizontal).',
                            },
                            {
                                property: 'compact',
                                type: 'boolean',
                                values: 'true, false',
                                desc: 'Property on <smss-multistepper>. Displays a compact version of the multistepper if true.',
                            },
                        ],
                    },
                ],
            },
        ];

        /**
         * @name scrollTo
         * @desc Called when a user clicks on a link and will jump to that section.
         * @param {string} id - ID of the section the user wants to go to
         * @returns {void}
         */
        function scrollTo(id) {
            $location.hash(id);
            $anchorScroll;
            if (scope.home.previousLocation !== id) {
                updateLinks(id);
            }
        }
        /**
         * @name updateLinks
         * @desc Called when a user scrolls or clicks on a link.  Will remove the 'smss-selected' classname from the previous link and add 'smss-selected' to the current link
         * @param {string} newLocation - ID of the user's current location
         * @returns {void}
         */
        function updateLinks(newLocation) {
            let currentLink = element[0].querySelector(
                    '#' + newLocation + 'Link'
                ),
                previousLink =
                    scope.home.previousLocation &&
                    element[0].querySelector(
                        '#' + scope.home.previousLocation + 'Link'
                    );

            if (previousLink) {
                previousLink.className = previousLink.className.replace(
                    'smss-selected',
                    ''
                );
            }

            if (currentLink) {
                currentLink.className += ' smss-selected';
            }

            scope.home.previousLocation = newLocation;
        }
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            $timeout(function () {
                if ($location.hash()) {
                    updateLinks($location.hash());
                }
            }, 0);
        }
        initialize();
    }
}
