import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('uaifix_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const user = JSON.parse(localStorage.getItem('uaifix_user') || 'null')
      localStorage.removeItem('uaifix_token')
      localStorage.removeItem('uaifix_user')
      window.location.href = user?.role === 'admin' ? '/admin/login' : '/tecnico/login'
    }
    return Promise.reject(error)
  }
)

export default api
