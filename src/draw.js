const draw = ( canvas ) => {

    let isDown
    let pos = {x: 0, y: 0}
    let currentObject
    let isTool = 'arrow'
    let state
    let undo = []
    let redo = []
    let $undo = document.querySelector( '#undo' )
    let $redo = document.querySelector( '#redo' )

    $undo.addEventListener( 'click', e => {
        replay( undo, redo, $redo, $undo )
    } )

    $redo.addEventListener( 'click', e => {
        replay( redo, undo, $undo, $redo )
    } )

    function save() {
        // clear the redo stack
        redo = [];
        // document.querySelector( '#redo' ).disabled = true
        $redo.classList.remove( '__active' )

        if (state) {
            undo.push(state);
            // document.querySelector( '#undo' ).disabled = false
            $undo.classList.add( '__active' )
        }

        state = JSON.stringify( canvas );
    }

    function replay( playStack, saveStack, buttonsOn, buttonsOff ) {
        saveStack.push( state );
        state = playStack.pop();

        // turn both buttons off for the moment to prevent rapid clicking
        // buttonsOn.disabled = true 
        // buttonsOff.disabled = true
        buttonsOn.classList.remove( '__active' )
        buttonsOff.classList.remove( '__active' )

        canvas.clear();
        canvas.loadFromJSON( state, () => {

            canvas.renderAll();
            // now turn the buttons back on if applicable
            // buttonsOn.disabled = false
            buttonsOn.classList.add( '__active' )

            if ( playStack.length ) {
                // buttonsOff.disabled = false
                buttonsOff.classList.add( '__active' ) 
            }
        } );
    }

    canvas.on( 'mouse:down', o => {
        
        if( o.target ) return;

        isDown = true
        pos = canvas.getPointer( o.e );
    
        currentObject = draw[isTool]( ...[pos.x, pos.y, pos.x, pos.y] )
        canvas.add( currentObject )
    } )
    
    canvas.on( 'mouse:move', o => {
    
        if( true == isDown ) {
    
            currentObject._update( o.pointer.x, o.pointer.y )
        }
    
        canvas.renderAll();
    } )
    
    canvas.on( 'mouse:up', o => {

        if( isTool == 'arrow' && isDown == true && currentObject._redraw ) {
            currentObject._redraw.call( '', currentObject )
        }

        // currentObject.setCoords();
        canvas.renderAll();
        isDown = false
    } )

    canvas.on( 'object:modified', () => {
        save();
    } ); 
    
    const calcArrowPoints = ( x1, y1, x2, y2 ) => {
        let angle = Math.atan2(y2 - y1, x2 - x1);
        let headlen = 15;  // arrow head size
        
        // bring the line end back some to account for arrow head.
        x2 = x2 - (headlen) * Math.cos(angle);
        y2 = y2 - (headlen) * Math.sin(angle);

        var points = [];
        //start
        points.push({
            x: x1, 
            y: y1
        })
        // points.push({
        //     x: x2, 
        //     y: y2
        // })
        points.push({
            x: x2 + ((headlen / 3) * Math.cos(angle + Math.PI / 2.5)), 
            y: y2 + ((headlen / 3) * Math.sin(angle + Math.PI / 2.5))
        })
        points.push({
            x: x2 - (headlen) * Math.cos(angle - Math.PI / 2.5),
            y: y2 - (headlen) * Math.sin(angle - Math.PI / 2.5),
        })
        points.push({
            x: x2 + (headlen) * Math.cos(angle),
            y: y2 + (headlen) * Math.sin(angle)
        })
        points.push({
            x: x2 - (headlen) * Math.cos(angle + Math.PI / 2.5),
            y: y2 - (headlen) * Math.sin(angle + Math.PI / 2.5),
        })
        // points.push({
        //     x: x2,
        //     y: y2
        // })
        points.push({
            x: x2 + ((headlen / 3) * Math.cos(angle - Math.PI / 2.5)), 
            y: y2 + ((headlen / 3) * Math.sin(angle - Math.PI / 2.5))
        })
        points.push({
            x: x1,
            y: y1
        });

        return points;
    }

    const draw = {
        arrow ( x1, y1, x2, y2 ) {
            
            const makeObjectArrow = ( points ) => {

                let obj =  new fabric.Polyline( points, {
                    fill: 'red',
                    stroke: 'red',
                    strokeWidth: 1,
                    originX: 'left',
                    originY: 'top',
                    selectable: true,
                    objectCaching: false,
                    transparentCorners: true,
                    cornerStyle: 'circle',
                    opacity: 0,
                } ); 

                obj.setControlsVisibility( {
                    tl:false, //top-left
                    mt:false, // middle-top
                    tr:false, //top-right
                    ml:false, //middle-left
                    mr:false, //middle-right
                    bl:false, // bottom-left
                    mb:false, //middle-bottom
                    br:false //bottom-right
                } )

                return obj
            }

            let obj = makeObjectArrow( calcArrowPoints( x1, y1, x2, y2 ) ) 

            obj._update = ( _x2, _y2 ) => {

                currentObject.x1 = pos.x
                currentObject.y1 = pos.y 
                currentObject.x2 = _x2
                currentObject.y2 = _y2 

                currentObject.set( {
                    points: calcArrowPoints( pos.x, pos.y, _x2, _y2 ),
                    opacity: 1
                } )
            }

            obj._redraw = ( _obj ) => {
                let points = _obj.get( 'points' )
                let opacity = _obj.get( 'opacity' )

                canvas.remove( currentObject )

                if( opacity != 0 ) {
                    let obj = makeObjectArrow( points )
                    obj.set( { opacity: 1 } )

                    canvas.add( obj )
                    currentObject = obj 

                    save();
                }
            }

            return obj
        },
        line ( x1, y1, x2, y2 ) {
            let obj = new fabric.Line( [x1, y1, x2, y2], {
                stroke: 'red',
                strokeWidth: 3,
                originX: 'left',
                originY: 'top',
                selectable: true
            } )

            obj._update = ( _x2, _y2 ) => {
                
                currentObject.set( {
                    x2: _x2,
                    y2: _y2,
                } )

                // currentObject.setCoords();
            }
    
            return obj
        },
        square ( x1, y1, x2, y2 ) {
    
        }
    }
}

module.exports = draw