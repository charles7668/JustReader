//SlideOutMenuContainer.js
import React, {Component} from 'react';
import './SlideOutPanel.css';
import LoadingPage from "./LoadingPage";

class SlideOutPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {loading: false}
        this.uploadFile = this.uploadFile.bind(this)
        this.startUpload = this.startUpload.bind(this)
    }

    uploadFile() {
        const element = document.querySelector('input[type="file"]')
        element.click()
    }

    startUpload(event) {
        this.setState({loading: true})
        const formData = new FormData()
        formData.append('file', event.target.files[0])
        const options = {
            method: 'POST',
            body: formData
        }

        fetch(window.serverURL + "novels", options).then(response => ({
            status: response.status,
            data: response
        })).then(data => {
            if (data.status === 208) {
                alert('file exist')
            } else if (data.status !== 200) {
                alert('error')
            } else {
                data.data.json().then(data => {
                    if (window.novel_list === null) {
                        window.novel_list = data
                    } else {
                        window.novel_list.splice(0, 0, data)
                    }
                    window.updateNovelList()
                    this.setState({loading: false})
                    alert('success')
                })
            }
        })
    }

    componentDidMount() {
        const element = document.querySelector('input[type="file"]')
        element.addEventListener('change', this.startUpload)
        console.log(element)
    }

    render() {
        return (
            <div className="SlideOutPanel">
                <ul className='slide_menu'>
                    <li>Setting</li>
                    <li onClick={this.uploadFile}>Upload</li>
                </ul>
                <input type="file" accept=".txt" style={{display: 'none'}}/>
                {this.state.loading === true && <LoadingPage text={"uploading..."}/>}
            </div>
        );
    }
}

export default SlideOutPanel;