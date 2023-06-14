'use strict';

import './kpi.scss';
import visualizationUniversal from '@/core/store/visualization/visualization.js';
import { THEME } from '@/core/constants.js';

export default angular.module('app.kpi.directive', []).directive('kpi', kpi);

kpi.$inject = [];

function kpi() {
    kpiLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    kpiCtrl.$inject = [];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        template: require('./kpi.directive.html'),
        controller: kpiCtrl,
        link: kpiLink,
        scope: {},
        bindToController: {},
        controllerAs: 'kpi',
    };

    function kpiCtrl() {}

    function kpiLink(scope, ele, attrs, ctrl) {
        let autoscale = false,
            verticalAlign = false;

        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];
        scope.kpi.groups = [];

        /**
         * @name setData
         * @desc setData for the visualization and paints testestest
         * @returns {void}
         */
        function setData() {
            let keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.KPI'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.KPI'
                    ) || {},
                sharedTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.shared'
                    ) || {},
                colorByValue = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions = angular.extend(sharedTools, individualTools),
                valueSize,
                titleSize,
                valueFill,
                titleFill,
                valueWeight,
                titleWeight,
                valueFontFamily,
                titleFontFamily,
                backgroundFill,
                justification,
                newGroup,
                wrapTitle,
                value,
                displayValue,
                borderSettings,
                updatedTitle,
                titleArr,
                dimensionName,
                formatType,
                formatDataValuesActive,
                formatDimension,
                j,
                colorPalette;

            // set the fill. The order of importance is
            // 1. use the default theme color
            // 2. use the settings color
            // 3. use color by value

            // first pull parent 'All Dimensions' kpi settings
            colorPalette = uiOptions.color;
            if (colorPalette && colorPalette.length > 0) {
                valueFill = colorPalette[0];
                titleFill = colorPalette[0];
            }

            if (uiOptions && uiOptions.hasOwnProperty('kpi')) {
                // Font color
                valueFill =
                    uiOptions.kpi.value.fontColor || THEME.kpi.value.fontColor;
                titleFill =
                    uiOptions.kpi.label.fontColor || THEME.kpi.label.fontColor;

                // Font Size
                valueSize =
                    uiOptions.kpi.value.fontSize || THEME.kpi.value.fontSize;
                titleSize =
                    uiOptions.kpi.label.fontSize || THEME.kpi.label.fontSize;

                // Font Family
                valueFontFamily =
                    uiOptions.kpi.value.fontFamily ||
                    THEME.kpi.value.fontFamily;
                titleFontFamily =
                    uiOptions.kpi.label.fontFamily ||
                    THEME.kpi.label.fontFamily;

                // Font Weight
                valueWeight =
                    uiOptions.kpi.value.fontWeight ||
                    THEME.kpi.value.fontWeight;
                titleWeight =
                    uiOptions.kpi.label.fontWeight ||
                    THEME.kpi.label.fontWeight;
            } else {
                // Font color
                valueFill = THEME.kpi.value.fontColor;
                titleFill = THEME.kpi.label.fontColor;

                // Font Size
                valueSize = THEME.kpi.value.fontSize;
                titleSize = THEME.kpi.label.fontSize;

                // Font Family
                valueFontFamily = THEME.kpi.value.fontFamily;
                titleFontFamily = THEME.kpi.label.fontFamily;

                // Font Weight
                valueWeight = THEME.kpi.value.fontWeight;
                titleWeight = THEME.kpi.label.fontWeight;
            }

            if (uiOptions && uiOptions.hasOwnProperty('kpiBackgroundColor')) {
                backgroundFill = uiOptions.kpiBackgroundColor;
            } else {
                backgroundFill = '';
            }

            if (
                uiOptions &&
                uiOptions.hasOwnProperty('kpiTitleText') &&
                uiOptions.kpiTitleText
            ) {
                updatedTitle = uiOptions.kpiTitleText;
                titleArr = uiOptions.kpiTitleText;
            }

            if (uiOptions && uiOptions.hasOwnProperty('kpiAutoScale')) {
                autoscale = uiOptions.kpiAutoScale;
            } else {
                autoscale = false;
            }

            if (uiOptions && uiOptions.hasOwnProperty('kpiVerticalAlign')) {
                verticalAlign = uiOptions.kpiVerticalAlign;
            } else {
                verticalAlign = false;
            }

            if (uiOptions && uiOptions.hasOwnProperty('kpiWrapTitle')) {
                wrapTitle = uiOptions.kpiWrapTitle;
            } else {
                wrapTitle = false;
            }

            if (uiOptions && uiOptions.hasOwnProperty('kpiJustification')) {
                justification = uiOptions.kpiJustification;
            } else {
                justification = 'middle';
            }

            if (
                uiOptions &&
                uiOptions.hasOwnProperty('kpiBorder') &&
                uiOptions.kpiBorder
            ) {
                borderSettings = {
                    borderColor: uiOptions.kpiBorderColor,
                    borderWidth: uiOptions.kpiBorderWidth,
                    borderStyle: uiOptions.kpiBorderStyle,
                };
            } else {
                borderSettings = false;
            }

            scope.kpi.groups = [];
            // look for the keys that are dimensions, we will use this to paint the data
            for (
                let keyIdx = 0, keyLen = keys.length;
                keyIdx < keyLen;
                keyIdx++
            ) {
                if (keys[keyIdx].model === 'dimension') {
                    value = 0;
                    formatDataValuesActive = false;
                    newGroup = {};
                    dimensionName = keys[keyIdx].alias;
                    // get primary db format type
                    formatType = visualizationUniversal.mapFormatOpts(
                        keys[keyIdx]
                    );

                    for (
                        let headerIdx = 0, headerLen = data.headers.length;
                        headerIdx < headerLen;
                        headerIdx++
                    ) {
                        if (
                            data.headers[headerIdx] === dimensionName &&
                            data.values.length > 0
                        ) {
                            value = data.values[0][headerIdx];
                        }
                    }
                    // if user has updated formatting rules in widget, override db format types
                    if (uiOptions && uiOptions.formatDataValues) {
                        for (
                            j = 0;
                            j < uiOptions.formatDataValues.formats.length;
                            j++
                        ) {
                            formatDimension =
                                uiOptions.formatDataValues.formats[j].dimension;
                            if (formatDimension === dimensionName) {
                                formatType =
                                    uiOptions.formatDataValues.formats[j];
                                formatDataValuesActive = true;
                            }
                        }
                    }

                    // for old KPIs only apply round and format for those not using the format data values widget
                    // TODO remove once this becomes obsolete
                    if (!formatDataValuesActive) {
                        if (uiOptions && uiOptions.hasOwnProperty('kpiRound')) {
                            if (uiOptions.kpiRound) {
                                let shift = 100; // default
                                if (uiOptions.hasOwnProperty('kpiRoundShift')) {
                                    shift = Math.pow(
                                        10,
                                        uiOptions.kpiRoundShift
                                    );
                                }
                                value = Math.round(value * shift) / shift;
                            }
                        }

                        if (
                            uiOptions &&
                            uiOptions.hasOwnProperty('kpiFormat')
                        ) {
                            if (uiOptions.kpiFormat === 'None') {
                                displayValue = value;
                            } else if (uiOptions.kpiFormat === '$ USD') {
                                displayValue = `$${value}`;
                            } else if (uiOptions.kpiFormat === '% Percentage') {
                                displayValue = `${value}%`;
                            }
                        } else {
                            // if no kpi settings or format data values are applied then use the primary db type to format
                            displayValue = visualizationUniversal.formatValue(
                                value,
                                formatType
                            );
                        }
                    } else {
                        // if format data values widget applied then use new format rules
                        displayValue = visualizationUniversal.formatValue(
                            value,
                            formatType
                        );
                    }

                    // check if updatedTitle is array for multiple KPIs or string
                    if (titleArr && typeof titleArr !== 'string') {
                        updatedTitle = titleArr[dimensionName];
                    }

                    newGroup = {
                        value: value,
                        displayValue: displayValue,
                        alias: dimensionName,
                        title: updatedTitle
                            ? updatedTitle
                            : String(dimensionName).replace(/_/g, ' '),
                        valueSize: valueSize,
                        titleSize: titleSize,
                        valueFill: valueFill,
                        titleFill: titleFill,
                        valueWeight: valueWeight,
                        titleWeight: titleWeight,
                        valueFontFamily: valueFontFamily,
                        titleFontFamily: titleFontFamily,
                        backgroundFill: backgroundFill,
                        autoscale: autoscale,
                        borderSettings: borderSettings,
                        justification: justification,
                        wrapTitle: wrapTitle,
                        lines: [],
                    };

                    // only update settings if entered for a specific dimension to preserve old KPIs
                    if (
                        uiOptions.hasOwnProperty('kpiDimensions') &&
                        uiOptions.kpiDimensions
                    ) {
                        for (let dim in uiOptions.kpiDimensions) {
                            if (dim === dimensionName) {
                                newGroup.valueFill =
                                    uiOptions.kpiDimensions[dim].kpiColor;
                                newGroup.titleFill =
                                    uiOptions.kpiDimensions[dim].kpiColor;
                                newGroup.backgroundFill =
                                    uiOptions.kpiDimensions[
                                        dim
                                    ].kpiBackgroundColor;
                                newGroup.valueSize =
                                    uiOptions.kpiDimensions[dim].kpiValueSize;
                                newGroup.titleSize =
                                    uiOptions.kpiDimensions[dim].kpiTitleSize;
                                newGroup.autoscale =
                                    uiOptions.kpiDimensions[dim].kpiAutoScale;
                                if (
                                    uiOptions.kpiDimensions[dim]
                                        .kpiTitleText !== ''
                                ) {
                                    newGroup.title =
                                        uiOptions.kpiDimensions[
                                            dim
                                        ].kpiTitleText;
                                }
                                // for old KPis check if new setting options exists
                                if (
                                    uiOptions.kpiDimensions[dim].kpiFontFamily
                                ) {
                                    newGroup.valueFontFamily =
                                        uiOptions.kpiDimensions[
                                            dim
                                        ].kpiFontFamily;
                                    newGroup.titleFontFamily =
                                        uiOptions.kpiDimensions[
                                            dim
                                        ].kpiFontFamily;
                                }
                                if (
                                    uiOptions.kpiDimensions[dim].hasOwnProperty(
                                        'kpiBorder'
                                    ) &&
                                    uiOptions.kpiDimensions[dim].kpiBorder
                                ) {
                                    newGroup.borderSettings = {
                                        borderColor:
                                            uiOptions.kpiDimensions[dim]
                                                .kpiBorderColor,
                                        borderWidth:
                                            uiOptions.kpiDimensions[dim]
                                                .kpiBorderWidth,
                                        borderStyle:
                                            uiOptions.kpiDimensions[dim]
                                                .kpiBorderStyle,
                                    };
                                } else {
                                    newGroup.borderSettings = false;
                                }

                                if (
                                    uiOptions.kpiDimensions[dim]
                                        .kpiJustification
                                ) {
                                    newGroup.justification =
                                        uiOptions.kpiDimensions[
                                            dim
                                        ].kpiJustification;
                                }

                                if (
                                    uiOptions.kpiDimensions[dim].hasOwnProperty(
                                        'kpiWrapTitle'
                                    ) &&
                                    uiOptions.kpiDimensions[dim].kpiWrapTitle
                                ) {
                                    newGroup.wrapTitle =
                                        uiOptions.kpiDimensions[
                                            dim
                                        ].kpiWrapTitle;
                                } else {
                                    newGroup.wrapTitle = false;
                                }
                            }
                        }
                    }

                    scope.kpi.groups.push(newGroup);
                }
            }

            if (scope.kpi.groups.length === 0) {
                console.error('Dimension is required');
                return;
            }

            colorByValue.forEach(function (rule) {
                for (
                    let valueIdx = 0, valueLen = rule.valuesToColor.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    for (
                        let groupIdx = 0;
                        groupIdx < scope.kpi.groups.length;
                        groupIdx++
                    ) {
                        let group = scope.kpi.groups[groupIdx];
                        if (
                            group.alias === rule.colorOn &&
                            group.value === rule.valuesToColor[valueIdx]
                        ) {
                            group.valueFill = rule.color;
                            group.titleFill = rule.color;
                        }
                    }
                }
            });

            // get container to add svgs to
            var container = ele[0].querySelector('.kpi');

            // remove any previously set kpi groups before resetting
            while (container.firstChild) {
                container.removeChild(container.lastChild);
            }

            // create svg elements and paint
            for (let kpiIdx = 0; kpiIdx < scope.kpi.groups.length; kpiIdx++) {
                let grp = scope.kpi.groups[kpiIdx],
                    newValueEle,
                    newTitleEle,
                    newGroupEle,
                    newSvgEle;

                newSvgEle = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'svg'
                );
                newGroupEle = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'g'
                );
                newValueEle = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'text'
                );

                newValueEle.setAttribute('text-anchor', `${grp.justification}`);
                newValueEle.style.fontSize = grp.valueSize;
                newValueEle.style.fontFamily = grp.valueFontFamily;
                newValueEle.style.fontWeight = grp.valueWeight;
                newValueEle.style.fill = grp.valueFill;
                newValueEle.textContent = grp.displayValue;
                newGroupEle.appendChild(newValueEle);

                newTitleEle = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'text'
                );
                newTitleEle.setAttribute('dy', '1.5em');
                newTitleEle.setAttribute('text-anchor', `${grp.justification}`);
                newTitleEle.style.fontSize = grp.titleSize;
                newTitleEle.style.fontFamily = grp.titleFontFamily;
                newTitleEle.style.fontWeight = grp.titleWeight;
                newTitleEle.style.fill = grp.titleFill;
                newTitleEle.textContent = grp.title;
                newTitleEle.setAttribute('class', 'kpi__group__title');
                newGroupEle.appendChild(newTitleEle);

                newGroupEle.setAttribute('class', 'kpi__group');

                newSvgEle.appendChild(newGroupEle);
                newSvgEle.setAttribute('class', 'kpi__svg');
                newSvgEle.setAttribute('viewBox', '0 0 100 100');
                newSvgEle.style.background = grp.backgroundFill;

                if (grp.borderSettings) {
                    let borderString =
                        grp.borderSettings.borderWidth +
                        'px ' +
                        grp.borderSettings.borderStyle +
                        ' ' +
                        grp.borderSettings.borderColor;
                    newSvgEle.style.border = borderString;
                }
                container.appendChild(newSvgEle);
                // wrap title text
                if (grp.wrapTitle && !grp.autoscale) {
                    wrapTitleText(kpiIdx);
                }
            }
            resizeAll();
        }

        /**
         * @name wrapTitleText
         * @desc update title ele with multiple lines if wrap title text setting selected
         * @param {number} grpIdx - index of KPI to wrap title text
         * @returns {void}
         */
        function wrapTitleText(grpIdx) {
            let allSvgEle,
                groupEle,
                titleEle,
                newLineEle,
                svg,
                grp,
                splitTitle,
                oldLine,
                newLine,
                boxWidth;

            // get all KPI groups
            allSvgEle = ele[0].querySelectorAll('.kpi__svg');

            // loop through and assign svg width and get min group width / height to assign all svg elements to
            if (grpIdx || grpIdx === 0) {
                svg = allSvgEle[grpIdx];
                grp = scope.kpi.groups[grpIdx];
                groupEle = svg.querySelector('.kpi__group');
                titleEle = groupEle.querySelector('.kpi__group__title');
                splitTitle = grp.title.split(' ');
                oldLine = '';
                newLine = '';

                // reset lines
                grp.lines = [];

                for (let wordIdx = 0; wordIdx < splitTitle.length; wordIdx++) {
                    newLine = oldLine + splitTitle[wordIdx] + ' ';
                    titleEle.textContent = newLine;
                    boxWidth = groupEle.getBBox().width;

                    // check if title element with current word count is wider than viewbox
                    if (boxWidth > 100) {
                        // check if its the first word in a line
                        if (oldLine === '') {
                            grp.lines.push(newLine);
                            oldLine = '';
                        } else {
                            grp.lines.push(oldLine);
                            oldLine = splitTitle[wordIdx] + ' ';
                            // the last word in a title always needs to be added
                            if (wordIdx === splitTitle.length - 1) {
                                grp.lines.push(splitTitle[wordIdx]);
                            }
                        }
                    } else {
                        if (wordIdx === splitTitle.length - 1) {
                            grp.lines.push(newLine);
                        }
                        oldLine = newLine;
                    }
                }

                // add tspan components if more than 1 line
                if (grp.lines.length > 1) {
                    titleEle.textContent = '';
                    for (
                        let lineIdx = 0;
                        lineIdx < grp.lines.length;
                        lineIdx++
                    ) {
                        newLineEle = document.createElementNS(
                            'http://www.w3.org/2000/svg',
                            'tspan'
                        );
                        if (lineIdx === 0) {
                            newLineEle.setAttribute('dy', '1.5em');
                        } else {
                            newLineEle.setAttribute('dy', '1.0em');
                        }
                        newLineEle.setAttribute('x', '0%');
                        newLineEle.textContent = grp.lines[lineIdx].trim();
                        titleEle.appendChild(newLineEle);
                    }
                }
            }
        }

        /**
         * @name resizeAll
         * @desc resize the visualization
         * @returns {void}
         */
        function resizeAll() {
            let allSvgEle,
                svgWidth = 100,
                svg,
                grp,
                groupEle,
                groupEleBB,
                groupCount,
                widthTransform = 100,
                heightTransform = 100;

            // get all KPI groups
            allSvgEle = ele[0].querySelectorAll('.kpi__svg');
            groupCount = scope.kpi.groups.length;
            svgWidth = 100 / groupCount;

            // loop through and assign svg width and get min group width / height to assign all svg elements to
            for (let grpIdx = 0; grpIdx < allSvgEle.length; grpIdx++) {
                svg = allSvgEle[grpIdx];
                grp = scope.kpi.groups[grpIdx];
                groupEle = svg.querySelector('.kpi__group');
                groupEleBB = groupEle.getBBox();

                if (verticalAlign) {
                    svg.setAttribute('height', `${svgWidth}%`);
                    svg.setAttribute('width', '100%');
                } else {
                    svg.setAttribute('width', `${svgWidth}%`);
                    svg.setAttribute('height', '100%');
                }

                if (100 / groupEleBB.width < widthTransform) {
                    widthTransform = 100 / groupEleBB.width;
                }
                if (100 / groupEleBB.height < heightTransform) {
                    heightTransform = 100 / groupEleBB.height;
                }
            }

            // loop through again and assign all svg elements to same scale if autoscale selected
            for (let i = 0; i < allSvgEle.length; i++) {
                svg = allSvgEle[i];
                grp = scope.kpi.groups[i];
                groupEle = svg.querySelector('.kpi__group');
                let xTranslate = 50;

                switch (grp.justification) {
                    case 'start':
                        xTranslate = 0;
                        break;
                    case 'end':
                        xTranslate = 100;
                        break;
                    default:
                        xTranslate = 50;
                }

                if (grp.autoscale) {
                    groupEle.setAttribute(
                        'transform',
                        `translate(${xTranslate},50)scale(${
                            widthTransform < heightTransform
                                ? widthTransform
                                : heightTransform
                        })`
                    );
                } else {
                    groupEle.setAttribute(
                        'transform',
                        `translate(${xTranslate},50)scale(1)`
                    );
                }
            }
        }

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            let resizeListener,
                updateTaskListener,
                addDataListener,
                updateOrnamentsListener;

            // bind listeners
            resizeListener = scope.widgetCtrl.on('resize-widget', resizeAll);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );

            scope.$on('$destroy', function () {
                resizeListener();
                updateTaskListener();
                updateOrnamentsListener();
                addDataListener();
            });

            setData();
        }

        initialize();
    }
}
