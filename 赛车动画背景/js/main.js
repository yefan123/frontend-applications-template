let $ = {
    canvas: null,
    ctx: null,
    canvas2: null,
    ctx2: null,
    colors: {
        sky: null,  //变成渐变色
        mountains: "#bbb",
        ground: "#8FC04C",
        groundDark: "#73B043",
        road: "#606a7c",
        roadLine: "#FFF",
        hud: "#FFF"
    },
    settings: {
        fps: 60,
        skySize: 120,
        ground: {
            size: 350,
            min: 4,
            max: 120
        },
        road: {
            min: 76,
            max: 700,
        }
    },
    state: {
        bgpos: 0,
        offset: 0,
        startDark: true,
        curve: 0,
        currentCurve: 0,
        turn: 1,
        speed: 27,
        xpos: 0,
        section: 50,
        car: {
            maxSpeed: 50,
            friction: 0.4,
            acc: 0.85,
            deAcc: 0.5
        },
        keypress: {
            up: false,
            left: false,
            right: false,
            down: false
        }
    },
    storage: {
        bg: null
    }
};
$.canvas = document.getElementsByTagName('canvas')[0];
$.ctx = $.canvas.getContext('2d');
$.canvas2 = document.createElement('canvas');
$.canvas2.width = $.canvas.width;
$.canvas2.height = $.canvas.height;
$.ctx2 = $.canvas2.getContext('2d');

//天空颜色变成渐变色
const grad = $.ctx.createLinearGradient(0, 0, 0, $.settings.skySize);
grad.addColorStop(0, "#D4F4FF");
grad.addColorStop(1, '#fff');
$.colors.sky = grad;

window.addEventListener("keydown", keyDown, false);
window.addEventListener("keyup", keyUp, false);

drawBg();
draw();

//模拟一直按'上'建
let testEvent = { keyCode: 38 };
(function loop() {
    keyDown(testEvent);
    requestAnimationFrame(loop);
})();
// setInterval(() => {
// keyDown(testEvent);
// }, 10);


function draw() {
    setTimeout(function () {
        calcMovement();

        //if($.state.speed > 0) {
        $.state.bgpos += ($.state.currentCurve * 0.02) * ($.state.speed * 0.2);
        $.state.bgpos = $.state.bgpos % $.canvas.width;

        $.ctx.putImageData($.storage.bg, $.state.bgpos, 5);
        $.ctx.putImageData($.storage.bg, $.state.bgpos > 0 ? $.state.bgpos - $.canvas.width : $.state.bgpos + $.canvas.width, 5);
        //}

        $.state.offset += $.state.speed * 0.05;
        if ($.state.offset > $.settings.ground.min) {
            $.state.offset = $.settings.ground.min - $.state.offset;
            $.state.startDark = !$.state.startDark;
        }
        drawGround($.ctx, $.state.offset, $.colors.ground, $.colors.groundDark, $.canvas.width);

        drawRoad($.settings.road.min + 6, $.settings.road.max + 36, 10, $.colors.roadLine);
        drawGround($.ctx2, $.state.offset, $.colors.roadLine, $.colors.road, $.canvas.width);
        drawRoad($.settings.road.min, $.settings.road.max, 10, $.colors.road);
        drawRoad(3, 24, 0, $.ctx.createPattern($.canvas2, 'repeat'));
        drawCar();
        drawHUD($.ctx, 630, 340, $.colors.hud);

        requestAnimationFrame(draw);
    }, 1000 / $.settings.fps);
}

//仪表盘
function drawHUD(ctx, centerX, centerY, color) {
    let radius = 50, tigs = [0, 90, 135, 180, 225, 270, 315],
        angle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.lineWidth = 7;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    for (let i = 0; i < tigs.length; i++) {
        drawTig(ctx, centerX, centerY, radius, tigs[i], 7);
    }

    // draw pointer
    angle = map($.state.speed, 0, $.state.car.maxSpeed, 90, 360);
    drawPointer(ctx, color, 50, centerX, centerY, angle);
}

