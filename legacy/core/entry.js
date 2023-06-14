// Outside CSS
import '../node_modules/font-awesome/css/font-awesome.min.css';

// Resource CSS
import './resources/css/buttons.scss';
import './resources/css/containers.scss';
import './resources/css/utilities.scss';
import './resources/css/chart.scss';
import './resources/css/driver.scss';

import 'jquery';

// Outisde Libraries
import 'angular';
import 'angular-aria';
import 'angular-messages';
import 'angular-sanitize';
import 'angular-cookies';
import 'angular-drag-and-drop-lists/angular-drag-and-drop-lists.min.js';

import '@uirouter/angularjs';
import 'satellizer';
import 'oclazyload';
import Flow from 'ng-flow/dist/ng-flow-standalone.min.js';

window.Flow = Flow;

/** This starts to prefetch when you land on the page */
import(/* webpackChunkName: "d3"  */ /* webpackPrefetch: true */ 'd3');
import(
    /* webpackChunkName: "echarts"  */ /* webpackPrefetch: true */ 'echarts'
);
import(
    /* webpackChunkName: "ag-grid" */ /* webpackPrefetch: true */ 'ag-grid-community'
);

// style
import '../style/src/index.js';

// services
import './services/settings/settings.service.ts';
import './services/app/app.service.ts';
import './services/alert/alert.service.ts';
import './services/event/event.service.ts';
import './services/handle/handle.service.ts';
import './services/loading/loading.service.ts';
import './services/message/message.service.ts';
import './services/context-menu/context-menu.service.ts';
import './services/mode/mode.service.ts';
import './services/monolith/monolith.service.ts';
import './services/options/options.service.ts';
import './services/pixel-timer/pixel-timer.service.ts';
import './services/security/security.service.ts';
import './services/selected/selected.service.ts';
import './services/semoss-core/semoss-core.service.ts';
import './services/semoss-interceptor/semoss-interceptor.service.ts';
import './services/state/state.service.ts';
import './services/store/store.service.ts';
import './services/tour/tour.service.ts';
import './services/tracking/tracking.service.ts';
import './services/visualization/visualization.service.ts';
import './services/widget/widget.service.ts';
import './services/widget-tab/widget-tab.service.ts';
import './services/workspace/workspace.service.ts';
import './services/workbook/workbook.service.ts';
import './services/external/external.service.ts';

// config
import './app.config.js';

// Modified external libraries
import './resources/js/tableauConnector/connectors.js';
import './resources/js/tableauConnector/config.js';

// filters
import './filters/filters.js';

// components
import './components/root/root.directive.ts';
import './components/dynamic/dynamic.directive.js';
import './components/enterkey/enterkey.directive.js';
import './components/drag-item/drag-item.directive.js';
import './components/drag-drop/drag-drop.directive.js';
import './components/loading-screen/loading-screen.directive.ts';

import './components/context-menu/context-menu.directive.js';
import './components/edit-insight/edit-insight.directive.ts';
import './components/share-insight/share-insight.directive.ts';
import './components/edit-database/edit-database.directive.ts';
import './components/edit-project/edit-project.directive.ts';
import './components/request-database/request-database.directive.ts';
import './components/template-management/template-management.directive.js';
import './components/template-management/create-template/create-template.directive.js';

import './components/cookie-banner/cookie-banner.directive.ts';
import './components/session-timer/session-timer.directive.js';
import './components/redirect-insight/redirect-insight.directive.js';
import './components/widget-compiler/widget-compiler.directive.js';
import './components/builder/builder.directive.js';
import './components/builder/form-builder/form-builder.directive.js';
import './components/builder/form-builder/form-loader/form-loader.directive.js';
import './components/edit-assisted-query/edit-assisted-query.directive.ts';

import './components/preview/preview.directive.js';

// formula
import './components/formula/formula.directive.ts';
import './components/manualformula/manualformula.directive.ts';
import './components/query-struct-filter/query-struct-filter.directive.ts';

import './components/widget/widget.directive.ts';
import './components/widget-view/widget-view.directive.ts';
import './components/widget-mode/widget-mode.directive.js';
import './components/widget-placeholder/widget-placeholder.directive.js';

import './components/app-list-dropdown/app-list-dropdown.directive.ts';
import './components/browser/browser.directive.ts';
import './components/browser-asset/browser-asset.directive.ts';

// metamodel
import './components/metamodel/metamodel.directive.ts';

// workspace
import './components/insight/insight.directive.ts';
import './components/workspace/workspace.directive.ts';
import './components/workbook/workbook.directive.ts';
import './components/worksheet/worksheet.directive.ts';
import './components/panel/panel.directive.ts';
import './components/panel-mask/panel-mask.directive.ts';

