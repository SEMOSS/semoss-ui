import { Button, Menu } from '@semoss/ui';
import { useState } from 'react';

export const JobsTableColumnsButton = (props: {}) => {
    const [columnSelectorAnchorEl, setColumnSelectorAnchorEl] =
        useState<HTMLButtonElement | null>(null);
    const [searchColumnType, setSearchColumnType] = useState<string>('');

    return (
        <>
            {/* <Button
                variant="outlined"
                onClick={(event) => {
                    setColumnSelectorAnchorEl(event.currentTarget);
                }}
                size="medium"
                startIcon={<Menu />}
                color="info"
            >
                Columns
            </Button>
            <StyledPopover
                id={'column-selector'}
                open={Boolean(columnSelectorAnchorEl)}
                anchorEl={columnSelectorAnchorEl}
                onClose={() => {
                    setColumnSelectorAnchorEl(null);
                    setSearchColumnType('');
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Search
                    placeholder="Search Column Type"
                    size="small"
                    onChange={(e) => {
                        setSearchColumnType(
                            e.target.value.toLocaleLowerCase().trim(),
                        );
                    }}
                />
                <div>
                    <Checkbox
                        label="Select All"
                        checked={jobColumns.every((col) => col.showColumn)}
                        onChange={(e, checked) => {
                            setJobColumns(
                                jobColumns.map((col) => {
                                    return {
                                        ...col,
                                        showColumn: checked,
                                    };
                                }),
                            );
                        }}
                    />
                </div>
                {jobColumns.map((col, i) => {
                    return (
                        col.hideable &&
                        col.columnType
                            .toLocaleLowerCase()
                            .includes(searchColumnType) && (
                            <div>
                                <Checkbox
                                    key={i}
                                    label={col.columnType}
                                    checked={col.showColumn}
                                    onChange={(e, checked) => {
                                        // find obejct matching col.columnType and switch col.showColumn
                                        const n = [];
                                        jobColumns.forEach((jc) => {
                                            if (
                                                jc.columnType ===
                                                col.columnType
                                            ) {
                                                n.push({
                                                    ...jc,
                                                    showColumn: checked,
                                                });
                                            } else {
                                                n.push(jc);
                                            }
                                        });
                                        setJobColumns(n);
                                    }}
                                />
                            </div>
                        )
                    );
                })}
            </StyledPopover> */}
        </>
    );
};
