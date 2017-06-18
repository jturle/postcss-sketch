'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _helpers = require('../helpers');

exports.default = function (border, parent) {
  parent.append({
    prop: 'border-color',
    value: border.color.value
  });
  parent.append({
    prop: 'border-width',
    value: (0, _helpers.convUnit)(_.get(border, 'thickness'))
  });
  parent.append({
    prop: 'border-style',
    value: 'solid'
  });
};