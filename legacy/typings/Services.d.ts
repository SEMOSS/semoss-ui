// Type Definitions for Services
interface SettingsService {
    initialize: () => void;
    get: (accessor?: string) => any;
}

interface AppService {
    initialize: () => void;
    get: (accessor?: string) => any;
    getApp: (appId: string, accessor?: string) => any;
    generateProjectImageURL: (appId: string) => any;
    generateDatabaseImageURL: (appId: string) => any;
    generateInsightImageURL: (appId: string, insightId: string) => any;
}

interface AlertService {
    initialize: () => void;
    get: (accessor?: string) => any;
}

interface EventService {
    initialize: () => void;
    get: (id: string, accessor?: string) => any;
    getCallbacks: (id: string) => {
        defaultMode: {
            onClick: (id: string) => void;
            onDoubleClick: (id: string) => void;
            onBrush: (id: string) => void;
            onHover: (id: string) => void;
            onMouseIn: (id: string) => void;
            onMouseOut: (id: string) => void;
            onKeyDown: (id: string) => void;
            onKeyUp: (id: string) => void;
        };
        selectMode: {
            onClick: (id: string) => void | null;
            onDoubleClick: (id: string) => void | null;
        };
        editMode: {
            onSave: (id: string) => void;
        };
        commentMode: {
            onSave: (id: string) => void;
        };
    };
}

interface HandleService {
    initialize: () => void;
    get: (id: string, accessor?: string) => any;
}

interface LoadingService {
    initialize: () => void;
}

interface MessageService {
    on: (message: string, callback: (...args: any) => void) => () => void;
    once: (message: string, callback: (...args: any) => void) => () => void;
    off: (message: string, callback?: (...args: any) => void) => () => void;
    emit: (message: string, payload?: any) => void;
    initialize: () => void;
}

interface ModeService {
    get: (widgetId: string, accessor?: string) => any;
    initialize: () => void;
}

