# postcss-sketch
Just playing with pulling Sketch colours, styles etc directly into postcss references.

## POC for text styles atm...

```css
h1 {
    font: sketch('./source.sketch').textStyle.Heading_H1;
}

h2 {
    font: sketch('./source.sketch').textStyle.Heading_H2;
}
```

### Becomes

```css
h1 {
    font: 20px 'Andale Mono';
    color: rgba(31,193,235,1.000000);
}

h2 {
    font: 14px 'Arial Black';
    color: rgba(36,187,41,1.000000);
}
```

### Based on 'test/source.sketch'

## Requires Sketch Beta...