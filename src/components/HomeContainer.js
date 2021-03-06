import React, { Component } from 'react';
import moment from 'moment';
import _ from 'lodash';
import { browserHistory, Link } from 'react-router';
import { Table, Icon, Menu, Dropdown, Checkbox } from 'semantic-ui-react';
import http from '../helpers/http';
import { apiPrefix } from '../../config';
import { Home } from './Home';
import { Admin } from './Admin';
import { UserPopup } from './UserPopup';

export class HomeContainer extends Component {

    state = {
        employees: [],
        filtered: [],
        currentPage: 0,
        user: null,
        users: [],
        isModalOpened: false,
        currentEmployeeId: '',
        filteredUsers: [],
        firstName: '',
        lastName: '',
        projects: [],
        skills: [],
        loaderActive: false,
        fieldsPerPage: +localStorage.getItem('fieldsPerPage') || 10,
        column: '',
        direction: ''
    };

    dropdownOptions = [
        {
            text: '5',
            value: 5
        },
        {
            text: '10',
            value: 10
        },
        {
            text: '15',
            value: 15
        },
        {
            text: '20',
            value: 20
        },
        {
            text: '25',
            value: 25
        },
        {
            text: '30',
            value: 30
        },
        {
            text: '40',
            value: 40
        },
        {
            text: '50',
            value: 50
        }
    ];

    componentWillMount() {
        this.checkUserAndLoadData(this.props.user);
    }

    componentWillReceiveProps(nextProps) {
        this.checkUserAndLoadData(nextProps.user);
        document.addEventListener('keyup', this.onModalActions);
    };

