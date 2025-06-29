import React from 'react';
import {
  Typography,
  Box,
  Alert,
} from '@semoss/ui';
import {
  Error as ErrorIcon,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { QueryResult, isErrorResponse, getErrorMessage, hasTabularData } from './useDatabaseQueryExecution';

export function useQueryResults() {
  const renderResults = (previewData: QueryResult | null, previewLimit: number) => {
    if (!previewData) {
      return (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: 'secondary'
        }}>
          <Typography variant="body2">
            Click "RUN" to see query results here
          </Typography>
        </Box>
      );
    }

    if (isErrorResponse(previewData)) {
      const errorMessage = getErrorMessage(previewData);
      return (
        <Box sx={{ padding: 2 }}>
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{ marginBottom: 2 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Query Error
            </Typography>
            <Typography variant="body2" sx={{ marginTop: 1, whiteSpace: 'pre-wrap' }}>
              {errorMessage}
            </Typography>
          </Alert>
          
          <Box sx={{
            padding: 1,
            backgroundColor: 'grey.100',
            borderRadius: 1,
            fontSize: '12px'
          }}>
            <Typography variant="caption">
              Execution time: {previewData.timeToRun || 0}ms
            </Typography>
          </Box>
        </Box>
      );
    }

    if (previewData.queryType && previewData.queryType !== 'SELECT') {
      const isSuccess = previewData.isSuccess !== false;
      
      return (
        <Box sx={{ padding: 2 }}>
          <Alert
            severity={isSuccess ? "success" : "warning"}
            icon={isSuccess ? <CheckCircle /> : <Info />}
            sx={{ marginBottom: 2 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {isSuccess
                ? `Statement Executed`
                : `Statement Completed`
              }
            </Typography>
          
          </Alert>
          
          <Box sx={{
            padding: 1,
            backgroundColor: 'grey.100',
            borderRadius: 1,
            fontSize: '12px',
            marginBottom: 2
          }}>
            <Typography variant="caption">
              Execution time: {previewData.timeToRun || 0}ms
            </Typography>
            {previewData.operationType && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                Operation: {Array.isArray(previewData.operationType)
                  ? previewData.operationType.join(', ')
                  : previewData.operationType}
              </Typography>
            )}
          </Box>

          {previewData.output && (
            <Box sx={{ marginTop: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', marginBottom: 1 }}>
                Database Response:
              </Typography>
              <Box sx={{
                padding: 1,
                backgroundColor: 'grey.50',
                border: '1px solid',
                borderColor: 'grey.300',
                borderRadius: 1,
                fontSize: '12px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {typeof previewData.output === 'string'
                  ? previewData.output
                  : JSON.stringify(previewData.output, null, 2)
                }
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    if (hasTabularData(previewData)) {
      return (
        <Box>
          <Box sx={{
            padding: '8px',
            backgroundColor: 'grey.100',
            borderBottom: '1px solid',
            borderColor: 'grey.300',
            fontSize: '12px',
            marginBottom: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption">
              {previewData.output.data.values?.length || 0} rows • {previewData.timeToRun || 0}ms
            </Typography>
            {previewData.output.numCollected > (previewData.output.data.values?.length || 0) && (
              <Typography variant="caption" color="primary">
                Limited to {previewLimit} rows
              </Typography>
            )}
          </Box>
          

          <Box sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
            {previewData.output.data.headers && (
              <Box sx={{
                display: 'flex',
                fontWeight: 'bold',
                backgroundColor: 'grey.50',
                borderBottom: '2px solid',
                borderColor: 'grey.300'
              }}>
                {previewData.output.data.headers.map((header: string, index: number) => (
                  <Box key={index} sx={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    borderRight: index < previewData.output.data.headers.length - 1 ? '1px solid' : 'none',
                    borderColor: 'grey.300',
                    minWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {header}
                  </Box>
                ))}
              </Box>
            )}
            
            {previewData.output.data.values && (
              <Box sx={{ maxHeight: '180px', overflow: 'auto' }}>
                {previewData.output.data.values.length === 0 ? (
                  <Box sx={{
                    padding: 3,
                    textAlign: 'center',
                    color: 'secondary'
                  }}>
                    <Typography variant="body2">
                      No data returned
                    </Typography>
                  </Box>
                ) : (
                  previewData.output.data.values.map((row: any[], rowIndex: number) => (
                    <Box key={rowIndex} sx={{
                      display: 'flex',
                      borderBottom: rowIndex < previewData.output.data.values.length - 1 ? '1px solid' : 'none',
                      borderColor: 'grey.200',
                      '&:hover': { backgroundColor: 'grey.50' }
                    }}>
                      {row.map((cell: any, cellIndex: number) => (
                        <Box key={cellIndex} sx={{
                          flex: 1,
                          padding: '8px',
                          fontSize: '12px',
                          borderRight: cellIndex < row.length - 1 ? '1px solid' : 'none',
                          borderColor: 'grey.200',
                          minWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {cell !== null && cell !== undefined ? String(cell) : '(null)'}
                        </Box>
                      ))}
                    </Box>
                  ))
                )}
              </Box>
            )}
          </Box>
          
          {previewData.output.numCollected && (
            <Box sx={{
              padding: '8px',
              backgroundColor: 'grey.100',
              borderTop: '1px solid',
              borderColor: 'grey.300',
              fontSize: '11px',
              marginTop: 1
            }}>
              <Typography variant="caption" color="secondary">
                Showing {previewData.output.data.values?.length || 0} of {previewData.output.numCollected} collected rows
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ padding: 2 }}>
        <Alert
          severity="info"
          icon={<Info />}
          sx={{ marginBottom: 2 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Query Executed
          </Typography>
          <Typography variant="body2" sx={{ marginTop: 1 }}>
            The query was executed successfully but returned no tabular data
          </Typography>
        </Alert>
        
        <Box sx={{
          padding: 1,
          backgroundColor: 'grey.100',
          borderRadius: 1,
          fontSize: '12px'
        }}>
          <Typography variant="caption">
            Execution time: {previewData.timeToRun || 0}ms
          </Typography>
        </Box>

        {previewData.output && (
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', marginBottom: 1 }}>
              Raw Output:
            </Typography>
            <pre style={{
              fontSize: '11px',
              overflow: 'auto',
              margin: 0,
              whiteSpace: 'pre-wrap',
              padding: '8px',
              maxHeight: '150px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              {typeof previewData.output === 'string'
                ? previewData.output
                : JSON.stringify(previewData.output, null, 2)
              }
            </pre>
          </Box>
        )}
      </Box>
    );
  };

  return renderResults;
}
