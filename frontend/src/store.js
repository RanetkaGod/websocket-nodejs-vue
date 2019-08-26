import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios"

Vue.prototype.$axios = axios

import {HTTP} from './srv-defaults'

Vue.use(Vuex)
const store = new Vuex.Store({
    state: {
        authorized: false,
        role: undefined
    },
    mutations: {
        authorize(state, payload) {
            if (payload) {
                state.authorized = true
                state.role = payload
            } else {
                state.authorized = false
                state.role = undefined
            }
        }
    },
    actions: {
        async authorize({commit}) {
            try {
                let response = await HTTP('/session')
                commit('authorize', response.data.role)
            } catch (e) {
                console.log(e)
                commit('authorize')
            }
        }
    }
})
export default store
