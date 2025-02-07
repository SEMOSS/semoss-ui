import React, { useEffect, useState } from 'react';
import { Button, Grid, Menu, Modal, Select, Typography } from '@semoss/ui';

export interface SwapAppDependencyInterface {
    vector: {
        needsReplace: boolean;
        variablesToReplace: string[];
        options: { database_id: string; database_name: string }[];
    };
    model: {
        needsReplace: boolean;
        variablesToReplace: string[];
        options: { database_id: string; database_name: string }[];
    };
    database: {
        needsReplace: boolean;
        variablesToReplace: string[];
        options: { database_id: string; database_name: string }[];
    };
    storage: {
        needsReplace: boolean;
        variablesToReplace: string[];
        options: { database_id: string; database_name: string }[];
    };
    function: {
        needsReplace: boolean;
        variablesToReplace: string[];
        options: { database_id: string; database_name: string }[];
    };
}

interface SwapDependencyModalProps {
    /**
     * Is Modal Open
     */
    open: boolean;

    /**
     *
     * @param
     * @returns
     */
    dependenciesToSwap: {} | SwapAppDependencyInterface;

    /**
     * on close
     */
    onClose: (swaps: Record<string, string>) => void;
}

export const SwapAppDependencyModal = (props: SwapDependencyModalProps) => {
    const { open, dependenciesToSwap, onClose } = props;

    const [selectedValues, setSelectedValues] = useState({});
    const [errors, setErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);

    useEffect(() => {
        // Initialize selectedValues with empty strings for each variable
        const initialValues = {};
        Object.entries(dependenciesToSwap).forEach(([key, value]) => {
            value.variablesToReplace.forEach((variable) => {
                initialValues[`${variable}`] = '';
            });
        });
        setSelectedValues(initialValues);
    }, [dependenciesToSwap]);

    useEffect(() => {
        validateForm();
    }, [selectedValues]);

    const handleSelectChange = (key, variable, value) => {
        setSelectedValues((prev) => ({
            ...prev,
            [`${variable}`]: value,
        }));
    };

    const handleClose = () => {
        onClose(selectedValues);
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        Object.entries(selectedValues).forEach(([key, value]) => {
            if (!value) {
                newErrors[key] = 'This field is required';
                isValid = false;
            }
        });

        setErrors(newErrors);
        setIsFormValid(isValid);
    };

    return (
        <Modal
            open={open}
            fullWidth
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                    handleClose();
                }
            }}
        >
            <Modal.Title>Use app with your dependencies</Modal.Title>
            <Modal.Content>
                <Grid container gap={2}>
                    {Object.entries(dependenciesToSwap).map(([key, value]) => {
                        if (!value.variablesToReplace.length) return null;
                        return (
                            <React.Fragment key={key}>
                                <Grid item xs={12}>
                                    <Typography variant={'h6'}>
                                        {key.charAt(0).toUpperCase() +
                                            key.slice(1) +
                                            ' ' +
                                            'engines'}
                                    </Typography>
                                </Grid>
                                {value.variablesToReplace.map((val) => (
                                    <Grid container key={val}>
                                        <Grid item xs={4}>
                                            <Typography variant={'body2'}>
                                                {val}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={8}>
                                            <Select
                                                fullWidth
                                                size={'small'}
                                                value={
                                                    selectedValues[`${val}`] ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleSelectChange(
                                                        key,
                                                        val,
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {value.options.map((opt) => (
                                                    <Menu.Item
                                                        key={opt.database_id}
                                                        value={opt.database_id}
                                                    >
                                                        {opt.database_name}
                                                    </Menu.Item>
                                                ))}
                                            </Select>
                                        </Grid>
                                    </Grid>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </Grid>
            </Modal.Content>

            <Modal.Actions>
                <Button
                    variant={'contained'}
                    color="primary"
                    onClick={handleClose}
                    disabled={!isFormValid}
                >
                    Swap
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
