import React, { ReactElement } from 'react';
import TaskList from './components/TaskList';

import './App.css';

export default function App(): ReactElement {
  return (
    <div className="App">
      <TaskList/>
    </div>
  );
}
