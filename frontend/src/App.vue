<template>
    <div id="app">
        <transition appear name="main" mode="out-in">
            <router-view/>
        </transition>
    </div>
</template>

<script>
    export default {
        name: 'app',
    }
</script>

<style lang="sass">
    @import "variables"
    body, html
        padding: 0
        margin: 0
        width: 100%

        *
            box-sizing: border-box

        button::-moz-focus-inner
            border: 0

        #app, select, button, input
            @import url('https://fonts.googleapis.com/css?family=Montserrat&display=swap')
            font-family: 'Montserrat', sans-serif
            font-size: 16px
            -webkit-font-smoothing: subpixel-antialiased

        #app
            width: 100%
            height: 100%
            display: flex
            flex-direction: row
            justify-content: center

        .main-enter, .main-leave-to
            opacity: 0

        .main-leave, .main-enter-to
            opacity: 1

        .main-leave-active, .main-enter-active
            transition: $transition02
</style>
