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

    fetchWithTimeout(url, options, timeout = 5000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout)
            )
        ]);
    }

    startUpload(event) {
        this.setState({loading: true})
        const formData = new FormData()
        formData.append('file', event.target.files[0])

        // 5 second timeout:
        const options = {
            method: 'POST',
            body: formData,
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
                    alert('success')
                })
            }
            this.setState({loading: false})
        }).catch((err) => {
            alert(err)
            this.setState({loading: false})
        })
    }

    componentDidMount() {
        const element = document.querySelector('input[type="file"]')
        element.addEventListener('change', this.startUpload)
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