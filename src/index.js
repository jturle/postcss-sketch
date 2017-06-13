import postcss, {plugin} from 'postcss';
import valueParser from 'postcss-value-parser';
import _ from 'lodash';
import {execSync} from 'child_process';
import path from 'path';
import fs from 'fs';
import md5 from 'md5';

const cache = [];

const getSketchJSON = (file) => {

  // Quick Cache...
  let hash = md5(file);
  if( cache[hash] )
    return cache[hash];

  let sketchToolLocation = '/Applications/Sketch Beta.app/Contents/Resources/sketchtool/bin/sketchtool';
  if (fs.existsSync(file)) {
    if (fs.existsSync(sketchToolLocation)) {
      let cmd = '"' + path.resolve(sketchToolLocation) + '" dump ' + path.resolve(file);
      return cache[hash] = JSON.parse(execSync(cmd));
    } else {
      throw( 'Sketch Tool Not Found: ' + sketchToolLocation);
    }
  } else {
    throw( 'Sketch File Not Found: ' + file );
  }
};

/**
 * Converts a Sketch RGBA to HTML5 RGBA
 * @param string
 * @returns {string}
 */
const convRGBA = (string) => {
  let x = string.substr( 5, string.indexOf(')') - 5 ).split(',');
  x[0] *= 255;
  x[0] = Math.round(x[0]);
  x[1] *= 255;
  x[1] = Math.round(x[1]);
  x[2] *= 255;
  x[2] = Math.round(x[2]);
  return 'rgba(' + x.join(',') + ')';
};

module.exports = plugin('postcss-backwards', (opts) => {
  opts = opts || {};
  return (css, result) => {

    // Runs through all of the nodes (declorations) in the file
    css.walkDecls(declaration => {
      if (declaration.value.indexOf('sketch') !== -1) {

        var parsedValue = valueParser(declaration.value);
        if (parsedValue.nodes[1].value.indexOf('.textStyle') == 0) {
          let textStyleName = parsedValue.nodes[1].value.substr(11);

          let file = parsedValue.nodes[0].nodes[0].value;
          let fileRef = path.join(path.dirname(declaration.source.input.file), file);

          let sketchData = getSketchJSON(path.resolve(fileRef));

          let style = _.find(sketchData.layerTextStyles.objects, ['name', textStyleName]);
          if (!style) {
            console.log('Missing style: ' + textStyleName);
          } else {
            // console.log('here', style.value.textStyle );
            if (_.get(style.value, 'textStyle.NSFont.name', false)) {

              // Do the font family & size...
              // TODO - line-height, style etc. px, pt, rem ?
              declaration.value = _.get(style.value, 'textStyle.NSFont.attributes.NSFontSizeAttribute', 10) + 'px \'' + _.get(style.value, 'textStyle.NSFont.name', false) + '\'';

              // Do the font color...
              if (_.has(style.value, 'textStyle.NSColor.color')) {
                const color = postcss.decl({
                  prop: 'color',
                  value: convRGBA(_.get(style.value, 'textStyle.NSColor.color'))
                });
                declaration.parent.append(color);
              }
            }
          }

        }


        //console.log('File: ' + file);
        //console.log('SketchJSON',style.value );
        // console.log('Deep',parsedValue.nodes[0].nodes);
        //console.log('this', declaration );
      }
      // css.walkRules(rule => {
      //   console.log(rule);
      // })
      // console.log(declaration);
      //declaration.value = declaration.value.split('').reverse().join('');
    });

  };
});