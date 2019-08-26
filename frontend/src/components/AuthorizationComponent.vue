<template>
    <div class="authorization-wrapper">
        <div class="authorization-block">
            <form class="auth-form">
                <span class="form-name">Вход</span>
                <input class="form-item input" type="text" placeholder="Логин" v-model="login_data.username">
                <input class="form-item input" type="password" placeholder="Пароль" v-model="login_data.password">
                <button class="form-item button" @click.prevent='login'>Войти</button>
                <span class="err-message">{{error_message}}</span>
            </form>
        </div>
    </div>
</template>

<script>
    import { HTTP } from '../srv-defaults'

    export default {
        name: "AuthorizationComponent",
        data() {
            return {
                login_data: {
                    username: '',
                    password: ''
                },
                error_message: '',
                token: ''
            }
        },
        methods: {
            login: async function () {
                try {
                    await HTTP.post('/auth', this.login_data)
                    this.$router.push('/')
                } catch (e) {
                    console.log(e)
                    this.error_message = 'Ошибка'
                }
            }
        }
    }
</script>

<style lang="sass" scoped>
    @import "../variables"
    .authorization-wrapper
        background: #f5f5f5
        display: flex
        flex-direction: row
        justify-content: center
        align-items: center
        width: 100%
        height: 100vh

        .authorization-block
            background: white
            border-radius: 6px
            padding: 60px 40px
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.3)

            .auth-form
                display: flex
                flex-direction: column
                width: 100%

                .err-message
                    color: red

                .form-name
                    font-size: 1.8em
                    font-weight: bold
                    margin-bottom: 20px
                    color: $main-blue

                .form-item
                    border-radius: 6px
                    width: 100%
                    margin-bottom: 12px
                    padding: 14px 10px

                    &:last-child
                        margin-bottom: 0

                .input
                    border: 1px solid lightgray

                .button
                    background: #92adff
                    font-weight: bold
                    color: white
                    outline: none
                    border: none
                    transition: all .2s ease-in-out

                    &:hover
                        background: #839deb

                    &:focus &:active
                        outline: none


</style>
