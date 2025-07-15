import React from "react";
import { useEffect } from "react";

type EditableTableProps = {
  data: string[][];
  setData: React.Dispatch<React.SetStateAction<string[][]>>;
};

const EditableTable = React.memo(function EditableTable({ data, setData }: EditableTableProps) {
  
    useEffect(() => {
        if (!data || data.length === 0) {
        setData(Array.from({ length: 3 }, () => Array(3).fill("")));
        }
    }, [data, setData]);

    const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    setData(prevData =>
      prevData.map((row, r) =>
        r === rowIdx
          ? row.map((cell, c) => (c === colIdx ? value : cell))
          : row
      )
    );
  };

  // If no data, show a 3x3 empty editable table
  let tableData = data;
  if (!tableData || tableData.length === 0) {
    tableData = Array.from({ length: 3 }, () => Array(3).fill(""));
  }

  const maxCols = Math.max(...tableData.map(row => row.length));

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <tbody>
        {tableData.map((row, rIdx) => (
          <tr key={rIdx}>
            {[...Array(maxCols)].map((_, cIdx) => (
              <td
                key={`cell-${rIdx}-${cIdx}`}
                style={{
                  border: '1px solid #ccc',
                  padding: '4px',
                  minWidth: '50px',
                  textAlign: 'center',
                  background: '#fff'
                }}
              >
                <input
                  value={row[cIdx] !== undefined ? String(row[cIdx]) : ""}
                  onChange={e => handleCellChange(rIdx, cIdx, e.target.value)}
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    border: 'none',
                    background: 'transparent'
                  }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default EditableTable;