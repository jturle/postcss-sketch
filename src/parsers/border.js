import { convUnit } from '../helpers';

export default border => {
    return [
        {
            prop: 'border-width',
            value: convUnit(border.thickness)
        },
        {
            prop: 'border-style',
            value: 'solid'
        },
        {
            prop: 'border-color',
            value: border.color.value
        }
    ];
};
