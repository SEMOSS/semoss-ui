import angular from 'angular';
import Utility from '../../utility/utility.js';
import pixelTimerDirective from '../../../widgets/pixel-timer/pixel-timer.directive.js';

export default angular
    .module('app.pixel-timer.service', [])
    .factory('pixelTimerService', pixelTimerService);

pixelTimerService.$inject = ['$interval', 'messageService', 'storeService'];

function pixelTimerService(
    $interval: ng.IIntervalService,
    messageService: MessageService,
    storeService: StoreService
) {
    const _state: Map<
            string,
            {
                statement: string;
                timer: number;
                fn: ng.IPromise<any>;
                refresh: boolean;
            }
        > = new Map(),
        _actions: any = {
            'update-ornaments': (payload: { widgetId: string }): void => {
                const widgetId = payload.widgetId,
                    insightID: string = storeService.getWidget(
                        widgetId,
                        'insightID'
                    ),
                    pixelTimer: {
                        timer: number;
                        statement: string;
                        refresh: boolean;
                    } = storeService.getWidget(widgetId, 'pixelTimer');
                let intervalFn, stateWidgetId;

                if (_state.has(widgetId)) {
                    stateWidgetId = _state.get(widgetId);
                    if (stateWidgetId) {
                        $interval.cancel(stateWidgetId.fn);
                    }
                }
                if (pixelTimer) {
                    const commandList: PixelCommand[] = [
                        {
                            type: 'Pixel',
                            components: [pixelTimer.statement],
                            terminal: true,
                        },
                    ];
                    if (pixelTimer.refresh) {
                        commandList.push({
                            type: 'refreshInsight',
                            components: [insightID],
                            terminal: true,
                        });
                    }
                    intervalFn = $interval(() => {
                        messageService.emit('execute-pixel', {
                            insightID,
                            commandList,
                        });
                    }, pixelTimer.timer * 1000);

                    _state.set(widgetId, {
                        statement: pixelTimer.statement,
                        refresh: pixelTimer.refresh,
                        timer: pixelTimer.timer,
                        fn: intervalFn,
                    });
                } else {
                    _state.delete(widgetId);
                }
            },
        };

    function initialize(): void {
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name get
     * @param widgetId the widget id to grab
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns  value of the requested object
     */
    function get(widgetId: string, accessor?: string): any {
        if (!_state.has(widgetId)) {
            return false;
        }

        return Utility.getter(_state.get(widgetId), accessor);
    }

    return {
        initialize,
        get,
    };
}
