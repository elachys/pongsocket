/*global App:false */
/*global jQuery:false */

require.config({
    paths: {
        jquery: '../bower_components/jquery/jquery',
        bootstrap: 'vendor/bootstrap',
        two: '../bower_components/two/build/two',
        socketio: '../bower_components/socket.io-client/dist/socket.io'
    },
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        two: {
            exports: 'two'
        },
        app: {
            deps: ['jquery', 'two'],
            exports: 'app'
        }

    }
});

require(['jquery', 'bootstrap', 'two', 'socketio', 'app'], function () {
    'use strict';
    // use app here

    //console.log('Running jQuery %s', $().jquery);
    jQuery(function(){
        App.init();
    });
});