import {convUnit} from '../helpers';

export default (border, parent) => {
    parent.append({
        prop: 'border-color',
        value: border.color.value
    });
    parent.append({
        prop: 'border-width',
        value: convUnit(_.get(border, 'thickness'))
    });
    parent.append({
        prop: 'border-style',
        value: 'solid'
    });
};

