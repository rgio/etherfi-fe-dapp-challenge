import { useWeb3React } from '@web3-react/core';
const util = require('util');

import { AbstractConnector } from '@web3-react/abstract-connector';
import { UnsupportedChainIdError } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError
} from '@web3-react/injected-connector';
import { injected } from '../utils/connectors';
import { useEagerConnect, useInactiveListener } from '../utils/hooks';

import { CalendarIcon } from '@heroicons/react/20/solid'
import { Contract, ethers, Signer } from 'ethers';
import Task from '../types';
import React, {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from 'react';

import AddTask from './AddTask';

import TasksArtifact from '../artifacts/contracts/Tasks.sol/Tasks.json';
import { Provider } from '../utils/provider';
import { uploadTask, fetchTasks } from '../utils/ipfs';

type ActivateFunction = (
  connector: AbstractConnector,
  onError?: (error: Error) => void,
  throwErrors?: boolean
) => Promise<void>;

function getErrorMessage(error: Error): string {
  let errorMessage: string;

  switch (error.constructor) {
    case NoEthereumProviderError:
      errorMessage = `No Ethereum browser extension detected. Please install MetaMask extension.`;
      break;
    case UnsupportedChainIdError:
      errorMessage = `You're connected to an unsupported network.`;
      break;
    case UserRejectedRequestError:
      errorMessage = `Please authorize this website to access your Ethereum account.`;
      break;
    default:
      errorMessage = error.message;
  }

  return errorMessage;
}

const mockTasks = [
  {
    id: '1',
    name: 'Task 1',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    dueDate:'2/14/2023',
  },
  {
    id: '2',
    name: 'Task 2',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    dueDate:'2/14/2023',
  },
  {
    id: '3',
    name: 'Task 3',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    dueDate:'2/14/2023',
  },
  {
    id: '4',
    name: 'Task 4',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    dueDate:'2/14/2023',
  },
  {
    id: '5',
    name: 'Task 5',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    dueDate:'2/14/2023',
  },
]

export default function TaskList(): ReactElement {
  const context = useWeb3React<Provider>();

  const { library, activate, active } = context;

  const [activating, setActivating] = useState<boolean>(false);

  function handleActivate(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();

    async function _activate(activate: ActivateFunction): Promise<void> {
      setActivating(true);
      await activate(injected);
      setActivating(false);
    }

    _activate(activate);
  }

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has
  // granted access already
  const eagerConnectionSuccessful = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider,
  // if it exists
  useInactiveListener(!eagerConnectionSuccessful);

  const [isAddingTask, setIsAddingTask] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [tasksContract, setTasksContract] = useState<Contract>();
  const [tasksContractAddr, setTasksContractAddr] = useState<string>('');
  const [signer, setSigner] = useState<Signer>();
  //const [greetingInput, setGreetingInput] = useState<string>('');

  function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // only deploy the contract one time, when a signer is defined
    if (tasksContract || !signer) {
      return;
    }

    async function deployTasksContract(signer: Signer): Promise<void> {
      const Tasks = new ethers.ContractFactory(
        TasksArtifact.abi,
        TasksArtifact.bytecode,
        signer
      );
  
      try {
        const tasksContract = await Tasks.deploy();
  
        await tasksContract.deployed();
  
        setTasksContract(tasksContract);
  
        window.alert(`Tasks deployed to: ${tasksContract.address}`);
  
        setTasksContractAddr(tasksContract.address);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    deployTasksContract(signer);
  }

  async function deployTasksContract(signer: Signer): Promise<void> {
    const Tasks = new ethers.ContractFactory(
      TasksArtifact.abi,
      TasksArtifact.bytecode,
      signer
    );

    try {
      const tasksContract = await Tasks.deploy();

      await tasksContract.deployed();

      setTasksContract(tasksContract);

      window.alert(`Tasks deployed to: ${tasksContract.address}`);

      setTasksContractAddr(tasksContract.address);
    } catch (error: any) {
      window.alert(
        'Error!' + (error && error.message ? `\n\n${error.message}` : '')
      );
    }
  }

  const getTasks = async (tasksContract: Contract): Promise<void> => {
    let _taskIds = await tasksContract.getTasks();
    _taskIds = _taskIds.filter((id) => id.length > 0);
    let _tasks = await fetchTasks(_taskIds);
    _tasks = _tasks.sort((task1,task2) => { 
      if (task1.dueDate > task2.dueDate) {
        return 1
      }
      if (task1.dueDate < task2.dueDate) {
        return -1
      }
      return 0
    })

    if (_tasks !== tasks) {
      setTasks(_tasks);
    }
  }

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  useEffect((): void => {
    if (!tasksContract) {
      return;
    }

    getTasks(tasksContract);
  },[tasksContract]);

  function handleCompleteTask(event: MouseEvent<HTMLButtonElement>, taskId): void {
    event.preventDefault();

    async function completeTask(tasksContract: Contract, taskId): Promise<void> {
      try {
        const completeTaskTxn = await tasksContract.completeTask(taskId);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    completeTask(tasksContract!, taskId);
  }

  async function addTask(name: string, due: string, description: string): Promise<void> {
    try {
      const taskId = await uploadTask({
        name,
        dueDate: due,
        description,
      })
      const addTaskTxn = await tasksContract?.addTask(taskId);
    } catch (error: any) {
      window.alert(
        'Error!' + (error && error.message ? `\n\n${error.message}` : '')
      );
    }
  }

  function handleAddTask(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    window.alert(`EVENT: ${util.inspect(event.target)}`)
    //window.alert(`EVENT: ${JSON.stringify(event)}`)


    async function addTask(tasksContract: Contract): Promise<void> {
      try {
        const addTaskTxn = await tasksContract.addTask(0);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    addTask(tasksContract!);
    getTasks(tasksContract!);
  }

  return (
    <div className="overflow-hidden shadow sm:rounded-md">
      <div className="flex flex-row">
        <button
          className='mt-8 text-indigo-600 bg-white mb-4 mr-6 ring-1 ring-inset ring-indigo-100 hover:ring-indigo-300 block rounded-md py-2 px-3 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
          style={{
            cursor: active ? 'not-allowed' : 'pointer',
            borderColor: activating ? 'orange' : active ? 'unset' : 'green'
          }}
          onClick={handleActivate}
        >
          Connect
        </button>
        <button
          className='mt-8 text-indigo-600 bg-white mb-4 mr-6 ring-1 ring-inset ring-indigo-100 hover:ring-indigo-300 block rounded-md py-2 px-3 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
          onClick={handleDeployContract}
        >
          Deploy Contract
        </button>
        <button
          className='mt-8 text-indigo-600 bg-white mb-4 mr-6 ring-1 ring-inset ring-indigo-100 hover:ring-indigo-300 block rounded-md py-2 px-3 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
          onClick={() => setIsAddingTask(true)}
        >
          Add Task
        </button>
        <button
          className='mt-8 text-indigo-600 bg-white mb-4 mr-6 ring-1 ring-inset ring-indigo-100 hover:ring-indigo-300 block rounded-md py-2 px-3 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
          onClick={() => getTasks(tasksContract)}
        >
          Load Tasks
        </button>
      </div>
      <ul role="list" className="flex flex-col my-8 gap-8 divide-y divide-gray-200">
        {tasks.map((task) => (
          <li key={task.id} className="flex flex-col bg-white gap-4 sm:rounded-md max-w-md">
            <a href="#" className="block hover:bg-gray-50 sm:rounded-md">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-indigo-600">{task.name}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                    <p className="inline-flex rounded-full text-sm leading-5 text-gray-500">
                      Due on <time className="ml-2" dateTime={task.dueDate}>{task.dueDate}</time>
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="inline-flex rounded-full text-xs font-semibold leading-5 text-gray-400">
                      {task.description}
                    </p>
                  </div>
                </div>
              </div>
            </a>
            <button
              className='text-green-800 mb-4 mr-6 ml-6 ring-1 ring-inset ring-green-100 hover:ring-green-300 block rounded-md py-2 px-3 text-center text-sm leading-6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              onClick={(e) => handleCompleteTask(e,task)}
            >
              Complete task
            </button>
          </li>
        ))}
      </ul>
      <AddTask
        open={isAddingTask}
        setOpen={setIsAddingTask}
        addTask={addTask}
      />
    </div>
  )
}

