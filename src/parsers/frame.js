import { convUnit } from '../helpers';

const FLAG_A = 1; // 0001
const FLAG_B = 2; // 0010
const FLAG_C = 4; // 0100
const FLAG_D = 8; // 1000
const FLAG_E = 16; // 0100
const FLAG_F = 32; // 1000

/*
 // console.log('FLAG A RIGHT ON', FLAG_A & resizingConstraint);
 // console.log('FLAG B LOCK WIDTH', FLAG_B & resizingConstraint);
 // console.log('FLAG C LEFT ON', FLAG_C & resizingConstraint);
 // console.log('FLAG D DOWN ON', FLAG_D & resizingConstraint);
 // console.log('FLAG E LOCK HEIGHT', FLAG_E & resizingConstraint);
 // console.log('FLAG F TOP ON', FLAG_F & resizingConstraint);
 // console.log('FLAG G TOP & BOT', FLAG_G & resizingConstraint);
 */

export default (layerType, frame, parentFrame, resizingConstraint) => {
    let rules = [];
    if (layerType === 'text') {
        if ((resizingConstraint & FLAG_C) === 0)
            rules.push({
                prop: 'padding-left',
                value: convUnit(frame.x - parentFrame.x)
            });
        if ((resizingConstraint & FLAG_F) === 0)
            rules.push({
                prop: 'padding-top',
                value: convUnit(frame.y - parentFrame.y)
            });
        if ((resizingConstraint & FLAG_D) === 0) {
            rules.push({
                prop: 'padding-bottom',
                value: convUnit(
                    parentFrame.y + parentFrame.height - frame.y - frame.height
                )
            });
        }
        if ((resizingConstraint & FLAG_A) === 0) {
            rules.push({
                prop: 'padding-right',
                value: convUnit(
                    parentFrame.x + parentFrame.width - frame.x - frame.width
                )
            });
        }
    }
    if (layerType == 'container') {
        if ((resizingConstraint & FLAG_B) === 0)
            rules.push({
                prop: 'width',
                value: convUnit(frame.width)
            });
        if ((resizingConstraint & FLAG_E) === 0)
            rules.push({
                prop: 'height',
                value: convUnit(frame.height)
            });

        // Margins
        if (frame.x !== 0)
            rules.push({
                prop: 'margin-left',
                value: convUnit(frame.x)
            });
        if (frame.y !== 0)
            rules.push({
                prop: 'margin-top',
                value: convUnit(frame.y)
            });
        let marginRight = parentFrame.width - frame.x - frame.width;
        if (marginRight !== 0)
            rules.push({
                prop: 'margin-right',
                value: convUnit(marginRight)
            });
        let marginBottom = parentFrame.height - frame.y - frame.height;
        if (marginBottom !== 0)
            rules.push({
                prop: 'margin-bottom',
                value: convUnit(marginBottom)
            });
    }
    return rules;
};
