import Vue from 'vue'
import App from './App.vue'
import VueNativeSock from 'vue-native-websocket'
import VueRouter from 'vue-router'
import TableComponent from "@/components/TableComponent"
import AuthorizationComponent from "@/components/AuthorizationComponent"
import axios from 'axios'
import store from "./store"

Vue.prototype.$axios = axios

Vue.use(VueRouter)
Vue.use(VueNativeSock, 'ws://localhost:3000',
    {
        connectManually: true,
    }
)
const routes = [
    {
        path: '/',
        name: 'table',
        component: TableComponent,
        beforeEnter: async function (to, from, next) {
            try {
                await store.dispatch('authorize')
                if (store.state.authorized) {
                    next()
                } else {
                    if (to.path !== 'auth')
                        next({name: 'auth'})
                    else
                        next()
                }
            } catch (e) {
                console.log(e)
            }
        }
    },
    {
        path: '/auth',
        name: 'auth',
        component: AuthorizationComponent,
        beforeEnter: async function (to, from, next) {
            try {
                await store.dispatch('authorize')
                if (store.state.authorized)
                    next({name: 'table'})
                else {
                    next()
                }
            } catch (e) {
                console.log(e)
            }

        }
    }
]
const router = new VueRouter({
    mode: 'history',
    routes
})

Vue.config.productionTip = false

new Vue({
    render: h => h(App),
    router,
    store
}).$mount('#app')