interface MonolithService {
    getSearchInsightsResults: (config: {
        searchString: string;
        filterData;
        any;
        limit: number;
        offset: number;
    }) => ng.IPromise<any>;
    uploadFile: (
        files: any,
        insightId: string,
        appId?: string,
        path?: string
    ) => ng.IPromise<any>;
    checkHeaders: (payload: any) => ng.IPromise<any>;
    runPixel: (
        insightID: string,
        input: string,
        sessionInfo?: any,
        disableLogging?: boolean
    ) => ng.IPromise<any>;
    getPipeline: (insightID: string) => ng.IPromise<any>;
    createUser: (
        name: string,
        username: string,
        email: string,
        password: string
    ) => ng.IPromise<any>;
    updateUser: (
        userId: string,
        name: string,
        userEmail: string,
        userPassword: string,
        userAdmin: string
    ) => ng.IPromise<any>;
    addNewUser: (userId: string, userAdmin: string) => ng.IPromise<any>;
    loginUser: (username: string, password: string) => ng.IPromise<any>;
    logoutUser: () => ng.IPromise<any>;
    console: (id: string) => ng.IPromise<any>;
    downloadFile: (insightID: string, fileKey: string) => void;
    uploadProjectImage: (id: string, file: File) => ng.IPromise<any>;
    deleteProjectImage: (project: string) => ng.IPromise<any>;
    updateProjectSmssFile: (id: string, content: string) => ng.IPromise<any>;
    uploadDatabaseImage: (id: string, file: File) => ng.IPromise<any>;
    deleteDatabaseImage: (database: string) => ng.IPromise<any>;
    updateDatabaseSmssFile: (id: string, content: string) => ng.IPromise<any>;
    uploadInsightImage: (
        project: string,
        id: string,
        file: string
    ) => ng.IPromise<any>;
    deleteInsightImage: (project: string, id: string) => ng.IPromise<any>;
    activeLogins: () => ng.IPromise<any>;
    login: (provider: string) => ng.IPromise<any>;
    logout: (provider: string) => ng.IPromise<any>;
    getUserInfo: (provider: string) => ng.IPromise<any>;
    backendConfig: () => ng.IPromise<any>;
    isAdmin: () => ng.IPromise<any>;
    getAllEngines: () => ng.IPromise<any>;
    removeAdminUser: (id: string, type: string) => ng.IPromise<any>;
    getUserInformation: (search: any) => ng.IPromise<any>;
    getAllUsers: () => ng.IPromise<any>;
    getDBUsers: (admin: boolean, dbId: string) => ng.IPromise<any>;
    getProjectUsers: (admin: boolean, projectId: string) => ng.IPromise<any>;
    getDBUsersNoCredentials: (
        admin: boolean,
        appId: string
    ) => ng.IPromise<any>;
    getProjectUsersNoCredentials: (
        admin: boolean,
        projectId: string
    ) => ng.IPromise<any>;
    getUserDBPermission: (appId: string) => ng.IPromise<any>;
    getUserProjectPermission: (appId: string) => ng.IPromise<any>;
    addDBUserPermission: (
        admin: boolean,
        appId: string,
        id: string,
        permission: string
    ) => ng.IPromise<any>;
    addProjectUserPermission: (
        admin: boolean,
        projectId: string,
        id: string,
        permission: string
    ) => ng.IPromise<any>;
    editDBUserPermission: (
        admin: boolean,
        appId: string,
        id: string,
        permission: string
    ) => ng.IPromise<any>;
    removeDBUserPermission: (
        admin: boolean,
        appId: string,
        id: string
    ) => ng.IPromise<any>;
    setDBGlobal: (
        admin: boolean,
        appId: string,
        global: string
    ) => ng.IPromise<any>;
    setProjectGlobal: (
        admin: boolean,
        projectId: string,
        global: string
    ) => ng.IPromise<any>;
    setDBVisibility: (appId: string, visibility: boolean) => ng.IPromise<any>;
    setDBDiscoverable: (
        appId: string,
        discoverable: boolean
    ) => ng.IPromise<any>;
    setProjectVisibility: (
        projectId: string,
        visibility: boolean
    ) => ng.IPromise<any>;
    getDBs: (admin: boolean) => ng.IPromise<any>;
    getProjects: (admin: boolean) => ng.IPromise<any>;
    getInsightUsers: (appId: string, insightId: string) => ng.IPromise<any>;
    getAdminInsightUsers: (
        appId: string,
        insightId: string
    ) => ng.IPromise<any>;
    getUserInsightPermission: (
        appId: string,
        insightId: string
    ) => ng.IPromise<any>;
    addInsightUserPermission: (
        appId: string,
        insightId: string,
        id: string,
        permission: string
    ) => ng.IPromise<any>;
    addAdminInsightUserPermission: (
        appId: string,
        insightId: string,
        id: string,
        permission: string
    ) => ng.IPromise<any>;
    editInsightUserPermission: (
        appId: string,
        insightId: string,
        id: string,
        permission: string
    ) => ng.IPromise<any>;
    editAdminInsightUserPermission: (
        appId: string,
        insightId: string,
        id: string,
        permission: string
    ) => ng.IPromise<any>;
    removeInsightUserPermission: (
        appId: string,
        insightId: string,
        id: string,
        admin: boolean
    ) => ng.IPromise<any>;
    setInsightGlobal: (
        appId: string,
        insightId: string,
        isPublic: boolean
    ) => ng.IPromise<any>;
    setAdminInsightGlobal: (
        appId: string,
        insightId: string,
        isPublic: boolean
    ) => ng.IPromise<any>;
    getAdminAppInsights: (appId: string) => ng.IPromise<any>;
    deleteAdminInsight: (
        appId: string,
        insightId: string[]
    ) => ng.IPromise<any>;
    saveFilesInInsightAsDb: (
        insightID: string,
        engineName: string
    ) => ng.IPromise<any>;
    loginsAllowed: () => ng.IPromise<any>;
    loginProperties: () => ng.IPromise<any>;
    modifyLoginProperties: (
        provider: string,
        properties: any
    ) => ng.IPromise<any>;
    getAdminThemes: () => ng.IPromise<any>;
    createAdminTheme: (data: {
        name: string;
        json: any;
        isActive: boolean;
    }) => ng.IPromise<any>;
    editAdminTheme: (data: {
        id: string;
        name: string;
        json: any;
        isActive: boolean;
    }) => ng.IPromise<any>;
    deleteAdminTheme: (data: { id: string }) => ng.IPromise<any>;
    setActiveAdminTheme: (data: { id: string }) => ng.IPromise<any>;
    setAllAdminThemesInactive: () => ng.IPromise<any>;
    setCookie: (insightId: string, secret: string) => ng.IPromise<any>;
    invalidateSession: () => ng.IPromise<any>;
}

