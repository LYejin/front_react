import axios from 'axios';
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from '../../../../../cookie/Cookie';

const accesstoken = getAccessToken();

const baseConfig = {
  baseURL: process.env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

const authConfig = {
  baseURL: '',
  // timeout: 1000, 요청 최대 대기 시간
  headers: {
    Authorization: getAccessToken(),
  },
  cache: 'no-store',
  withCredentials: true,
};

// 기본적으로 사용되는 axios instance
export const axiosInstance = axios.create(baseConfig);

//token 인증이 필요한 instance
export const ComAuthAxiosInstance = axios.create(authConfig);

axiosInstance.interceptors.response.use(
  response => {
    // accessToken 갱신
    if (response.headers['authorization'] !== undefined) {
      setAccessToken(response.headers['authorization']);
    }
    return response;
  },
  async error => {
    throw error;
  }
);
////////////////////////////////////////////////////////////

//요청 인터셉터
ComAuthAxiosInstance.interceptors.request.use(
  async config => {
    const req_url = config.url;
    config.headers['Authorization'] = getAccessToken();
    if (req_url.includes('system')) {
      await ComAuthAxiosInstance('/login').catch(error => {
        if (
          error.response.status === 403 &&
          error.response.headers['authorization'] !== undefined
        ) {
          return config;
        } else if (
          error.response.status === 404 &&
          error.response.headers['authorization'] !== undefined
        ) {
          setAccessToken(error.response.headers['authorization']);
          config.headers['Authorization'] =
            error.response.headers['authorization'];
        }
      });
    }
    return config;
  },
  err => {
    return Promise.reject(err);
  }
);

//응답 인터셉터
ComAuthAxiosInstance.interceptors.response.use(
  response => {
    // accessToken 갱신
    if (response.headers['authorization'] !== undefined) {
      setAccessToken(response.headers['authorization']);
    }
    return response;
  },
  async error => {
    if (
      error.response.status === 403 &&
      error.response.headers['authorization'] === undefined
    ) {
      removeAccessToken();
      window.location.href = '/';
      alert('로그인 시간이 만료되었습니다. 다시 로그인 해주세요.');
    }
    throw error;
  }
);
