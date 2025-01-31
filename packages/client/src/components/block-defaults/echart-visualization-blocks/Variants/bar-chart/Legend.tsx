import { useBlockSettings } from '@/hooks';
import { PathValue } from '@/types';
import { getValueByPath } from '@/utility';
import { styled, Switch } from '@semoss/ui';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

const StyledContainer = styled('div')<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    width: '100%',
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
}));

interface legendProps {
    id: string;
}

export const Legend = observer<legendProps>(({ id }) => {
    const { data, setData } = useBlockSettings<any>(id);
    const [value, setValue] = useState({});
    const [isLegendShown, setIsLegendShown] = useState<boolean>(false);
    const path = 'option';
    // get the value of the input (wrapped in usememo because of path prop)
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
    }, [computedValue]);
    useEffect(() => {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let legendShown = isLegendShown;
        if (option.hasOwnProperty('legend') && option['legend']) {
            legendShown = option['legend'].hasOwnProperty('show')
                ? option['legend']['show']
                : false;
        }
        setIsLegendShown(legendShown);
    }, []);

    function handleInputChange(fieldName, newVal) {
        setIsLegendShown((prevProps) => {
            return newVal;
        });
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        if (option['legend']) {
            option = {
                ...option,
                ['legend']: {
                    ...option['legend'],
                    ['show']: !option['legend']['show'],
                },
            };
        } else {
            option = {
                ...option,
                ['legend']: {
                    type: 'plain',
                    show: true,
                },
            };
        }
        runStateUpdateCustom(option);
    }
    //updating the state of Block with a debounce time
    function runStateUpdateCustom(updatedOption: PathValue<any, typeof path>) {
        setTimeout(() => {
            try {
                setData('option', updatedOption as PathValue<any, typeof path>);
            } catch (e) {
                console.log(e);
            }
        }, 300);
    }
    return (
        <>
            <StyledContainer display="inline-block">
                <Switch
                    checked={isLegendShown}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        handleInputChange('isLegendShown', e.target.checked);
                    }}
                    title="Show Legend"
                />
                <label htmlFor="showToolList">Show Legend</label>
            </StyledContainer>
        </>
    );
});
