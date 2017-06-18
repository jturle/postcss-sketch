'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
 * Method to convert units from percent in Sketch, to percent HTML string value...
 * @param unit
 * @returns {string}
 */
var percentUnit = exports.percentUnit = function percentUnit(unit) {
  return Math.round(unit * 100) + '%';
};