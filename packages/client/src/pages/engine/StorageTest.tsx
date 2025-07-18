import React, { useState } from 'react';
import {
  Checkbox,
  Search,
  Table,
  Typography,
  styled,
} from '@semoss/ui';
import { useFileManager } from '@/hooks';

const StyledTableContainer = styled(Table.Container)({
  borderRadius: '12px',
  boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTableTitleContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'stretch',
  boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
  backgroundColor: 'white',
  justifyContent: 'space-between',
});

const StyledFileContent = styled('div')({
  display: 'flex',
  width: '100%',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '25px',
  flexShrink: '0',
  paddingLeft: '5px',
});

const StyledTableTitleDiv = styled('div')({
  display: 'flex',
  padding: '12px 24px 12px 16px',
  alignItems: 'center',
  gap: '10px',
});

const StyledFileTable = styled(Table)({ backgroundColor: 'white' });

interface StorageTestProps {
  id: string;
  storagePath?: string;
}

const StorageTest = ({ id, storagePath = '/' }: StorageTestProps) => {
  const [filePage, setFilePage] = useState<number>(1);
  const NUM_RESULTS_PER_PAGE = 5;

  const {
    files,
    searchFilter,
    setSearchFilter,
    selectedFiles,
    setSelectedFiles,
    isLoading
  } = useFileManager({
    engineId: id,
    mode: 'storage',
    storagePath
  });

  const startIndex = filePage * NUM_RESULTS_PER_PAGE - NUM_RESULTS_PER_PAGE;
  const endIndex = filePage * NUM_RESULTS_PER_PAGE;
  const paginatedFiles = files.slice(startIndex, endIndex);

  const toggleFileSelection = (file: any) => {
    const isSelected = selectedFiles.some(f => f.fileName === file.fileName);
    if (isSelected) {
      setSelectedFiles(selectedFiles.filter(f => f.fileName !== file.fileName));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <StyledFileContent>
      <StyledTableContainer>
        <StyledTableTitleContainer>
          <StyledTableTitleDiv>
            <Typography variant={'h6'}>Files</Typography>
          </StyledTableTitleDiv>
          <div>
            <Search
              placeholder={'Search Files'}
              size="small"
              sx={{ marginRight: '20px' }}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </StyledTableTitleContainer>

        <StyledFileTable>
          <Table.Head>
            <Table.Cell size="small">Select</Table.Cell>
            <Table.Cell size="small">Name</Table.Cell>
            <Table.Cell size="small">Date Uploaded</Table.Cell>
            <Table.Cell size="small">Size</Table.Cell>
          </Table.Head>
          <Table.Body>
            {paginatedFiles.map((file, i) => {
              const isSelected = selectedFiles.some(f => f.fileName === file.fileName);
              return (
                <Table.Row key={i}>
                  <Table.Cell size="medium">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleFileSelection(file)}
                    />
                  </Table.Cell>
                  <Table.Cell>{file.fileName}</Table.Cell>
                  <Table.Cell>{file.lastModified}</Table.Cell>
                  <Table.Cell>
                    {Math.round(file.fileSize * 10) / 10} KB
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
          <Table.Footer>
            <Table.Row>
              <Table.Pagination
                rowsPerPageOptions={[]}
                onPageChange={(e, v) => {
                  setFilePage(v + 1);
                  setSelectedFiles([]);
                }}
                page={filePage - 1}
                rowsPerPage={NUM_RESULTS_PER_PAGE}
                count={files.length}
              />
            </Table.Row>
          </Table.Footer>
        </StyledFileTable>
      </StyledTableContainer>
    </StyledFileContent>
  );
};

export default StorageTest;