// backend/src/config/axiosConfig.ts

import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Create axios instance with proxy support if needed
const createAxiosInstance = () => {
  const config: any = {
    timeout: 15000,
    headers: {
      'User-Agent': 'TLE-Eliminators-App/1.0',
      'Accept': 'application/json',
    },
    // Increase max redirects
    maxRedirects: 5,
  };

  // Add proxy if environment variables are set
  if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    console.log(`Using proxy: ${proxyUrl}`);
    
    config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    config.proxy = false; // Disable axios built-in proxy
  }

  return axios.create(config);
};

export const cfApi = createAxiosInstance();

// Add response interceptor for better error handling
cfApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ETIMEDOUT') {
      console.error('Request timed out - Codeforces API might be slow');
    } else if (error.code === 'ENETUNREACH') {
      console.error('Network unreachable - Check your internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - Codeforces API might be down');
    }
    
    return Promise.reject(error);
  }
);