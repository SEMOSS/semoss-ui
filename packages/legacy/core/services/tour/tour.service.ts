import Driver from 'driver.js';
import angular from 'angular';

export default angular
    .module('app.tour.service', [])
    .factory('tourService', tourService);

tourService.$inject = [
    '$stateParams',
    '$timeout',
    'messageService',
    'workspaceService',
    'settingsService',
];

function tourService(
    $stateParams,
    $timeout: ng.ITimeoutService,
    messageService: MessageService,
    workspaceService: WorkspaceService,
    settingsService: SettingsService
) {
    // TODO
    // customize steps when in app home page, work space with menu closed, specific menu when menu is open
    const /** Public */
        /** Private */
        _state: any = {},
        _actions = {
            /**
             * @name start-tour
             * @desc listen when a widget is closed
             * @param payload - payload of the message
             */
            'start-tour': (payload: any): void => {
                const driver = new Driver({
                    padding: 0,
                });

                if (driver) {
                    _state.driver = driver;
                    getCurrentState(payload);
                }
            },
            /**
             * @name open-app
             * @desc listen when an app is opened
             */
            'open-app': (): void => {
                if (_state.driver) {
                    _state.driver.reset();
                }
            },
            /**
             * @name changed-workspace-menu
             * @desc listen when menu state is changed
             */
            'changed-workspace-menu': (): void => {
                if (_state.driver) {
                    _state.driver.reset();
                }
            },
            /**
             * @name new-sheet
             * @desc listen when a sheet is added
             */
            'new-worksheet': (): void => {
                if (_state.driver) {
                    _state.driver.reset();
                }
            },
            /**
             * @name select-sheet
             * @desc listen when a sheet is selected
             */
            'select-worksheet': (): void => {
                if (_state.driver) {
                    _state.driver.reset();
                }
            },
            /**
             * @name change-widget-tab
             * @desc listen when a widget tab is selected
             */
            'change-widget-tab': (): void => {
                if (_state.driver) {
                    _state.driver.reset();
                }
            },
            /**
             * @name open-app
             * @desc listen when an app is opened
             */
            open: (): void => {
                if (_state.driver) {
                    _state.driver.reset();
                }
            },
        };

    /** Public */
    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        // register the selected to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    /**
     * @name getCurrentState
     * @param payload - where tour was called from
     * @desc defines the steps for the store based on current state
     */
    function getCurrentState(payload: {
        selectedState: string;
        selectedApp: string;
    }): void {
        let steps: TourStep[] = [];

        if (payload.selectedState === 'home.landing') {
            steps = getTourForLandingPage();
        } else if (payload.selectedState === 'home.settings') {
            steps = getTourForSettingsPage();
        } else if (payload.selectedState === 'home.catalog') {
            steps = getTourForCatalogPage();
        } else if (
            payload.selectedState.indexOf('home.catalog.database') > -1
        ) {
            steps = getTourForDatabasePage();
        } else if (payload.selectedState === 'home.build') {
            steps = getTourForVisualization();
        } else if (payload.selectedState === 'home.landing.project.manage') {
            steps = getTourForProjectPage();
        }

        initializeTour(steps);
    }

    /**
     * @name getTourForLandingPage
     * @desc get steps for home layout
     */
    function getTourForLandingPage(): TourStep[] {
        const steps: TourStep[] = [];

        const theme = settingsService.get('active').theme;
        steps.push(
            {
                element: '#home__semoss-tour-home-logo',
                popover: {
                    title: `Welcome to ${theme.name}!`,
                    description: `Click here to return back to the ${theme.name} home page at any time.`,
                    position: 'bottom',
                },
            },
            {
                element: '#landing__insights-scroll',
                popover: {
                    title: 'View Insights',
                    description: 'Access all of your saved Insights.',
                    position: 'left',
                    className: 'driver-popover--small',
                },
            },
            {
                element: '#home-nav__item--new-insight',
                popover: {
                    title: 'New Insight',
                    description:
                        'Create a new Insight using new data or existing data from a saved Database.',
                    position: 'right',
                },
            },
            {
                element: '#home-nav__item--insight',
                popover: {
                    title: 'Insights',
                    description: 'View and navigate to your open Insights.',
                    position: 'right',
                },
            },
            {
                element: '#home-nav__item--catalog',
                popover: {
                    title: 'Data Catalog',
                    description:
                        'View all of your Databases or create a new Database.',
                    position: 'right',
                },
            },
            {
                element: '#home-nav__item--jobs',
                popover: {
                    title: 'Job Scheduler',
                    description:
                        'Execute a specific task (job) at a defined time. You can organize defined jobs into a workflow.',
                    position: 'top-left',
                },
            },
            {
                element: '#home-nav__item--settings',
                popover: {
                    title: 'Settings',
                    description:
                        'Manage settings and user permissions for Projects, Databases, and Insights.',
                    position: 'top-left',
                },
            },
            {
                element: '#home__topbar__search',
                popover: {
                    title: 'Global Search',
                    description:
                        'Search throughout all of your projects for a specific insight no matter where you are.',
                    position: 'bottom',
                },
            },
            {
                element: '#home__semoss-tour-home-help',
                popover: {
                    title: `${theme.name} Help`,
                    description: `Click here if you ever get stuck. You can access the User Guide, email the ${theme.name} Help Desk, and go through a guided tour of the page you're viewing.`,
                    position: 'left',
                },
            },
            {
                element: '#home-login-tab',
                popover: {
                    title: 'Log In',
                    description: `Easily log into ${theme.name} through different social platforms.`,
                    position: 'left',
                },
            }
        );

        return steps;
    }

    /**
     * @name getTourForSettingsPage
     * @desc get steps for settings tab
     * @returns  array of steps
     */
    function getTourForSettingsPage(): TourStep[] {
        const steps: TourStep[] = [];
        steps.push(
            {
                element: '#settings__semoss-tour-app-permissions',
                popover: {
                    title: 'Project Permissions',
                    description:
                        'View all of your projects and the access you have to them. Control which projects to hide/show on the home page.',
                    position: 'bottom',
                },
            },
            {
                element: '#settings__semoss-tour-settings-permissions',
                popover: {
                    title: 'Admin Settings',
                    description:
                        'Add users and edit their access to projects and insights.',
                    position: 'bottom',
                },
            },
            {
                element: '#settings__semoss-tour-settings-query',
                popover: {
                    title: 'Admin Query',
                    description: 'Perform SQL notebooks on the Database.',
                    position: 'bottom',
                },
            },
            {
                element: '#settings__semoss-tour-settings-themes',
                popover: {
                    title: 'Admin Themes',
                    description:
                        'Customize the look and feel of your platform by creating a new theme for you and your users.',
                    position: 'bottom',
                },
            },
            {
                element: '#settings__semoss-tour-social',
                popover: {
                    title: 'Social',
                    description:
                        'Link social accounts by defining your social properties.',
                    position: 'bottom',
                },
            }
        );

        return steps;
    }

    /**
     * @name getTourForCatalogPage
     * @desc get steps for catalog page
     * @returns  array of steps
     */
    function getTourForCatalogPage(): TourStep[] {
        const steps: TourStep[] = [];

        steps.push(
            {
                element: '#catalog__semoss-tour-import',
                popover: {
                    title: 'Add Database',
                    description: `Add a new Database by importing data into ${name}.`,
                    position: 'bottom',
                },
            },
            {
                element: '#catalog__semoss-tour-database',
                popover: {
                    title: 'Database',
                    description:
                        "Manage an existing Database's settings by clicking on its tile.",
                    position: 'bottom',
                },
            }
        );

        return steps;
    }

    /**
     * @name getTourForDatabasePage
     * @desc get steps for database page
     * @returns  array of steps
     */
    function getTourForDatabasePage(): TourStep[] {
        const steps: TourStep[] = [];

        steps.push(
            {
                element: '#database__semoss-tour-export',
                popover: {
                    title: 'Export Database',
                    description: 'Export your Database to share with others.',
                    position: 'bottom-right',
                },
            },
            {
                element: '#database__semoss-tour-edit',
                popover: {
                    title: 'Edit Database',
                    description:
                        "Edit your database's name, description, tags, and image.",
                    position: 'bottom-right',
                },
            },
            {
                element: '#database__semoss-tour-access',
                popover: {
                    title: 'Access',
                    description:
                        "Manage your Database's visibility and user permissions.",
                    position: 'bottom',
                },
            },
            {
                element: '#database__semoss-tour-metamodel',
                popover: {
                    title: 'Metamodel',
                    description:
                        'View and modify the metamodel of your data, which defines the structure of your data.',
                    position: 'bottom',
                },
            },
            {
                element: '#database__semoss-tour-replace',
                popover: {
                    title: 'Replace Data',
                    description:
                        "Replace the Database's current data with a new or updated set of data.",
                    position: 'bottom',
                },
            },
            {
                element: '#database__semoss-tour-query',
                popover: {
                    title: 'Query Data',
                    description: 'Perform SQL notebooks on the Database.',
                    position: 'bottom',
                },
            }
            // {
            //     element: '#database__semoss-tour-Template-Management',
            //     popover: {
            //         title: 'Template Management',
            //         description: 'The Template Management allows you to configure the database templates.',
            //         position: 'bottom'
            //     }
            // },
            // {
            //     element: '#database__semoss-tour-Settings',
            //     popover: {
            //         title: 'Database Settings',
            //         description: 'Here you can delete and edit individual insights.',
            //         position: 'bottom'
            //     }
            // }
        );
        return steps;
    }

    /**
     * @name getTourForProjectPage
     * @desc get steps for project page
     * @returns  array of steps
     */
    function getTourForProjectPage(): TourStep[] {
        const steps: TourStep[] = [];

        steps.push(
            {
                element: '#project__semoss-tour-export',
                popover: {
                    title: 'Export Project',
                    description: 'Export your Project to share with others.',
                    position: 'bottom-right',
                },
            },
            {
                element: '#project__semoss-tour-edit',
                popover: {
                    title: 'Edit Project',
                    description:
                        "Edit your Project's name, description, tags, and image.",
                    position: 'bottom-right',
                },
            },
            {
                element: '#project__semoss-tour-access',
                popover: {
                    title: 'Access',
                    description:
                        "Manage your Projects's visibility and user permissions.",
                    position: 'bottom',
                },
            },
            {
                element: '#project__semoss-tour-insights',
                popover: {
                    title: 'Insight Settings',
                    description: 'Delete and edit individual insights.',
                    position: 'bottom',
                },
            },
            {
                element: '#project__semoss-tour-templates',
                popover: {
                    title: 'Template Management',
                    description: 'Configure the database templates.',
                    position: 'bottom',
                },
            }
        );
        return steps;
    }

    /**
     * @name getTourForVisualization
     * @desc get steps for visualization layout
     * @param sheetId selected sheet id
     */
    function getTourForVisualization(): TourStep[] {
        const insightID = $stateParams.insight;

        //check if it is valid
        if (
            !insightID ||
            typeof workspaceService.getWorkspace(insightID) === 'undefined'
        ) {
            return [];
        }

        const menuOpen = workspaceService.getWorkspace(insightID, 'menu.open');

        if (menuOpen) {
            // Customize steps for selected widget
            return [
                {
                    element: '#widget-menu__semoss-tour-enrich',
                    popover: {
                        title: 'Add New Data',
                        description: 'Bring in new data to your frame.',
                        position: 'left',
                    },
                },
                {
                    element: '#widget-menu__semoss-tour-clean',
                    popover: {
                        title: 'Clean Your Data',
                        description: 'Manipulate your dirty data.',
                        position: 'left',
                    },
                },
                {
                    element: '#widget-menu__semoss-tour-analytics',
                    popover: {
                        title: 'Analyze your Data',
                        description:
                            'Run specific analytics routines on your data.',
                        position: 'left',
                    },
                },
                {
                    element: '#widget-menu__semoss-tour-view',
                    popover: {
                        title: 'View Your Data',
                        description:
                            'Visualize your data by choosing from over 30 visualization types.',
                        position: 'left',
                    },
                },
                {
                    element: '#widget-menu__semoss-tour-filter',
                    popover: {
                        title: 'Filter Data',
                        description: 'Apply filters to your data.',
                        position: 'left',
                    },
                },
                {
                    element: '#widget-menu__semoss-tour-share',
                    popover: {
                        title: 'Share or Export Data',
                        description:
                            'Share your data with Tableau, export your data, or download an image of your panel.',
                        position: 'left',
                    },
                },
                {
                    element: '#widget-menu__semoss-tour-menu',
                    popover: {
                        title: 'More Tools',
                        description: 'Access additional widgets.',
                        position: 'left',
                    },
                },
                {
                    element: '#widget-menu__semoss-tour-settings',
                    popover: {
                        title: 'Customize Panel Settings',
                        description:
                            'Customize the settings (panel name, background color, etc.) for your selected panel.',
                        position: 'top-right',
                    },
                },
            ];
        } else {
            return [
                {
                    element: '#workspace__semoss-tour-panel',
                    popover: {
                        title: 'Add Panel',
                        description:
                            'Add a panel to your dashboard to create a visualization, form, dashboard filter, or dashboard unfilter.',
                        position: 'bottom-right',
                    },
                },
                {
                    element: '#workspace__semoss-tour-presentation-mode',
                    popover: {
                        title: 'Presentation Mode',
                        description:
                            'Expand your sheet when presenting your insights.',
                        position: 'bottom-right',
                    },
                },
                {
                    element: '#workspace__semoss-tour-save',
                    popover: {
                        title: 'Save Insight',
                        description:
                            'Save your entire insight to a new or existing project.',
                        position: 'bottom-right',
                    },
                },
                {
                    element: '#workspace__semoss-tour-terminal',
                    popover: {
                        title: 'Open Terminal',
                        description:
                            'Open to write and execute Pixel, R, or Python code.',
                        position: 'bottom-right',
                    },
                },
                {
                    element: '#workbook__navigation',
                    popover: {
                        title: 'Your Open Sheets',
                        description:
                            'Jump between all of your open sheets. A sheet can have one or multiple panels.',
                        position: 'top',
                    },
                },
                {
                    element: '#workbook__navigation--new-sheet',
                    popover: {
                        title: 'Add New Sheet',
                        description: 'Open a new, clean sheet.',
                        position: 'top',
                    },
                },
                {
                    element: '#workbook__semoss-tour-settings',
                    popover: {
                        title: 'Sheet Settings',
                        description:
                            'Customize the look and feel of your sheet.',
                        position: 'top-right',
                    },
                },
            ];
        }

        return [];
    }

    /**
     * @name initializeTour
     * @desc start tour or redirect to user guide
     * @param steps - tour steps defined for the users current state
     */
    function initializeTour(steps: TourStep[]): void {
        if (steps.length > 0 && _state.driver) {
            _state.driver.defineSteps(steps);
            $timeout(function () {
                _state.driver.start();
            }, 50);
        } else {
            window.open('http://semoss.org/userguide/', '_blank');
        }
    }

    /** Private */
    return {
        initialize: initialize,
        getCurrentState: getCurrentState,
    };
}
