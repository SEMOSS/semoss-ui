import React, { useState, ChangeEvent } from 'react';
import { Select, MenuItem, styled, Button } from '@semoss/ui';


const StyledDropdownContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
});

const StyledDropdown = styled('div')({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '8px',
});

const StyledSelect = styled(Select)({
  width: '200px',
});

export const JiraSettings: React.FC = () => {
  const [dropdown1Value, setDropdown1Value] = useState<string>('');
  const [dropdown2Value, setDropdown2Value] = useState<string>('');

  const handleDropdown1Change = (event: ChangeEvent<{ value: unknown }>): void => {
    setDropdown1Value(event.target.value as string);
  };

  const handleDropdown2Change = (event: ChangeEvent<{ value: unknown }>): void => {
    setDropdown2Value(event.target.value as string);
  };

  return (
    <StyledDropdownContainer>
      <div>Jira Reactor</div>  
      <StyledDropdown>
        <StyledSelect
          id="dropdown1"
          value={dropdown1Value}
          label={"Jira Reactor"}
          onChange={handleDropdown1Change}
        >
          <MenuItem value="Option1">JiraInsert</MenuItem>
          <MenuItem value="Option2">JiraGet</MenuItem>
          <MenuItem value="Option3">Jira</MenuItem>
        </StyledSelect>
      </StyledDropdown>
      
      <div>Jira Reactor options</div>
      <StyledDropdown>
        <StyledSelect
          id="dropdown2"
          value={dropdown2Value}
          label={"Jira Reactor Options"}
          onChange={handleDropdown2Change}
        >
          <MenuItem value="OptionA">List all tickets</MenuItem>
          <MenuItem value="OptionB">Create new jira</MenuItem>
          <MenuItem value="OptionC">Delete jira ticket</MenuItem>
        </StyledSelect>
      </StyledDropdown>
      
      <Button
        style={{ backgroundColor: 'blue', color: 'white' }}
        onClick={() => console.log('Add button clicked')}
      >
        Add
      </Button>
    </StyledDropdownContainer>
  );
};
