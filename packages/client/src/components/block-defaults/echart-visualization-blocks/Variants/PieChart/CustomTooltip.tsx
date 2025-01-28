import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { Paths, PathValue } from '@/types';
import { getValueByPath } from '@/utility';
import { Slider, styled, Switch, TextField, Typography } from '@semoss/ui';
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

export const CustomTooltip = observer(
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
                reinitializeFeatures(data.option);
            }
        }, [id]);

        const reinitializeFeatures = (options) => {
            if (options.hasOwnProperty('tooltip')) {
                setShowTooltip(options['tooltip']['show']);
            }
        };
        const showTooltip = (e) => {
            let option = JSON.parse(value);
            setShowTooltip(!showTooltips);
            option['tooltip']['show'] = e.target.checked;
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
