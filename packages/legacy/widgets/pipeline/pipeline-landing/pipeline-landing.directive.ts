import angular from 'angular';
import '../../pipeline-existing-insight/pipeline-existing-insight.directive';
import './pipeline-landing.scss';

export default angular
    .module('app.pipeline.landing', [
        'app.pipeline-existing-insights.directive',
    ])
    .directive('pipelineLanding', pipelineLandingDirective);

pipelineLandingDirective.$inject = ['ENDPOINT', 'semossCoreService', '$timeout'];

function pipelineLandingDirective(
    ENDPOINT: EndPoint,
    semossCoreService: SemossCoreService,
    $timeout,
) {
    pipelineLandingCtrl.$inject = [];
    pipelineLandingLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^pipeline'],
        controller: pipelineLandingCtrl,
        link: pipelineLandingLink,
        template: require('./pipeline-landing.directive.html'),
        scope: {},
        bindToController: {},
        controllerAs: 'pipelineLanding',
    };

    function pipelineLandingCtrl() { }

    function pipelineLandingLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineCtrl = ctrl[1];

        scope.pipelineLanding.accordionSettings = {
            first: {
                name: 'Select a Starting Point',
                size: 20,
                selected: '',
            },
            second: {
                name: '',
                size: 80,
            },
        };
        scope.pipelineLanding.firstToSecond = {
            'web-source': [], // fake component to hold single click Source Components (api, git clone, etc...)
        };
        scope.pipelineLanding.start = [];
        scope.pipelineLanding.rendered = [];
        scope.pipelineLanding.searched = '';
        scope.pipelineLanding.selectLanding = selectLanding;
        scope.pipelineLanding.searchLanding = searchLanding;
        scope.pipelineLanding.onFileDrop = onFileDrop;
        scope.pipelineLanding.limit = 12;
        scope.pipelineLanding.offset = 0;
        scope.pipelineLanding.canCollect = true
        scope.pipelineLanding.dbLoading = false

        let
            insightScrollEle,
            insightScrollTimeout;

        /** databases */

        /**
         * @name getInsights
         * @desc called to get insights
         * @param clear - if true, will reset the search
         */
        function getDatabases(clear = false): void {
            scope.pipelineLanding.dbLoading = true;
            const message: string =
                semossCoreService.utility.random('query-pixel')

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType[0];
                // scope.landing.insights.search.loading = false;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // scope.landing.insights.canCollect =
                //     output.length === scope.landing.insights.limit;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [scope.pipelineLanding.limit, scope.pipelineLanding.offset],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name getMoreDatabases
         * @desc gets more insights on scroll
         */
        function getMoreDatabases(): void {
            if (!scope.pipelineLanding.canCollect) {
                return;
            }
            // if (insightScrollTimeout) {
            //     $timeout.cancel(insightScrollTimeout);
            // }

            // debounce
            insightScrollTimeout = $timeout(function () {
                // check if it is at the bottom and going downwards
                if (
                    insightScrollEle.scrollTop +
                    insightScrollEle.clientHeight >=
                    insightScrollEle.scrollHeight * 0.75 &&
                    !scope.landing.insights.search.loading
                ) {
                    // increment the offset to get more
                    scope.pipelineLanding.offset +=
                        scope.pipelineLanding.limit;
                    getDatabases();
                }
            }, 300);
        }

        /**
         * @name onFileDrop
         * @param file - flow file
         * @desc handles file drop and takes user to pipeline-file if valid
         */
        function onFileDrop(file): void {
            const extension = file.getExtension().toLowerCase();

            if (
                extension === 'xls' ||
                extension === 'xlsx' ||
                extension === 'xlsm' ||
                extension === 'csv' ||
                extension === 'ts'
            ) {
                scope.widgetCtrl.file = file;
                scope.pipelineLanding.accordionSettings.first.selected =
                    'pipeline-file';
                selectLanding({ id: 'pipeline-file' });
            } else if (
                extension === 'rdf' ||
                extension === 'ttl' ||
                extension === 'n3' ||
                extension === 'nt' ||
                extension === 'trig' ||
                extension === 'trix' ||
                extension === 'owl'
            ) {
                scope.widgetCtrl.file = file;
                scope.pipelineLanding.accordionSettings.first.selected =
                    'pipeline-rdf-file';
                selectLanding({ id: 'pipeline-rdf-file' });
            } else {
                scope.widgetCtrl.alert(
                    'error',
                    'File must be excel (.xls, .xlsx, or .xlsm), .csv, or .tsv or a RDF file'
                );
            }
        }

        /**
         * @name checkFileExtension
         * @param file - flow file
         * @desc checks file extension (must be csv) and makes sure there is only one file added
         * @returns checks wether it is an  file
         */
        function checkFileExtension(file: any): boolean {
            const fileExtension = file.getExtension();

            if (fileExtension) {
                return true;
            }

            return false;
        }

        /**
         * @name searchLanding
         * @param item - selected item
         * @desc search the landing for the pipeline
         */
        function searchLanding(item: { id: string; name: string }): void {
            if (item) {
                scope.pipelineLanding.accordionSettings.first.selected =
                    item.id;
                if (item.id === 'pipeline-codeblock-source') {
                    scope.pipelineCtrl.addComponent(item.id);
                    scope.pipelineCtrl.landing.open = false;
                    return;
                }
                scope.pipelineLanding.accordionSettings.second.name = item.name;
            }
            const searchTerm = String(
                scope.pipelineLanding.searched
            ).toUpperCase();

            scope.pipelineLanding.rendered =
                scope.pipelineLanding.firstToSecond[
                    scope.pipelineLanding.accordionSettings.first.selected
                ]
                    .map((child) => child)
                    .filter((child) =>
                        child.name.toUpperCase().match(searchTerm)
                    );
        }

        /**
         * @name selectLanding
         * @desc add a new widget
         * @param item - can be entire app info or widget selected
         */
        function selectLanding(item: any): void {
            const frame = false;
            const selected =
                scope.pipelineLanding.accordionSettings.first.selected;

            // two part selection
            if (selected === 'pipeline-app') {
                const param = {
                    pipeline: {
                        parameters: {
                            QUERY_STRUCT: {
                                value: {
                                    landing: true,
                                    engineName: item.id,
                                    type: item.type,
                                    display: item.name,
                                },
                            },
                        },
                    },
                };
                scope.pipelineCtrl.addComponent(selected, false, param);
            } else if (
                selected === 'pipeline-existing-insight' ||
                selected === 'pipeline-query'
            ) {
                const param = {
                    pipeline: {
                        parameters: {
                            SELECTED_APP: {
                                frame: frame,
                                value: {
                                    image: item.icon,
                                    display: item.name,
                                    value: item.id,
                                    type: item.type,
                                },
                            },
                        },
                    },
                };
                scope.pipelineCtrl.addComponent(selected, false, param);
            } else {
                // selecting a widget, need to use .id
                scope.pipelineCtrl.addComponent(item.id);
            }
            scope.pipelineCtrl.landing.open = false;
        }

        function initialize() {
            const components = semossCoreService.getWidgetState('all');
            scope.pipelineLanding.start = [];

            const seen = {};

            for (
                let componentIdx = 0, componentLen = components.length;
                componentIdx < componentLen;
                componentIdx++
            ) {
                const component = components[componentIdx];

                // skip ones if they are already seen
                if (seen[component.id]) {
                    continue;
                }
                // mark as seen
                seen[component.id] = true;

                if (
                    component.hasOwnProperty('pipeline') &&
                    component.pipeline.group === 'Source'
                ) {
                    if (component.hasOwnProperty('parent')) {
                        let parent = component.parent;

                        if (component.parent === 'pipeline-social') {
                            parent = 'web-source';
                        }
                        if (
                            !scope.pipelineLanding.firstToSecond.hasOwnProperty(
                                parent
                            )
                        ) {
                            scope.pipelineLanding.firstToSecond[parent] = [];
                        }

                        scope.pipelineLanding.firstToSecond[parent].push(
                            component
                        );
                    } else if (
                        component.id === 'pipeline-web-scraper' ||
                        component.id === 'pipeline-api' ||
                        component.id === 'pipeline-git-clone'
                    ) {
                        component.parent = 'web-source';
                        scope.pipelineLanding.firstToSecond['web-source'].push(
                            component
                        );
                    } else if (component.id === 'pipeline-rdf-file') {
                        if (
                            !scope.pipelineLanding.firstToSecond[
                            'pipeline-file'
                            ]
                        ) {
                            scope.pipelineLanding.firstToSecond[
                                'pipeline-file'
                            ] = [];
                        }

                        scope.pipelineLanding.firstToSecond[
                            'pipeline-file'
                        ].push(component);
                    } else if (
                        component.id !== 'pipeline-social' &&
                        !scope.pipelineLanding.firstToSecond[component.id]
                    ) {
                        scope.pipelineLanding.firstToSecond[component.id] = [];
                    }

                    if (
                        component.id !== 'pipeline-social' &&
                        component.id !== 'pipeline-rdf-file' &&
                        !component.hasOwnProperty('parent')
                    ) {
                        scope.pipelineLanding.start.push(component);
                    }
                }
            }

            scope.pipelineLanding.start.push({
                id: 'web-source',
                name: 'Web Source',
                description: 'Source data from the web.',
                icon: require('images/web-scraper.svg'),
            });

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [scope.pipelineLanding.limit, scope.pipelineLanding.offset],
                        terminal: true,
                    },
                ],
                (response: PixelReturnPayload) => {
                    const apps =
                        response.pixelReturn[0].output.map(createAppConfig);

                    Object.keys(scope.pipelineLanding.firstToSecond).forEach(
                        (key) => {
                            if (
                                scope.pipelineLanding.firstToSecond[key]
                                    .length === 0
                            ) {
                                scope.pipelineLanding.firstToSecond[key] = apps;
                            }
                        }
                    );
                    const start = scope.pipelineLanding.start.find(
                        (ele) => ele.id === 'pipeline-app'
                    );
                    searchLanding(start);
                }
            );
        }

        insightScrollEle = ele[0].querySelector(
            '#pipeline-component'
        );
        console.log(insightScrollEle)
        insightScrollEle.addEventListener('scroll', getMoreDatabases);

        initialize();
    }

    /**
     * @name createAppConfig
     * @param app - user app
     * @desc adds icon, name, and id properties to user app
     */
    function createAppConfig(app: {
        app_id: string;
        app_name: string;
        app_type: string;
    }): { icon: string; name: string; id: string; type: string } {
        const transformedApp: {
            name: string;
            icon: string;
            id: string;
            type: string;
        } = {
            icon: '',
            name: '',
            id: '',
            type: '',
        };
        transformedApp.icon = semossCoreService.app.generateDatabaseImageURL(
            app.app_id
        );
        transformedApp.name = app.app_name;
        transformedApp.id = app.app_id;
        transformedApp.type = app.app_type;

        return transformedApp;
    }
}
