import _ from 'lodash';

/**
 * Converts a Sketch RGBA to HTML5 RGBA
 * @param string
 * @returns {string}
 */
export const convRGBA = string => {
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
export const convUnit = unit => {
    return Math.round(unit * 100) / 100 + 'px';
};

/**
 * Method to convert units from percent in Sketch, to percent HTML string
 * value...
 * @param unit
 * @returns {string}
 */
export const percentUnit = unit => {
    return Math.round(unit * 100) + '%';
};

export const appendRules = (decl, rules) => {
    if (rules) {
        if (Array.isArray(rules)) rules.forEach(rule => decl.append(rule));
        else decl.append(rules);
    }
};

export const findSymbol = (pages, name) => {
    let found = false;
    pages.forEach(page => {
        let symbol = _.find(page.layers, ['name', name]);
        if (symbol && symbol['<class>'] === 'MSSymbolMaster') found = symbol;
    });
    return found;
};
