import postcss, {plugin} from 'postcss';
import valueParser from 'postcss-value-parser';
import _ from 'lodash';
import path from 'path';

// Local imports...
import {convRGBA,convUnit,percentUnit} from './helpers';
import {getSketchJSON,clearLoaderCache} from './loader';
import * as parser from './parsers';

const sketchLayerToMixed = (layer, parent, nest = true, parentLayer = null) => {
  if (layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
    parent.append({prop: 'background-color', value: layer.backgroundColor.value});
  } else {
    // Background/Fills
    if (layer.style && layer.style.fills.length && _.find(layer.style.fills, ['isEnabled', 1])) {
      parent.append(parser.extractBackground(_.find(layer.style.fills, ['isEnabled', 1])));
    }
  }

  if (nest && layer.layers) {
    layer.layers.forEach((childLayer) => {
      if (['text', 'container', 'Path'].indexOf(childLayer.name) == -1) {
        let newParent = parent.cloneBefore();
        newParent.removeAll();
        newParent.selector += ' :global(.' + childLayer.name + ')';
        sketchLayerToMixed(childLayer, newParent, nest, layer);
      }
      let boundingLayer = _.find(layer.layers, ['name', 'container']) || layer;
      //console.log('BoundingLayer', boundingLayer.name);
      if (childLayer.name == 'container')
        sketchLayerToMixed(childLayer, parent, nest, layer);
      if (childLayer.name == 'text')
        sketchLayerToMixed(childLayer, parent, nest, boundingLayer);
    });
  }

  // Frame
  const resizingConstraint = layer.resizingConstraint;
  let shape = layer.frame;
  parent.append({prop: 'box-sizing', value: 'border-box'});
  let FLAG_A = 1; // 0001
  let FLAG_B = 2; // 0010
  let FLAG_C = 4; // 0100
  let FLAG_D = 8; // 1000
  let FLAG_E = 16; // 0100
  let FLAG_F = 32; // 1000
  let FLAG_G = 64; // 1000
  if (layer.name == 'text') {
    // console.log('nl');
    // console.log('FLAG A RIGHT ON', FLAG_A & resizingConstraint);
    // console.log('FLAG B LOCK WIDTH', FLAG_B & resizingConstraint);
    // console.log('FLAG C LEFT ON', FLAG_C & resizingConstraint);
    // console.log('FLAG D DOWN ON', FLAG_D & resizingConstraint);
    // console.log('FLAG E LOCK HEIGHT', FLAG_E & resizingConstraint);
    // console.log('FLAG F TOP ON', FLAG_F & resizingConstraint);
    // console.log('FLAG G TOP & BOT', FLAG_G & resizingConstraint);
    if ((resizingConstraint & FLAG_C) == 0)
      parent.append({prop: 'padding-left', value: convUnit(layer.frame.x - parentLayer.frame.x)});
    if ((resizingConstraint & FLAG_F) == 0)
      parent.append({prop: 'padding-top', value: convUnit(layer.frame.y - parentLayer.frame.y)});
    if ((resizingConstraint & FLAG_D) == 0) {
      parent.append({
        prop: 'padding-bottom',
        value: convUnit(parentLayer.frame.y + parentLayer.frame.height - layer.frame.y - layer.frame.height)
      });
    }
    if ((resizingConstraint & FLAG_A) == 0) {
      parent.append({
        prop: 'padding-right',
        value: convUnit(parentLayer.frame.x + parentLayer.frame.width - layer.frame.x - layer.frame.width)
      });
    }
  }
  if (layer.name == 'container') {
    if ((resizingConstraint & FLAG_B) == 0)
      parent.append({prop: 'width', value: convUnit(layer.frame.width)});
    if ((resizingConstraint & FLAG_E) == 0)
      parent.append({prop: 'height', value: convUnit(layer.frame.height)});

    // Margins
    if (layer.frame.x !== 0)
      parent.append({prop: 'margin-left', value: convUnit(layer.frame.x)});
    if (layer.frame.y !== 0)
      parent.append({prop: 'margin-top', value: convUnit(layer.frame.y)});
    let marginRight = parentLayer.frame.width - layer.frame.x - layer.frame.width;
    if (marginRight !== 0)
      parent.append({prop: 'margin-right', value: convUnit(marginRight)});
    let marginBottom = parentLayer.frame.height - layer.frame.y - layer.frame.height;
    if (marginBottom !== 0)
      parent.append({prop: 'margin-bottom', value: convUnit(marginBottom)});
  }

  // Font color
  if (layer.style && layer.style.textStyle) {
    let alignment = layer.style.textStyle.NSParagraphStyle.style.alignment;
    switch (alignment) {
      case 1:
        parent.append({prop: 'text-align', value: 'right'});
        break;
      case 2:
        parent.append({prop: 'text-align', value: 'center'});
        break;
      case 3:
        parent.append({prop: 'text-align', value: 'justify'});
        break;
      case 0:
        parent.append({prop: 'text-align', value: 'left'});
        break;
    }
    if (layer.style.textStyle.NSParagraphStyle.style.maximumLineHeight !== 0) {
      parent.append({
        prop: 'line-height',
        value: convUnit(layer.style.textStyle.NSParagraphStyle.style.maximumLineHeight)
      });
    }
    let font = _.get(layer.style, 'textStyle.NSFont.family');
    let fontName = layer.style.textStyle.NSFont.name.toLowerCase();
    if (fontName.indexOf('italic') !== -1)
      parent.append({
        prop: 'font-style',
        value: 'italic'
      });
    if (fontName.indexOf('bold') !== -1)
      parent.append({
        prop: 'font-weight',
        value: 'bold'
      });
    if (font !== '.SF NS Text')
      parent.append({prop: 'font-family', value: '\'' + _.get(layer.style, 'textStyle.NSFont.family') + '\''});
    parent.append({
      prop: 'font-size',
      value: convUnit(_.get(layer.style, 'textStyle.NSFont.attributes.NSFontSizeAttribute'))
    });
    parent.append({prop: 'color', value: convRGBA(layer.style.textStyle.NSColor.color)});
  }

  // Borders
  if (layer.style && layer.style.borders.length && _.find(layer.style.borders, ['isEnabled', 1])) {
    parser.processBorder(_.find(layer.style.borders, ['isEnabled', 1]), parent);
    //parent.append(extractBorder(_.find(layer.style.borders, ['isEnabled', 1])));
  }

  // Radius
  if (_.find(layer.layers, ['name', 'Path'])) {
    let path = _.find(layer.layers, ['name', 'Path']);
    if (path.fixedRadius)
      parent.append({prop: 'border-radius', value: convUnit(path.fixedRadius)});
  }

  // Do the box shadow...
  if (_.find(layer.style.shadows, ['isEnabled', 1])) {
    let shadow = _.find(layer.style.shadows, ['isEnabled', 1]);
    let shadowRule = convUnit(shadow.offsetX);
    shadowRule += ' ' + convUnit(shadow.offsetY);
    shadowRule += ' ' + convUnit(shadow.blurRadius);
    shadowRule += ' ' + convUnit(shadow.spread);
    shadowRule += ' ' + shadow.color.value;
    parent.append({
      prop: 'box-shadow',
      value: shadowRule
    });
  }

};

