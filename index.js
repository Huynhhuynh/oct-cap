const path = require( 'path' )
const url = require('url')
const fs = require('fs')
const os = require('os')
const crypto = require("crypto");

const { app, BrowserWindow, screen, Menu, ipcMain, Tray } = require( 'electron' )

let tray 
let win
let cropWin
let editorWin

app.allowRendererProcessReuse = true 
app.setPath( 'userData', __dirname + '/saved_recordings' )

const createTray = () => {

    tray = new Tray( path.join( __dirname, '/images/icon.png' ) )

    const menu = Menu.buildFromTemplate( [
        { 
            label: "Screen Shot", 
            click: () => {
                cropWin.show( true )
            }
        },
        {  type: "separator"  },
        { 
            label: "Quit", 
            click: () => { app.quit() }
        }
    ] );

    tray.setContextMenu( menu );  
}

const createWindow = () => {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize

    win = new BrowserWindow( {
        width,
        height,
        width: 1280 * 0.5,
        height: 720 * 0.5,
        show: false,
        frame: false,
        resizable: false,
        transparent: true,
        // alwaysOnTop: true,
        webPreferences: { 
            nodeIntegration: true 
        }
    } )

    win.loadURL( url.format( {
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    } ) )
}

function cropWindow () {
    const activeScreen = screen.getPrimaryDisplay() 
    cropWin = new BrowserWindow( {
        transparent: true,
        enableLargerThanScreen: true,
        frame: false,
        x: 0,
        y: 0,
        minimizable: false,
        movable: false,
        hasShadow: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
        }
    } )

    app.dock.hide();

    cropWin.setResizable( true) ;
    cropWin.setSize( ...Object.values( activeScreen.size ) );
    cropWin.setResizable( false );
    cropWin.setPosition( ...Object.values( activeScreen.bounds ) );
    
    cropWin.on('close', () => {
        cropWin = null
    });

    cropWin.setAlwaysOnTop( true, 'screen-saver', 1 );
    cropWin.loadURL( path.join( 'file://', __dirname, '/crop.html') );

    // cropWin.webContents.openDevTools()
}

function createEditorWindow () {
    const {width, height} = screen.getPrimaryDisplay().workAreaSize

    editorWin = new BrowserWindow( {
        minWidth: 800,
        minHeight: 600,
        show: false,
        // frame: false,
        resizable: false,
        // transparent: true,
        // alwaysOnTop: true,
        webPreferences: { 
            nodeIntegration: true 
        }
    } )

    editorWin.on('close', e => {
        e.preventDefault();
        editorWin.hide();
    });

    editorWin.loadURL( path.join( 'file://', __dirname, '/editor.html') );
    
    editorWin.webContents.openDevTools()
}

app.on( 'ready', () => {
    // createWindow();
    cropWindow()
    createEditorWindow()
    createTray() 
} )

ipcMain.on( 'app-screenshot', ( event, base64image ) => {
    // console.log( arg );
    var data = base64image.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from( data, 'base64' );
    var name = crypto.randomBytes(16).toString("hex") + '-screenshot.png'
    var path_image = path.join( __dirname, '/snapshot/' + name )

    fs.writeFile(
        path_image,
        buf,
        err => {
            if( err ) {
                console.log( err )
                return;
            }

            cropWin.webContents.send( 'snapshot-completed', true )
            cropWin.hide()
            
            // editorWin.loadURL( path.join( 'file://', __dirname, `/editor.html#${ 'snapshot/' + name }`) );
            editorWin.webContents.send( 'go-edit', 'snapshot/' + name )
            editorWin.show()
        }
    )
} )

ipcMain.on( 'resize-editor-window', ( event, size ) => {
    // console.log( size )
    editorWin.setSize( parseInt( size.width ), parseInt( size.height ) )
} )