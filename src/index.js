import postcss, {plugin} from 'postcss';
import valueParser from 'postcss-value-parser';
import _ from 'lodash';
import {execSync} from 'child_process';
import path from 'path';
import fs from 'fs';
import md5 from 'md5';

let cache = [];

const getSketchJSON = (file) => {

  // Quick Cache...
  let hash = md5(file);
  if (cache[hash])
    return cache[hash];

  let sketchToolLocation = '/Applications/Sketch Beta.app/Contents/Resources/sketchtool/bin/sketchtool';

  // Suppor the non-beta version.
  if (!fs.existsSync(sketchToolLocation))
    sketchToolLocation = '/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool';

  if (fs.existsSync(sketchToolLocation)) {
    if (fs.existsSync(file)) {
      let cmd = '"' + path.resolve(sketchToolLocation) + '" dump ' + path.resolve(file);
      return cache[hash] = JSON.parse(execSync(cmd));
    } else {
      throw( 'Sketch File Not Found: ' + file );
    }
  } else {
    throw( 'Sketch Tool Not Found: ' + sketchToolLocation);
  }
};

/**
 * Converts a Sketch RGBA to HTML5 RGBA
 * @param string
 * @returns {string}
 */
const convRGBA = (string) => {
  let x = string.substr(5, string.indexOf(')') - 5).split(',');
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
const convUnit = (unit) => {
  return unit + 'px';
};

/**
 * Method to convert units from percent in Sketch, to percent HTML string value...
 * @param unit
 * @returns {string}
 */
const percentUnit = (unit) => {
  return Math.round(unit * 100) + '%';
};

const extractBackground = (fill) => {
  if (fill.fillType == 0) { // Background-color
    return {
      prop: 'background-color',
      value: _.get(fill, 'color.value')
    };
  }

  if (fill.fillType == 1) { // Gradient
    let gradRule;
    switch (fill.gradient.gradientType) {
      case 0:
        gradRule = 'linear-gradient(0deg, ';
        break;
      case 1:
        // console.log('Radial', fill );
        /* Rectangle:
         background-image: radial-gradient(26% 71%, #3023AE 17%, #C96DD8 85%);*/
        gradRule = 'radial-gradient(' + percentUnit(fill.gradient.from.x) + ' ' + percentUnit(fill.gradient.to.y) + ', ';
        break;
    }
    fill.gradient.stops.forEach((stop, idx) => {
      // if( fill.gradient.gradientType == 1 )
      //console.log(stop);
      if (idx > 0)
        gradRule += ', ';
      gradRule += stop.color.value + ' ' + Math.round(stop.position * 100) + '%';
    });
    gradRule += ')';
    return {
      prop: 'background-image',
      value: gradRule
    };
  }

  return {prop: 'background', value: 'transparent'}
};

const extractBorder = (border) => {
  return {
    prop: 'border',
    value: convUnit(_.get(border, 'thickness')) + ' solid ' + _.get(border, 'color.value')
  };
};

const sketchLayerToMixed = (layer, parent, nest = true) => {
  // parent.append({prop: '-ref', value: layer.name});
  if (layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
    parent.append({prop: 'background-color', value: layer.backgroundColor.value});
  } else {
    // Background/Fills
    if (layer.style && layer.style.fills.length && _.find(layer.style.fills, ['isEnabled', 1])) {
      parent.append(extractBackground(_.find(layer.style.fills, ['isEnabled', 1])));
    }
  }
  if (nest && layer.layers) {
    layer.layers.forEach((childLayer) => {
      if (['text', 'container'].indexOf(childLayer.name) == -1) {
        let newParent = parent.cloneBefore();
        newParent.removeAll();
        newParent.selector += ' :global(.' + childLayer.name + ')';
        sketchLayerToMixed(childLayer, newParent);
      }
      if (childLayer.name == 'text' || childLayer.name == 'container')
        sketchLayerToMixed(childLayer, parent);
    });
  }

  // Font color
  if (layer.style && layer.style.textStyle) {
    parent.append({prop: 'color', value: convRGBA(layer.style.textStyle.NSColor.color)});
  }

  // Borders
  if (layer.style && layer.style.borders.length && _.find(layer.style.borders, ['isEnabled', 1])) {
    parent.append(extractBorder(_.find(layer.style.borders, ['isEnabled', 1])));
  }

  // Radius
  if (_.find(layer.layers, ['name', 'Path'])) {
    let path = _.find(layer.layers, ['name', 'Path']);
    if (path.fixedRadius)
      parent.append({prop: 'border-radius', value: convUnit(path.fixedRadius)});
  }
};

module.exports = plugin('postcss-backwards', (opts) => {
  opts = opts || {};
  return (css, result) => {

    // Clear cache every run
    cache = [];

    let addedDep = false;

    // Runs through all of the nodes (declorations) in the file
    css.walkDecls(decl => {
      if (decl.value.indexOf('sketch(') !== -1) {
        var parsedValue = valueParser(decl.value);

        let file = parsedValue.nodes[0].nodes[0].value;

        // Resolve the file reference.
        let fileRef = path.join(path.dirname(decl.source.input.file), file);

        // Retrieve the sketch JSON dump
        let sketchData = getSketchJSON(path.resolve(fileRef));

        // Add a dependency.
        if (!addedDep) {
          result.messages.push({type: 'dependency', file: fileRef, parent: css.source.input.file});
          addedDep = true;
        }

        // Symbols
        if (parsedValue.nodes[1].value.indexOf('.symbolDeep') == 0) {
          let symbolName = parsedValue.nodes[1].value.substr(12);
          let symbols = _.find(sketchData.pages, ['name', 'Symbols']);
          let symbol = _.find(symbols.layers, ['name', symbolName]);
          //console.log(symbols);
          if (!symbol) {
            console.log('Missing symbol: ' + symbolName);
          } else {
            sketchLayerToMixed(symbol, decl.parent);
            // Finally remove it...
            decl.remove();
          }
        }

        // Symbols
        if (parsedValue.nodes[1].value.indexOf('.symbol') == 0) {
          let symbolName = parsedValue.nodes[1].value.substr(8);
          let symbols = _.find(sketchData.pages, ['name', 'Symbols']);
          let symbol = _.find(symbols.layers, ['name', symbolName]);
          //console.log(symbols);
          if (!symbol) {
            console.log('Missing symbol: ' + symbolName);
          } else {
            sketchLayerToMixed(symbol, decl.parent, false);
            // Finally remove it...
            decl.remove();
          }
        }

        // Shared Styles
        if (parsedValue.nodes[1].value.indexOf('.sharedStyle') == 0) {
          let sharedStyleName = parsedValue.nodes[1].value.substr(13);
          let style = _.find(sketchData.layerStyles.objects, ['name', sharedStyleName]);
          if (!style) {
            console.log('Missing shared style: ' + sharedStyleName);
          } else {

            // Do the font color...
            if (_.has(style.value, 'contextSettings.opacity') && _.get(style.value, 'contextSettings.opacity', 1) < 1) {
              decl.cloneBefore({
                prop: 'opacity',
                value: _.get(style.value, 'contextSettings.opacity', 1)
              });
            }

            // Do the background...
            let fill = _.find(style.value.fills, ['isEnabled', 1]);
            if (fill) {

              if (fill.fillType == 0) { // Background-color
                decl.cloneBefore({
                  prop: 'background-color',
                  value: _.get(fill, 'color.value')
                });
              }

              if (fill.fillType == 1) { // Gradient
                let gradRule;
                switch (fill.gradient.gradientType) {
                  case 0:
                    gradRule = 'linear-gradient(90deg, ';
                    break;
                  case 1:
                    // console.log('Radial', fill );
                    /* Rectangle:
                     background-image: radial-gradient(26% 71%, #3023AE 17%, #C96DD8 85%);*/
                    gradRule = 'radial-gradient(' + percentUnit(fill.gradient.from.x) + ' ' + percentUnit(fill.gradient.to.y) + ', ';
                    break;
                }
                fill.gradient.stops.forEach((stop, idx) => {
                  // if( fill.gradient.gradientType == 1 )
                  //console.log(stop);
                  if (idx > 0)
                    gradRule += ', ';
                  gradRule += stop.color.value + ' ' + Math.round(stop.position * 100) + '%';
                });
                gradRule += ')';
                decl.cloneBefore({
                  prop: 'background-image',
                  value: gradRule
                });
              }
            }

            // Do the border...
            let border = _.find(style.value.borders, ['isEnabled', 1]);
            if (border) {
              decl.cloneBefore({
                prop: 'border',
                value: _.get(border, 'thickness') + 'px solid ' + _.get(border, 'color.value')
              });
            }

            // Do the box shadow...
            let shadow = _.find(style.value.shadows, ['isEnabled', 1]);
            if (shadow) {
              let shadowRule = convUnit(shadow.offsetX);
              shadowRule += ' ' + convUnit(shadow.offsetY);
              shadowRule += ' ' + convUnit(shadow.blurRadius);
              shadowRule += ' ' + convUnit(shadow.spread);
              shadowRule += ' ' + shadow.color.value;
              decl.cloneBefore({
                prop: 'box-shadow',
                value: shadowRule
              });

            }

            // Finally remove it...
            decl.remove();
          }
        }

        // Text Styles...
        if (parsedValue.nodes[1].value.indexOf('.textStyle') == 0) {
          let textStyleName = parsedValue.nodes[1].value.substr(11);
          let style = _.find(sketchData.layerTextStyles.objects, ['name', textStyleName]);
          if (!style) {
            console.log('Missing text style: ' + textStyleName);
          } else {
            // console.log('here', style.value.textStyle );
            if (_.get(style.value, 'textStyle.NSFont.family', false)) {

              // Do the font family & size...
              // TODO - line-height, style etc. px, pt, rem ?
              decl.value = _.get(style.value, 'textStyle.NSFont.attributes.NSFontSizeAttribute', 10) + 'px \'' + _.get(style.value, 'textStyle.NSFont.family', false) + '\'';

              // Do the font color...
              if (_.has(style.value, 'textStyle.NSColor.color')) {
                const color = postcss.decl({
                  prop: 'color',
                  value: convRGBA(_.get(style.value, 'textStyle.NSColor.color'))
                });
                decl.parent.append(color);
              }
            }
          }

        }
      }
    });

  };
});