let canvas
let ctx

let cameraOffset = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
let cameraZoom = 0.03
let MAX_ZOOM = 150
let MIN_ZOOM = 0.001
let SCROLL_SENSITIVITY = -0.0006

let cameraView = [0, 0, 0, 0]

let hw = window.innerWidth / 2
let hh = window.innerHeight / 2

// handle centering, zooming, panning, clearing canvas
function setupView() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // half width & height
    hw = window.innerWidth / 2
    hh = window.innerHeight / 2

    ctx.translate(hw, hh)
    ctx.scale(cameraZoom, cameraZoom)

    let [x, y] = [cameraOffset.x - hw, cameraOffset.y - hh]
    ctx.translate(x, y)
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

    cameraView = [-x - hw / cameraZoom, -y - hh / cameraZoom, -x + hw / cameraZoom, -y + hh / cameraZoom]
}

function inCameraView(x1, y1, x2, y2) {
    return (x1 >= cameraView[0] && x2 <= cameraView[2]) && (y1 >= cameraView[1] && y2 <= cameraView[3])
}

// https://www.geeksforgeeks.org/find-two-rectangles-overlap/
function inCameraView2(x1, y1, x2, y2) {
    let l1 = { x: x1, y: y1 }
    let r1 = { x: x2, y: y2 }
    let l2 = { x: cameraView[0], y: cameraView[1] }
    let r2 = { x: cameraView[2], y: cameraView[3] }

    // If one rectangle is on left side of other
    if (l1.x > r2.x || l2.x > r1.x) {
        return false;
    }

    // If one rectangle is above other
    if (r1.y < l2.y || r2.y < l1.y) {
        return false;
    }

    return true;
}

function drawRect(x, y, width, height) {
    ctx.fillRect(x, y, width, height)
}

function drawText(text, x, y, size, font) {
    ctx.font = `${size}px ${font}`
    ctx.fillText(text, x, y)
}

// const menger_offsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]

const images = [
    'beans.jpg',
    // me first :)
    'hb.png',

    // friends
    'beans.jpg',
    'brock.png',
    'dc.jpg',
    'de.jpg',
    'g.jpg',
    'j.jpg',
    'lib.jpg',
    'pc.jpg',
    'tae.png',
    'vec.png',
    'pepe.webp',
    'obama.jpg',
    'leo.png',
    'trumpepe.png',
    'smol.jpg',
    'kethic.jpg',
    'cypher.png',
    'boy.jpg',
    'hacker.jpg',
    'phil.png',
    'paladin.jpg',
    'vex.png',
    '59.jpg',
    '13.jpg',
    'dump.jpg',
    'riley.jpg',
    'gm.jpg'
]

function lerp(a, b, t){
    return (1 - t) * a + t * b
}

// t should be between 0..1
function pointOnEdge(x1, y1, x2, y2, t) {
    return [lerp(x1, x2, t), lerp(y1, y2, t)]
}

function edgeFromSquare(cx, cy, radius, k) {
    k = k % 4

    if (k == 0) {
        return [cx - radius, cy - radius, cx + radius, cy - radius]
    } else if (k == 1) {
        return [cx + radius, cy - radius, cx + radius, cy + radius]
    } else if (k == 2) {
        return [cx + radius, cy + radius, cx - radius, cy + radius]
    } else { //if (k == 3) {
        return [cx - radius, cy + radius, cx - radius, cy - radius]
    }
}

