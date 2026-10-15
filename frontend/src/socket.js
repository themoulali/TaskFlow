
import { io } from 'socket.io-client'

export const socket = io({
  autoConnect: false,
  auth: (callback) => {
    callback({
      token: localStorage.getItem('taskflow_token') || '',
    })
  },
})
