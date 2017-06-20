'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.findSymbol = exports.appendRules = exports.percentUnit = exports.convUnit = exports.convRGBA = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Converts a Sketch RGBA to HTML5 RGBA
 * @param string
 * @returns {string}
 */
var convRGBA = exports.convRGBA = function convRGBA(string) {
    var x = string.substr(5, string.indexOf(')') - 5).split(',');
    x[0] *= 255;
    x[0] = Math.round(x[0]);
    x[1] *= 255;
    x[1] = Math.round(x[1]);
    x[2] *= 255;
    x[2] = Math.round(x[2]);
    if (x[3]) {
        x[3] = Math.round(x[3] * 100) / 100;
    }
    return 'rgba(' + x.join(',') + ')';
};

/**
 * Method to convert units from number in Sketch, to pixel string value...
 * @param unit
 * @returns {string}
 */
var convUnit = exports.convUnit = function convUnit(unit) {
    return Math.round(unit * 100) / 100 + 'px';
};

/**
 * Method to convert units from percent in Sketch, to percent HTML string
 * value...
 * @param unit
 * @returns {string}
 */
var percentUnit = exports.percentUnit = function percentUnit(unit) {
    return Math.round(unit * 100) + '%';
};

var appendRules = exports.appendRules = function appendRules(decl, rules) {
    if (rules) {
        if (Array.isArray(rules)) rules.forEach(function (rule) {
            return decl.append(rule);
        });else decl.append(rules);
    }
};

var findSymbol = exports.findSymbol = function findSymbol(pages, name) {
    var found = false;
    pages.forEach(function (page) {
        var symbols = _lodash2.default.filter(page.layers, ['<class>', 'MSSymbolMaster']);
        var symbol = _lodash2.default.find(symbols, ['name', name]);
        if (symbol) found = symbol;
    });
    return found;
};