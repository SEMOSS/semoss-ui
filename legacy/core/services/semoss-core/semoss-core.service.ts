import Utility from '../../utility/utility.js';
import Pixel from '../../store/pixel/pixel.js';
import Visualization from '../../store/visualization/visualization.js';
import angular from 'angular';

/**
 * @name semoss-core.service.js
 * @desc semoss core API
 */
export default angular
    .module('app.semoss-core.service', [])
    .factory('semossCoreService', semossCoreService);

semossCoreService.$inject = [
    '$q',
    'CONFIG',
    'VIZ_COLORS',
    'monolithService',
    'loadingService',
    'messageService',
    'appService',
    'storeService',
    'widgetService',
    'widgetTabService',
    'securityService',
    'contextMenuService',
    'modeService',
    'selectedService',
    'handleService',
    'visualizationService',
    'optionsService',
    'eventService',
    'stateService',
    'trackingService',
    'tourService',
    'settingsService',
    'alertService',
    'pixelTimerService',
    'workspaceService',
    'workbookService',
    'externalService',
];

function semossCoreService(
    $q: ng.IQService,
    CONFIG,
    VIZ_COLORS,
    monolithService: MonolithService,
    loadingService: LoadingService,
    messageService: MessageService,
    appService: AppService,
    storeService: StoreService,
    widgetService: WidgetService,
    widgetTabService: WidgetTabService,
    securityService: SecurityService,
    contextMenuService: ContextMenuService,
    modeService: ModeService,
    selectedService: SelectedService,
    handleService: HandleService,
    visualizationService: VisualizationService,
    optionsService: OptionsService,
    eventService: EventService,
    stateService: StateService,
    trackingService: TrackingService,
    tourService: TourService,
    settingsService: SettingsService,
    alertService: AlertService,
    pixelTimerService: PixelTimerService,
    workspaceService: WorkspaceService,
    workbookService: WorkbookService,
    externalService: ExternalService
) {
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        messageService.initialize();
        loadingService.initialize();
        appService.initialize();
        storeService.initialize();
        securityService.initialize();
        contextMenuService.initialize();
        modeService.initialize();
        selectedService.initialize();
        handleService.initialize();
        visualizationService.initialize();
        widgetService.initialize();
        widgetTabService.initialize();
        optionsService.initialize();
        eventService.initialize();
        stateService.initialize();
        trackingService.initialize();
        tourService.initialize();
        settingsService.initialize();
        alertService.initialize();
        pixelTimerService.initialize();
        workspaceService.initialize();
        workbookService.initialize();
        externalService.initialize();

        // pass in the colors
        Visualization.initialize(VIZ_COLORS);
    }

    /**
     * @name getBEConfig
     * @desc get the config from the backend
     * @returns the BE configurations (localDeployment, r, security, timeout)
     */
    function getBEConfig(): ng.IPromise<any> {
        const deferred = $q.defer();
        if (!CONFIG.hasOwnProperty('security')) {
            return monolithService.backendConfig().then((config) => {
                for (const key in config) {
                    if (config.hasOwnProperty(key)) {
                        CONFIG[key] = config[key];
                    }
                }

                // update config
                if (
                    CONFIG.hasOwnProperty('theme') &&
                    Object.keys(CONFIG.theme).length > 0
                ) {
                    messageService.emit('set-theme', {
                        id: CONFIG.theme.ID,
                        name: CONFIG.theme.THEME_NAME,
                        theme: JSON.parse(CONFIG.theme.THEME_MAP),
                    });
                }

                deferred.resolve(config);
                return deferred.promise;
            });
        }

        deferred.resolve(CONFIG);
        return deferred.promise;
    }

    return {
        getBEConfig: getBEConfig,
        initialize: initialize,
        getSharedTools: widgetService.getSharedTools,
        getIndividualTools: widgetService.getIndividualTools,
        getSpecificConfig: widgetService.getSpecificConfig,
        loadWidget: widgetService.loadWidget,
        getModeConfig: widgetService.getModeConfig,
        getVisualizationConfig: widgetService.getVisualizationConfig,
        getActiveVisualizationId: widgetService.getActiveVisualizationId,
        getWidgetState: widgetService.get,
        setWidgetState: widgetService.set,
        // updated API
        on: messageService.on,
        once: messageService.once,
        off: messageService.off,
        emit: messageService.emit,
        get: storeService.get,
        getWidget: storeService.getWidget,
        getShared: storeService.getShared,
        set: storeService.set,
        getInitCredentials: securityService.getInitCredentials,
        getActiveLogins: securityService.getActiveLogins,
        getCredentials: securityService.getCredentials,
        getCurrentLogins: securityService.getCurrentLogins,
        getSecurity: securityService.get,
        isSecurityEnabled: securityService.isSecurityEnabled,
        getMode: modeService.get,
        getSelected: selectedService.get,
        getWidgetTab: widgetTabService.get,
        getHandle: handleService.get,
        getEvent: eventService.get,
        getEventCallbacks: eventService.getCallbacks,
        setOptions: optionsService.set,
        getOptions: optionsService.get,
        setState: stateService.set,
        getState: stateService.get,
        getVisualization: visualizationService.get,
        setVisualization: visualizationService.set,
        getPixelTimer: pixelTimerService.get,

        app: appService,
        settings: settingsService,
        // new
        pixel: Pixel,
        utility: Utility,
        visualization: Visualization,
        workspace: workspaceService,
        workbook: workbookService,
        alert: alertService,
    };
}
