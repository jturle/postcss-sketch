import React from 'react';
import { render } from 'react-dom';
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
                <div className={styles.testBackground}>TestBackground</div>
                <br />
                <div className={styles.testLinearBackground}>
                    TestLinearBackground
                </div>
                <br />
                <div className={styles.testRadialBackground}>
                    TestRadialBackground
                </div>
                <br />
                <div className={styles.test} />
                <Menu />
                <br />
                <div className={styles.symbolTest}>
                    What's happening dude...
                </div>
                <div
                    style={{
                        backgroundColor: 'white',
                        boxSizing: 'border-box',
                        display: 'inline-block'
                    }}
                />
            </div>
        );
    }
}

render(<App />, document.getElementById('app'));
