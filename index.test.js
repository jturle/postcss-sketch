var postcss = require('postcss');

var plugin = require('./lib/index');

function run(input, output, opts) {
    return postcss([plugin(opts)]).process(input).then(result => {
        expect(result.css).toEqual(output);
        expect(result.warnings().length).toBe(0);
    });
}

const sketchRef = './test/tests.sketch.ref.json';

it('can load a font from a textStyle', () => {
    return run(
        "a { font: sketch('./test/reference.json').textStyle.Heading_H1; }",
        "a { font-family: 'Helvetica Neue'; font-size: 20px; color: rgba(143,143,143,1); }"
    );
});

it('can extract a basic symbols textStyle', () => {
    return run(
        "a { extends: sketch('" + sketchRef + "').symbol.BasicSymbol; }",
        "a { font-style: italic; font-family: 'Helvetica Neue'; font-size: 24px; color: rgba(0,0,0,1); }"
    );
});

it('can extract a basic border', () => {
    return run(
        "a { extends: sketch('" + sketchRef + "').symbol.BasicBorder; }",
        'a { border-width: 1px; border-style: solid; border-color: #979797; }'
    );
});

it('can extract a border radius', () => {
    return run(
        "a { extends: sketch('" + sketchRef + "').symbol.TestBorderRadius; }",
        'a { border-width: 1px; border-style: solid; border-color: #979797; border-radius: 10px; }'
    );
});

it('can extract a fill/background', () => {
    return run(
        "a { extends: sketch('" + sketchRef + "').symbol.TestBackground; }",
        'a { background-color: #D8D8D8; }'
    );
});

it('can extract a symbol background', () => {
    return run(
        "a { extends: sketch('" +
            sketchRef +
            "').symbol.TestSymbolBackground; }",
        'a { background-color: #C4C4C4; }'
    );
});

it('can extract a linear gradient fill/background', () => {
    return run(
        "a { extends: sketch('" +
            sketchRef +
            "').symbol.TestLinearBackground; }",
        'a { background-image: linear-gradient(0deg, #B4EC51 0%, #429321 100%); }'
    );
});

it('can extract a radial gradient fill/background', () => {
    return run(
        "a { extends: sketch('" +
            sketchRef +
            "').symbol.TestRadialBackground; }",
        'a { background-image: radial-gradient(50% 44%, #3023AE 0%, #C86DD7 100%); }'
    );
});

it('can extract frame sizing', () => {
    return run(
        "a { extends: sketch('" + sketchRef + "').symbol.TestFrameFixed; }",
        'a { width: 235px; height: 89px; }'
    );
});

it('can extract frame padding', () => {
    return run(
        "a { extends: sketch('" + sketchRef + "').symbol.TestFramePadding; }",
        "a { padding-left: 18px; padding-top: 13px; padding-bottom: 60px; padding-right: 100px; text-align: left; font-style: italic; font-family: 'Helvetica Neue'; font-size: 14px; color: rgba(0,0,0,1); }"
    );
});

it('can extract frame margin', () => {
    return run(
        "a { extends: sketch('" + sketchRef + "').symbol.TestFrameMargin; }",
        "a { background-color: #F1F1F1; margin-left: 10px; margin-top: 5px; margin-right: 20px; margin-bottom: 15px; text-align: left; font-style: italic; font-family: 'Helvetica Neue'; font-size: 14px; color: rgba(0,0,0,1); }"
    );
});
