'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.processLayer = exports.processBorder = exports.extractBackground = undefined;

var _background = require('./background');

var _background2 = _interopRequireDefault(_background);

var _border = require('./border');

var _border2 = _interopRequireDefault(_border);

var _layer = require('./layer');

var _layer2 = _interopRequireDefault(_layer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.extractBackground = _background2.default;
exports.processBorder = _border2.default;
exports.processLayer = _layer2.default;