function makePolygon(cx, cy, radius, sides=3) {
    // sqrt(2)
    // radius *= 3 / (sides*sides) + 1

    const angle_offset = 0 //(22.5 * (sides % 2 + 1))
    const angle_step = 360 / sides
    let path = []
    for (let i = 0; i < sides; i++) {
        // debugger
        let angle_deg = (angle_step * i + angle_offset)

        // on a circle contained inside the rectangle
        let angle_rad = angle_deg / 180 * Math.PI

        let x = cx + radius * Math.cos(angle_rad)
        let y = cy + radius * Math.sin(angle_rad)

        // https://math.stackexchange.com/questions/2740317/simple-way-to-find-position-on-square-given-angle-at-center
        // let phi = angle_rad
        // let k = Math.round(2 * phi / Math.PI) & 3
        // let a = phi - (Math.PI / 2) * Math.round(phi / (Math.PI / 2))
        // let x = cx + radius * (Math.cos(phi) / Math.cos(a))
        // let y = cy + radius * (Math.sin(phi) / Math.cos(a))

        // on the rectangle bounds
        // first need to figure out which side it's on...
        // let side_idx = (angle_deg / 90) | 0
        // if (side_idx > 3) debugger
        // let edge = edgeFromSquare(cx, cy, radius, side_idx)
        // let [x, y] = pointOnEdge(edge[0], edge[1], edge[2], edge[3], (angle_deg / 90) - side_idx)

        path.push(x)
        path.push(y)
    }

    return path
}

function drawClippedImage(img, cx, cy, size, sides=3) {
    let radius = size / 2
    let path = makePolygon(cx, cy, radius, sides)

    // save the unclipped context
    ctx.save()

    // define the path that will be clipped to
    ctx.beginPath()
    ctx.moveTo(path[0], path[1])
    for (let i = 2; i < path.length; i += 2) {
        ctx.lineTo(path[i], path[i + 1])
    }
    ctx.closePath();   

    // stroke the path
    // half of the stroke is outside the path
    // the outside part of the stroke will survive the clipping that follows
    ctx.lineWidth = 2
    ctx.stroke()

    // make the current path a clipping path
    ctx.clip()

    // draw the image which will be clipped except in the clipping path
    ctx.drawImage(img, cx - radius, cy - radius, size, size)

    // restore the unclipped context (==undo the clipping path)
    ctx.restore()
}


/*
    menger size is 3 x 3
    hence center is 1 x 1
    and 8 squares around it are 1/3rd x 1/3rd
    then 1/9th x 1/9th etc...

    indices should be represented in base 8 and using menger_offsets as lookup table for square location
*/
function drawMenger_internal(x, y, size, limit, depth = 2) {
    if (depth >= limit || depth * depth > cameraZoom * 450) {
        return false
    }

    const next_size = size / 3
    const offset = size / 2
    const next_offset = offset / 3
    // drawRect(x - offset, y - offset, size, size)

    let has_drawn = false
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx == 0 && dy == 0) {
                continue
            }

            has_drawn |= drawMenger_internal(x + (dx * next_size), y + (dy * next_size), next_size, limit, depth + 1)
        }
    }

    // drawRect(x - offset/1.25, y - offset/1.25, size/1.5, size/1.5)
    // drawRect(x - offset, y - offset, size, size)

    let img = null
    if (depth * depth < cameraZoom * 200 && inCameraView2(x - next_offset*2, y - next_offset*2, x + next_offset*2, y + next_offset*2)) {
        let img_id = Math.abs(((x * y + x) / 1000 + depth) | 0) % (images.length + 38)
        img = document.getElementById('img_' + img_id)
        if (img) {
            drawClippedImage(img, x, y, next_size, limit - depth + 2)
        } else {
            // if (!has_drawn) {
                // debugger
                // center square
                let color = (depth * 20).toString(16)
                ctx.fillStyle = `#${color}${color}${color}`
            
                drawRect(x - next_offset/1.1, y - next_offset/1.1, next_size/1.1, next_size/1.1)
            // }
        }
        has_drawn = true
            // ctx.drawImage(img, x - next_offset, y - next_offset, next_size, next_size)
    } else {
        // if (depth == 0)
        // console.log(depth, x, y)
    }

    return has_drawn
}

function drawMenger(size, limit, depth = 0) {
    // const offset = -size / 3

    // first draw entire square
    ctx.fillStyle = "#000000"
    drawRect(-size / 2, -size / 2, size, size)

    drawMenger_internal(0, 0, size, limit, depth)
}

