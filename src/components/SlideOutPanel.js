//SlideOutMenuContainer.js
import React, {Component} from 'react';
import './SlideOutPanel.css';

class SlideOutPanel extends Component {
    render() {

        return (
            <div className="SlideOutPanel">
                <ul id='slide_menu'>
                    <li>Home</li>
                    <li>About</li>
                    <li>Contact</li>
                    <li>Tutorial</li>
                    <li>Advertise</li>
                </ul>
            </div>
        );
    }
}

export default SlideOutPanel;