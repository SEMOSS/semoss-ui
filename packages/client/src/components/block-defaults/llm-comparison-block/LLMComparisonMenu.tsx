import { BlockComponent } from '@/stores';
import { useBlocks, useRootStore } from '@/hooks';
import { styled, ToggleTabsGroup, useNotification } from '@semoss/ui';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsSubMenu } from './SettingsSubMenu';
import { ConfigureSubMenu } from './ConfigureSubMenu';
import { TypeLlmComparisonForm, TypeLlmConfig } from '@/components/workspace';
import { LLMComparisonContext } from '@/contexts';
import {
    LlmComparisonFormDefaultValues,
    modelEngineOutput,
} from './LlmComparison.utility';

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    height: '36px',
    alignItems: 'center',
    width: '306px',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '32px',
    width: '50%',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(2),
}));

type Mode = 'configure' | 'settings';

export const LLMComparisonMenu: BlockComponent = ({ id }) => {
    const notification = useNotification();
    const { monolithStore } = useRootStore();
    const [mode, setMode] = useState<Mode>('configure');
    const [allModels, setAllModels] = useState<TypeLlmConfig[]>([]);

    const { state: appState } = useBlocks();
    const variables = Object.entries(appState.variables);

    const { control, setValue, handleSubmit, getValues, watch } =
        useForm<TypeLlmComparisonForm>({
            defaultValues: LlmComparisonFormDefaultValues,
        });

    useEffect(() => {
        notification.add({
            color: 'info',
            message:
                'The LLM Comparison tool is currently in beta, please contact the administrator with any issues with this part of the tool',
        });

        fetchAllModels();
    }, []);

    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await monolithStore.runQuery(pixel);

        const modelled = modelEngineOutput(res.pixelReturn[0].output);
        setAllModels(modelled);
    };

    useEffect(() => {
        fetchDefaultVariant();
    }, [variables.length]);

    const fetchDefaultVariant = async () => {
        const vars = [];
        variables.forEach((v) => {
            const val = v[1];
            if (val.type === 'model') {
                const value = {
                    ...val,
                    value: appState.getVariable(val.to, val.type),
                };
                vars.push(value);
            }
        });

        let pixel = '';

        vars.forEach((v) => {
            pixel += `GetEngineMetadata(engine=["${v.value}"]);`;
        });

        const resp = (await monolithStore.runQuery(pixel)).pixelReturn;

        resp.forEach((o) => {
            const output = o.output;
            const found = vars.find(
                (variable) => variable.value === output.database_id,
            );

            found.database_name = output.database_name;
            found.database_subtype = output.database_subtype;
            found.database_type = output.database_type;
        });

        console.log('VARS', vars);
    };

    return (
        <LLMComparisonContext.Provider
            value={{
                control,
                setValue,
                getValues,
                handleSubmit,
                watch,
                allModels,
            }}
        >
            <StyledMenu>
                <StyledToggleTabsGroup
                    value={mode}
                    onChange={(e, val) => setMode(val as Mode)}
                >
                    <StyledToggleTabsGroupItem
                        label="Configure"
                        value="configure"
                    />
                    <StyledToggleTabsGroupItem
                        label="Settings"
                        value="settings"
                    />
                </StyledToggleTabsGroup>

                {mode === 'configure' && <ConfigureSubMenu />}

                {mode === 'settings' && <SettingsSubMenu />}
            </StyledMenu>
        </LLMComparisonContext.Provider>
    );
};
