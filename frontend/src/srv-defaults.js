import axios from 'axios'
export const HTTP = axios.create({
    // Empty when in production, which means that publicPath used
    baseURL: `${'http://vue-test-websocket.herokuapp.com'}`,
    withCredentials: true
});

HTTP.defaults.headers.post['Content-Type'] = 'application/json';
HTTP.defaults.headers.put['Content-Type'] = 'application/json';
