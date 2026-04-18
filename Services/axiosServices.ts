import axios from 'axios';

export const BASE_URL = 'http://10.125.219.60:3000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const requestHandler = async (request: Promise<any>) => {
  try {
    const response = await request;
    return response.data; 
  } catch (error: any) {
    if (error.response) {
      // Return the custom error object sent by your backend
      return error.response.data;
    }
    // Handle cases where the server is down or no internet
    return { 
      success: false, 
      message: "Network Error: Please check your connection", 
      error: error.message 
    };
  }
};

const getHeaders = async (isAuth: boolean) => {
  if (!isAuth) return {};
  const token = "YOUR_STORED_TOKEN"; 
  return {
    Authorization: `Bearer ${token}`,
  };
};


export const getRequest = async (endpoint: string, isAuth = true) => {
  const headers = await getHeaders(isAuth);
  return requestHandler(apiClient.get(endpoint, { headers }));
};

export const postRequest = async (endpoint: string, payload: any, isAuth = true) => {
  const headers = await getHeaders(isAuth);
  return requestHandler(apiClient.post(endpoint, payload, { headers }));
};

export const putRequest = async (endpoint: string, payload: any, isAuth = true) => {
  const headers = await getHeaders(isAuth);
  return requestHandler(apiClient.put(endpoint, payload, { headers }));
};

export const deleteRequest = async (endpoint: string, isAuth = true) => {
  const headers = await getHeaders(isAuth);
  return requestHandler(apiClient.delete(endpoint, { headers }));
};