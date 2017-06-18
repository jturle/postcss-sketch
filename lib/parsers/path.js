'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _helpers = require('../helpers');

exports.default = function(path) {
    if (path.fixedRadius)
        return [
            {
                prop: 'border-radius',
                value: (0, _helpers.convUnit)(path.fixedRadius)
            }
        ];
};
