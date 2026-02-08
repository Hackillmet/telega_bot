// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// При запуске приложения
tg.expand(); // Развернуть на весь экран
tg.enableClosingConfirmation(); // Подтверждение перед закрытием

// Объект состояния приложения
const AppState = {
    habits: JSON.parse(localStorage.getItem('disciplina_habits')) || [],
    goals: JSON.parse(localStorage.getItem('disciplina_goals')) || [],
    stats: JSON.parse(localStorage.getItem('disciplina_stats')) || {
        streak: 0,
        lastActiveDate: null,
        weeklyCompletion: 0,
        totalPomodoros: 0
    },
    pomodoro: {
        isRunning: false,
        isBreak: false,
        timeLeft: 25 * 60, // 25 минут в секундах
        totalSessions: 4,
        currentSession: 1,
        focusTime: 25,
        breakTime: 5
    },
    quotes: [
        "Дисциплина — это выбор между тем, чего ты хочешь сейчас, и тем, чего ты хочешь больше всего.",
        "Успех — это не случайность. Это тяжелый труд, настойчивость, обучение, изучение, жертвоприношение и, прежде всего, любовь к тому, что вы делаете.",
        "Мотивация заставляет вас начать. Привычка заставляет вас продолжать.",
        "Не откладывай на завтра то, что можно сделать сегодня.",
        "Маленькие ежедневные улучшения со временем приводят к большим результатам.",
        "Самое трудное — решиться действовать, остальное — дело упорства.",
        "Дисциплина — это мост между целями и достижениями."
    ]
};

// DOM элементы
const elements = {
    // Шапка
    username: document.getElementById('username'),
    streakCount: document.getElementById('streak-count'),
    todayCompleted: document.getElementById('today-completed'),
    todayTotal: document.getElementById('today-total'),
    
    // Вкладки
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Привычки
    habitsList: document.getElementById('habits-list'),
    addHabitBtn: document.getElementById('add-habit'),
    addFirstHabitBtn: document.getElementById('add-first-habit'),
    quoteText: document.getElementById('quote-text'),
    
    // Pomodoro
    timerDisplay: document.getElementById('timer-display'),
    timerLabel: document.getElementById('timer-label'),
    startTimerBtn: document.getElementById('start-timer'),
    pauseTimerBtn: document.getElementById('pause-timer'),
    resetTimerBtn: document.getElementById('reset-timer'),
    focusTimeInput: document.getElementById('focus-time'),
    breakTimeInput: document.getElementById('break-time'),
    sessionCount: document.getElementById('session-count'),
    decreaseSessionsBtn: document.getElementById('decrease-sessions'),
    increaseSessionsBtn: document.getElementById('increase-sessions'),
    sessionProgress: document.getElementById('session-progress'),
    currentSession: document.getElementById('current-session'),
    totalSessions: document.getElementById('total-sessions'),
    
    // Статистика
    weekCompletion: document.getElementById('week-completion'),
    currentStreak: document.getElementById('current-streak'),
    
    // Модальное окно
    habitModal: document.getElementById('habit-modal'),
    closeModalBtn: document.getElementById('close-modal'),
    cancelHabitBtn: document.getElementById('cancel-habit'),
    saveHabitBtn: document.getElementById('save-habit'),
    habitNameInput: document.getElementById('habit-name'),
    habitTimeInput: document.getElementById('habit-time-input'),
    
    // Быстрые действия
    quickTaskBtn: document.getElementById('quick-task'),
    motivationBtn: document.getElementById('motivation')
};

// Инициализация приложения
function initApp() {
    // Установка имени пользователя из Telegram
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        elements.username.textContent = `${user.first_name || 'Пользователь'}`;
        updateStreak();
    }
    
    // Загрузка данных
    loadHabits();
    updateStats();
    showRandomQuote();
    
    // Инициализация Pomodoro
    initPomodoro();
    
    // Инициализация чарта статистики
    initStatsChart();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Проверка уведомлений
    checkDailyReminder();
    
    console.log('Disciplina Pro запущен!');
}

