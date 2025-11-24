const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreDisplay = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScore');

const GRAVITY = 0.5;
const FLAP_STRENGTH = -8;
const PIPE_SPEED = 2;
const PIPE_GAP = 150;
const PIPE_WIDTH = 60;
const BIRD_SIZE = 30;

let bird = {
    x: 80,
    y: canvas.height / 2,
    velocity: 0,
    rotation: 0
};

let pipes = [];
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let gameState = 'start';
let frameCount = 0;

function resetGame() {
    bird = {
        x: 80,
        y: canvas.height / 2,
        velocity: 0,
        rotation: 0
    };
    pipes = [];
    score = 0;
    frameCount = 0;
    scoreDisplay.textContent = score;
}

function startGame() {
    if (gameState === 'start' || gameState === 'gameover') {
        resetGame();
        gameState = 'playing';
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
    }
}

function flap() {
    if (gameState === 'playing') {
        bird.velocity = FLAP_STRENGTH;
    }
}

function updateBird() {
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);

    if (bird.y + BIRD_SIZE > canvas.height) {
        bird.y = canvas.height - BIRD_SIZE;
        gameOver();
    }

    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }
}

function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        scored: false
    });
}

function updatePipes() {
    if (frameCount % 100 === 0) {
        createPipe();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
            score++;
            pipes[i].scored = true;
            scoreDisplay.textContent = score;
        }

        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }

        if (checkCollision(pipes[i])) {
            gameOver();
        }
    }
}

function checkCollision(pipe) {
    const birdLeft = bird.x;
    const birdRight = bird.x + BIRD_SIZE;
    const birdTop = bird.y;
    const birdBottom = bird.y + BIRD_SIZE;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
            return true;
        }
    }

    return false;
}

function gameOver() {
    if (gameState === 'playing') {
        gameState = 'gameover';

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyHighScore', highScore);
        }

        finalScoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore;
        gameOverScreen.classList.remove('hidden');
    }
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE);

    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE / 2, 0);
    ctx.lineTo(BIRD_SIZE / 2 + 10, -5);
    ctx.lineTo(BIRD_SIZE / 2 + 10, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawPipes() {
    ctx.fillStyle = '#2ecc71';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;

    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
        ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);

        ctx.fillStyle = '#27ae60';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, PIPE_WIDTH + 10, 30);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 30);

        ctx.fillStyle = '#2ecc71';
    });
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4ec0ca');
    gradient.addColorStop(1, '#87ceeb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(50 + i * 100, 100 + Math.sin(frameCount * 0.01 + i) * 20, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    ctx.fillStyle = '#8B4513';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillRect(i - (frameCount * PIPE_SPEED % 20), canvas.height - 50, 10, 5);
    }
}

function gameLoop() {
    drawBackground();

    if (gameState === 'playing') {
        frameCount++;
        updateBird();
        updatePipes();
    }

    drawPipes();
    drawGround();
    drawBird();

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start' || gameState === 'gameover') {
            startGame();
        } else if (gameState === 'playing') {
            flap();
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameState === 'start' || gameState === 'gameover') {
        startGame();
    } else if (gameState === 'playing') {
        flap();
    }
});

highScoreDisplay.textContent = highScore;

gameLoop();