function draw() {
    setupView()

    const size = 30000
    drawMenger(size, 6)

    /*
    ctx.fillStyle = "#991111"
    drawRect(-50,-50,100,100)
    
    ctx.fillStyle = "#eecc77"
    drawRect(-35,-35,20,20)
    drawRect(15,-35,20,20)
    drawRect(-35,15,70,20)
    
    ctx.fillStyle = "#fff"
    drawText("Simple Pan and Zoom Canvas", -255, -100, 32, "courier")
    
    ctx.rotate(-31*Math.PI / 180)
    ctx.fillStyle = `#${(Math.round(Date.now()/40)%4096).toString(16)}`
    drawText("Now with touch!", -110, 100, 32, "courier")
    
    ctx.fillStyle = "#fff"
    ctx.rotate(31*Math.PI / 180)
    
    drawText("Wow, you found me!", -260, -2000, 48, "courier")
    */

    requestAnimationFrame(draw)
}

// Gets the relevant location from a mouse or single touch event
function getEventLocation(e, offset) {
    let x, y
    if (e.touches && e.touches.length == 1) {
        x = e.touches[0].clientX
        y = e.touches[0].clientY
    }
    else if (e.clientX && e.clientY) {
        x = e.clientX
        y = e.clientY
    }

    return { x: (x - hw) / cameraZoom - offset.x, y: (y - hh) / cameraZoom - offset.y }
}

let isDragging = false
let dragStartLoc = { x: 0, y: 0 }
let dragStartCamera = { x: 0, y: 0 }

function onPointerDown(e) {
    isDragging = true
    dragStartLoc = getEventLocation(e, cameraOffset)
    dragStartCamera = cameraOffset
}

function onPointerUp(e) {
    let loc = getEventLocation(e, dragStartCamera)
    if (loc.x == dragStartLoc.x && loc.y == dragStartLoc.y) {
        loc = getEventLocation(e, dragStartCamera)
        // console.log('clicked:', loc.x, loc.y)
    }

    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e) {
    if (isDragging) {
        cameraOffset = getEventLocation(e, dragStartLoc)
    }

    // this prevents scrolling (panning) on mobile
    e.preventDefault()
}

function handleTouch(e, singleTouchHandler) {
    if (e.touches.length == 1) {
        singleTouchHandler(e)
    }
    else if (e.type == "touchmove" && e.touches.length == 2) {
        isDragging = false
        handlePinch(e)
    }
}

let initialPinchDistance = null
let lastZoom = cameraZoom

function handlePinch(e) {
    e.preventDefault()

    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }

    // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
    let currentDistance = (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2

    if (initialPinchDistance == null) {
        initialPinchDistance = currentDistance
    }
    else {
        adjustZoom(null, currentDistance / initialPinchDistance)
    }
}

function adjustZoom(zoomAmount, zoomFactor) {
    if (!isDragging) {
        if (zoomAmount) {
            cameraZoom += zoomAmount
        }
        else if (zoomFactor) {
            cameraZoom = zoomFactor * lastZoom
        }

        cameraZoom = Math.min(cameraZoom, MAX_ZOOM)
        cameraZoom = Math.max(cameraZoom, MIN_ZOOM)

        // console.log(zoomAmount)
    }
}

function loadImages() {
    for (let i in images) {
        let img = document.createElement('img')
        img.src = '/pics/' + images[i]
        img.id = 'img_' + i
        img_holder.appendChild(img)
    }
}

function onLoad() {
    canvas = document.getElementById("canvas")
    ctx = canvas.getContext('2d')

    loadImages()

    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('touchend', (e) => handleTouch(e, onPointerUp))
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
    canvas.addEventListener('wheel', (e) => adjustZoom(e.deltaY * cameraZoom * SCROLL_SENSITIVITY))
    canvas.addEventListener('resize', (e) => resizeCanvas())

    // Ready, set, go
    draw()
}

window.addEventListener('load', onLoad)