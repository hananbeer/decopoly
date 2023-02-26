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

function drawRect(x, y, width, height) {
    ctx.fillRect(x, y, width, height)
}

function drawText(text, x, y, size, font) {
    ctx.font = `${size}px ${font}`
    ctx.fillText(text, x, y)
}

// const menger_offsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]

const images = [
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

/*
    menger size is 3 x 3
    hence center is 1 x 1
    and 8 squares around it are 1/3rd x 1/3rd
    then 1/9th x 1/9th etc...

    indices should be represented in base 8 and using menger_offsets as lookup table for square location
*/
function drawMenger_internal(x, y, size, limit, depth = 2) {
    if (depth >= limit || depth * depth > cameraZoom * 450) {
        return
    }

    const next_size = size / 3
    const offset = size / 2
    const next_offset = offset / 3

    // center square
    let color = (depth * 20).toString(16)
    ctx.fillStyle = `#${color}${color}${color}`

    drawRect(x - offset, y - offset, size, size)

    if (depth * depth < cameraZoom * 200 && inCameraView(x - next_offset, y - next_offset, x + next_offset, y + next_offset)) {
        let img_id = Math.abs(((x * y + x) / 1000 + depth) | 0) % (images.length + 38)
        let img = document.getElementById('img_' + img_id)
        if (img)
            ctx.drawImage(img, x - next_offset, y - next_offset, next_size, next_size)
    } else {
        // if (depth == 0)
        // console.log(depth, x, y)
    }

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx == 0 && dy == 0)
                continue

            drawMenger_internal(x + (dx * next_size), y + (dy * next_size), next_size, limit, depth + 1)
        }
    }
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
    drawMenger(size, 7)

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