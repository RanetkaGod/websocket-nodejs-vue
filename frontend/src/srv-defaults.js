import axios from 'axios'
export const HTTP = axios.create({
    // Empty when in production, which means that publicPath used
    baseURL: `${''}`,
    withCredentials: true
})

HTTP.defaults.headers.post['Content-Type'] = 'application/json'
HTTP.defaults.headers.put['Content-Type'] = 'application/json'
