<template>
    <div class="content-wrapper">
        <nav-menu></nav-menu>
        <div class="table-wrapper">
            <div class="table" :class="{'menu-open': this.delete_menu_displayed}">
                <span class="cell cell--title">Информация</span>
                <span class="cell cell--title">
                    Состояние
                    <button v-if="$store.state.role === 1" class="button delete-menu"
                            @click="delete_menu_displayed =! delete_menu_displayed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path d="M3 6l3 18h12l3-18h-18zm19-4v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.316c0 .901.73 2 1.631 2h5.711z"/>
                        </svg>
                    </button>
                </span>

                <template v-for="(elements, key) in socketData">
                    <span class="cell" :key="key+'-info'">{{ elements['project-info'] }}</span>
                    <span v-if="$store.state.role === 2" class="cell" :key="key+'-state'">{{ elements.state }}</span>
                    <div v-if="$store.state.role === 1" class="select-wrapper" :key="key+'-select'">
                        <select v-if="$store.state.role === 1" :key="key+'-state'" class="select cell"
                                v-model="selected_states[key].state"
                                @change="changeState(selected_states[key])">
                            <option class="option" v-for="state in states" :key="state" :value="state">{{state}}
                            </option>
                        </select>
                        <transition name="delete-button" appear>
                            <button v-if="delete_menu_displayed" class="button delete" @click="deleteRow(elements._id)">X</button>
                        </transition>
                    </div>
                </template>

                <template v-if="$store.state.role === 1">
                    <transition name="add-button" mode="out-in">
                        <span v-if="!adding_row" key="newrow" class="new-row"><button class="button new-row" @click="adding_row=true">+</button></span>
                        <span key="form" v-else class="new-form">
                            <input v-model="new_row.info" type="text" class="cell input"
                                   placeholder="Название проекта"/>
                            <select v-model="new_row.state" class="cell select">
                                <option v-for="(state, key) in states" class="option" :key="key">{{state}}</option>
                            </select>
                            <div class="button-group">
                                <button key="save" class="button save" @click="saveRow">Сохранить</button>
                                <button class="button cancel" @click="adding_row=false">Отменить</button>
                            </div>
                        </span>
                    </transition>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
    import NavMenu from "./NavMenu"
    import { HTTP } from '../srv-defaults'
    export default {
        name: "TableComponent",
        components: {NavMenu},
        data() {
            return {
                socketData: '',
                fieldData: '',
                states: ['Connected', 'Disconnected', 'Testing'],
                selected_states: [],
                adding_row: false,
                new_row: {
                    info: '',
                    state: 'Connected'
                },
                delete_menu_displayed: false
            }
        },
        mounted: async function () {
            try {
                const response = HTTP.get('/ticket')
                console.log(response)
                let token = response.data.token
                this.$connect(`ws://vue-test-websocket.herokuapp.com/?token=${token}`, {reconnection: true})
                console.log('connected to websocket')
                this.$options.sockets.onmessage = (data) => {
                    console.log('got message from ws:'+ data)
                    let self = this
                    this.socketData = JSON.parse(data.data)
                    this.socketData.forEach(function (obj, key) {
                        self.selected_states[key] = {
                            '_id': self.socketData[key]._id,
                            'state': self.socketData[key].state
                        }
                    })
                }
            } catch (e) {
                console.log(e)
                this.$store.dispatch('authorize')
            }
        },
        beforeDestroy() {
            this.$disconnect()
        },
        methods: {
            changeState: function (row) {
                this.$socket.send(JSON.stringify(row))
            },
            saveRow: async function () {
                try {
                    await HTTP.post('/new', this.new_row)
                    this.new_row.info = undefined
                    this.new_row.state = 'Connected'
                    this.adding_row = !this.adding_row
                } catch (e) {
                    this.adding_row = !this.adding_row
                    alert('Произошла ошибка')
                }

            },
            deleteRow: async function(id){
                try {
                    await HTTP.delete(`/delete?id=${id}`)
                }catch (e) {
                    alert('Невозможно удалить')
                }
            }
        },
    }
</script>

<style lang="sass" scoped>
    @import "../variables"
    .content-wrapper
        width: 100%

        .table-wrapper
            margin-top: 20px
            width: 100%
            display: flex
            flex-direction: row
            justify-content: center
            position: relative

            .new-form
                width: 100%
                grid-column: 1/3

                .button-group
                    grid-column: 1/3

            .new-row
                width: 100%
                grid-column: 1/3

            .table, .new-form
                display: grid
                grid-gap: 10px
                grid-template-columns: minmax(130px, 300px) minmax(130px, 300px)
                padding: 0
                transition: all .2s ease-in-out
                &.menu-open
                    padding: 0 60px

                .select-wrapper
                    position: relative

                .button
                    width: 100%
                    background: white
                    border: 1px solid
                    height: 50px
                    transition: all .2s ease-in-out

                .button.new-row

                    border-color: $main-blue
                    font-size: 30px
                    color: $main-blue

                    &:hover
                        background: $main-blue
                        color: white

                .button.save
                    border-color: #00d735
                    color: #00d735
                    font-weight: bold
                    margin-bottom: 10px

                    &:hover
                        background: #00d735
                        color: white

                .button.cancel
                    border-color: #d72e01
                    color: #d72e01
                    font-weight: bold

                    &:hover
                        background: #d72e01
                        color: white

                .button.delete
                    position: absolute
                    z-index: 1
                    width: 40px
                    height: 40px
                    //border-radius: 50%
                    top: 0
                    right: -50px
                    border-color: #d72e01
                    color: #d72e01
                    font-weight: bold

                    &:hover
                        background: #d72e01
                        color: white

                .cell
                    z-index: 2
                    position: relative
                    background: #f9f9f9
                    padding: 10px
                    width: 100%
                    height: 100%

                    &.cell--title
                        font-weight: bold

                        & .delete-menu
                            position: absolute
                            width: 20px
                            height: 20px
                            background: transparent
                            border: none
                            right: 15px
                            top: 6px
                            fill: #d72e01
                            transition: all .2s ease-in-out
                            &:hover
                                fill: $main-blue

                    &.input
                        border: none

                    &.select
                        border: none
                        z-index: 2

                        &:-moz-focusring
                            color: transparent
                            text-shadow: 0 0 0 #000

                        &:focus, &:active
                            outline: none


    .delete-button-enter, .delete-button-leave-to
        transform: translateX(-50px)
        opacity: 0

    .delete-button-enter-to, .delete-button-leave
        transform: translateX(0)
        opacity: 1

    .delete-button-enter-active, .delete-button-leave-active
        transition: all .2s ease-in-out

    .add-button-enter, .add-button-leave-to
        opacity: 0
        transform: translateY(-10px)

    .add-button-enter-to, .add-button-leave
        opacity: 1
        transform: translateY(0)

    .add-button-enter-active, .add-button-leave-active
        transition: all .1s ease-in-out
</style>
