import React from 'react';
import { Link } from 'react-router';
import { Grid, Table, Dropdown, Modal, Header, Button } from 'semantic-ui-react';

export const Home = (props) => (
    <Grid container>

        <Modal basic
               open={ props.isModalOpened }
               size="small">
            <Header icon="user delete" content="Deleting" color="red" />
            <Modal.Content>
                <h3>Are you sure you want to delete an employee?</h3>
            </Modal.Content>
            <Modal.Actions>
                <Button basic
                        inverted
                        onClick={ props.onModalClose }>
                    No
                </Button>
                <Button color='red'
                        basic
                        inverted
                        onClick={ props.onEmployeeDelete }>
                    Yes</Button>
            </Modal.Actions>
        </Modal>

        <Grid.Row>
            <Grid.Column width={8} floated="right">
                <Dropdown fluid
                          multiple
                          search
                          selection
                          options={ props.dropdownOptions }
                          placeholder="Search parameters"
                          style={{ marginTop: '40px' }}
                          onChange={ props.onDropdownChange } />
            </Grid.Column>
        </Grid.Row>

        <Grid.Row>
            <Grid.Column>
                <Link to="profile/create">
                    <Button floated="right" color="blue" style={{ margin: '20px 0' }}>
                        Add new employee
                    </Button>
                </Link>
                <Table singleLine color="blue">
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>#</Table.HeaderCell>
                            <Table.HeaderCell>First Name</Table.HeaderCell>
                            <Table.HeaderCell>Last Name</Table.HeaderCell>
                            <Table.HeaderCell>Position</Table.HeaderCell>
                            <Table.HeaderCell>Started At</Table.HeaderCell>
                            <Table.HeaderCell>Actions</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        { props.tableBody }
                    </Table.Body>
                </Table>
            </Grid.Column>
        </Grid.Row>

    </Grid>
);