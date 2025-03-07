import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { Paths, PathValue } from '@/types';
import { getValueByPath } from '@/utility';
import { styled, Switch, Typography } from '@semoss/ui';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    path: Paths<Block<D>['data'], 4>;
}
const StyledAxisDiv = styled('div')<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: 'row',
    padding: '0.5rem',
}));
const StyledTypography = styled(Typography)({
    paddingLeft: '10px',
});

export const LineTooltip = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState('');
        const [showTooltips, setShowTooltip] = useState(true);
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
            setValue(computedValue);
        }, [computedValue, data]);
        useEffect(() => {
            if (data.hasOwnProperty('option')) {
                reInitializeFeatures(data.option);
            }
        }, [id]);
        /**
         * Reinitializes the tooltip feature when the chart is loaded.
         * @param options - The options passed in when the chart is loaded.
         */
        const reInitializeFeatures = (options) => {
            // Check if the options include tooltip settings
            if (options.hasOwnProperty('tooltip')) {
                // Set the tooltip visibility based on the options
                setShowTooltip(options['tooltip']['show']);
            }
        };
        /**
         * Handles the change event for the toggle switch. Updates the state of showTooltips
         * and sets the tooltip.show property in the chart options.
         * @param e - The event object from the toggle switch
         */
        const showTooltip = (e: ChangeEvent<HTMLInputElement>) => {
            let option = JSON.parse(value);
            // Toggle the state of showTooltips
            setShowTooltip(!showTooltips);
            // Update the tooltip.show property in the chart options
            option['tooltip']['show'] = e.target.checked;
            // Update the chart options in the data
            setData(path, option as PathValue<D['data'], typeof path>);
        };
        return (
            <StyledAxisDiv>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showTooltips}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showTooltip(e)
                        }
                        title="Show Tooltip"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show Tooltip
                    </StyledTypography>
                </StyledAxisDiv>
            </StyledAxisDiv>
        );
    },
);
