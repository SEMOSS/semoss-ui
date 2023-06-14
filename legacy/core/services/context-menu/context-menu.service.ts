import angular from 'angular';

import { ContextMenuService, ContextMenuState, ContextMenuUIOptions } from '.';

angular
    .module('app.context-menu.service', [])
    .factory('contextMenuService', contextMenuService);

contextMenuService.$inject = ['$compile', '$rootScope', 'messageService'];

/**
 * @name contextMenuService
 * @description Returns shared context menu service
 * @param {angular.ICompileService} $compile AngularJS compile service
 * @param {angular.IRootScopeService} $rootScope Application root scope
 * @param {object} messageService Shared messageService
 * @return {ContextMenuService} Shared context menu service functions
 */
function contextMenuService(
    $compile: angular.ICompileService,
    $rootScope: angular.IRootScopeService,
    messageService: MessageService
): ContextMenuService {
    //TODO: consolidate update-context-menu with open
    let _state: ContextMenuState = {
            open: false,
            widgetId: '',
            visualizationType: '',
        },
        _actions = {
            'close-context-menu': closeContextMenu,
            'open-context-menu': openContextMenu,
            'update-context-menu': updateContextMenu,
        },
        contextMenuEle: HTMLElement | undefined,
        contextMenuScope: angular.IScope | undefined;

    /**
     * @name closeContextMenu
     * @description Emits destroy message for all context menu directives
     */
    function closeContextMenu(): void {
        // remove the old scope
        if (contextMenuScope) {
            contextMenuScope.$destroy();
            contextMenuScope = undefined;
        }

        // remove the oldEle
        if (contextMenuEle) {
            if (contextMenuEle.parentNode !== null) {
                contextMenuEle.parentNode.removeChild(contextMenuEle);
            }
            contextMenuEle = undefined;
        }

        // set the state to close
        _state.open = false;
        _state.widgetId = '';
    }

    /**
     * @name openContextMenu
     * @description Creates and appends context menu for a given widget id and visualization type
     * @param {object} data Contains information relative to context menu positioning and values to display
     */
    function openContextMenu(options: ContextMenuUIOptions): void {
        let contextMenuHTML: string,
            selectedValues = JSON.stringify([]),
            selectedHeader = JSON.stringify([]);

        // close the context menu, this will remove the scope as well
        closeContextMenu();

        // update the state
        _state.open = true;
        _state.widgetId = options.widgetId;
        _state.visualizationType = options.visualizationType;

        if (_state.selected) {
            selectedValues = JSON.stringify(_state.value);
            selectedHeader = JSON.stringify(_state.header.name);
        }

        // Prevent default context menu from appearing
        if (options.event.type === 'contextmenu') {
            options.event.preventDefault();
        }

        // create the new scope
        contextMenuScope = $rootScope.$new(true);

        // Define custom context menu
        contextMenuHTML =
            '<context-menu show="true" ' +
            'x="' +
            options.event.pageX +
            '"' +
            'y="' +
            options.event.pageY +
            '"' +
            'widget-id="\'' +
            options.widgetId +
            '\'"' +
            'visualization-type="\'' +
            options.visualizationType +
            '\'"' +
            'event-type="\'' +
            _state.eventType +
            '\'"' +
            "header='" +
            selectedHeader +
            "' " +
            "value='" +
            selectedValues +
            "'>" +
            '</context-menu>';

        // create the ele
        contextMenuEle = $compile(contextMenuHTML)(contextMenuScope)[0];

        // mount the ele
        document.body.appendChild(contextMenuEle);

        // set selected to false
        _state.selected = false;
    }

    /**
     * @name updateContextMenu
     * @description Updates context menu state
     * @param {object} state Updated context menu state
     */
    function updateContextMenu(state: ContextMenuState): void {
        // _state = angular.merge({}, _state, state);
        _state = state;
    }

    /**
     * @name initialize
     * @description Intializes action event listeners
     */
    function initialize(): void {
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    return {
        initialize: initialize,
    };
}
