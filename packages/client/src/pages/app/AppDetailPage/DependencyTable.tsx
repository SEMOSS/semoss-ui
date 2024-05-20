import { Table, Typography, Link, Chip, Stack } from '@semoss/ui';
import { tableCellClasses } from '@mui/material';
import { engine } from './appDetails.utility';
import { formatPermission } from '@/utils';

interface PropsDependencyTable {
    dependencies: engine[];
    permission: string;
}

const DependencyTable = (props: PropsDependencyTable) => {
    const { dependencies, permission } = props;
    return (
        <Table
            sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: 'none',
                },
            }}
        >
            <Table.Head>
                <Table.Row>
                    <Table.Cell>
                        <Typography variant="body2" fontWeight="bold">
                            {`Dependency (${dependencies.length})`}
                        </Typography>
                    </Table.Cell>
                    <Table.Cell>
                        <Typography variant="body2" fontWeight="bold">
                            Current level of access
                        </Typography>
                    </Table.Cell>
                    {permission === 'author' && (
                        <Table.Cell>
                            <Typography variant="body2" fontWeight="bold">
                                Access Type
                            </Typography>
                        </Table.Cell>
                    )}
                </Table.Row>
            </Table.Head>

            {dependencies.map((dep: engine) => (
                <Table.Row key={`name-${dep.app_name}--id-${dep.app_id}`}>
                    <Table.Cell>
                        <Link href={`./#/engine/${dep.app_type}/${dep.app_id}`}>
                            <Typography variant="body2">
                                {dep.app_name}
                            </Typography>
                        </Link>
                    </Table.Cell>
                    <Table.Cell>
                        <Typography variant="body2">
                            {formatPermission(dep.user_permission)}
                        </Typography>
                    </Table.Cell>
                    {permission === 'author' && (
                        <Table.Cell>
                            <Stack direction="row" spacing={1}>
                                {dep.database_discoverable ? (
                                    <Chip label="Discoverable" />
                                ) : (
                                    <Chip label="Non-Discoverable" />
                                )}
                                {dep.database_global ? (
                                    <Chip label="Public" />
                                ) : (
                                    <Chip label="Non-Public" />
                                )}
                            </Stack>
                        </Table.Cell>
                    )}
                </Table.Row>
            ))}
        </Table>
    );
};

export default DependencyTable;
