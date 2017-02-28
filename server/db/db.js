import mongoose from 'mongoose';

import { dbConfig } from '../../config';

import { User } from './models/User';
import { Employee } from './models/Employee';

export const setUpConnection = () => {
  mongoose.connect(`mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`);
};

export const findByLogin = (login) => {
    return User.findOne({ login });
};

export const initializeDb = () => {
    findByLogin('admin').then(user => {

        if(!user) {
            const user = new User({
                login: 'admin',
                password: 'admin',
                isAdmin: true
            });

            user.save();
        }
    })
};

export const createUser = (data) => {
    return new User(data).save();
};

export const createEmployee = (data, login) => {
    return findByLogin(login)
        .then(user => {
            const employeeData = Object.assign(data, {_leader: user._id});

            return new Employee(employeeData).save();
        });
};

export const getAllEmployees = (login) => {
    return findByLogin(login)
        .then(user => {
            return Employee.find({ _leader: user._id });
        })
};

export const getSkillsAndPositions = () => {
    return Employee.find()
        .select('skills position')
        .exec()
        .then(result => {
            let preparedSkills = [],
                preparedPositions = [];

            const uniqueFilter = (item, index, self) => self.indexOf(item) === index;

            result.forEach(item => {
                preparedSkills = [...preparedSkills, ...item.skills];
                preparedPositions.push(item.position)
            });

            preparedSkills = preparedSkills.filter(uniqueFilter);
            preparedPositions = preparedPositions.filter(uniqueFilter);

            return [preparedSkills, preparedPositions];
        });
};

export const getEmployeeById = (_id) => {
    return getSkillsAndPositions()
        .then(([skills, positions]) => {
            const employeePromise = Employee.findById(_id);

            return Promise.all([employeePromise, skills, positions]);
        });
};

export const updateEmployeeData = (_id, data) => {
    return Employee.findByIdAndUpdate(_id, { $set: data });
};

export const deleteEmployee = (_id) => {
    return Employee.findByIdAndRemove(_id);
};