document.addEventListener('DOMContentLoaded', () => {
    // 캔버스 설정
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next-canvas');
    const nextCtx = nextCanvas.getContext('2d');
    
    // 블록 크기 설정
    const blockSize = 20;
    const boardWidth = canvas.width / blockSize;
    const boardHeight = canvas.height / blockSize;
    
    // 게임 상태
    let score = 0;
    let level = 1;
    let lines = 0;
    let gameOver = false;
    let paused = false;
    let gameStarted = false;
    let requestId = null;
    
    // 게임 보드 생성
    let board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));
    
    // 테트로미노 모양 정의
    const tetrominos = [
        // I 모양
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // J 모양
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        // L 모양
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        // O 모양
        [
            [4, 4],
            [4, 4]
        ],
        // S 모양
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        // T 모양
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        // Z 모양
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]
    ];
    
    // 색상 정의
    const colors = [
        'black',      // 빈 공간
        'cyan',       // I
        'blue',       // J
        'orange',     // L
        'yellow',     // O
        'green',      // S
        'purple',     // T
        'red'         // Z
    ];
    
    // 현재 테트로미노와 다음 테트로미노
    let currentPiece = null;
    let nextPiece = null;
    
    // 게임 시작 버튼
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        if (!gameStarted) {
            startGame();
        } else if (gameOver) {
            resetGame();
        } else if (paused) {
            resumeGame();
        } else {
            pauseGame();
        }
    });
    
    // 키보드 이벤트 처리
    document.addEventListener('keydown', handleKeyPress);
    
    // 게임 시작 함수
    function startGame() {
        resetGame();
        gameStarted = true;
        startButton.textContent = '일시정지';
        generateNewPiece();
        update();
    }
    
    // 게임 재설정 함수
    function resetGame() {
        cancelAnimationFrame(requestId);
        board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0));
        score = 0;
        level = 1;
        lines = 0;
        gameOver = false;
        updateScore();
        startButton.textContent = '게임 시작';
        gameStarted = false;
        drawBoard();
    }
    
    // 게임 일시정지 함수
    function pauseGame() {
        if (!gameOver && gameStarted) {
            paused = true;
            cancelAnimationFrame(requestId);
            startButton.textContent = '계속하기';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('일시정지', canvas.width / 2, canvas.height / 2);
        }
    }
    
    // 게임 재개 함수
    function resumeGame() {
        if (!gameOver && gameStarted) {
            paused = false;
            startButton.textContent = '일시정지';
            update();
        }
    }
    
    // 새 테트로미노 생성
    function generateNewPiece() {
        if (nextPiece === null) {
            nextPiece = createPiece();
        }
        
        currentPiece = nextPiece;
        nextPiece = createPiece();
        
        // 게임 오버 체크
        if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
            gameOver = true;
            startButton.textContent = '다시 시작';
            cancelAnimationFrame(requestId);
            drawGameOver();
        }
        
        drawNextPiece();
    }
    
    // 테트로미노 생성
    function createPiece() {
        const index = Math.floor(Math.random() * tetrominos.length);
        const shape = tetrominos[index];
        
        return {
            shape,
            color: index + 1,
            x: Math.floor((boardWidth - shape[0].length) / 2),
            y: 0
        };
    }
    
    // 충돌 체크
    function checkCollision(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    if (
                        boardX < 0 || 
                        boardX >= boardWidth || 
                        boardY >= boardHeight || 
                        (boardY >= 0 && board[boardY][boardX] !== 0)
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // 테트로미노 회전
    function rotatePiece() {
        const rotated = [];
        const shape = currentPiece.shape;
        
        for (let col = 0; col < shape[0].length; col++) {
            const newRow = [];
            for (let row = shape.length - 1; row >= 0; row--) {
                newRow.push(shape[row][col]);
            }
            rotated.push(newRow);
        }
        
        if (!checkCollision(rotated, currentPiece.x, currentPiece.y)) {
            currentPiece.shape = rotated;
        } else {
            // 벽 근처에서 회전 시 밀어내기 시도
            const originalX = currentPiece.x;
            const kicks = [1, -1, 2, -2]; // 오른쪽, 왼쪽, 더 오른쪽, 더 왼쪽
            
            for (const kick of kicks) {
                currentPiece.x += kick;
                if (!checkCollision(rotated, currentPiece.x, currentPiece.y)) {
                    currentPiece.shape = rotated;
                    return;
                }
                currentPiece.x = originalX;
            }
        }
    }
    
    // 테트로미노 이동
    function movePiece(dx, dy) {
        if (!checkCollision(currentPiece.shape, currentPiece.x + dx, currentPiece.y + dy)) {
            currentPiece.x += dx;
            currentPiece.y += dy;
            return true;
        }
        return false;
    }
    
    // 테트로미노 즉시 내리기
    function hardDrop() {
        while (movePiece(0, 1)) {
            score += 1;
        }
        updateScore();
        lockPiece();
    }
    
    // 테트로미노 고정
    function lockPiece() {
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col] !== 0) {
                    const boardY = currentPiece.y + row;
                    const boardX = currentPiece.x + col;
                    
                    if (boardY >= 0) {
                        board[boardY][boardX] = currentPiece.color;
                    }
                }
            }
        }
        
        clearLines();
        generateNewPiece();
    }
    
    // 완성된 라인 제거
    function clearLines() {
        let linesCleared = 0;
        
        for (let row = boardHeight - 1; row >= 0; row--) {
            if (board[row].every(cell => cell !== 0)) {
                // 라인 제거
                board.splice(row, 1);
                // 새 라인 추가
                board.unshift(Array(boardWidth).fill(0));
                linesCleared++;
                row++; // 같은 위치 다시 체크
            }
        }
        
        if (linesCleared > 0) {
            // 점수 계산
            const linePoints = [40, 100, 300, 1200]; // 1, 2, 3, 4 라인 제거 시 점수
            score += linePoints[linesCleared - 1] * level;
            lines += linesCleared;
            
            // 레벨 업
            level = Math.floor(lines / 10) + 1;
            
            updateScore();
        }
    }
    
    // 점수 업데이트
    function updateScore() {
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = lines;
    }
    
    // 키보드 입력 처리
    function handleKeyPress(event) {
        if (!gameStarted || gameOver || paused) return;
        
        switch (event.keyCode) {
            case 37: // 왼쪽 화살표
                movePiece(-1, 0);
                break;
            case 39: // 오른쪽 화살표
                movePiece(1, 0);
                break;
            case 40: // 아래 화살표
                if (!movePiece(0, 1)) {
                    lockPiece();
                }
                score += 1;
                updateScore();
                break;
            case 38: // 위 화살표
                rotatePiece();
                break;
            case 32: // 스페이스바
                hardDrop();
                break;
            case 80: // P 키
                if (paused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
                break;
        }
        
        drawBoard();
    }
    
    // 게임 보드 그리기
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 보드 그리기
        for (let row = 0; row < boardHeight; row++) {
            for (let col = 0; col < boardWidth; col++) {
                const colorIndex = board[row][col];
                if (colorIndex !== 0) {
                    drawBlock(ctx, col, row, colors[colorIndex]);
                }
            }
        }
        
        // 현재 테트로미노 그리기
        if (currentPiece) {
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col] !== 0) {
                        const colorIndex = currentPiece.color;
                        const x = currentPiece.x + col;
                        const y = currentPiece.y + row;
                        
                        if (y >= 0) {
                            drawBlock(ctx, x, y, colors[colorIndex]);
                        }
                    }
                }
            }
        }
        
        // 그리드 그리기
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        
        for (let row = 0; row <= boardHeight; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * blockSize);
            ctx.lineTo(canvas.width, row * blockSize);
            ctx.stroke();
        }
        
        for (let col = 0; col <= boardWidth; col++) {
            ctx.beginPath();
            ctx.moveTo(col * blockSize, 0);
            ctx.lineTo(col * blockSize, canvas.height);
            ctx.stroke();
        }
    }
    
    // 다음 테트로미노 그리기
    function drawNextPiece() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        
        if (nextPiece) {
            const offsetX = (nextCanvas.width - nextPiece.shape[0].length * blockSize) / 2;
            const offsetY = (nextCanvas.height - nextPiece.shape.length * blockSize) / 2;
            
            for (let row = 0; row < nextPiece.shape.length; row++) {
                for (let col = 0; col < nextPiece.shape[row].length; col++) {
                    if (nextPiece.shape[row][col] !== 0) {
                        const colorIndex = nextPiece.color;
                        const x = col;
                        const y = row;
                        
                        drawBlock(
                            nextCtx, 
                            x, 
                            y, 
                            colors[colorIndex], 
                            offsetX / blockSize, 
                            offsetY / blockSize
                        );
                    }
                }
            }
        }
    }
    
    // 블록 그리기
    function drawBlock(context, x, y, color, offsetX = 0, offsetY = 0) {
        context.fillStyle = color;
        context.fillRect(
            (x + offsetX) * blockSize, 
            (y + offsetY) * blockSize, 
            blockSize, 
            blockSize
        );
        
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.strokeRect(
            (x + offsetX) * blockSize, 
            (y + offsetY) * blockSize, 
            blockSize, 
            blockSize
        );
        
        // 하이라이트 효과
        context.fillStyle = 'rgba(255, 255, 255, 0.2)';
        context.beginPath();
        context.moveTo((x + offsetX) * blockSize, (y + offsetY) * blockSize);
        context.lineTo((x + offsetX + 1) * blockSize, (y + offsetY) * blockSize);
        context.lineTo((x + offsetX) * blockSize, (y + offsetY + 1) * blockSize);
        context.fill();
    }
    
    // 게임 오버 화면 그리기
    function drawGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText(`점수: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    }
    
    // 게임 업데이트 함수
    function update() {
        if (gameOver || paused) return;
        
        const dropSpeed = 1000 - (level - 1) * 100; // 레벨에 따른 속도 조절
        
        const now = Date.now();
        const delta = now - lastTime;
        
        if (delta > dropSpeed) {
            if (!movePiece(0, 1)) {
                lockPiece();
            }
            lastTime = now;
        }
        
        drawBoard();
        requestId = requestAnimationFrame(update);
    }
    
    // 초기 시간 설정
    let lastTime = Date.now();
    
    // 초기 보드 그리기
    drawBoard();
});