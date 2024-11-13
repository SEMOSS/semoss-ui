import { Button } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { Block, BlockDef, QueryState } from '@/stores';
import { Paths, PathValue } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { useBlockSettings } from '@/hooks';
import { getValueByPath } from '@/utility';
import { computed } from 'mobx';

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const ToolTips = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const [value, setChartFeaturesValue] = useState('');
        const { data, setData } = useBlockSettings<D>(id);
        const [canshowVegaTooltip, setCanShowvegaTooltip] =
            useState<any>(false);
        const [canshowEchartsTooltip, setCanShowEchartsTooltip] =
            useState<any>(false);
        const [variation, setVariation] = useState<any>('');
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();
        useEffect(() => {
            setChartFeaturesValue(computedValue);
        }, [computedValue, data]);
        useEffect(() => {
            console.log(data.variation, data, 'variation');
            setVariation(data.widget ? data.widget : '');
        }, []);
        useEffect(() => {
            console.log(data, 'data');
            if (data) {
                const json: PathValue<D['data'], typeof path> =
                    JSON.parse(computedValue);
                let state = json['_state'];
                if (state && state.hasOwnProperty('styling')) {
                    reinitializeFeatures(state['styling']);
                }
            }
        }, []);
        const reinitializeFeatures = (state) => {
            console.log(state, 'state');
            setCanShowEchartsTooltip(
                state.canShowToolTipEchart
                    ? state.canShowToolTipEchart
                    : canshowEchartsTooltip,
            );
            setCanShowvegaTooltip(
                state.canShowToolTipVega
                    ? state.canShowToolTipVega
                    : canshowVegaTooltip,
            );
        };

        const showTooltipForEcharts = () => {
            console.log(data, 'data');
            const spec = data.Option;
            console.log(spec, 'spec');
            spec['tooltip']['show'] = spec['tooltip']['show'] ? false : true;
            setCanShowEchartsTooltip(canshowEchartsTooltip ? false : true);

            spec['_state'] =
                spec['_state'] && Object.keys(spec['_state']).length > 0
                    ? spec['_state']
                    : {};
            spec['_state']['styling'] = {
                ...spec['_state']['styling'],
                canShowToolTipEchart: canshowEchartsTooltip,
            };
            setData(path, spec as PathValue<D['data'], typeof path>);
            setCanShowEchartsTooltip(canshowEchartsTooltip ? false : true);
            setChartFeaturesValue(JSON.stringify(spec));
        };

        const showTooltipForVega = () => {
            console.log(data, 'data');
            const spec = JSON.parse(value);
            console.log(spec, 'spec');
            spec.layer[0].mark.tooltip = spec.layer[0].mark.tooltip
                ? false
                : true;
            setCanShowvegaTooltip(canshowVegaTooltip ? false : true);
            spec['_state'] =
                spec['_state'] && Object.keys(spec['_state']).length > 0
                    ? spec['_state']
                    : {};
            spec['_state']['styling'] = {
                ...spec['_state']['styling'],
                canShowToolTipVega: spec.layer[0].mark.tooltip,
            };
            setData(path, spec as PathValue<D['data'], typeof path>);
            console.log(spec, 'test12345');
            setChartFeaturesValue(JSON.stringify(spec));
        };

        return (
            <Button
                onClick={
                    variation == 'e-chart'
                        ? showTooltipForEcharts
                        : showTooltipForVega
                }
            >
                Show Tooltip
            </Button>
        );
    },
);
