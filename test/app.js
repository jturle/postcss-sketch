import React from 'react';
import {render} from 'react-dom';
import styles from './test.css';

// const sketch = require( './source_current.sketch' );
// Components
import Menu from './components/menu';

class App extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <h1>Header Bar</h1>
        <h2>Header H2 - Nice one</h2>
        <div className={styles.headerBar}>I will be styled as a header bar...</div>
        <br/>
        <div className={styles.headerBar2}>I will be styled as a header bar...</div>
        <br/>
        <div className={styles.headerBar3}>I will be styled as a header bar...</div>
        <br/>
        <div className={styles.test}></div>
        <Menu/>
      </div>
    )
  }
}

render(<App />, document.getElementById("app"));