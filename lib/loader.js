'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getSketchJSON = exports.clearLoaderCache = undefined;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _md = require('md5');

var _md2 = _interopRequireDefault(_md);

var _child_process = require('child_process');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __DEBUG__ = false;
var cache = [];

var clearLoaderCache = exports.clearLoaderCache = function clearLoaderCache() {
    // Clear cache every run
    cache = [];
};

var getSketchJSON = exports.getSketchJSON = function getSketchJSON(file) {
    // Quick Cache...
    var hash = (0, _md2.default)(file);
    if (cache[hash]) return cache[hash];

    if (file.indexOf('.json') !== -1) return cache[hash] = JSON.parse(_fs2.default.readFileSync(file));

    var sketchToolLocation = '/Applications/Sketch Beta.app/Contents/Resources/sketchtool/bin/sketchtool';

    // Suppor the non-beta version.
    if (!_fs2.default.existsSync(sketchToolLocation)) sketchToolLocation = '/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool';

    if (_fs2.default.existsSync(sketchToolLocation)) {
        if (_fs2.default.existsSync(file)) {
            var cmd = '"' + _path2.default.resolve(sketchToolLocation) + '" dump ' + _path2.default.resolve(file);
            var execResult = (0, _child_process.execSync)(cmd);
            if (__DEBUG__) _fs2.default.writeFileSync('./reference.json', execResult);
            return cache[hash] = JSON.parse(execResult);
        } else {
            throw 'Sketch File Not Found: ' + file;
        }
    } else {
        throw 'Sketch Tool Not Found: ' + sketchToolLocation;
    }
};