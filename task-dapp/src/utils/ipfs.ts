
import axios from 'axios';
// import ipfs from 'ipfs';
// import makeIpfsFetch from 'ipfs-fetch';
import Task from '../types';

type TaskInput = {
  name: string;
  description: string;
  dueDate: string;
};

export const fetchTasks = async(taskIds) => {
  let results = [];

  for (let i = 0; i < taskIds.length; i++) {
    await fetch(`https://gateway.pinata.cloud/ipfs/${taskIds[i]}`)
      .then((response) => response.json())
      .then((data) => results.push(data));
  }

  return results;
}

// upload task JSON to IPFS
export const uploadTask = async (task: TaskInput) => {
  try {
  const resFile = await axios({
    method: "post",
    url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    data: task,
    headers: {
        'pinata_api_key': `${process.env.REACT_APP_PINATA_API_KEY}`,
        'pinata_secret_api_key': `${process.env.REACT_APP_PINATA_API_SECRET}`,
        "Content-Type": "application/json"
    },
  });
  const taskHash = resFile.data.IpfsHash;
  return taskHash;
  } catch (error) {
    console.log(`Error uploading task to IPFS: ${error}`);
  }

}
