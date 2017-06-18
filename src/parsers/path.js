import { convUnit } from '../helpers';

export default path => {
    if (path.fixedRadius)
        return [
            {
                prop: 'border-radius',
                value: convUnit(path.fixedRadius)
            }
        ];
};
