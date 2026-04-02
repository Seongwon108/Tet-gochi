const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const moodDisplay = document.getElementById('pet-mood');
const scoreDisplay = document.getElementById('score');
const msg = document.getElementById('msg');

context.scale(20, 20);

// 7가지 다양한 블록 정의
function createPiece(type) {
    if (type === 'I') return [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]];
    if (type === 'L') return [[0, 2, 0], [0, 2, 0], [0, 2, 2]];
    if (type === 'J') return [[0, 3, 0], [0, 3, 0], [3, 3, 0]];
    if (type === 'O') return [[4, 4], [4, 4]];
    if (type === 'Z') return [[5, 5, 0], [0, 5, 5], [0, 0, 0]];
    if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    if (type === 'T') return [[0, 7, 0], [7, 7, 7], [0, 0, 0]];
}

const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
const arena = Array.from({ length: 20 }, () => Array(12).fill(0));

const player = { pos: { x: 0, y: 0 }, matrix: null, score: 0 };

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;
let animationId = null;

function draw() {
    context.fillStyle = '#e0f0e0';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos, true);
}

function drawMatrix(matrix, offset, isPlayer = false) {
    if (!matrix) return;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // 블록 몸통
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.strokeStyle = 'rgba(0,0,0,0.1)';
                context.strokeRect(x + offset.x, y + offset.y, 1, 1);

                // 다마고치 캐릭터 얼굴 추가 (눈 + 홍조)
                if (isPlayer) {
                    context.fillStyle = 'black';
                    context.fillRect(x + offset.x + 0.2, y + offset.y + 0.3, 0.15, 0.15);
                    context.fillRect(x + offset.x + 0.65, y + offset.y + 0.3, 0.15, 0.15);
                    context.fillStyle = 'rgba(255, 100, 100, 0.5)';
                    context.fillRect(x + offset.x + 0.1, y + offset.y + 0.5, 0.2, 0.1);
                    context.fillRect(x + offset.x + 0.7, y + offset.y + 0.5, 0.2, 0.1);
                }
            }
        });
    });
}

function playerDrop() {
    if (paused) return;
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    if (paused) return;
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}

function playerRotate() {
    if (paused) return;
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -1);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir = 1) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        player.score += 10;
        scoreDisplay.innerText = player.score;
        moodDisplay.innerText = "😄 신남!";
        setTimeout(() => moodDisplay.innerText = "😐 보통", 1000);
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        scoreDisplay.innerText = 0;
        moodDisplay.innerText = "😭 으앙!";
    }
}

function togglePause() {
    paused = !paused;
    msg.style.display = paused ? 'block' : 'none';
}

function update(time = 0) {
    if (!paused) {
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) playerDrop();
        draw();
    } else {
        lastTime = time;
    }
    animationId = requestAnimationFrame(update);
}

function startGame(speed) {
    dropInterval = speed;
    paused = false;
    msg.style.display = 'none';
    arena.forEach(row => row.fill(0));
    player.score = 0;
    scoreDisplay.innerText = 0;
    playerReset();
    if (!animationId) update();
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 37) playerMove(-1);        // 좌
    else if (event.keyCode === 39) playerMove(1);     // 우
    else if (event.keyCode === 40) playerDrop();      // 하
    else if (event.keyCode === 38) playerRotate();    // 상 (회전)
    else if (event.keyCode === 80) togglePause();     // P (일시정지)
});