/* eslint-disable complexity */
import { plugin } from 'postcss';
import valueParser from 'postcss-value-parser';
import _ from 'lodash';
import path from 'path';

// Local imports...
import { convUnit, percentUnit, appendRules, findSymbol } from './helpers';
import {
    getSketchJSON,
    clearLoaderCache,
    disableCache,
    enableDebugMode
} from './loader';
import * as parser from './parsers';

module.exports = plugin('postcss-sketch', opts => {
    opts = _.assignIn(
        {
            debugMode: false,
            noCache: false,
            cssModulesMode: false
        },
        opts || {}
    );
    if (_.get(opts, 'debugMode', false)) enableDebugMode();
    if (_.get(opts, 'noCache', false)) disableCache();
    return (css, result) => {
        clearLoaderCache();

        // Runs through all of the nodes (declorations) in the file
        css.walkDecls(decl => {
            if (decl.value.indexOf('sketch(') !== -1) {
                let parsedValue = valueParser(decl.value);

                let file = parsedValue.nodes[0].nodes[0].value;

                // Resolve the file reference.
                let fileRef;
                if (decl.source.input.file)
                    fileRef = path.join(
                        path.dirname(decl.source.input.file),
                        file
                    ); // Relative to CSS File
                else fileRef = path.join(file); // No CSS file, probably testing

                // Retrieve the sketch JSON dump
                let sketchData = getSketchJSON(path.resolve(fileRef));

                // Add a dependency.
                result.messages.push({
                    type: 'dependency',
                    file: fileRef,
                    parent: css.source.input.file
                });

                // Symbols
                if (parsedValue.nodes[1].value.indexOf('.symbol') === 0) {
                    if (
                        parsedValue.nodes[1].value.indexOf('.symbol.deep') === 0
                    ) {
                        let symbolName = parsedValue.nodes[1].value.substr(13);
                        let symbol = findSymbol(sketchData.pages, symbolName);
                        if (!symbol) {
                            decl.warn(
                                result,
                                'Missing symbol deep: ' + symbolName
                            );
                        } else {
                            parser.processLayer(symbol, decl.parent, opts);
                        }
                    } else {
                        // Symbols
                        let symbolName = parsedValue.nodes[1].value.substr(8);
                        let symbol = findSymbol(sketchData.pages, symbolName);
                        if (!symbol) {
                            decl.warn(result, 'Missing symbol: ' + symbolName);
                        } else {
                            parser.processLayer(
                                symbol,
                                decl.parent,
                                opts,
                                false
                            );
                        }
                    }
                    // Finally remove it...
                    decl.remove();
                }

                // Shared Styles
                if (parsedValue.nodes[1].value.indexOf('.sharedStyle') === 0) {
                    let sharedStyleName = parsedValue.nodes[1].value.substr(13);
                    let style = _.find(sketchData.layerStyles.objects, [
                        'name',
                        sharedStyleName
                    ]);
                    if (!style) {
                        decl.warn(
                            result,
                            'Missing shared style: ' + sharedStyleName
                        );
                    } else {
                        // Do the font color...
                        if (
                            _.has(style.value, 'contextSettings.opacity') &&
                            _.get(style.value, 'contextSettings.opacity', 1) < 1
                        ) {
                            decl.cloneBefore({
                                prop: 'opacity',
                                value: _.get(
                                    style.value,
                                    'contextSettings.opacity',
                                    1
                                )
                            });
                        }

                        // Do the background...
                        let fill = _.find(style.value.fills, ['isEnabled', 1]);
                        if (fill) {
                            if (fill.fillType === 0) {
                                // Background-color
                                decl.cloneBefore({
                                    prop: 'background-color',
                                    value: _.get(fill, 'color.value')
                                });
                            }

                            if (fill.fillType === 1) {
                                // Gradient
                                let gradRule;
                                /* eslint-disable */
                                switch (fill.gradient.gradientType) {
                                    default:
                                    case 0:
                                        gradRule = 'linear-gradient(90deg, ';
                                        break;
                                    case 1:
                                        gradRule =
                                            'radial-gradient(' +
                                            percentUnit(fill.gradient.from.x) +
                                            ' ' +
                                            percentUnit(fill.gradient.to.y) +
                                            ', ';
                                        break;
                                }
                                /* eslint-enable */
                                fill.gradient.stops.forEach((stop, idx) => {
                                    if (idx > 0) gradRule += ', ';
                                    gradRule +=
                                        stop.color.value +
                                        ' ' +
                                        Math.round(stop.position * 100) +
                                        '%';
                                });
                                gradRule += ')';
                                decl.cloneBefore({
                                    prop: 'background-image',
                                    value: gradRule
                                });
                            }
                        }

                        // Do the border...
                        let border = _.find(style.value.borders, [
                            'isEnabled',
                            1
                        ]);
                        if (border) {
                            decl.cloneBefore({
                                prop: 'border',
                                value:
                                    _.get(border, 'thickness') +
                                        'px solid ' +
                                        _.get(border, 'color.value')
                            });
                        }

                        // Do the box shadow...
                        let shadow = _.find(style.value.shadows, [
                            'isEnabled',
                            1
                        ]);
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
                if (parsedValue.nodes[1].value.indexOf('.textStyle') === 0) {
                    let textStyleName = parsedValue.nodes[1].value.substr(11);
                    let style = _.find(sketchData.layerTextStyles.objects, [
                        'name',
                        textStyleName
                    ]);
                    if (!style) {
                        decl.warn(
                            result,
                            'Missing text style: ' + textStyleName
                        );
                    } else {
                        let textStyle = style.value.textStyle;
                        appendRules(decl.parent, parser.textStyle(textStyle));
                    }
                    // Remove original
                    decl.remove();
                }
            }
        });
    };
});
