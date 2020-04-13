// In the renderer process.
const { desktopCapturer, ipcRenderer, shell } = require('electron')
const fs = require('fs')
const os = require('os')
const path = require('path')

const ratio = window.screen.width / window.screen.height 
const _screen = {
    width: window.screen.width * 2,
    height: ( window.screen.width * 2 ) / ratio// window.screen.height 
}

let options = { 
    types: ['screen'], 
    thumbnailSize: _screen }

desktopCapturer.getSources( options ).then(async sources => {
    
    for (const source of sources) {
        if (source.name === 'Entire Screen') {
        try {
            fs.writeFile( 'screenshot.png', source.thumbnail.toPNG(), function (err) {
                if( err ) return console.log( err.message );
            });
            
        } catch (e) {
            handleError(e)
        }
        return
        }
    }
})

function handleError (e) {
    console.log(e)
}
