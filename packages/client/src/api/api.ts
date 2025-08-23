import axios from 'axios';
import router from '@/router';
import { Mage } from 'shared/types/mage';

export const API = axios.create({
  baseURL: '/api'
});


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
