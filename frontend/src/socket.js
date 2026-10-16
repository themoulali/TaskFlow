
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL

const socketOptions = {
  autoConnect: false,
  auth: (callback) => {
    callback({
      token: localStorage.getItem('taskflow_token') || '',
    })
  },
}

export const socket = SOCKET_URL
  ? io(SOCKET_URL.replace(/\/$/, ''), socketOptions)
  : io(socketOptions)
