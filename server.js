const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Cria a pasta de vídeos automaticamente se não existir
const videoDir = path.join(__dirname, 'public', 'videos');
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

let gameState = {
    esporte: 'futsal',
    sacando: null,
    timeA: { nome: 'Time Local', logo: '', placar: 0, sets: 0, elenco: [] },
    timeB: { nome: 'Visitante', logo: '', placar: 0, sets: 0, elenco: [] },
    cronometro: { rodando: false, tempoAcumulado: 0, inicioTimestamp: 0, duracaoConfigurada: 600000 }
};

io.on('connection', (socket) => {
//     console.log('🟢 Dispositivo conectado:', socket.id);
//     socket.emit('atualizar_tela', { ...gameState, serverTime: Date.now() });

//     // Gestão de Vídeos (Comerciais)
//     socket.on('solicitar_videos', () => {
//         fs.readdir(videoDir, (err, files) => {
//             if (!err) {
//                 const videos = files.filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
//                 socket.emit('lista_videos', videos);
//             }
//         });
//     });

//     socket.on('comando_video', (dados) => {
//         io.emit('executar_video', dados);
//     });

//     // Configuração Inicial e Atualização de Dados
    socket.on('configurar_jogo', (dados) => {
        console.log("CONFIGURANDO")
        if (dados.esporte) gameState.esporte = dados.esporte;
        if (dados.timeA_nome) gameState.timeA.nome = dados.timeA_nome;
        if (dados.timeB_nome) gameState.timeB.nome = dados.timeB_nome;
        if (dados.timeA_logo !== undefined) gameState.timeA.logo = dados.timeA_logo;
        if (dados.timeB_logo !== undefined) gameState.timeB.logo = dados.timeB_logo;
        if (dados.timeA_elenco) gameState.timeA.elenco = dados.timeA_elenco;
        if (dados.timeB_elenco) gameState.timeB.elenco = dados.timeB_elenco;
        io.emit('atualizar_tela', { ...gameState, serverTime: Date.now() });
    });

//     // Ações de Placar e Anúncio de Jogador
//     socket.on('comando_placar', ({ time, acao, valor, jogador }) => {
//         if (acao === 'add_ponto') { 
//             gameState[time].placar += valor; 
//             gameState.sacando = time; 
            
//             if (jogador) {
//                 let textoAcao = gameState.esporte === 'futsal' ? 'GOL!' : (gameState.esporte === 'basquete' ? 'CESTA!' : 'PONTO!');
//                 io.emit('animacao_ponto', {
//                     texto: textoAcao,
//                     jogador: jogador,
//                     timeNome: gameState[time].nome
//                 });
//             }
//         }
//         if (acao === 'sub_ponto' && gameState[time].placar > 0) gameState[time].placar -= valor;
//         if (acao === 'add_set') gameState[time].sets += 1;
//         if (acao === 'sub_set' && gameState[time].sets > 0) gameState[time].sets -= 1;
//         if (acao === 'zerar_tudo') {
//             gameState.timeA.placar = 0; gameState.timeA.sets = 0;
//             gameState.timeB.placar = 0; gameState.timeB.sets = 0; gameState.sacando = null;
//         }
//         io.emit('atualizar_tela', { ...gameState, serverTime: Date.now() });
//     });

//     // Gestão do Cronômetro (Milissegundos)
//     socket.on('comando_cronometro', ({ acao, valor }) => {
//         console.log(acao, valor, "Teste")
//         if (acao === 'play' && !gameState.cronometro.rodando) {
//             gameState.cronometro.rodando = true; 
//             gameState.cronometro.inicioTimestamp = Date.now();
//             console.log(gameState.cronometro.inicioTimestamp)
//         } else if (acao === 'pause' && gameState.cronometro.rodando) {
//             gameState.cronometro.rodando = false; 
//             gameState.cronometro.tempoAcumulado += (Date.now() - gameState.cronometro.inicioTimestamp);
//         } else if (acao === 'set') {
//             gameState.cronometro.rodando = false; 
//             gameState.cronometro.tempoAcumulado = 0; 
//             gameState.cronometro.duracaoConfigurada = valor * 60 * 1000; 
//         }
//         io.emit('atualizar_tela', { ...gameState, serverTime: Date.now() });
//     });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Servidor rodando! Acesse via IP na rede (ex: http://192.168.x.x:3000)');
});