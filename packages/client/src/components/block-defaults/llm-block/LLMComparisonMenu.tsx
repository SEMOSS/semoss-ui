import { BlockComponent } from '@/stores';
import { useBlock, useBlocks, useRootStore } from '@/hooks';
import { Stack, styled, ToggleTabsGroup, useNotification } from '@semoss/ui';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { QueryInputSettings } from '@/components/block-settings';
// import { SettingsSubMenu } from './SettingsSubMenu';
// import { ConfigureSubMenu } from './ConfigureSubMenu';
// import { TypeLlmComparisonForm, TypeLlmConfig } from '@/components/workspace';
// import { LLMComparisonContext } from '@/contexts';
// import {
//     LlmComparisonFormDefaultValues,
//     modelEngineOutput,
// } from './LlmComparison.utility';

import { LLMVariantConfigure } from './LLMVariantConfigure';

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
    // const [allModels, setAllModels] = useState<TypeLlmConfig[]>([]);
    const [allModels, setAllModels] = useState([]);

    const [defaultVariant, setDefaultVariant] = useState([]);

    const { state: appState } = useBlocks();
    const block = useBlock(id);
    const pointer = block.data['to'];

    // const { control, setValue, handleSubmit, getValues, watch } =
    //     useForm<TypeLlmComparisonForm>({
    //         defaultValues: LlmComparisonFormDefaultValues,
    //     });

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

        // const modelled = modelEngineOutput(res.pixelReturn[0].output);
        // setAllModels(modelled);
        setAllModels([]);
    };

    useEffect(() => {
        // if (pointer) {
        // fetchDefaultVariant();
        // }
    }, [pointer]);

    /**
     * The Default Variant is all the models used to generate a single response
     * We tie our UI components to either
     * A: A Whole Query Sheet that consists of llm-cell (Will expand)
     * B: A Singular cell that is an llm-cell (Will expand)
     *
     * Use that to get a default variant
     */
    const fetchDefaultVariant = async () => {
        if (typeof pointer !== 'string') {
            notification.add({
                message: 'Unable to retrieve variant data',
            });
            return;
        }

        const vars = [];

        const to = appState.variables[pointer].to;
        const querySheet = appState.queries[to];

        Object.values(querySheet.cells).forEach((c) => {
            if (c.widget === 'llm') {
                vars.push(c.parameters);
            }
        });

        let pixel = '';

        vars.forEach((v) => {
            // Comes in parameterized
            const mId = appState.flattenVariable(v.modelId);
            pixel += `GetEngineMetadata(engine=["${mId}"]);`;
        });

        const resp = (await monolithStore.runQuery(pixel)).pixelReturn;

        resp.forEach((o) => {
            const output = o.output;
            const found = vars.find((variable) => {
                const mId = appState.flattenVariable(variable.modelId);

                return mId === output.database_id;
            });
            // debugger;

            found.database_name = output.database_name;
            found.database_subtype = output.database_subtype;
            found.database_type = output.database_type;
        });

        console.log('VARS', vars);
        setDefaultVariant(vars);
    };

    return (
        <Stack direction={'column'} gap={1} marginTop={1}>
            <QueryInputSettings id={id} label={'Response'} path={'to'} />
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
                {mode === 'configure' && (
                    <LLMVariantConfigure defaultVariant={defaultVariant} />
                )}
                {/* {mode === 'settings' && <SettingsSubMenu />} */}
            </StyledMenu>
        </Stack>
        // <LLMComparisonContext.Provider
        //     value={{
        //         control,
        //         setValue,
        //         getValues,
        //         handleSubmit,
        //         watch,
        //         allModels,
        //     }}
        // >
        //     <StyledMenu>
        //         <StyledToggleTabsGroup
        //             value={mode}
        //             onChange={(e, val) => setMode(val as Mode)}
        //         >
        //             <StyledToggleTabsGroupItem
        //                 label="Configure"
        //                 value="configure"
        //             />
        //             <StyledToggleTabsGroupItem
        //                 label="Settings"
        //                 value="settings"
        //             />
        //         </StyledToggleTabsGroup>

        //         {mode === 'configure' && <ConfigureSubMenu />}

        //         {mode === 'settings' && <SettingsSubMenu />}
        //     </StyledMenu>
        // </LLMComparisonContext.Provider>
    );
};
