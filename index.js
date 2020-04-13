const path = require( 'path' )
const url = require('url')
const fs = require('fs')
const os = require('os')
const { app, BrowserWindow, screen, Menu, ipcMain, Tray } = require( 'electron' )

let tray 
let win
let cropWin

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

app.on( 'ready', () => {
    // createWindow();
    cropWindow();
    createTray() 
} )

ipcMain.on( 'app-screenshot', ( event, base64image ) => {
    // console.log( arg );
    var data = base64image.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from( data, 'base64' );
    fs.writeFile(
        "screenshot.png",
        buf,
        err => {
            if( err ) {
                console.log( err )
                return;
            }

            cropWin.webContents.send( 'snapshot-completed', true )
            cropWin.hide()
        }
    )
} )