interface OptionsService {
    initialize: () => void;
    get: (id: string, accessor?: string) => any;
    set: (id: string, accessor: string, value: any) => void;
}

interface PixelTimerService {
    initialize: () => void;
    get: (id: string, acc?: string) => any;
}

interface SecurityService {
    initialize: () => void;
    getCredentials: (provider: string) => ng.IPromise<any>;
    getInitCredentials: () => { username: string; name: string } | boolean;
    getActiveLogins: () => ng.IPromise<any>;
    getCurrentLogins: () => any;
    isSecurityEnabled: () => ng.IPromise<any>;
    get: (accessor?: string) => any;
}

interface SelectedService {
    initialize: () => void;
    get: (id: string, accessor?: string) => any;
}

interface SemossCoreService {
    initialize: () => void;
    getBEConfig: () => ng.IPromise<any>;
    getSharedTools: WidgetService['getSharedTools']; // () => any;
    getIndividualTools: WidgetService['getIndividualTools']; // (widget: string) => any;
    getSpecificConfig: WidgetService['getSpecificConfig']; // (widget: string, accessor?: string) => any;
    loadWidget: WidgetService['loadWidget']; // (widget: string, type: string) => ng.IPromise<any>;
    getModeConfig: WidgetService['getModeConfig']; // () => any[];
    getVisualizationConfig: WidgetService['getVisualizationConfig']; // () => any[];
    getActiveVisualizationId: WidgetService['getActiveVisualizationId']; // (layout: string, type: string) => string | boolean;
    getWidgetState: WidgetService['get']; // (accessor?: string) => any;
    setWidgetState: WidgetService['set']; // (accessor: string, value: any) => void;
    on: MessageService['on']; // (message: string, callback: (...args: any) => void) => () => void;
    once: MessageService['once']; // (message: string, callback: (...args: any) => void) => () => void;
    off: MessageService['off']; // (message: string, callback: (...args: any) => void) => () => void;
    emit: MessageService['emit']; // (message: string, payload?: any) => void;
    get: StoreService['get']; // (accessor?: string) => any;
    set: StoreService['set']; // (accessor: string, content: any) => void;
    getWidget: StoreService['getWidget']; // (widgetId: string, accessor?: string) => any;
    getShared: StoreService['getShared']; // (insightID: string, accessor?: string) => any;
    getCredentials: SecurityService['getCredentials']; // (provider: string) => ng.IPromise<any>
    getInitCredentials: SecurityService['getInitCredentials']; // () => { username: string, name: string } | boolean;
    getActiveLogins: SecurityService['getActiveLogins']; // () => ng.IPromise<any>;
    getCurrentLogins: SecurityService['getCurrentLogins']; // () => any;
    isSecurityEnabled: SecurityService['isSecurityEnabled']; // () => ng.IPromise<any>;
    getSecurity: SecurityService['get']; // (accessor?: string) => any;
    getMode: ModeService['get']; // (widgetId: string, accessor?: string) => any;
    getSelected: SelectedService['get']; // (id: string, accessor?: string) => any;
    getWidgetTab: WidgetTabService['get']; // (id: string, accessor?: string) => any;
    getHandle: HandleService['get']; // (id: string, accessor?: string) => any;
    getEvent: EventService['get']; // (id: string, accessor?: string) => any;
    getEventCallbacks: EventService['getCallbacks'];
    // getEventCallbacks: (id: string) => {
    //     defaultMode: {
    //         onClick: (id: string) => void,
    //         onDoubleClick: (id: string) => void,
    //         onBrush: (id: string) => void,
    //         onHover: (id: string) => void,
    //         onMouseIn: (id: string) => void,
    //         onMouseOut: (id: string) => void,
    //         onKeyDown: (id: string) => void,
    //         onKeyUp: (id: string) => void,
    //     }
    //     selectMode: {
    //         onClick: (id: string) => void | null
    //         onDoubleClick: (id: string) => void | null
    //     },
    //     editMode: {
    //         onSave: (id: string) => void
    //     },
    //     commentMode: {
    //         onSave: (id: string) => void
    //     }
    // };
    getOptions: OptionsService['get']; // (id: string, accessor?: string) => any;
    setOptions: OptionsService['set']; // (id: string, accessor: string, value: any) => void
    setState: StateService['set']; // (id: string, accessor: string, content: any) => void;
    getState: StateService['get']; // (id: string, accessor?: string) => any;
    setVisualization: VisualizationService['set'];
    getVisualization: VisualizationService['get'];
    getPixelTimer: PixelTimerService['get'];
    app: AppService;
    settings: SettingsService;
    workspace: WorkspaceService;
    workbook: WorkbookService;
    alert: AlertService;
    // TODO: SPECIFY THESE
    pixel: any;
    utility: any;
    visualization: any;
}

