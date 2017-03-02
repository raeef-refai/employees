import React, { Component } from 'react';
import { browserHistory, Link } from 'react-router';
import { Table, Icon, Menu } from 'semantic-ui-react';
import http, { setAuthHeader } from '../helpers/http';
import { apiPrefix } from '../../config';
import { Home } from './Home';
import { Admin } from './Admin';
import { UserPopup } from './UserPopup';

export class HomeContainer extends Component {

    state = {
        employees: [],
        filtered: [],
        currentPage: 0,
        users: [],
        isAdmin: false,
        isModalOpened: false,
        currentEmployeeId: ''
    };

    fieldsPerPage = 8;

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
                                    users,
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
        //Todo: Fix bug, in admin panel employee isn't deleted from state
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

    paginate = (array) => {
        const startIndex = this.state.currentPage === 0 ? 0 : this.state.currentPage * this.fieldsPerPage - 1;
        const endIndex = startIndex + this.fieldsPerPage;

        return array.slice(startIndex, endIndex);
    };

    getPageAmount = () => this.state.filtered.length
        ? Math.ceil(this.state.filtered.length / this.fieldsPerPage)
        : Math.ceil(this.state.employees.length / this.fieldsPerPage);

    getPageArray = () => {
        const pageAmount = this.getPageAmount();
        const pages = [];

        for(let i = 0; i <= pageAmount; i++) {
            pages.push(i);
        }

        return pages;
    };

    onPaginationChange = (page) => {
        this.setState({ currentPage: page });
    };

    onPaginationNext = () => {
        if(this.state.currentPage < this.getPageAmount()) {
            this.setState(prevState => ({
                currentPage: prevState.currentPage + 1
            }))
        }
    };

    onPaginationPrev = () => {
        if(this.state.currentPage !== 0) {
            this.setState(prevState => ({
                currentPage: prevState.currentPage - 1
            }))
        }
    };

    getEmployeesSkillsSearchData = () => ({
        dropdownOptions: this.prepareOptions(),
        onDropdownChange: this.dropdownOnChange
    });

    getEmployeesTableProps = () => ({
        headerRow: ['#', 'First Name', 'Last Name', 'Position', 'Started At', 'Actions'],
        footerRow: (
            <Table.Row>
                <Table.HeaderCell colSpan="6">
                    <Menu floated="right" pagination>
                        <Menu.Item icon onClick={ this.onPaginationPrev }>
                            <Icon name="left chevron" />
                        </Menu.Item>
                        {
                            this.getPageArray().map(pageNumber => (
                                <Menu.Item key={ pageNumber }
                                           active={ pageNumber === this.state.currentPage }
                                           onClick={() => {
                                               this.onPaginationChange(pageNumber);
                                           }}>
                                    { pageNumber + 1 }
                                </Menu.Item>
                            ))
                        }
                        <Menu.Item icon onClick={ this.onPaginationNext }>
                            <Icon name="right chevron" />
                        </Menu.Item >
                    </Menu>
                </Table.HeaderCell>
            </Table.Row>
        ),
        renderBodyRow: this.renderEmployeesTable,
        tableData: this.state.filtered.length
            ? this.prepareEmployeesTableData(this.paginate(this.state.filtered))
            : this.prepareEmployeesTableData(this.paginate(this.state.employees)),
        onEmployeeDelete: () => { this.onEmployeeDelete(this.state.currentEmployeeId) },
        onModalClose: () => { this.setState({ isModalOpened: false }) },
        isModalOpened: this.state.isModalOpened
    });

    onUserClick = (userId) => {
        let employees = this.state.users
            .find(user => user._id === userId)
            .employees;

        employees = this.formatEmployeesDate(employees);

        this.setState({ employees });
    };

    render() {
        return this.state.isAdmin
            ? <Admin getEmployeesTableProps={ this.getEmployeesTableProps }
                     getEmployeesSkillsSearchData={ this.getEmployeesSkillsSearchData }
                     users={ this.state.users }
                     onUserClick={ this.onUserClick } />
            : <Home getEmployeesTableProps={ this.getEmployeesTableProps }
                    getEmployeesSkillsSearchData={ this.getEmployeesSkillsSearchData } />
    }
}