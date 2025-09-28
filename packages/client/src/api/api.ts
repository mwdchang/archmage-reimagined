import axios, { AxiosResponse } from 'axios';
import router from '@/router';
import { Mage } from 'shared/types/mage';

export const API = axios.create({
  baseURL: '/api'
});


export const APIWrapper = async <T = any>(
  requestFn: () => Promise<AxiosResponse<T>>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const response = await requestFn();
    return { data: response.data, error: null };
  } catch (err) {
    let errorMsg = 'Unknown error';

    if (axios.isAxiosError(err)) {
      errorMsg = err.response?.data?.message || err.message;
      console.error('Axios error:', err.response);
    } else {
      console.error('Unexpected error:', err);
    }
    return { data: null, error: errorMsg };
  }
}



// Interceptor for defeated status and reroute
API.interceptors.response.use(
  response => {
    const mage = response.data?.mage as Mage
    if (mage && (mage.status === 'defeated' || mage.forts <= 0)) {
      router.push({ name: 'defeated' }) // assumes 'notice' is a named route
    }
    return Promise.resolve(response);
  },
  error => {
    return Promise.reject(error);
  }
)
