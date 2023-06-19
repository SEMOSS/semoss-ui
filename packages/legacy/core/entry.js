// Outside CSS
import 'font-awesome/css/font-awesome.min.css';

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
import 'angular-drag-and-drop-lists/angular-drag-and-drop-lists.min';

import '@uirouter/angularjs';
import 'satellizer';
import 'oclazyload';
import Flow from 'ng-flow/dist/ng-flow-standalone.min';

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
import '../style/src/index';

// services
import './services/settings/settings.service';
import './services/app/app.service';
import './services/alert/alert.service';
import './services/event/event.service';
import './services/handle/handle.service';
import './services/loading/loading.service';
import './services/message/message.service';
import './services/context-menu/context-menu.service';
import './services/mode/mode.service';
import './services/monolith/monolith.service';
import './services/options/options.service';
import './services/pixel-timer/pixel-timer.service';
import './services/security/security.service';
import './services/selected/selected.service';
import './services/semoss-core/semoss-core.service';
import './services/semoss-interceptor/semoss-interceptor.service';
import './services/state/state.service';
import './services/store/store.service';
import './services/tour/tour.service';
import './services/tracking/tracking.service';
import './services/visualization/visualization.service';
import './services/widget/widget.service';
import './services/widget-tab/widget-tab.service';
import './services/workspace/workspace.service';
import './services/workbook/workbook.service';
import './services/external/external.service';

// config
import './app.config';

// Modified external libraries
import './resources/js/tableauConnector/connectors';
import './resources/js/tableauConnector/config';

// filters
import './filters/filters';

// components
import './components/root/root.directive';
import './components/dynamic/dynamic.directive';
import './components/enterkey/enterkey.directive';
import './components/drag-item/drag-item.directive';
import './components/drag-drop/drag-drop.directive';
import './components/loading-screen/loading-screen.directive';

import './components/context-menu/context-menu.directive';
import './components/edit-insight/edit-insight.directive';
import './components/share-insight/share-insight.directive';
import './components/edit-database/edit-database.directive';
import './components/edit-project/edit-project.directive';
import './components/request-database/request-database.directive';
import './components/template-management/template-management.directive';
import './components/template-management/create-template/create-template.directive';

import './components/cookie-banner/cookie-banner.directive';
import './components/session-timer/session-timer.directive';
import './components/redirect-insight/redirect-insight.directive';
import './components/widget-compiler/widget-compiler.directive';
import './components/builder/builder.directive';
import './components/builder/form-builder/form-builder.directive';
import './components/builder/form-builder/form-loader/form-loader.directive';
import './components/edit-assisted-query/edit-assisted-query.directive';

import './components/preview/preview.directive';

// formula
import './components/formula/formula.directive';
import './components/manualformula/manualformula.directive';
import './components/query-struct-filter/query-struct-filter.directive';

import './components/widget/widget.directive';
import './components/widget-view/widget-view.directive';
import './components/widget-mode/widget-mode.directive';
import './components/widget-placeholder/widget-placeholder.directive';

import './components/app-list-dropdown/app-list-dropdown.directive';
import './components/browser/browser.directive';
import './components/browser-asset/browser-asset.directive';

// metamodel
import './components/metamodel/metamodel.directive';

// workspace
import './components/insight/insight.directive';
import './components/workspace/workspace.directive';
import './components/workbook/workbook.directive';
import './components/worksheet/worksheet.directive';
import './components/panel/panel.directive';
import './components/panel-mask/panel-mask.directive';

// terminal
import './components/terminal/terminal.directive';

// tabs
import './components/widget-menu/widget-menu.directive';
import './components/widget-tab/widget-tab.directive';

// view
import './components/view/view.directive';

import './components/visualization/visualization.directive';
import './components/text-editor-settings/text-editor-settings.directive';

// views
import './components/home/home.directive';
import './components/viewer/viewer.directive';
import './components/viewer-terminal/viewer-terminal.directive';
import './components/viewer-html/viewer-html.directive';
import './components/redirect/redirect.directive';
import './components/landing/landing.directive';
import './components/create-project/create-project.directive';
import './components/upload-project/upload-project.directive';
import './components/upload-image/upload-image.directive';
import './components/catalog/catalog.directive';
import './components/build/build.directive';
import './components/project/project.directive';
import './components/document-qa/document-qa.directive';

// markdown
import './components/markdown/markdown.directive';

import './components/rewrite/rewrite.directive';

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
