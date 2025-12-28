// Массив URL для пинга — добавляй сюда новые ссылки
const URLS = [
  'https://backtest-1ixo.onrender.com/',
  'https://backtest-1-nbgx.onrender.com/',
];

const PING_INTERVAL = 14 * 60 * 1000; // 14 минут

// Минимальный HTTP сервер (чтобы хостинг видел что сервер жив)
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('pong');
});

// Пинг всех URL
async function pingAll() {
  for (const url of URLS) {
    try {
      const res = await fetch(url);
      console.log(`[${new Date().toISOString()}] ${url} - ${res.status}`);
    } catch (e) {
      console.log(`[${new Date().toISOString()}] ${url} - ERROR: ${e.message}`);
    }
  }
}

// Запуск
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ping server running on port ${PORT}`);
  pingAll(); // сразу при старте
  setInterval(pingAll, PING_INTERVAL);
});
