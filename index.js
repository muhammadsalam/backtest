require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YANDEX_API_KEY;

const STATIONS = ['s9613115', 's9613649']; // Манас, Махачкала

const cache = {
  's9613115_s9613649': { segments: [], lastUpdated: null },
  's9613649_s9613115': { segments: [], lastUpdated: null }
};

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

async function fetchSchedule(from, to) {
  const key = `${from}_${to}`;
  const url = `https://api.rasp.yandex.net/v3.0/search/?apikey=${API_KEY}&from=${from}&to=${to}&date=${getTodayDate()}&transport_types=suburban&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.segments) {
      cache[key].segments = data.segments.map(seg => ({
        departure: seg.departure,
        arrival: seg.arrival,
        duration: seg.duration,
        thread: {
          number: seg.thread?.number || '',
          title: seg.thread?.title || ''
        }
      }));
      cache[key].lastUpdated = new Date().toISOString();
      console.log(`[${new Date().toISOString()}] Обновлён кэш: ${from} → ${to}, ${cache[key].segments.length} рейсов`);
    }
  } catch (error) {
    console.error(`Ошибка загрузки ${from} → ${to}:`, error.message);
  }
}

async function updateAllSchedules() {
  await fetchSchedule('s9613115', 's9613649');
  await fetchSchedule('s9613649', 's9613115');
}

// Эндпоинты
app.get('/', (req, res) => {
  res.json({ message: 'Сервер расписания электричек работает!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/schedule', (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Укажите параметры from и to' });
  }

  if (!STATIONS.includes(from) || !STATIONS.includes(to)) {
    return res.status(400).json({ error: 'Неверные коды станций' });
  }

  const key = `${from}_${to}`;
  res.json({ segments: cache[key].segments });
});

// Запуск
app.listen(PORT, async () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  await updateAllSchedules();
});

// Обновление каждый час
cron.schedule('0 * * * *', updateAllSchedules);
