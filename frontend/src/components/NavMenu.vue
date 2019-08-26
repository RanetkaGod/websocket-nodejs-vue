<template>
    <div class="nav-wrapper">
        <nav class="nav">
            <button class="logout nav-item" @click="logout">Выйти</button>
        </nav>
    </div>
</template>

<script>
    import { HTTP } from '../srv-defaults'
    export default {
        name: "NavMenu",
        methods: {
            logout: async function () {
                try {
                    await HTTP.delete('/logout')
                    this.$router.push('/auth')
                }
                catch (e) {
                    console.error('Ошибка выхода ', e)
                }

            }
        }
    }
</script>

<style lang="sass" scoped>
    @import "../variables"
    .nav-wrapper
        width: 100%
        height: 60px
        background: $main-blue
        .nav
            height: 100%
            display: flex
            justify-content: flex-end
            .nav-item
                height: 100%
                background: $main-blue
                border: none
                border-left: 1px solid gray
                width: 100px
                color: white
                font-weight: bold
                transition: all .2s ease-in-out
                &:hover
                    background: $main-blue-hover
</style>