    checkUserAndLoadData = user => {
        if (user) {
            if (user.isAdmin) {
                if (!this.state.users.length) {
                    http.get(`${apiPrefix}/admin`)
                        .then(({ data: users }) => {
                            this.setState({
                                users,
                                user,
                                loaderActive: false
                            });
                        });
                } else this.setState({loaderActive: false});

            } else if (!this.state.employees.length) {
                http.get(`${apiPrefix}/employees`)
                    .then(({ data }) => {
                        this.setState({
                            employees: this.formatEmployeesDate(data),
                            loaderActive: false
                        })
                    });
            } else this.setState({loaderActive: false});
        } else this.setState({loaderActive: true});
    };

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
                if(this.state.user && this.state.user.isAdmin) {
                    this.setState(prevState => ({
                        users: prevState.users.map(user => {
                            user.employees = user.employees.filter(employee => employee._id !== id);
                            return user;
                        }),
                        isModalOpened: false,
                        employees: prevState.employees.filter(employee => employee._id !== id)
                    }));
                } else {
                    this.setState(prevState => ({
                        employees: prevState.employees.filter(employee => employee._id !== id),
                        isModalOpened: false
                    }));
                }
            })
            .catch(console.log)
    };

    formatEmployeesDate = employees => employees.map(employee => {
         employee.startedAt = moment(employee.startedAt).format('YYYY-MM-DD');
         return employee;
    });

    hasItem = (array, searchItem) => array.some(item => item['value'] === searchItem);

    prepareOptionsSkills = () => {
        const options = [];
        let key = 0;
        this.state.employees.forEach(employee => {
            (employee.skills && employee.skills.length) &&
                employee.skills.forEach(skill => {
                    if(!this.hasItem(options, skill)) {
                        options.push({
                            text: skill,
                            value: skill,
                            key
                        });
                        key++
                    }
                });
        });

        return options;
    };

    prepareProjectsForSearch = () => {
        const options = [];
        let key = 0;
        this.state.employees.forEach(employee => {
            (employee.projects && employee.projects.length) &&
            employee.projects.forEach(project => {
                if(!this.hasItem(options, project.name)) {
                    options.push({
                        text: project.name,
                        value: project.name,
                        key
                    });
                    key++
                }
            });
        });

        return options;
    };

    prepareOptionsForSearch = key => {
        const options = [{
            text: 'selected none',
            value: '',
            key: 0
        }];

        this.state.employees.forEach((employee, index) => {
            if (!this.hasItem(options, employee[key]) && employee[key] && employee[key]) options.push({
                text: employee[key],
                value: employee[key],
                key: index + 1
            });
        });

        return options
    };

    prepareOptionForFirstAndLastName = () => {
        const options = [{
            text: 'selected none',
            value: '',
            key: 0
        }];

        this.state.employees.forEach((employee, index) => {
            options.push({
                text: `${employee.firstName} ${employee.lastName}`,
                value: `${employee.firstName} ${employee.lastName}`,
                key: index + 1
            })
        });

        return options
    };

    dropdownOnChange = (e, data) => {
        this.setChangedState(data);
    };

    setChangedState = ({ dataKey, value }) => {
        if (dataKey === 'firstName') {
            if (value) {
                const [ firstName, lastName ] = value.replace(/\s{1,}/g, ' ').split(' ');
                this.setState({
                    firstName,
                    lastName
                }, this.filterTable)
            } else this.setState({
                firstName: '',
                lastName: ''
            }, this.filterTable)
        } else this.setState({ [dataKey]: value }, this.filterTable)
    };

    // filterTable = values => {
    //     let filtered = values.length
    //         ? this.state.employees
    //             .map(employee => ({
    //                 matches: employee.skills.filter(skill => values.includes(skill)).length,
    //                 employee
    //             }))
    //             .sort((a, b) => b.matches - a.matches)
    //             .filter(item => item.matches)
    //             .map(item => item.employee)
    //         : this.state.employees;
    //
    //     this.setState({ filtered })
    // };

    filterTable = () => {
        const filtered = this.state.employees
            .filter(employee => this.filterSkillsProjects(employee)
                && this.filterProjects(employee)
                && this.filtredByAnotherCriteria('firstName', employee)
                && this.filtredByAnotherCriteria('lastName', employee));

        this.setState({ filtered })
    };

    filterSkillsProjects = employee => {
        return !this.state.skills.find(skill => !employee.skills.includes(skill));
    };

    filterProjects = employees => {
        return !this.state.projects.find(project => !employees.projects.some(item => item.name === project))
    };

    filtredByAnotherCriteria = (criteria, employee) => {
        return this.state[criteria] !== ''
            ? employee[criteria] ? employee[criteria].includes(this.state[criteria]) : false
            : true
    };

    getClassName = employee => {
        return employee.available
            ? 'empty-project'
            : employee.readyForTransition
                ? 'ready-for-transition'
                : '';
    };

    updateEmployeeQuery = employee => {
        const requestUrl = `${apiPrefix}/employee/update`;
        const data = new FormData();

        data.append('_id', employee._id);
        data.append('firstName', employee.firstName);
        data.append('lastName', employee.lastName);
        data.append('position', employee.position);
        data.append('startedAt', employee.startedAt);
        data.append('readyForTransition', employee.readyForTransition);
        data.append('image', employee.imageSrc);
        data.append('available', employee.available);
        employee.skills.forEach(skill => data.append('skills[]', skill));
        employee.projects
            .map(project => project._id)
            .forEach(project => data.append('projects[]', project));
        employee.projectsHistory.forEach(project => data.append('projectsHistory[]', project));

        return http.post(requestUrl, data)
    };

    switchReadyForTransition = employee => {
        const dataObj = Object.assign({}, employee, { readyForTransition: !employee.readyForTransition});

        this.updateEmployeeQuery(dataObj)
            .then(res =>
                this.setState(prevState => ({
                    employees: prevState.employees.map(item => {
                        if(item._id === employee._id) item.readyForTransition = dataObj.readyForTransition;
                        return item
                    })
                }))
            )
            .catch(console.log)
    };

    switchAvailableMarker = employee => {
        const dataObj = Object.assign({}, employee, { available: !employee.available});

        this.updateEmployeeQuery(dataObj)
            .then(res =>
                this.setState(prevState => ({
                    employees: prevState.employees.map(item => {
                        if(item._id === employee._id) item.available = dataObj.available;
                        return item
                    })
                }))
            )
            .catch(console.log)
    };

    prepareEmployeesTableData = array => {
        if(array.length) {
            return array.map((employee, index) => ({
                className: this.getClassName(employee),
                index: index + 1,
                firstName: employee.firstName,
                lastName: employee.lastName,
                projects: this.getStringOfNameProjects(employee.projects),
                position: employee.position,
                readyForTransition: (
                    <Table.Cell key={index + 5} className='ready-for-transition-table'>
                        <Checkbox key={index + 6}
                                  checked={ employee.readyForTransition }
                                  onClick={e => this.switchReadyForTransition(employee)} />
                    </Table.Cell>
                ),
                available: (
                    <Table.Cell key={index + 7} className='ready-for-transition-table'>
                        <Checkbox  key={index + 8}
                                   checked={ employee.available }
                                   onClick={e => this.switchAvailableMarker(employee)}/>
                    </Table.Cell>
                ),
                startedAt: employee.startedAt,
                actions: (
                    <Table.Cell key={ index + 10 }>
                        <UserPopup user={ employee }
                                   projects={this.getStringOfNameProjects(employee.projects)}
                                   key={ index + 11 }
                                   trigger={
                                       <Link to={{ pathname: '/profile', query: { id: employee._id } }}>
                                           <Icon name="search"
                                                 size="large"
                                                 link color="blue" />
                                       </Link>
                                   } />
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

    getStringOfNameProjects = projects => projects.map(project => project.name).join(', ');

    renderEmployeesTable = ({ className, index, firstName, lastName, position,
                                projects, readyForTransition, available, startedAt, actions }) => ({
        key: index,
        className,
        cells: [
            index,
            firstName,
            lastName,
            position,
            projects,
            readyForTransition,
            available,
            startedAt,
            actions
        ]
    });

    paginate = (array) => {
        const startIndex = this.state.currentPage === 0 ? 0 : this.state.currentPage * this.state.fieldsPerPage;
        const endIndex = startIndex + this.state.fieldsPerPage;

        return array.slice(startIndex, endIndex);
    };

    getPageAmount = () => this.state.filtered.length
        ? Math.ceil(this.state.filtered.length / this.state.fieldsPerPage)
        : Math.ceil(this.state.employees.length / this.state.fieldsPerPage);

    getPageArray = () => {
        const pageAmount = this.getPageAmount();
        const pages = [];

        for(let i = 0; i < pageAmount; i++) {
            pages.push(i);
        }

        return pages;
    };

    onPaginationChange = (page) => {
        this.setState({ currentPage: page });
    };

    onPaginationNext = () => {
        if(this.state.currentPage < this.getPageAmount() - 1) {
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

    onPaginationNumberChange = (e, { value }) => {
        localStorage.setItem('fieldsPerPage', value);
        this.setState(prevState => ({
            fieldsPerPage: value
        }));
    };

    getEmployeesSkillsSearchData = () => ({
        dropdownOptions: this.prepareOptionsSkills(),
        onDropdownChange: this.dropdownOnChange
    });

    handleSort = clickedColumn => {
        const { column, employees, direction } = this.state;
        const sortedEmployees = _.sortBy(employees, [clickedColumn]);

        if (column !== clickedColumn) {
            this.setState({
                column: clickedColumn,
                employees: sortedEmployees,
                direction: 'ascending',
            });
            return
        }

        this.setState({
            employees: direction === 'ascending' ? sortedEmployees.reverse() : sortedEmployees,
            direction: direction === 'ascending' ? 'descending' : 'ascending',
        })
    };

    getEmployeesTableProps = () => ({
        headerRow: (
            <Table.Row>
                <Table.HeaderCell>#</Table.HeaderCell>
                <Table.HeaderCell
                    sorted={this.state.column === 'firstName' ? this.state.direction : null}
                    onClick={ e => this.handleSort('firstName')}>
                    First Name
                </Table.HeaderCell>
                <Table.HeaderCell
                    sorted={this.state.column === 'lastName' ? this.state.direction : null}
                    onClick={ e => this.handleSort('lastName')}>
                    Last Name
                </Table.HeaderCell>
                <Table.HeaderCell
                    sorted={this.state.column === 'position' ? this.state.direction : null}
                    onClick={ e => this.handleSort('position')}>
                    Position
                </Table.HeaderCell>
                <Table.HeaderCell>
                    Project
                </Table.HeaderCell>
                <Table.HeaderCell
                    sorted={this.state.column === 'readyForTransition' ? this.state.direction : null}
                    onClick={ e => this.handleSort('readyForTransition')}>
                    Ready for transition
                </Table.HeaderCell>
                <Table.HeaderCell
                    sorted={this.state.column === 'available' ? this.state.direction : null}
                    onClick={ e => this.handleSort('available')}>
                    Available
                </Table.HeaderCell>
                <Table.HeaderCell
                    sorted={this.state.column === 'startedAt' ? this.state.direction : null}
                    onClick={ e => this.handleSort('startedAt')}>
                    Started At
                </Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
        ),
        footerRow: (
            <Table.Row>
                <Table.HeaderCell colSpan="9">
                    <Dropdown placeholder="Per page"
                              selection
                              value={ this.state.fieldsPerPage }
                              options={ this.dropdownOptions }
                              onChange={ this.onPaginationNumberChange }/>
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
        isModalOpened: this.state.isModalOpened,
        entity: 'employee'
    });

    onUserClick = userId => {
        this.setState({
            projects: [],
            firstName: '',
            lastName: '',
            skills: [],
            filtered: []
        }, () => this.onUserClickContinue(userId))
    };

    onUserClickContinue = userId => {
        let employees = this.state.users
            .find(user => user._id === userId)
            .employees;

        employees = this.formatEmployeesDate(employees);

        this.setState({ employees });
    };

    onFilterUsers = (e, data) => {
        const seachUser = data.value.toLowerCase();
        const filtered = this.state.users.filter(user => `${user.firstName} ${user.lastName}`
            .toLowerCase()
            .includes(seachUser));

        this.setState({ filteredUsers: filtered});
    };

    render() {
        return this.state.user && this.state.user.isAdmin
            ? <Admin getEmployeesTableProps={ this.getEmployeesTableProps }
                     getEmployeesSkillsSearchData={ this.getEmployeesSkillsSearchData }
                     users={ this.state.filteredUsers.length ? this.state.filteredUsers : this.state.users }
                     onUserClick={ this.onUserClick }
                     onSearchUsers={ this.onFilterUsers }
                     dropdownOnChange={ this.dropdownOnChange }
                     prepareOptionsForSearch={ this.prepareOptionsForSearch }
                     prepareOptionForFirstAndLastName={ this.prepareOptionForFirstAndLastName }
                     prepareProjectsForSearch={ this.prepareProjectsForSearch }
                     loaderActive={ this.state.loaderActive }/>
            : <Home getEmployeesTableProps={ this.getEmployeesTableProps }
                    getEmployeesSkillsSearchData={ this.getEmployeesSkillsSearchData }
                    prepareOptionsForSearch={ this.prepareOptionsForSearch }
                    dropdownOnChange={ this.dropdownOnChange }
                    prepareOptionForFirstAndLastName={ this.prepareOptionForFirstAndLastName }
                    prepareProjectsForSearch={ this.prepareProjectsForSearch }
                    loaderActive={ this.state.loaderActive }/>
    }
}