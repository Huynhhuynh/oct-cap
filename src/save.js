const path = require( 'path' )
const fs = require( 'fs' )

const save = ( imageBase64, filename, callback ) => {

    var data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from( data, 'base64' );
    var path_image = filename

    fs.writeFile(
        path_image,
        buf,
        err => {
            if( err ) {
                console.log( err )
                return;
            }

            callback.call( '', {filename} )
        }
    )
}

module.exports = save