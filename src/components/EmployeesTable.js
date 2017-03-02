import React from 'react';
import { Grid, Table } from 'semantic-ui-react';
import { DeleteEmployeeModal } from './DeleteEmployeeModal';

export const EmployeesTable = (props) => (
    <Grid style={ props.containerStyles }>
        <DeleteEmployeeModal isModalOpened={ props.isModalOpened }
                             onModalClose={ props.onModalClose }
                             onEmployeeDelete={ props.onEmployeeDelete } />
        <Grid.Column width={16}>
            <Table singleLine
                   color="blue"
                   headerRow={ props.headerRow }
                   footerRow={ props.footerRow }
                   renderBodyRow={ props.renderBodyRow }
                   tableData={ props.tableData } />
        </Grid.Column>
    </Grid>
);