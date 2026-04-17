const DEFAULT_API_URL = 'http://localhost:5000/api';
const DEFAULT_SOCKET_URL = 'http://localhost:5000';

export const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? DEFAULT_SOCKET_URL;
