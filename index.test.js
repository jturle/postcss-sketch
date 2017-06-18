var postcss = require('postcss');

var plugin = require('./lib/index');

function run(input, output, opts) {
    return postcss([plugin(opts)]).process(input).then(result => {
        expect(result.css).toEqual(output);
        expect(result.warnings().length).toBe(0);
    });
}

it('can load a font from a textStyle', () => {
    return run(
        "a { font: sketch('./test/reference.json').textStyle.Heading_H1; }",
        "a { font-family: 'Helvetica Neue'; font-size: 20px; color: rgba(143,143,143,1); }"
    );
});
