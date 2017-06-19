var postcss = require('postcss');

var plugin = require('./lib/index');

function run(input, output, opts) {
    return postcss([plugin(opts)]).process(input).then(result => {
        expect(result.css).toEqual(output);
        expect(result.warnings().length).toBe(0);
    });
}

const sketchRef = './test/tests.sketch.ref.json';

it('can load a Semi-Bold font from a textStyle', () => {
    return run(
        "div { font: sketch('" + sketchRef + "').textStyle.Headline_1; }",
        "div { font-weight: 500; font-family: 'Roboto'; font-size: 32px; line-height: 44px; color: rgba(57,60,62,1); }"
    );
});

it('can load a another font style from a textStyle', () => {
    return run(
        "div { font: sketch('" + sketchRef + "').textStyle.Headline_2; }",
        "div { font-family: 'Roboto'; font-size: 22px; line-height: 32px; color: rgba(57,60,62,1); }"
    );
});

it('can extract a basic symbols textStyle', () => {
    return run(
        "div { extends: sketch('" + sketchRef + "').symbol.BasicSymbol; }",
        "div { font-style: italic; font-family: 'Helvetica Neue'; font-size: 24px; color: rgba(0,0,0,1); }"
    );
});

it('can extract a basic border', () => {
    return run(
        "div { extends: sketch('" + sketchRef + "').symbol.BasicBorder; }",
        'div { border-width: 1px; border-style: solid; border-color: #979797; }'
    );
});

it('can extract a border radius', () => {
    return run(
        "div { extends: sketch('" + sketchRef + "').symbol.TestBorderRadius; }",
        'div { border-width: 1px; border-style: solid; border-color: #979797; border-radius: 10px; }'
    );
});

it('can extract a fill/background', () => {
    return run(
        "div { extends: sketch('" + sketchRef + "').symbol.TestBackground; }",
        'div { background-color: #D8D8D8; }'
    );
});

it('can extract a symbol background', () => {
    return run(
        "div { extends: sketch('" +
            sketchRef +
            "').symbol.TestSymbolBackground; }",
        'div { background-color: #C4C4C4; }'
    );
});

it('can extract a linear gradient fill/background', () => {
    return run(
        "div { extends: sketch('" +
            sketchRef +
            "').symbol.TestLinearBackground; }",
        'div { background-image: linear-gradient(0deg, #B4EC51 0%, #429321 100%); }'
    );
});

it('can extract a radial gradient fill/background', () => {
    return run(
        "div { extends: sketch('" +
            sketchRef +
            "').symbol.TestRadialBackground; }",
        'div { background-image: radial-gradient(50% 44%, #3023AE 0%, #C86DD7 100%); }'
    );
});

it('can extract frame sizing', () => {
    return run(
        "div { extends: sketch('" + sketchRef + "').symbol.TestFrameFixed; }",
        'div { width: 235px; height: 89px; }'
    );
});

it('can extract frame padding', () => {
    return run(
        "div { extends: sketch('" + sketchRef + "').symbol.TestFramePadding; }",
        "div { padding-left: 18px; padding-top: 13px; padding-bottom: 60px; padding-right: 100px; text-align: left; font-style: italic; font-family: 'Helvetica Neue'; font-size: 14px; color: rgba(0,0,0,1); }"
    );
});

it('can extract frame margin', () => {
    return run(
        "div { extends: sketch('" + sketchRef + "').symbol.TestFrameMargin; }",
        "div { background-color: #F1F1F1; margin-left: 10px; margin-top: 5px; margin-right: 20px; margin-bottom: 15px; text-align: left; font-style: italic; font-family: 'Helvetica Neue'; font-size: 14px; color: rgba(0,0,0,1); }"
    );
});

it('can extract a sharedStyle', () => {
    return run(
        "div { extends: sketch('" +
            sketchRef +
            "').sharedStyle.ButtonPrimary; }",
        'div { background-image: linear-gradient(90deg, #39B54A 0%, #34AA44 98%); }'
    );
});
