import fs from 'fs';
import path from 'path';
import md5 from 'md5';
import {execSync} from 'child_process';

const __DEBUG__ = false;
let cache = [];

export const clearLoaderCache = () => {
  // Clear cache every run
  cache = [];
};

export const getSketchJSON = (file) => {

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
      let execResult = execSync(cmd);
      if (__DEBUG__)
        fs.writeFileSync('./reference.json', execResult);
      return cache[hash] = JSON.parse(execResult);
    } else {
      throw( 'Sketch File Not Found: ' + file );
    }
  } else {
    throw( 'Sketch Tool Not Found: ' + sketchToolLocation);
  }
};
