//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Tasks {
  string[] public tasks;

  mapping(string => uint) public task_idx_by_id;

  // add tasks to contract
  function addTask(string memory _taskId) public {
    task_idx_by_id[_taskId] = tasks.length;
    tasks.push(_taskId);
  }

  //complete task by id
  function completeTask(string memory _taskId) public {
    uint _index = task_idx_by_id[_taskId];
    delete tasks[_index];
  }

  // get all tasks
  function getTasks() public view returns (string[] memory) {
    return tasks;
  }

}
