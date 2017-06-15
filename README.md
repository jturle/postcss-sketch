# postcss-sketch
Just playing with pulling Sketch colours, styles etc directly into postcss references.

## POC for text styles atm...

```css
h1 {
    font: sketch('./source_current.sketch').textStyle.Heading_H1;
}

h2 {
    font: sketch('./source_current.sketch').textStyle.Heading_H2;
}

.headerBar {
    extends: sketch('./source_current.sketch').sharedStyle.HeaderBar;
}

.headerBar2 {
    extends: sketch('./source_current.sketch').sharedStyle.HeaderBar2;
}

.headerBar3 {
    extends: sketch('./source_current.sketch').sharedStyle.HeaderBar3;
}
```

### Becomes

```css
h1 {
    font: 20px 'Helvetica Neue';
    color: rgba(143,143,143,1.000000);
}

h2 {
    font: 14px 'Helvetica Neue';
    color: rgba(0,0,0,1.000000);
}

.headerBar {
    opacity: 0.7497169384057971;
    background-color: rgba(187,80,80,0.47);
    border: 1px solid #155AEF;
    box-shadow: 6px 6px 3px 2px rgba(253,3,3,0.50);
}

.headerBar2 {
    background-image: linear-gradient(90deg, #3023AE 0%, #53A0FE 48%, #B4ED50 100%);
}

.headerBar3 {
    background-image: radial-gradient(50% 64%, #3023AE 0%, #C96DD8 100%);
}
```

### Based on 'test/source.sketch'

![Image of Sketch file](./doc/source_current.png)

## Requires Sketch Beta...