function drawPointer(ctx, color, radius, centerX, centerY, angle) {
    let point = getCirclePoint(centerX, centerY, radius - 20, angle),
        point2 = getCirclePoint(centerX, centerY, 2, angle + 90),
        point3 = getCirclePoint(centerX, centerY, 2, angle - 90);

    ctx.beginPath();
    ctx.strokeStyle = "#FF9166";
    ctx.lineCap = 'round';
    ctx.lineWidth = 4;
    ctx.moveTo(point2.x, point2.y);
    ctx.lineTo(point.x, point.y);
    ctx.lineTo(point3.x, point3.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 9, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawTig(ctx, x, y, radius, angle, size) {
    let startPoint = getCirclePoint(x, y, radius - 4, angle),
        endPoint = getCirclePoint(x, y, radius - size, angle);

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
}

function getCirclePoint(x, y, radius, angle) {
    let radian = (angle / 180) * Math.PI;

    return {
        x: x + radius * Math.cos(radian),
        y: y + radius * Math.sin(radian)
    }
}

function calcMovement() {
    let move = $.state.speed * 0.01,
        newCurve = 0;

    if ($.state.keypress.up) {
        $.state.speed += $.state.car.acc - ($.state.speed * 0.015);
    } else if ($.state.speed > 0) {
        $.state.speed -= $.state.car.friction;
    }

    if ($.state.keypress.down && $.state.speed > 0) {
        $.state.speed -= 1;
    }

    // Left and right
    $.state.xpos -= ($.state.currentCurve * $.state.speed) * 0.005;

    if ($.state.speed) {
        if ($.state.keypress.left) {
            $.state.xpos += (Math.abs($.state.turn) + 7 + ($.state.speed > $.state.car.maxSpeed / 4 ? ($.state.car.maxSpeed - ($.state.speed / 2)) : $.state.speed)) * 0.2;
            $.state.turn -= 1;
        }

        if ($.state.keypress.right) {
            $.state.xpos -= (Math.abs($.state.turn) + 7 + ($.state.speed > $.state.car.maxSpeed / 4 ? ($.state.car.maxSpeed - ($.state.speed / 2)) : $.state.speed)) * 0.2;
            $.state.turn += 1;
        }

        if ($.state.turn !== 0 && !$.state.keypress.left && !$.state.keypress.right) {
            $.state.turn += $.state.turn > 0 ? -0.25 : 0.25;
        }
    }

    $.state.turn = clamp($.state.turn, -5, 5);
    $.state.speed = clamp($.state.speed, 0, $.state.car.maxSpeed);

    // section
    $.state.section -= $.state.speed;

    if ($.state.section < 0) {
        $.state.section = randomRange(1000, 9000);

        newCurve = randomRange(-50, 50);

        if (Math.abs($.state.curve - newCurve) < 20) {
            newCurve = randomRange(-50, 50);
        }

        $.state.curve = newCurve;
    }

    if ($.state.currentCurve < $.state.curve && move < Math.abs($.state.currentCurve - $.state.curve)) {
        $.state.currentCurve += move;
    } else if ($.state.currentCurve > $.state.curve && move < Math.abs($.state.currentCurve - $.state.curve)) {
        $.state.currentCurve -= move;
    }

    if (Math.abs($.state.xpos) > 550) {
        $.state.speed *= 0.96;
    }

    $.state.xpos = clamp($.state.xpos, -650, 650);
}

function keyUp(e) {
    move(e, false);
}

function keyDown(e) {
    move(e, true);
}

function move(e, isKeyDown) {
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        // e.preventDefault();
    }

    if (e.keyCode === 37) {
        $.state.keypress.left = isKeyDown;
    }

    if (e.keyCode === 38) {
        $.state.keypress.up = isKeyDown;
    }

    if (e.keyCode === 39) {
        $.state.keypress.right = isKeyDown;
    }

    if (e.keyCode === 40) {
        $.state.keypress.down = isKeyDown;
    }
}

const lerp = (norm, min, max) => (max - min) * norm + min,
    norm = (value, min, max) => (value - min) / (max - min),
    randomRange = (min, max) => min + Math.random() * (max - min),
    clamp = (value, min, max) => Math.min(Math.max(value, min), max),
    map = (value, sourceMin, sourceMax, destMin, destMax) => lerp(norm(value, sourceMin, sourceMax), destMin, destMax);

function drawBg() {

    $.ctx.fillStyle = $.colors.sky;
    $.ctx.fillRect(0, 0, $.canvas.width, $.settings.skySize);
    drawMountain(0, 60, 200);
    drawMountain(280, 40, 200);
    drawMountain(400, 80, 200);
    drawMountain(550, 60, 200);

    $.storage.bg = $.ctx.getImageData(0, 0, $.canvas.width, $.canvas.height);
}

function drawMountain(pos, height, width) {
    $.ctx.fillStyle = $.colors.mountains;
    $.ctx.strokeStyle = $.colors.mountains;
    $.ctx.lineJoin = "round";
    $.ctx.lineWidth = 20;
    $.ctx.beginPath();
    $.ctx.moveTo(pos, $.settings.skySize);
    $.ctx.lineTo(pos + (width / 2), $.settings.skySize - height);
    $.ctx.lineTo(pos + width, $.settings.skySize);
    $.ctx.closePath();
    $.ctx.stroke();
    $.ctx.fill();
}

// function drawSky() {
//     $.ctx.fillStyle = $.colors.sky;
//     $.ctx.fillRect(0, 0, $.canvas.width, $.settings.skySize);
// }

function drawRoad(min, max, squishFactor, color) {
    let basePos = $.canvas.width + $.state.xpos;

    $.ctx.fillStyle = color;
    $.ctx.beginPath();
    $.ctx.moveTo(((basePos + min) / 2) - ($.state.currentCurve * 3), $.settings.skySize);
    $.ctx.quadraticCurveTo((((basePos / 2) + min)) + ($.state.currentCurve / 3) + squishFactor, $.settings.skySize + 52, (basePos + max) / 2, $.canvas.height);
    $.ctx.lineTo((basePos - max) / 2, $.canvas.height);
    $.ctx.quadraticCurveTo((((basePos / 2) - min)) + ($.state.currentCurve / 3) - squishFactor, $.settings.skySize + 52, ((basePos - min) / 2) - ($.state.currentCurve * 3), $.settings.skySize);
    $.ctx.closePath();
    $.ctx.fill();
}

function drawCar() {
    let carWidth = 160,
        carHeight = 50,
        carX = ($.canvas.width / 2) - (carWidth / 2),
        carY = 320;

    // shadow
    roundedRect($.ctx, "rgba(0, 0, 0, 0.35)", carX - 1 + $.state.turn, carY + (carHeight - 35), carWidth + 10, carHeight, 9);

    // tires
    roundedRect($.ctx, "#111", carX, carY + (carHeight - 30), 30, 40, 6);
    roundedRect($.ctx, "#111", (carX - 22) + carWidth, carY + (carHeight - 30), 30, 40, 6);

    drawCarBody($.ctx);
}

//画车
function drawCarBody(ctx) {
    let startX = 299, startY = 311,
        lights = [10, 26, 134, 152],
        lightsY = 0;

    /* Front */
    roundedRect($.ctx, "#C2C2C2", startX + 6 + ($.state.turn * 1.1), startY - 18, 146, 40, 18);

    //车棚
    ctx.beginPath();
    ctx.lineWidth = "12";
    ctx.fillStyle = "red";
    ctx.strokeStyle = "red";
    ctx.moveTo(startX + 30, startY);
    ctx.lineTo(startX + 46 + $.state.turn, startY - 25);
    ctx.lineTo(startX + 114 + $.state.turn, startY - 25);
    ctx.lineTo(startX + 130, startY);
    ctx.fill();
    ctx.stroke();
    /* END: Front */

    ctx.lineWidth = "12";
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.fillStyle = "#DEE0E2";
    ctx.strokeStyle = "#DEE0E2";
    ctx.moveTo(startX + 2, startY + 12 + ($.state.turn * 0.2));
    ctx.lineTo(startX + 159, startY + 12 + ($.state.turn * 0.2));
    ctx.quadraticCurveTo(startX + 166, startY + 35, startX + 159, startY + 55 + ($.state.turn * 0.2));
    ctx.lineTo(startX + 2, startY + 55 - ($.state.turn * 0.2));
    ctx.quadraticCurveTo(startX - 5, startY + 32, startX + 2, startY + 12 - ($.state.turn * 0.2));
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = "12";
    ctx.fillStyle = "#DEE0E2";
    ctx.strokeStyle = "#DEE0E2";
    ctx.moveTo(startX + 30, startY);
    ctx.lineTo(startX + 40 + ($.state.turn * 0.7), startY - 15);
    ctx.lineTo(startX + 120 + ($.state.turn * 0.7), startY - 15);
    ctx.lineTo(startX + 130, startY);
    ctx.fill();
    ctx.stroke();

    //车后盖风引导扇
    roundedRect(ctx, "#474747", startX + 40, startY + 5, 80, 10, 5, true, 0.1);
    roundedRect(ctx, "#000", startX - 8, startY, 177, 7, 3, true, 0.2);

    //车灯
    ctx.fillStyle = "#91FF66";
    lights.forEach(function (xPos) {
        ctx.beginPath();
        ctx.arc(startX + xPos, startY + 20 + lightsY, 6, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
        lightsY += $.state.turn * 0.05;
    });

    ctx.lineWidth = "9";
    ctx.fillStyle = "#222222";
    ctx.strokeStyle = "#444";
    //车牌..
    roundedRect($.ctx, "#FFF", startX + 55, startY + 25, 50, 18, 3, true, 0.05);

    ctx.font="15px Arial";
    ctx.textAlign="center";
    ctx.fillStyle='black';
    ctx.fillText("BMW",startX + 80, startY + 39);
}

//圆角矩形-->整个赛车由各种圆角矩形组成
function roundedRect(ctx, color, x, y, width, height, radius, turn, turneffect) {
    let skew = turn === true ? $.state.turn * turneffect : 0;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y - skew);

    // top right
    ctx.lineTo(x + width - radius, y + skew);
    ctx.arcTo(x + width, y + skew, x + width, y + radius + skew, radius);
    ctx.lineTo(x + width, y + radius + skew);

    // down right
    ctx.lineTo(x + width, (y + height + skew) - radius);
    ctx.arcTo(x + width, y + height + skew, (x + width) - radius, y + height + skew, radius);
    ctx.lineTo((x + width) - radius, y + height + skew);

    // down left
    ctx.lineTo(x + radius, y + height - skew);
    ctx.arcTo(x, y + height - skew, x, (y + height - skew) - radius, radius);
    ctx.lineTo(x, (y + height - skew) - radius);

    // top left
    ctx.lineTo(x, y + radius - skew);
    ctx.arcTo(x, y - skew, x + radius, y - skew, radius);
    ctx.lineTo(x + radius, y - skew);
    ctx.fill();
}

function drawGround(ctx, offset, lightColor, darkColor, width) {
    let pos = ($.settings.skySize - $.settings.ground.min) + offset, stepSize = 1, drawDark = $.state.startDark,
        firstRow = true;
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, $.settings.skySize, width, $.settings.ground.size);

    ctx.fillStyle = darkColor;
    while (pos <= $.canvas.height) {
        stepSize = norm(pos, $.settings.skySize, $.canvas.height) * $.settings.ground.max;
        if (stepSize < $.settings.ground.min) {
            stepSize = $.settings.ground.min;
        }

        if (drawDark) {
            if (firstRow) {
                ctx.fillRect(0, $.settings.skySize, width, stepSize - (offset > $.settings.ground.min ? $.settings.ground.min : $.settings.ground.min - offset));
            } else {
                ctx.fillRect(0, pos < $.settings.skySize ? $.settings.skySize : pos, width, stepSize);
            }
        }

        firstRow = false;
        pos += stepSize;
        drawDark = !drawDark;
    }
}