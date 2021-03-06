import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import App from './App';
import { Auth } from './components/Auth';
import { HomeContainer } from './components/HomeContainer';
import { Profile } from './components/Profile';
import { ProjectTable } from './components/ProjectTable';
import { Project } from "./components/Project";

ReactDOM.render(
  <Router history={ browserHistory }>
      <Route path="/" component={ App }>
          <IndexRoute component={ HomeContainer }/>
          <Route path="register" component={ Auth }/>
          <Route path="login" component={ Auth }/>
          <Route path="profile(/:method)" component={ Profile } />
          <Route path="projects" component={ ProjectTable } />
          <Route path="project(/:method)" component={ Project } />
      </Route>
  </Router>,
  document.getElementById('root')
);