interface SemossInterceptorService {
    request: (config: { url: string; data: string }) => {
        url: string;
        data: string;
    };
}

interface StateService {
    initialize: () => void;
    set: (id: string, accessor: string, content: any) => void;
    get: (id: string, accessor?: string) => any;
}

interface StoreService {
    initialize: () => void;
    get: (accessor?: string) => any;
    set: (accessor: string, content: any) => void;
    getWidget: (widgetId: string, accessor?: string) => any;
    getShared: (insightID: string, accessor?: string) => any;
    generate: (
        type: string,
        payload: {
            insightID?: string;
            widgetIds?: string[];
            meta?: boolean;
            replacements?: any;
        }
    ) => any;
}

interface TourStep {
    element: string;
    popover: {
        title: string;
        description: string;
        position: string;
        offset?: number;
        className?: string;
    };
}

interface TourService {
    initialize: (steps?: TourStep[]) => void;
    getCurrentState: (payload: {
        selectedState: string;
        selectedApp: string;
    }) => void;
}

interface TrackingService {
    initialize: () => void;
}

interface VisualizationService {
    initialize: () => void;
    get: (accessor?: string) => any;
    set: (accessor: string, value: any) => void;
    formatValue: (value: any, format?: any) => any;
}

interface WidgetService {
    initialize: () => void;
    getSharedTools: () => any;
    getIndividualTools: (widget: string) => any;
    getSpecificConfig: (widget: string, accessor?: string) => any;
    loadWidget: (widget: string, type: string) => ng.IPromise<any>;
    getModeConfig: () => any[];
    getVisualizationConfig: () => any[];
    getActiveVisualizationId: (layout: string, type: string) => string;
    get: (accessor?: string) => any;
    set: (accessor: string, value: any) => void;
}

interface WidgetTabService {
    initialize: () => void;
    get: (id: string, accessor?: string) => any;
}

interface WorkspaceService {
    initialize: () => void;
    get: (accessor?: string) => any;
    getWorkspace: (insightID: string, accessor?: string) => any;
    saveWorkspace: (insightID: string) => any;
}

interface WorkbookService {
    initialize: () => void;
    get: (accessor?: string) => any;
    getWorkbook: (insightID: string, accessor?: string) => any;
    saveWorkbook: (insightID: string) => any;
    getWorksheet: (
        insightID: string,
        sheetId: string,
        accessor?: string
    ) => any;
    getPanel: (
        insightID: string,
        sheetId: string,
        panelId: string,
        accessor?: string
    ) => any;
}

interface ExternalService {
    initialize: () => void;
    get: (accessor?: string) => any;
}

interface ContextMenuService {
    initialize: () => void;
    get: (accessor?: string) => any;
}
