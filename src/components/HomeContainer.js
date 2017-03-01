import React, { Component } from 'react';
import { browserHistory, Link } from 'react-router';
import { Table, Icon } from 'semantic-ui-react';
import http, { setAuthHeader } from '../helpers/http';
import { apiPrefix } from '../../config';
import { Home } from './Home';
import { UserPopup } from './UserPopup';

export class HomeContainer extends Component {

    state = {
        employees: [],
        users: [],
        isAdmin: false,
        filtered: [],
        isModalOpened: false,
        currentEmployeeId: ''
    };

    initializeUser = () => {
        const key = localStorage.getItem('Authorization');

        if(key) {
            setAuthHeader(key);

            http.get(`${apiPrefix}/login`)
                .then(({ data: user }) => {
                    if(user.isAdmin) {
                        return http.get(`${apiPrefix}/admin`)
                            .then(({ data: users }) => {
                                this.setState({
                                    users: users.forEach(user => {
                                        user.employees = this.formatEmployeesDate(user.employees)
                                    }),
                                    isAdmin: true
                                });
                            });
                    } else {
                        return http.get(`${apiPrefix}/employees`)
                            .then(({ data }) => {
                                this.setState({ employees: this.formatEmployeesDate(data) })
                            });
                    }
                })
                .catch(err => {
                    localStorage.removeItem('Authorization');
                    browserHistory.push('/login');
                });

        } else {
            browserHistory.push('/login');
        }
    };

    componentDidMount() {
        this.initializeUser();
        document.addEventListener('keyup', this.onModalActions)
    }

    componentWillUnmount() {
        document.removeEventListener('keyup', this.onModalActions);
    }

    onModalActions = (e) => {
        if(e.which === 13 && this.state.isModalOpened) {
            this.onEmployeeDelete(this.state.currentEmployeeId)
        } else if(e.which === 27 && this.state.isModalOpened) {
            this.setState({ isModalOpened: false })
        }
    };

    onEmployeeDelete = (id) => {
        http.post(`${apiPrefix}/employee/delete`, { id })
            .then(res => {
                this.setState((prevState) => ({
                    employees: prevState.employees.filter((employee) => employee._id !== id),
                    isModalOpened: false
                }));
            })
            .catch(err => {
                console.log('Deleting error');
            })
    };

    formatEmployeesDate = (employees) => employees.map(employee => {
         employee.startedAt = new Date(employee.startedAt).toISOString().split('T')[0];

         return employee;
    });

    hasItem = (array, searchItem) => array.some(item => item['value'] === searchItem);

    prepareOptions = () => {
        const options = [];

        this.state.employees.forEach(employee => {

            employee.skills.forEach(skill => {

                if(!this.hasItem(options, skill)) {
                    options.push({
                        text: skill,
                        value: skill
                    })
                }
            });
        });

        return options;
    };

    dropdownOnChange = (e, data) => {
        this.filterTable(data.value);
    };

    filterTable = (values) => {
        let filtered = values.length
            ? this.state.employees
                .map(employee => ({
                    matches: employee.skills.filter(skill => values.includes(skill)).length,
                    employee
                }))
                .sort((a, b) => b.matches - a.matches)
                .filter(item => item.matches)
                .map(item => item.employee)
            : this.state.employees;

        this.setState({ filtered })
    };

    prepareEmployeesTableData = (array) => {
        if(array.length) {
            return array.map((employee, index) => ({
                index: index + 1,
                firstName: employee.firstName,
                lastName: (
                    <UserPopup user={ employee }
                               key={ index + 2 }
                               trigger={
                                   <Table.Cell>{ employee.lastName }</Table.Cell>
                               } />
                ),
                position: employee.position,
                startedAt: employee.startedAt,
                actions: (
                    <Table.Cell key={ index + 3 }>
                        <Link to={{ pathname: '/profile', query: { id: employee._id } }}>
                            <Icon name="search"
                                  size="large"
                                  link color="blue" />
                        </Link>
                        <Icon name="delete"
                              size="large"
                              link
                              color="red"
                              onClick={ () => { this.setState({ isModalOpened: true, currentEmployeeId: employee._id })} } />
                    </Table.Cell>
                )
            }));
        } else {
            return [{
                index: 'No employees'
            }]
        }
    };

    renderEmployeesTable = ({ index, firstName, lastName, position, startedAt, actions }) => ({
        key: index,
        cells: [
            index,
            firstName,
            lastName,
            position,
            startedAt,
            actions
        ]
    });

    getEmployeesTableProps = () => ({
        dropdownOptions: this.prepareOptions(),
        onDropdownChange: this.dropdownOnChange,
        headerRow: ['#', 'First Name', 'Last Name', 'Position', 'Started At', 'Actions'],
        renderBodyRow: this.renderEmployeesTable,
        tableData: this.state.filtered.length
            ? this.prepareEmployeesTableData(this.state.filtered)
            : this.prepareEmployeesTableData(this.state.employees),
        onEmployeeDelete: () => { this.onEmployeeDelete(this.state.currentEmployeeId) },
        onModalClose: () => { this.setState({ isModalOpened: false }) },
        isModalOpened: this.state.isModalOpened
    });

    render() {
        return (
            <Home getEmployeesTableProps={ this.getEmployeesTableProps } />
        );
    }
}