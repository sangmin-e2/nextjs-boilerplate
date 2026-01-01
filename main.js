const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
const DIARY_FOLDER = path.join(os.homedir(), 'Documents', 'GaengniDiary');
const DIARY_FILE = path.join(DIARY_FOLDER, 'diary.tsv');
const BACKUP_LIMIT = 5;

// 폴더 및 파일 초기화
function initializeDiaryFile() {
  if (!fs.existsSync(DIARY_FOLDER)) {
    fs.mkdirSync(DIARY_FOLDER, { recursive: true });
  }
  
  if (!fs.existsSync(DIARY_FILE)) {
    fs.writeFileSync(DIARY_FILE, 'date\ttitle\tcontent\n', 'utf-8');
  }
}

// TSV 이스케이프
function escapeTsv(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// TSV 언이스케이프
function unescapeTsv(text) {
  if (!text) return '';
  return text
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
}

// TSV 파일 로드
function loadDiary() {
  try {
    const content = fs.readFileSync(DIARY_FILE, 'utf-8');
    const lines = content.split('\n');
    const entries = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const date = parts[0];
        const title = unescapeTsv(parts[1]);
        const entryContent = unescapeTsv(parts[2]);
        entries[date] = { date, title, content: entryContent };
      }
    }
    
    return entries;
  } catch (error) {
    console.error('Error loading diary:', error);
    return {};
  }
}

// 백업 생성
function createBackup() {
  if (!fs.existsSync(DIARY_FILE)) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupFile = path.join(DIARY_FOLDER, `diary_${timestamp}.bak.tsv`);
  fs.copyFileSync(DIARY_FILE, backupFile);
  
  // 오래된 백업 삭제
  const backups = fs.readdirSync(DIARY_FOLDER)
    .filter(f => f.startsWith('diary_') && f.endsWith('.bak.tsv'))
    .map(f => ({ name: f, time: fs.statSync(path.join(DIARY_FOLDER, f)).mtime }))
    .sort((a, b) => b.time - a.time);
  
  if (backups.length > BACKUP_LIMIT) {
    backups.slice(BACKUP_LIMIT).forEach(b => {
      fs.unlinkSync(path.join(DIARY_FOLDER, b.name));
    });
  }
}

// TSV 파일 저장 (원자적 저장)
function saveDiary(entries) {
  try {
    createBackup();
    
    const lines = ['date\ttitle\tcontent'];
    const sortedDates = Object.keys(entries).sort();
    
    sortedDates.forEach(date => {
      const entry = entries[date];
      const title = escapeTsv(entry.title);
      const content = escapeTsv(entry.content);
      lines.push(`${date}\t${title}\t${content}`);
    });
    
    const tempFile = DIARY_FILE + '.tmp';
    fs.writeFileSync(tempFile, lines.join('\n') + '\n', 'utf-8');
    fs.renameSync(tempFile, DIARY_FILE);
    
    return { success: true };
  } catch (error) {
    console.error('Error saving diary:', error);
    return { success: false, error: error.message };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  initializeDiaryFile();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 핸들러
ipcMain.handle('load-diary', () => {
  return loadDiary();
});

ipcMain.handle('save-entry', (event, entry) => {
  const entries = loadDiary();
  entries[entry.date] = entry;
  return saveDiary(entries);
});

ipcMain.handle('get-entry', (event, date) => {
  const entries = loadDiary();
  return entries[date] || null;
});
