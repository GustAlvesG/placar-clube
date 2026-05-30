const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const videoDir = path.join(__dirname, 'public', 'videos');
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

let gameState = {
    esporte: 'futsal',
    sacando: null,
    periodo: 1,
    timeA: { nome: 'Time Local', logo: '', placar: 0, sets: 0, faltas: 0, elenco: [] },
    timeB: { nome: 'Visitante', logo: '', placar: 0, sets: 0, faltas: 0, elenco: [] },
    cronometro: { rodando: false, tempoAcumulado: 0, inicioTimestamp: 0, duracaoConfigurada: 600000 }
};

function broadcast() {
    io.emit('atualizar_tela', { ...gameState, serverTime: Date.now() });
}

io.on('connection', (socket) => {
    // Sincroniza novo cliente com o estado atual do jogo
    socket.emit('atualizar_tela', { ...gameState, serverTime: Date.now() });

    // Gestão de Vídeos (Comerciais)
    socket.on('solicitar_videos', () => {
        fs.readdir(videoDir, (err, files) => {
            if (err) {
                console.error('Erro ao ler diretório de vídeos:', err.message);
                socket.emit('lista_videos', []);
                return;
            }
            const exts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
            const videos = files.filter(f => exts.includes(path.extname(f).toLowerCase()));
            console.log(`Vídeos encontrados em ${videoDir}:`, videos);
            socket.emit('lista_videos', videos);
        });
    });

    socket.on('comando_video', (dados) => {
        io.emit('executar_video', dados);
    });

    // Configuração Inicial e Atualização de Dados
    socket.on('configurar_jogo', (dados) => {
        if (dados.esporte) gameState.esporte = dados.esporte;
        if (dados.timeA_nome) gameState.timeA.nome = dados.timeA_nome;
        if (dados.timeB_nome) gameState.timeB.nome = dados.timeB_nome;
        if (dados.timeA_logo !== undefined) gameState.timeA.logo = dados.timeA_logo;
        if (dados.timeB_logo !== undefined) gameState.timeB.logo = dados.timeB_logo;
        if (dados.timeA_elenco) gameState.timeA.elenco = dados.timeA_elenco;
        if (dados.timeB_elenco) gameState.timeB.elenco = dados.timeB_elenco;
        if ('sacando' in dados) gameState.sacando = dados.sacando;
        broadcast();
    });

    // Ações de Placar e Anúncio de Jogador
    socket.on('comando_placar', ({ time, acao, valor, jogador }) => {
        if (acao === 'add_ponto') {
            gameState[time].placar += valor;
            gameState.sacando = time;
            if (jogador) {
                const textos = { futsal: 'GOL!', basquete: 'CESTA!', volei: 'PONTO!' };
                const textoAcao = textos[gameState.esporte] || 'PONTO!';
                io.emit('animacao_ponto', { texto: textoAcao, jogador, timeNome: gameState[time].nome });
            }

            //No volei, checar se o ponto fez o time alcançar 25 pontos com diferença de 2 para vencer o set
            //TODO: VERIFICAR SE MANTEM ESSA AUTOMATICAMENTE OU SE DEVE TER UM BOTÃO PARA FINALIZAR O SET (OU SE DEVE PERMITIR QUE O USUÁRIO DESFAÇA O PONTO CASO TENHA SIDO UM ERRO)
            if (gameState.esporte === 'volei') {
                const outroTime = time === 'timeA' ? 'timeB' : 'timeA';
                const placarTime = gameState[time].placar;
                const placarOutro = gameState[outroTime].placar;
                if (placarTime >= 25 && (placarTime - placarOutro) >= 2) {
                    gameState[time].sets += 1;
                    gameState.timeA.placar = 0;
                    gameState.timeB.placar = 0;
                    gameState.sacando = null;
                }
            }
        }
        if (acao === 'sub_ponto' && gameState[time].placar > 0) gameState[time].placar -= valor;
        if (acao === 'add_set') gameState[time].sets += 1;
        if (acao === 'sub_set' && gameState[time].sets > 0) gameState[time].sets -= 1;
        if (acao === 'add_falta') gameState[time].faltas += 1;
        if (acao === 'sub_falta' && gameState[time].faltas > 0) gameState[time].faltas -= 1;
        if (acao === 'add_periodo') gameState.periodo += 1;
        if (acao === 'sub_periodo' && gameState.periodo > 1) gameState.periodo -= 1;
        if (acao === 'zerar_tudo') {
            gameState.timeA.placar = 0; gameState.timeA.sets = 0; gameState.timeA.faltas = 0;
            gameState.timeB.placar = 0; gameState.timeB.sets = 0; gameState.timeB.faltas = 0;
            gameState.sacando = null;
            gameState.periodo = 1;
            gameState.cronometro.rodando = false;
            gameState.cronometro.tempoAcumulado = 0;
            gameState.cronometro.inicioTimestamp = 0;
        }
        broadcast();
    });

    // Gestão do Cronômetro
    socket.on('comando_cronometro', ({ acao, valor, segundos }) => {
        if (acao === 'play' && !gameState.cronometro.rodando) {
            gameState.cronometro.rodando = true;
            gameState.cronometro.inicioTimestamp = Date.now();
        } else if (acao === 'pause' && gameState.cronometro.rodando) {
            gameState.cronometro.rodando = false;
            gameState.cronometro.tempoAcumulado += (Date.now() - gameState.cronometro.inicioTimestamp);
        } else if (acao === 'set') {
            gameState.cronometro.rodando = false;
            gameState.cronometro.tempoAcumulado = 0;
            gameState.cronometro.duracaoConfigurada = ((valor || 0) * 60 + (segundos || 0)) * 1000;
        }
        broadcast();
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Servidor rodando! Acesse via IP na rede (ex: http://192.168.x.x:3000)');
});