// Загрузка и отображение привычек
function loadHabits() {
    const habits = AppState.habits;
    const today = new Date().toDateString();
    
    if (habits.length === 0) {
        elements.habitsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list fa-2x"></i>
                <p>У вас пока нет привычек</p>
                <button class="btn-primary" id="add-first-habit">
                    Добавить первую привычку
                </button>
            </div>
        `;
        // Добавляем обработчик для кнопки в empty state
        document.getElementById('add-first-habit')?.addEventListener('click', () => {
            showHabitModal();
        });
        return;
    }
    
    let completedToday = 0;
    let habitsHTML = '';
    
    habits.forEach((habit, index) => {
        const isToday = habit.lastCompleted === today;
        if (isToday) completedToday++;
        
        habitsHTML += `
            <div class="habit-item" data-id="${index}">
                <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-meta">
                        <span><i class="far fa-clock"></i> ${getFrequencyText(habit.frequency)}</span>
                        ${habit.time ? `<span><i class="far fa-bell"></i> ${habit.time}</span>` : ''}
                    </div>
                </div>
                <button class="habit-check ${isToday ? 'checked' : ''}" data-id="${index}">
                    ${isToday ? '<i class="fas fa-check"></i>' : ''}
                </button>
            </div>
        `;
    });
    
    elements.habitsList.innerHTML = habitsHTML;
    elements.todayCompleted.textContent = completedToday;
    elements.todayTotal.textContent = habits.length;
    
    // Добавляем обработчики для чекбоксов
    document.querySelectorAll('.habit-check').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            toggleHabitCompletion(id);
        });
    });
}

function getFrequencyText(freq) {
    const freqMap = {
        'daily': 'Ежедневно',
        'weekdays': 'По будням',
        'weekly': 'Еженедельно'
    };
    return freqMap[freq] || freq;
}

// Переключение выполнения привычки
function toggleHabitCompletion(id) {
    const habit = AppState.habits[id];
    const today = new Date().toDateString();
    
    if (!habit) return;
    
    if (habit.lastCompleted === today) {
        // Отменить выполнение
        habit.lastCompleted = null;
    } else {
        // Отметить выполненным
        habit.lastCompleted = today;
        
        // Показать анимацию
        const button = document.querySelector(`.habit-check[data-id="${id}"]`);
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('checked');
        
        // Вибрация (если поддерживается)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Обновить streak
        updateStreak();
    }
    
    saveData();
    loadHabits();
}

// Обновление streak (серии дней)
function updateStreak() {
    const today = new Date().toDateString();
    const lastActive = AppState.stats.lastActiveDate;
    
    if (lastActive === today) {
        return; // Уже обновлено сегодня
    }
    
    if (!lastActive) {
        // Первый запуск
        AppState.stats.streak = 1;
    } else {
        const lastDate = new Date(lastActive);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            // Последовательные дни
            AppState.stats.streak++;
        } else if (diffDays > 1) {
            // Разрыв в днях
            AppState.stats.streak = 1;
        }
    }
    
    AppState.stats.lastActiveDate = today;
    elements.streakCount.textContent = `${AppState.stats.streak} дней подряд`;
    elements.currentStreak.textContent = AppState.stats.streak;
    
    saveData();
}

// Показать случайную цитату
function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * AppState.quotes.length);
    elements.quoteText.textContent = AppState.quotes[randomIndex];
}

// Инициализация Pomodoro таймера
function initPomodoro() {
    updateTimerDisplay();
    
    // Настройка значений
    elements.focusTimeInput.value = AppState.pomodoro.focusTime;
    elements.breakTimeInput.value = AppState.pomodoro.breakTime;
    elements.sessionCount.textContent = AppState.pomodoro.totalSessions;
    elements.totalSessions.textContent = AppState.pomodoro.totalSessions;
    elements.currentSession.textContent = AppState.pomodoro.currentSession;
    
    // Обновление прогресса
    updateSessionProgress();
    
    // Обработчики Pomodoro
    elements.startTimerBtn.addEventListener('click', startPomodoro);
    elements.pauseTimerBtn.addEventListener('click', pausePomodoro);
    elements.resetTimerBtn.addEventListener('click', resetPomodoro);
    
    elements.focusTimeInput.addEventListener('change', function() {
        AppState.pomodoro.focusTime = parseInt(this.value);
        if (!AppState.pomodoro.isRunning) {
            AppState.pomodoro.timeLeft = AppState.pomodoro.focusTime * 60;
            updateTimerDisplay();
        }
        saveData();
    });
    
    elements.breakTimeInput.addEventListener('change', function() {
        AppState.pomodoro.breakTime = parseInt(this.value);
        saveData();
    });
    
    elements.decreaseSessionsBtn.addEventListener('click', function() {
        if (AppState.pomodoro.totalSessions > 1) {
            AppState.pomodoro.totalSessions--;
            elements.sessionCount.textContent = AppState.pomodoro.totalSessions;
            elements.totalSessions.textContent = AppState.pomodoro.totalSessions;
            updateSessionProgress();
            saveData();
        }
    });
    
    elements.increaseSessionsBtn.addEventListener('click', function() {
        if (AppState.pomodoro.totalSessions < 10) {
            AppState.pomodoro.totalSessions++;
            elements.sessionCount.textContent = AppState.pomodoro.totalSessions;
            elements.totalSessions.textContent = AppState.pomodoro.totalSessions;
            updateSessionProgress();
            saveData();
        }
    });
}

// Таймер Pomodoro
let timerInterval = null;

function startPomodoro() {
    if (AppState.pomodoro.isRunning) return;
    
    AppState.pomodoro.isRunning = true;
    elements.startTimerBtn.disabled = true;
    elements.pauseTimerBtn.disabled = false;
    
    // Обновить иконку
    elements.startTimerBtn.innerHTML = '<i class="fas fa-play"></i>';
    
    timerInterval = setInterval(() => {
        AppState.pomodoro.timeLeft--;
        
        if (AppState.pomodoro.timeLeft <= 0) {
            clearInterval(timerInterval);
            completePomodoroSession();
            return;
        }
        
        updateTimerDisplay();
    }, 1000);
}

function pausePomodoro() {
    if (!AppState.pomodoro.isRunning) return;
    
    AppState.pomodoro.isRunning = false;
    clearInterval(timerInterval);
    elements.startTimerBtn.disabled = false;
    elements.pauseTimerBtn.disabled = true;
    
    // Обновить иконку
    elements.startTimerBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function resetPomodoro() {
    AppState.pomodoro.isRunning = false;
    AppState.pomodoro.isBreak = false;
    clearInterval(timerInterval);
    
    AppState.pomodoro.timeLeft = AppState.pomodoro.focusTime * 60;
    AppState.pomodoro.currentSession = 1;
    
    elements.startTimerBtn.disabled = false;
    elements.pauseTimerBtn.disabled = true;
    elements.startTimerBtn.innerHTML = '<i class="fas fa-play"></i>';
    elements.timerLabel.textContent = 'Фокус-сессия';
    
    updateTimerDisplay();
    updateSessionProgress();
}

function updateTimerDisplay() {
    const minutes = Math.floor(AppState.pomodoro.timeLeft / 60);
    const seconds = AppState.pomodoro.timeLeft % 60;
    elements.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function completePomodoroSession() {
    AppState.pomodoro.isRunning = false;
    
    if (AppState.pomodoro.isBreak) {
        // Закончился перерыв
        AppState.pomodoro.isBreak = false;
        AppState.pomodoro.currentSession++;
        
        if (AppState.pomodoro.currentSession > AppState.pomodoro.totalSessions) {
            // Все сессии завершены
            showNotification('🎉 Все Pomodoro сессии завершены! Время отдохнуть.');
            resetPomodoro();
            return;
        }
        
        AppState.pomodoro.timeLeft = AppState.pomodoro.focusTime * 60;
        elements.timerLabel.textContent = 'Фокус-сессия';
        showNotification('⏰ Перерыв окончен! Возвращайтесь к работе.');
    } else {
        // Закончилась фокус-сессия
        AppState.pomodoro.isBreak = true;
        AppState.pomodoro.timeLeft = AppState.pomodoro.breakTime * 60;
        elements.timerLabel.textContent = 'Перерыв';
        
        // Увеличить счетчик Pomodoro
        AppState.stats.totalPomodoros++;
        
        showNotification('✅ Фокус-сессия завершена! Время для перерыва.');
    }
    
    updateSessionProgress();
    saveData();
    
    // Автоматически запустить следующую сессию через 2 секунды
    setTimeout(() => {
        if (AppState.pomodoro.currentSession <= AppState.pomodoro.totalSessions) {
            startPomodoro();
        }
    }, 2000);
}

function updateSessionProgress() {
    const totalSessions = AppState.pomodoro.totalSessions * 2; // фокус + перерыв
    const completedSessions = (AppState.pomodoro.currentSession - 1) * 2;
    
    if (AppState.pomodoro.isBreak) {
        // В перерыве
        const progress = ((completedSessions + 1) / totalSessions) * 100;
        elements.sessionProgress.style.width = `${progress}%`;
    } else {
        // В фокусе
        const progress = (completedSessions / totalSessions) * 100;
        elements.sessionProgress.style.width = `${progress}%`;
    }
    
    elements.currentSession.textContent = AppState.pomodoro.currentSession;
}

// Инициализация графика статистики
let statsChart = null;

function initStatsChart() {
    const ctx = document.getElementById('productivity-chart').getContext('2d');
    
    // Пример данных за неделю
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const completionData = [65, 80, 45, 90, 75, 60, 85]; // Пример процентов
    
    // Рассчитать реальные данные из привычек
    updateWeeklyStats();
    
    statsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekDays,
            datasets: [{
                label: 'Выполнение (%)',
                data: completionData,
                borderColor: getComputedStyle(document.documentElement)
                    .getPropertyValue('--tg-theme-button-color').trim(),
                backgroundColor: 'rgba(80, 168, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateWeeklyStats() {
    // Расчет выполнения за неделю
    const habits = AppState.habits;
    let totalPossible = 0;
    let totalCompleted = 0;
    
    habits.forEach(habit => {
        // Здесь должна быть логика расчета выполнения за неделю
        // Для простоты считаем по последним 7 дням
        // В реальном приложении нужно хранить историю выполнения
    });
    
    const completionRate = habits.length > 0 ? 
        Math.round((totalCompleted / totalPossible) * 100) : 0;
    
    elements.weekCompletion.textContent = `${completionRate}%`;
    AppState.stats.weeklyCompletion = completionRate;
}

// Обновление общей статистики
function updateStats() {
    elements.currentStreak.textContent = AppState.stats.streak;
    elements.weekCompletion.textContent = `${AppState.stats.weeklyCompletion}%`;
}

// Модальное окно для новой привычки
function showHabitModal() {
    elements.habitModal.classList.add('active');
    elements.habitNameInput.value = '';
    elements.habitTimeInput.value = '';
    
    // Сфокусироваться на поле ввода
    setTimeout(() => {
        elements.habitNameInput.focus();
    }, 300);
}

function hideHabitModal() {
    elements.habitModal.classList.remove('active');
}

function saveNewHabit() {
    const name = elements.habitNameInput.value.trim();
    if (!name) return;
    
    const frequency = document.querySelector('input[name="frequency"]:checked').value;
    const time = elements.habitTimeInput.value;
    
    const newHabit = {
        id: Date.now(),
        name: name,
        frequency: frequency,
        time: time || null,
        createdAt: new Date().toISOString(),
        lastCompleted: null,
        completedDays: []
    };
    
    AppState.habits.push(newHabit);
    saveData();
    loadHabits();
    hideHabitModal();
    
    // Показать уведомление
    showNotification(`Привычка "${name}" добавлена!`);
}

// Уведомления
function showNotification(message) {
    // Если в Telegram, используем их метод
    if (tg.showAlert) {
        tg.showAlert(message);
    } else {
        // Фолбэк для браузера
        alert(message);
    }
}

function checkDailyReminder() {
    const now = new Date();
    const lastReminder = localStorage.getItem('last_reminder_date');
    const today = now.toDateString();
    
    if (lastReminder !== today) {
        // Показать утреннее напоминание
        if (now.getHours() >= 9 && now.getHours() < 10) {
            showNotification('🌅 Доброе утро! Не забудьте спланировать свой день в Disciplina Pro!');
            localStorage.setItem('last_reminder_date', today);
        }
    }
}

// Сохранение данных в localStorage
function saveData() {
    localStorage.setItem('disciplina_habits', JSON.stringify(AppState.habits));
    localStorage.setItem('disciplina_goals', JSON.stringify(AppState.goals));
    localStorage.setItem('disciplina_stats', JSON.stringify(AppState.stats));
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение вкладок
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Убрать active у всех вкладок
            elements.tabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            
            // Добавить active текущей вкладке
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Обновить данные при переключении
            if (tabId === 'stats') {
                updateStats();
                statsChart?.update();
            }
        });
    });
    
    // Добавление привычки
    elements.addHabitBtn.addEventListener('click', showHabitModal);
    elements.addFirstHabitBtn?.addEventListener('click', showHabitModal);
    
    // Модальное окно
    elements.closeModalBtn.addEventListener('click', hideHabitModal);
    elements.cancelHabitBtn.addEventListener('click', hideHabitModal);
    elements.saveHabitBtn.addEventListener('click', saveNewHabit);
    
    // Закрытие модального окна по клику вне его
    elements.habitModal.addEventListener('click', function(e) {
        if (e.target === this) {
            hideHabitModal();
        }
    });
    
    // Быстрые действия
    elements.quickTaskBtn.addEventListener('click', function() {
        showNotification('Функция "Быстрая задача" в разработке!');
    });
    
    elements.motivationBtn.addEventListener('click', function() {
        showRandomQuote();
        showNotification('💪 Сохраняйте мотивацию! Вы отлично справляетесь!');
    });
    
    // Обработка нажатия Enter в модальном окне
    elements.habitNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveNewHabit();
        }
    });
    
    // Инициализация темы Telegram
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('secondary_bg_color');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initApp);