import React from 'react';
import { Button } from 'semantic-ui-react';
import Styles from './button.css';

const ButtonExampleEmphasis = () =>
    <div>
        <Button className={Styles.buttonPrimary} primary>Primary</Button>
        <Button className={Styles.buttonSecondary} secondary>Secondary</Button>
    </div>;

export default ButtonExampleEmphasis;