// terminal
import './components/terminal/terminal.directive.ts';

// tabs
import './components/widget-menu/widget-menu.directive.js';
import './components/widget-tab/widget-tab.directive.js';

// view
import './components/view/view.directive.ts';

import './components/visualization/visualization.directive.js';
import './components/text-editor-settings/text-editor-settings.directive.ts';

// views
import './components/home/home.directive.js';
import './components/viewer/viewer.directive.ts';
import './components/viewer-terminal/viewer-terminal.directive.ts';
import './components/viewer-html/viewer-html.directive.ts';
import './components/redirect/redirect.directive.js';
import './components/landing/landing.directive.ts';
import './components/create-project/create-project.directive.ts';
import './components/upload-project/upload-project.directive.ts';
import './components/upload-image/upload-image.directive.ts';
import './components/catalog/catalog.directive.ts';
import './components/build/build.directive.js';
import './components/project/project.directive.ts';
import './components/document-qa/document-qa.directive';

// markdown
import './components/markdown/markdown.directive.ts';

import './components/rewrite/rewrite.directive.ts';

angular.module('app', [
    /** angular libs **/
    'ngAria',
    'ngMessages',
    'ngSanitize',
    'ngCookies',
    'ui.router',
    'satellizer',
    'oc.lazyLoad',
    'flow',
    'smss-style',
    'dndLists',
    /** services **/
    'app.alert.service',
    'app.monolith.service',
    'app.store.service',
    'app.message.service',
    'app.loading.service',
    'app.security.service',
    'app.widget.service',
    'app.widget-tab.service',
    'app.app.service',
    'app.semoss-core.service',
    'app.event.service',
    'app.options.service',
    'app.context-menu.service',
    'app.mode.service',
    'app.selected.service',
    'app.handle.service',
    'app.visualization.service',
    'app.state.service',
    'app.tracking.service',
    'app.tour.service',
    'app.settings.service',
    'app.semoss-interceptor.service',
    'app.pixel-timer.service',
    'app.workspace.service',
    'app.workbook.service',
    'app.external.service',

    /** Configuration **/
    'app.constants',
    'app.config',

    /** filters **/
    'app.filters',

    /** utility */
    'app.root.directive',
    'app.dynamic.directive',
    'app.enterkey.directive',
    'app.drag-item.directive',
    'app.drag-drop.directive',
    'app.loading-screen.directive',

    'app.cookie-banner.directive',
    'app.context-menu.directive',
    'app.session-timer.directive',
    'app.redirect-insight.directive',
    'app.edit-insight.directive',
    'app.share-insight.directive',
    'app.edit-database.directive',
    'app.request-database.directive',
    'app.edit-project.directive',

    'app.widget.directive',
    'app.widget-view.directive',
    'app.widget-mode.directive',
    'app.widget-placeholder.directive',

    'app.app-list-dropdown.directive',
    'app.browser.directive',
    'app.browser-asset.directive',

    /** workspace */
    'app.insight.directive',
    'app.workspace.directive',
    'app.workbook.directive',
    'app.worksheet.directive',
    'app.panel.directive',
    'app.panel-mask.directive',

    /** terminal */
    'app.terminal.directive',

    /** tabs*/
    'app.widget-menu.directive',
    'app.widget-tab.directive',
    'app.view.directive',
    'app.visualization.directive',
    'app.text-editor-settings.directive',

    /** widget compiler **/
    'app.widget-compiler.directive',

    /** preview */
    'app.preview.directive',

    /** formula */
    'app.formula.directive',
    'app.manualformula.directive',
    'app.query-struct-filter.directive',

    /** builder */
    'app.builder.directive',
    'app.form-builder.directive',
    'app.form-loader.directive',

    /** Template Management */
    'app.template-management.directive',
    'app.create-template.directive',

    /** Metamodel **/
    'app.metamodel.directive',

    /** views */
    'app.home.directive',
    'app.viewer.directive',
    'app.viewer-terminal.directive',
    'app.viewer-html.directive',
    'app.redirect.directive',
    'app.landing.directive',
    'app.create-project.directive',
    'app.upload-project.directive',
    'app.upload-image.directive',
    'app.catalog.directive',
    'app.build.directive',
    'app.project.directive',
    'app.edit-assisted-query.directive',
    'app.document-qa.directive',
    'app.rewrite.directive',
    'react',
]);

import { react2angular } from 'react2angular';
import { Moose } from '@client/exports';

angular
    .module('react', [])
    .component(
        'reactMoose',
        react2angular(
            Moose,
            ['options', 'value', 'insightID', 'module'],
            ['semossCoreService']
        )
    );