module.exports = plugin('postcss-backwards', (opts) => {
  opts = opts || {};
  return (css, result) => {

    clearLoaderCache();

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
        if (parsedValue.nodes[1].value.indexOf('.symbol.deep') == 0) {
          let symbolName = parsedValue.nodes[1].value.substr(13);
          let symbols = _.find(sketchData.pages, ['name', 'Symbols']);
          let symbol = _.find(symbols.layers, ['name', symbolName]);
          //console.log(symbols);
          if (!symbol) {
            decl.warn(result, 'Missing symbol: ' + symbolName);
          } else {
            sketchLayerToMixed(symbol, decl.parent);
            // Finally remove it...
            decl.remove();
          }
        } else {
          // Symbols
          if (parsedValue.nodes[1].value.indexOf('.symbol') == 0) {
            let symbolName = parsedValue.nodes[1].value.substr(8);
            let symbols = _.find(sketchData.pages, ['name', 'Symbols']);
            let symbol = _.find(symbols.layers, ['name', symbolName]);
            //console.log(symbols);
            if (!symbol) {
              decl.warn(result, 'Missing symbol: ' + symbolName);
            } else {
              sketchLayerToMixed(symbol, decl.parent, false);
              // Finally remove it...
              decl.remove();
            }
          }
        }


        // Shared Styles
        if (parsedValue.nodes[1].value.indexOf('.sharedStyle') == 0) {
          let sharedStyleName = parsedValue.nodes[1].value.substr(13);
          let style = _.find(sketchData.layerStyles.objects, ['name', sharedStyleName]);
          if (!style) {
            decl.warn(result, 'Missing shared style: ' + sharedStyleName);
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
            decl.warn(result, 'Missing text style: ' + textStyleName);
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