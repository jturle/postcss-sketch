import _ from 'lodash';

export default (fill) => {
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
