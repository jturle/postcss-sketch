import React from 'react';
import { render } from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import styles from './test.css';

// Components
import Menu from './components/menu';

class App extends React.Component {
    render() {
        return (
            <div className={styles.container}>
                <h1>PostCSS Sketch Plugin</h1>
                <h2>What is Lorem Ipsum?</h2>
                <p>
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book. It has survived not only five centuries,
                    but also the leap into electronic typesetting, remaining
                    essentially unchanged. It was popularised in the 1960s with
                    the release of Letraset sheets containing Lorem Ipsum
                    passages, and more recently with desktop publishing software
                    like Aldus PageMaker including versions of Lorem Ipsum. From{' '}
                    <a href="http://lipsum.lipsum.com/">lipsum.lipsum.com</a>
                </p>
                <div className={styles.sharedStyle}>
                    Complex Shared Style Test, featuring fills, border and
                    shadow.
                </div>
                <Menu />
            </div>
        );
    }
}

render(<App />, document.getElementById('app'));
