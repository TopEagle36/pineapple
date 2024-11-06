import axios from 'axios';
import { SERVER_URL } from '../../../constant/server';
// import https from 'https'

// const agent = new https.Agent({
//   rejectUnauthorized: false // This will ignore self-signed certificate errors
// });

export const sendVisitInfo = async (data) => {
  const result = axios
    .post(`${SERVER_URL}/record/module/visit`, data)
    .then((response) => response.data)
    .catch((err) => {
      console.log('error', err);
      return { message: 'Error occured while trying to fetch your visit info!' };
    });
  return result;
};
