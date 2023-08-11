import React, { useEffect, useState } from 'react';
import {
    Modal,
    styled,
    theme,
    Form,
    Button,
    Table,
    Radio,
    Icon,
    TextField,
} from '@semoss/ui';

import { useForm } from 'react-hook-form';
const StyledContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
}));
const StyledColumnItem = styled('div')(() => ({
    display: 'flex',
}));

const StyledField = styled('div')(() => ({
    marginBottom: theme.space['4'],
}));

export const ColumnDetails = ({ column }) => {
    const {
        table,
        columnName,
        columnDescription,
        columnType,
        columnDefaultValue,
        columnNotNull,
        columnIsPrimary,
    } = column;

    const { control, watch, setValue, register, handleSubmit } = useForm<{
        TABLE_NAME: string;
        COLUMN_NAME: string;
        COLUMN_TYPE: string;
        COLUMN_DESCRIPTION: string;
        COLUMN_DEFAULT_VALUE: any;
        COLUMN_NOT_NULL: boolean;
        COLUMN_IS_PRIMARY: boolean;
    }>({
        defaultValues: {
            TABLE_NAME: table,
            COLUMN_NAME: columnName,
            COLUMN_TYPE: columnType,
            COLUMN_DESCRIPTION: columnDescription,
            COLUMN_DEFAULT_VALUE: columnDefaultValue,
            COLUMN_NOT_NULL: columnNotNull,
            COLUMN_IS_PRIMARY: columnIsPrimary,
        },
    });

    return (
        <Form>
            <StyledContainer>
                <h3>Table: {table}</h3>
                <StyledColumnItem>
                    <StyledField>
                        <TextField
                            name={'COLUMN_NAME'}
                            label={'Column name'}
                            control={control}
                            rules={{
                                required: true,
                            }}
                            options={{
                                component: 'input',
                                placeholder: 'Enter column name',
                                size: 'md',
                            }}
                            error="Column name is required"
                            description=""
                        ></TextField>
                    </StyledField>
                    <StyledField>
                        <TextField
                            name={'COLUMN_DESCRIPTION'}
                            label={'Column description'}
                            control={control}
                            rules={{
                                required: false,
                            }}
                            options={{
                                component: 'textarea',
                                placeholder: 'Enter column description',
                                size: 'md',
                            }}
                            description=""
                        ></TextField>
                    </StyledField>
                    <StyledField>
                        <TextField
                            name={'COLUMN_TYPE'}
                            label={'Column type'}
                            control={control}
                            rules={{
                                required: true,
                            }}
                            options={{
                                component: 'input',
                                placeholder: 'Enter column type',
                                size: 'md',
                            }}
                            error="Column must have a type"
                            description=""
                        ></TextField>
                    </StyledField>
                    <StyledField>
                        <TextField
                            name={'COLUMN_DEFAULT_VALUE'}
                            label={'Column default value'}
                            control={control}
                            rules={{
                                required: false,
                            }}
                            options={{
                                component: 'input',
                                placeholder: 'Enter column default value',
                                size: 'md',
                            }}
                            description=""
                        ></TextField>
                    </StyledField>
                    <StyledField>
                        <TextField
                            name={'COLUMN_NOT_NULL'}
                            label={'Not Null?'}
                            control={control}
                            rules={{
                                required: true,
                            }}
                            options={{
                                component: 'checkbox',
                            }}
                            description=""
                        ></TextField>
                    </StyledField>
                    <StyledField>
                        <TextField
                            name={'COLUMN_IS_PRIMARY'}
                            label={'Primary Key?'}
                            control={control}
                            rules={{
                                required: true,
                            }}
                            options={{
                                component: 'checkbox',
                            }}
                            description=""
                        ></TextField>
                    </StyledField>
                </StyledColumnItem>
            </StyledContainer>
        </Form>
    );
};
