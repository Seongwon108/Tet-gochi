const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const pauseMsg = document.getElementById('pause-msg');

let currentGame = ''; // 'zombie' or 'fall'
let score = 0;
let paused = false;
let gameActive = false;
let difficulty = 1;
let animationId;

// 플레이어 객체
const player = {
    x: 200, y: 400, w: 40, h: 40, emoji: '', speed: 5
};

// 장애물/발판 리스트
let objects = [];

// 키 입력 상태
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('keydown', e => { if(e.code === 'KeyP') togglePause(); });

function showMainMenu() {
    gameActive = false;
    cancelAnimationFrame(animationId);
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('char-select').style.display = 'none';
    document.getElementById('game-stage').style.display = 'none';
}

function showCharacterSelect() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('char-select').style.display = 'block';
}

// --- 1번 게임: 좀비 피하기 ---
function startZombieGame(emoji) {
    currentGame = 'zombie';
    player.emoji = emoji;
    initGame("좀비 피하기");
}

// --- 2번 게임: 무한 낙하 ---
function startInfiniteFall() {
    currentGame = 'fall';
    player.emoji = '⚡'; // 피카츄 상징
    initGame("무한 낙하 (피카츄)");
}

function initGame(title) {
    document.getElementById('char-select').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-stage').style.display = 'block';
    document.getElementById('game-title').innerText = title;
    
    score = 0;
    paused = false;
    gameActive = true;
    objects = [];
    player.x = 180;
    player.y = currentGame === 'zombie' ? 400 : 100;
    
    if (currentGame === 'fall') {
        // 첫 발판
        objects.push({x: 150, y: 200, w: 100, h: 15});
    }

    update();
}

function setDifficulty(level) {
    difficulty = level;
    alert("난이도가 변경되었습니다! (현재: " + (level==1?'쉬움':level==2?'보통':'어려움') + ")");
}

function togglePause() {
    if (!gameActive) return;
    paused = !paused;
    pauseMsg.style.display = paused ? 'block' : 'none';
}

function update() {
    if (!gameActive) return;
    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        movePlayer();
        handleObjects();
        drawPlayer();
        
        score++;
        scoreEl.innerText = Math.floor(score / 10);
    }
    animationId = requestAnimationFrame(update);
}

function movePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;
    
    if (currentGame === 'zombie') {
        if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
        if (keys['ArrowDown'] && player.y < canvas.height - player.h) player.y += player.speed;
    } else {
        // 무한 낙하 중력
        player.y += 3 * difficulty; 
        if (player.y > canvas.height) gameOver();
    }
}

function handleObjects() {
    // 오브젝트 생성
    if (currentGame === 'zombie') {
        if (Math.random() < 0.02 * difficulty) {
            objects.push({x: Math.random() * canvas.width, y: -50, w: 30, h: 30, type: 'zombie'});
        }
    } else {
        if (objects.length < 5 && Math.random() < 0.05) {
            objects.push({x: Math.random() * (canvas.width-80), y: canvas.height, w: 80, h: 15, type: 'platform'});
        }
    }

    // 오브젝트 이동 및 그리기
    for (let i = objects.length - 1; i >= 0; i--) {
        let o = objects[i];
        
        if (currentGame === 'zombie') {
            o.y += 2 * difficulty;
            ctx.fillText('🧟', o.x, o.y + 20);
            // 충돌 체크
            if (checkCollision(player, o)) gameOver();
        } else {
            o.y -= 2 * difficulty;
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(o.x, o.y, o.w, o.h);
            // 발판 체크
            if (player.y + player.h > o.y && player.y + player.h < o.y + 20 &&
                player.x + player.w > o.x && player.x < o.x + o.w) {
                player.y = o.y - player.h;
            }
        }

        // 화면 밖 제거
        if (o.y > canvas.height || o.y < -50) objects.splice(i, 1);
    }
}

function drawPlayer() {
    ctx.font = "30px Arial";
    ctx.fillText(player.emoji, player.x, player.y + 30);
}

function checkCollision(p, o) {
    return p.x < o.x + 25 && p.x + 30 > o.x && p.y < o.y + 25 && p.y + 30 > o.y;
}

function gameOver() {
    gameActive = false;
    alert("게임 오버! 당신의 점수: " + Math.floor(score/10));
    showMainMenu();
}