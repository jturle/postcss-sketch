# PostCSS-Sketch [![Build Status](https://travis-ci.org/jturle/postcss-sketch.svg?branch=master)](https://travis-ci.org/jturle/postcss-sketch)
Just playing with pulling Sketch colours, styles etc directly into postcss references.

Please ignore the horrible design in the examples etc.

## Currently Supports

- textStyles (font, size, color)
- sharedStyles (opacity, background, border)

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

### Nested Symbol Support

Little demo of working with a semantic-ui-react Menu component...

## One line of CSS
```css
.menuContainer.ui.menu {
    extends: sketch('../source_current.sketch').symbol.deep.MenuComponent;
}
```
## Becomes (Output for CSS modules atm...)
```css
.menuContainer.ui.menu :global(.item:hover) {
    background-image: linear-gradient(0deg, #0B7BD0 0%, #2DA1F8 100%);
    border-radius: 3px;
    text-align: left;
    font-size: 14px;
    color: rgba(255,255,255,1);
}
.menuContainer.ui.menu :global(.item.active) {
    background-image: linear-gradient(0deg, #1991EB 0%, #2DA1F8 100%);
    border-radius: 4px;
    text-align: left;
    font-size: 14px;
    color: rgba(255,255,255,1);
}
.menuContainer.ui.menu :global(.item.active:hover) {
    background-image: linear-gradient(0deg, #1BBA43 0%, #1D9F2F 100%);
    border-radius: 4px;
    text-align: left;
    font-size: 14px;
    color: rgba(255,255,255,1);
}
.menuContainer.ui.menu :global(.item) {
    text-align: left;
    font-family: 'Chalkboard';
    font-size: 14px;
    color: rgba(53,64,82,1);
}
.menuContainer.ui.menu {
    background-color: #FFFFFF;
    text-align: left;
    font-family: 'Arial';
    font-size: 12px;
    color: rgba(159,169,186,1);
}
```

## Try it?

Clone the package, `yarn install`, `yarn dev`, visit http://localhost:8080. Open `source_current.sketch`. Have a play!

## Use it?

`yarn add postcss-sketch` - good luck :/

Add the plugin to the postcss configuration.

```js
module.exports = (ctx) => ({
  plugins: [
    require("postcss-nesting")(),
    require("postcss-sketch")()
  ]
});
```