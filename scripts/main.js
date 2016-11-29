
(function (window) {
    if (window && window.document && typeof window.addEventListener === 'function') {
        window.addEventListener('load', function () {
            const App = require('./app');
            (new App(window, window.document)).run();
        }, false);
    } else {
        throw {
            name: 'INVALID_GLOBAL_OBJECT',
            message: 'The global object is not valid...'
        };
    }
})(typeof window !== 'undefined' ? window : null);
