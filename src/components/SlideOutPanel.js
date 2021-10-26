import React, {useEffect, useState} from 'react';
import './css/SlideOutPanel.css';
import LoadingPage from "./LoadingPage";

function SlideOutPanel() {
    const [loading, setLoading] = useState(false)
    const startUpload = (event) => {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', event.target.files[0])

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
                data.data.json().then(() => {
                    window.updateNovelList()
                    alert('success')
                })
            }
            setLoading(false)
        }).catch((err) => {
            alert(err)
            setLoading(false)
        })
    }
    const uploadFile = () => {
        const element = document.querySelector('input[type="file"]')
        element.click()
    }
    useEffect(() => {
        const element = document.querySelector('input[type="file"]')
        element.addEventListener('change', startUpload)
    }, [])
    return (
        <div className="SlideOutPanel">
            <ul className="SlideMenu">
                <li>Setting</li>
                <li onClick={uploadFile}>Upload</li>
            </ul>
            <input type="file" accept=".txt"/>
            {loading === true && <LoadingPage text={"uploading..."}/>}
        </div>
    );
}

export default SlideOutPanel;