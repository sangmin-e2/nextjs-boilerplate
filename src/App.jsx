import React, { useState, useEffect } from 'react';
import { formatDateKey, generateColors } from './colorUtils';
import './App.css';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [colors, setColors] = useState({ backgroundColor: '#ffffff', textColor: '#000000' });
  const [saveStatus, setSaveStatus] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState('');

  // 날짜 변경 시 색상 업데이트 및 기존 데이터 로드
  useEffect(() => {
    const dateKey = formatDateKey(selectedDate);
    const newColors = generateColors(dateKey);
    setColors(newColors);
    
    // 기존 엔트리 로드
    if (window.electronAPI) {
      window.electronAPI.getEntry(dateKey).then(entry => {
        if (entry) {
          setTitle(entry.title || '');
          setContent(entry.content || '');
        } else {
          setTitle('');
          setContent('');
        }
      });
    }
  }, [selectedDate]);

  const handleSave = async () => {
    const dateKey = formatDateKey(selectedDate);
    const entry = {
      date: dateKey,
      title: title.trim(),
      content: content.trim(),
    };

    setSaveStatus('저장 중...');
    
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.saveEntry(entry);
        if (result.success) {
          setSaveStatus('✓ 저장 완료');
          setLastSavedTime(new Date().toLocaleTimeString('ko-KR'));
          setTimeout(() => setSaveStatus(''), 2000);
        } else {
          setSaveStatus('✗ 저장 실패: ' + result.error);
        }
      } else {
        setSaveStatus('✗ Electron API를 사용할 수 없습니다');
      }
    } catch (error) {
      setSaveStatus('✗ 저장 실패: ' + error.message);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(new Date(e.target.value));
  };

  const dateInputValue = selectedDate.toISOString().split('T')[0];

  return (
    <div className="app" style={{ 
      backgroundColor: colors.backgroundColor,
      color: colors.textColor,
      minHeight: '100vh',
    }}>
      <div className="container">
        <header>
          <h1>My Diary</h1>
          <p className="subtitle">날짜별로 일상을 기록하세요</p>
        </header>

        <div className="form-group">
          <label htmlFor="date-picker">날짜 선택</label>
          <input
            id="date-picker"
            type="date"
            value={dateInputValue}
            onChange={handleDateChange}
            className="date-input"
            style={{ 
              backgroundColor: colors.textColor === '#1a1a1a' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              color: colors.textColor,
              borderColor: colors.textColor + '40',
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="title-input">제목</label>
          <input
            id="title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요 (선택사항)"
            maxLength={200}
            className="title-input"
            style={{ 
              backgroundColor: colors.textColor === '#1a1a1a' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              color: colors.textColor,
              borderColor: colors.textColor + '40',
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content-input">내용</label>
          <textarea
            id="content-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘의 일상을 기록하세요..."
            maxLength={20000}
            rows={12}
            className="content-input"
            style={{ 
              backgroundColor: colors.textColor === '#1a1a1a' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
              color: colors.textColor,
              borderColor: colors.textColor + '40',
            }}
          />
        </div>

        <div className="button-group">
          <button 
            onClick={handleSave}
            className="save-button"
            style={{ 
              backgroundColor: colors.textColor,
              color: colors.backgroundColor,
            }}
          >
            저장
          </button>
        </div>

        {saveStatus && (
          <div className="status-message">
            {saveStatus}
          </div>
        )}

        {lastSavedTime && (
          <div className="last-saved">
            마지막 저장: {lastSavedTime}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
