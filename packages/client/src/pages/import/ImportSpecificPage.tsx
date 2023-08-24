import React from 'react';
import { styled, Box, useNotification } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { DATABASE_FORM_ROUTES } from '../engine-import/forms/forms';
import { StorageForm } from '../engine-import/forms/StorageForm';
import { ModelForm } from '../engine-import/forms/ModelForm';
import { useRootStore } from '@/hooks';

import { useImport } from '@/hooks';

const StyledBox = styled(Box)({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: '16px 16px 16px 16px',
    marginBottom: '32px',
});

export const ImportSpecificPage = () => {
    const [predictDataTypes, setPredictDataTypes] = React.useState(null);
    const [metamodel, setMetamodel] = React.useState(null);

    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();

    const insightId = configStore.store.insightID;

    const { steps, setIsLoading } = useImport();

    /**
     *
     * @param values
     * @returns
     * @desc determines what pixel to hit based on steps
     */
    const formSubmit = async (values) => {
        // Loading
        setIsLoading(true);

        /** Storage: START */
        if (values.type === 'storage') {
            const pixel = `CreateStorageEngine(storage=["${
                values.storage
            }"], storageDetails=[${JSON.stringify(values.fields)}])`;

            monolithStore.runQuery(pixel).then((response) => {
                const output = response.pixelReturn[0].output,
                    operationType = response.pixelReturn[0].operationType;

                setIsLoading(false);

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                    return;
                }

                notification.add({
                    color: 'success',
                    message: `Successfully created storage`,
                });

                navigate(`/storage/${output.database_id}`);
            });
            return;
        }
        /** Storage: END */

        /** Model: START */
        if (values.type === 'model') {
            const pixel = `CreateModelEngine(model=["${
                values.storage
            }"], modelDetails=[${JSON.stringify(values.fields)}])`;

            monolithStore.runQuery(pixel).then((response) => {
                const output = response.pixelReturn[0].output,
                    operationType = response.pixelReturn[0].operationType;

                setIsLoading(false);

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                    return;
                }

                notification.add({
                    color: 'success',
                    message: `Successfully added model`,
                });

                navigate(`/model/${output.database_id}`);
            });
            return;
        }
        /** Model: END */

        /** Connect to External: START */
        // I'll be hitting this reactor if dbDriver is in RDBMSTypeEnum on BE
        // if (values.type === 'connect') {
        //     const pixel = `ExternalJdbcTablesAndViews(conDetails=[
        //         ${JSON.stringify(values.conDetails)}
        //     ])`;

        //     const resp = await monolithStore.runQuery(pixel);
        //     const output = resp.pixelReturn[0].output,
        //         operationType = resp.pixelReturn[0].operationType;

        //     setIsLoading(false);

        //     if (operationType.indexOf('ERROR') > -1) {
        //         notification.add({
        //             color: 'error',
        //             message: output,
        //         });
        //     } else {
        //         setMetamodel(output);
        //     }
        //     return;
        // }
        /** Connect to External: END */

        /** Drag and Drop: START */
        if (values.METAMODEL_TYPE === 'As Suggested Metamodel') {
            monolithStore
                .uploadFile(values.FILE, insightId)
                .then((res: { fileName: string; fileLocation: string }[]) => {
                    const file = res[0].fileLocation;
                    monolithStore
                        .runQuery(
                            `PredictMetamodel(filePath=["${file}"], delimiter=["${values.DELIMETER}"], rowCount=[false])`,
                        )
                        .then((res) => {
                            const output = res.pixelReturn[0].output;
                            setIsLoading(false);
                            // format response to send to Form
                            setMetamodel(output);
                        });
                });
        }
        if (values.METAMODEL_TYPE === 'As Flat Table') {
            monolithStore
                .uploadFile(values.FILE, insightId)
                .then((res: { fileName: string; fileLocation: string }[]) => {
                    const file = res[0].fileLocation;
                    predictDataTypesPixelCall(file, values.DELIMETER);
                });
        }
        /** Drag and Drop: END */
    };

    /** run predictData type function based off file type */
    const predictDataTypesPixelCall = async (file, delimeter) => {
        let pixel = ``;
        if (steps[steps.length - 1].data === 'Excel') {
            pixel = `PredictExcelDataTypes(filePath=["${file}"]);`;
        }
        if (steps[steps.length - 1].data === 'CSV') {
            pixel = `PredictDataTypes(filePath=["${file}"], delimiter=["${delimeter}"], rowCount=[false]);`;
        }
        monolithStore.runQuery(pixel).then((res) => {
            setIsLoading(false);
            setPredictDataTypes(res);
        });
    };

    const getForm = (form, i) => {
        return React.createElement(form.component, {
            submitFunc: formSubmit,
            metamodel: metamodel,
            predictDataTypes: predictDataTypes,
            key: i,
        });
    };

    return (
        <StyledBox>
            {steps[0].title === 'Connect to Model' ? (
                <ModelForm submitFunc={(vals) => formSubmit(vals)} />
            ) : steps[0].title === 'Connect to Storage' ? (
                <StorageForm submitFunc={(vals) => formSubmit(vals)} />
            ) : (
                DATABASE_FORM_ROUTES.map((f, i) => {
                    if (f.name === steps[1].title) {
                        return getForm(f, i);
                    }
                })
            )}
        </StyledBox>
    );
};
