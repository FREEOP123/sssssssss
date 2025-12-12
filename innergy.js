/* ========================================
   INNERGY - The Mindful Planner
   Digital Scrapbook Application
   ======================================== */

// ========================================
// STATE MANAGEMENT
// ========================================
const state = {
    currentPage: 'planner',
    currentDate: new Date(),
    selectedDate: null,
    selectedElement: null,
    isDragging: false,
    isResizing: false,
    isRotating: false,
    dragOffset: { x: 0, y: 0 },
    initialSize: { width: 0, height: 0 },
    initialAngle: 0,
    elementCenter: { x: 0, y: 0 },
    initialFontSize: 16 // Added for text scaling
};

// ========================================
// DOM ELEMENTS
// ========================================
const DOM = {
    bookContainer: document.getElementById('bookContainer'),
    book: document.getElementById('book'),
    bookCover: document.getElementById('bookCover'),
    appContainer: document.getElementById('appContainer'),
    closeBookBtn: document.getElementById('closeBookBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    pageTitle: document.getElementById('pageTitle'),
    quoteBox: document.getElementById('quoteBox'),

    // Calendar
    calendarMonth: document.getElementById('calendarMonth'),
    calendarDays: document.getElementById('calendarDays'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    canvasDate: document.getElementById('canvasDate'),

    // Tools
    addTextBtn: document.getElementById('addTextBtn'),
    addImageBtn: document.getElementById('addImageBtn'),
    imageInput: document.getElementById('imageInput'),
    clearCanvasBtn: document.getElementById('clearCanvasBtn'),

    // Canvases
    dailyCanvas: document.getElementById('dailyCanvas'),
    visionCanvas: document.getElementById('visionCanvas'),
    // Journal Canvases
    journalLeftCanvas: document.getElementById('journalLeftCanvas'),

    // Journal
    journalDate: document.getElementById('journalDate'),
    journalText: document.getElementById('journalText'),
    // journalHistoryBtn handled inside functions

    // Delete Zone
    deleteZone: document.getElementById('deleteZone'),
    themeBtn: document.getElementById('themeBtn'),

    // New Slider
    fontSizeSlider: document.getElementById('fontSizeSlider')
};

// ========================================
// STORAGE KEYS
// ========================================
const STORAGE_KEYS = {
    BOOK_OPENED: 'innergy_book_opened',
    QUOTE: 'innergy_quote',
    DAILY_CANVAS: 'innergy_daily_canvas_',
    VISION_CANVAS: 'innergy_vision_canvas',
    JOURNAL_CANVAS: 'innergy_journal_canvas_',
    JOURNAL_TEXT: 'innergy_journal_text_',
    SELECTED_DATE: 'innergy_selected_date',
    DAY_COLORS: 'innergy_day_colors',
    THEME: 'innergy_theme',
    FONT_SIZE: 'innergy_font_size'
};

// ========================================
// INITIALIZATION
// ========================================
function init() {
    loadSavedTheme();
    loadSavedFontSize();
    loadSavedState();
    setupEventListeners();
    renderCalendar();
    setTodayAsDefault();
}

function loadSavedFontSize() {
    const size = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    if (size) {
        // Change: Affects ONLY the quote box
        DOM.quoteBox.style.fontSize = size + 'px';
        if (DOM.fontSizeSlider) DOM.fontSizeSlider.value = size;
    }
}

function loadSavedState() {
    const savedQuote = localStorage.getItem(STORAGE_KEYS.QUOTE);
    if (savedQuote) {
        DOM.quoteBox.textContent = savedQuote;
    }

    loadCanvasElements('vision');

    DOM.journalDate.valueAsDate = new Date();
    loadJournalForDate(formatDate(new Date()));
}

function setTodayAsDefault() {
    const today = new Date();
    state.selectedDate = today;
    selectDate(today.getDate(), today.getMonth(), today.getFullYear());
}

// ========================================
// BOOK ANIMATION
// ========================================
function openBook() {
    DOM.book.classList.add('open');
    localStorage.setItem(STORAGE_KEYS.BOOK_OPENED, 'true');

    setTimeout(() => {
        DOM.bookContainer.classList.add('opened');
        DOM.appContainer.classList.remove('hidden');

        setTimeout(() => {
            DOM.appContainer.classList.add('visible');
        }, 100);
    }, 800);
}

function closeBook() {
    DOM.appContainer.classList.remove('visible');

    setTimeout(() => {
        DOM.appContainer.classList.add('hidden');
        DOM.bookContainer.classList.remove('opened');
        DOM.book.classList.remove('open');
        localStorage.setItem(STORAGE_KEYS.BOOK_OPENED, 'false');
    }, 400);
}

// ========================================
// NAVIGATION
// ========================================
function switchPage(pageName) {
    state.currentPage = pageName;

    DOM.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    DOM.pages.forEach(page => {
        page.classList.toggle('active', page.dataset.page === pageName);
    });

    const titles = {
        planner: 'Planner',
        vision: 'Vision Board',
        journal: 'Journal'
    };
    DOM.pageTitle.textContent = titles[pageName] || pageName;

    deselectElement();
}

// ========================================
// CALENDAR
// ========================================
const MONTHS_TH = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    DOM.calendarMonth.textContent = `${MONTHS_TH[month]} ${year + 543}`;
    DOM.calendarDays.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, 'other-month', month - 1, year);
        DOM.calendarDays.appendChild(dayEl);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const classes = [];
        if (isCurrentMonth && day === today.getDate()) classes.push('today');

        if (state.selectedDate &&
            state.selectedDate.getDate() === day &&
            state.selectedDate.getMonth() === month &&
            state.selectedDate.getFullYear() === year) {
            classes.push('selected');
        }

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const savedData = localStorage.getItem(STORAGE_KEYS.DAILY_CANVAS + dateKey);
        if (savedData && savedData !== '[]') {
            classes.push('has-content');
        }

        const dayEl = createDayElement(day, classes.join(' '), month, year);
        DOM.calendarDays.appendChild(dayEl);
    }

    const totalCells = DOM.calendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, 'other-month', month + 1, year);
        DOM.calendarDays.appendChild(dayEl);
    }
}

function createDayElement(day, classes, month, year) {
    const dayEl = document.createElement('div');
    dayEl.className = `calendar-day ${classes}`;
    dayEl.textContent = day;

    const dateKey = getDateKey(day, month, year);
    dayEl.dataset.dateKey = dateKey;

    const savedColors = getDayColors();
    if (savedColors[dateKey]) {
        dayEl.dataset.color = savedColors[dateKey];
    }

    dayEl.addEventListener('click', (e) => {
        if (!e.target.closest('.color-picker-popup')) {
            hideAllColorPickers();
            selectDate(day, month, year);
        }
    });

    dayEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showColorPicker(dayEl, dateKey);
    });

    return dayEl;
}

function getDateKey(day, month, year) {
    if (month < 0) { month = 11; year--; }
    else if (month > 11) { month = 0; year++; }
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDayColors() {
    const saved = localStorage.getItem(STORAGE_KEYS.DAY_COLORS);
    return saved ? JSON.parse(saved) : {};
}

function setDayColor(dateKey, color) {
    const colors = getDayColors();
    if (color) colors[dateKey] = color;
    else delete colors[dateKey];
    localStorage.setItem(STORAGE_KEYS.DAY_COLORS, JSON.stringify(colors));
}

function showColorPicker(dayEl, dateKey) {
    hideAllColorPickers();
    const popup = document.createElement('div');
    popup.className = 'color-picker-popup';

    ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'].forEach(color => {
        const option = document.createElement('div');
        option.className = 'color-option';
        option.dataset.color = color;
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            dayEl.dataset.color = color;
            setDayColor(dateKey, color);
            hideAllColorPickers();
        });
        popup.appendChild(option);
    });

    const clearOption = document.createElement('div');
    clearOption.className = 'color-option clear';
    clearOption.textContent = '✕';
    clearOption.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        dayEl.removeAttribute('data-color');
        setDayColor(dateKey, null);
        hideAllColorPickers();
    });
    popup.appendChild(clearOption);
    dayEl.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('visible'));
}

function hideAllColorPickers() {
    document.querySelectorAll('.color-picker-popup').forEach(p => p.remove());
}

function selectDate(day, month, year) {
    if (month < 0) { month = 11; year--; }
    else if (month > 11) { month = 0; year++; }

    state.selectedDate = new Date(year, month, day);
    state.currentDate = new Date(year, month, 1);
    renderCalendar();

    const dayOfWeek = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const selectedDayName = dayOfWeek[state.selectedDate.getDay()];
    DOM.canvasDate.textContent = `วัน${selectedDayName}ที่ ${day} ${MONTHS_TH[month]} ${year + 543}`;
    loadCanvasElements('daily');
}

function navigateMonth(direction) {
    state.currentDate.setMonth(state.currentDate.getMonth() + direction);
    renderCalendar();
}

// ========================================
// CANVAS HELPERS
// ========================================
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getActiveCanvas(element) {
    if (element) return element.closest('.canvas');

    switch (state.currentPage) {
        case 'planner': return DOM.dailyCanvas;
        case 'vision': return DOM.visionCanvas;
        case 'journal': return DOM.journalLeftCanvas;
        default: return null;
    }
}

function getCanvasStorageKey(canvas) {
    if (!canvas) return null;
    if (canvas === DOM.dailyCanvas) {
        if (!state.selectedDate) return null;
        return STORAGE_KEYS.DAILY_CANVAS + formatDate(state.selectedDate);
    } else if (canvas === DOM.visionCanvas) {
        return STORAGE_KEYS.VISION_CANVAS;
    } else if (canvas === DOM.journalLeftCanvas) {
        return STORAGE_KEYS.JOURNAL_CANVAS + DOM.journalDate.value;
    }
    return null;
}

// ========================================
// CREATE & MANAGE ELEMENTS
// ========================================
function createCanvasElement(type, data = {}, targetCanvas = null) {
    const canvas = targetCanvas || getActiveCanvas();

    if (!canvas) {
        console.error("No active canvas found");
        return null;
    }

    const element = document.createElement('div');
    element.className = `canvas-element ${type}-element`;
    element.id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let canvasWidth = canvas.offsetWidth || 800;
    let canvasHeight = canvas.offsetHeight || 600;

    const x = data.x !== undefined ? data.x : Math.random() * (canvasWidth - 200) + 50;
    const y = data.y !== undefined ? data.y : Math.random() * (canvasHeight - 200) + 50;

    element.style.left = `${Math.max(0, x)}px`;
    element.style.top = `${Math.max(0, y)}px`;

    const width = data.width || 200;
    element.style.width = `${width}px`;

    // Change: Don't set fixed height for text elements so they can grow
    if (type !== 'text' && data.height) {
        element.style.height = `${data.height}px`;
    }
    // Text elements: Let CSS height: auto handle it.
    // We do NOT set style.height for text here.

    const rotation = data.rotation || 0;
    element.style.transform = `rotate(${rotation}deg)`;
    element.dataset.rotation = rotation;
    element.style.zIndex = data.zIndex || getNextZIndex(canvas);
    element.style.display = 'block';

    if (type === 'image') {
        const img = document.createElement('img');
        img.src = data.content || '';
        img.draggable = false;
        element.appendChild(img);
    } else if (type === 'text') {
        const textContent = document.createElement('div');
        textContent.className = 'text-content';
        textContent.contentEditable = true;
        textContent.textContent = data.content || '';

        // Load saved font size or default
        if (data.fontSize) {
            textContent.style.fontSize = `${data.fontSize}px`;
        } else {
            textContent.style.fontSize = '16px';
        }

        textContent.addEventListener('blur', () => saveCurrentCanvas(canvas));
        textContent.addEventListener('mousedown', (e) => e.stopPropagation());
        element.appendChild(textContent);
    }

    addElementHandles(element);

    element.addEventListener('mousedown', (e) => startDrag(e, element));
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element);
    });

    canvas.appendChild(element);
    saveCurrentCanvas(canvas);

    return element;
}

function addElementHandles(element) {
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'element-handle rotate-handle';
    rotateHandle.addEventListener('mousedown', (e) => startRotate(e, element));
    element.appendChild(rotateHandle);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'element-handle resize-handle';
    resizeHandle.addEventListener('mousedown', (e) => startResize(e, element));
    element.appendChild(resizeHandle);

    const deleteHandle = document.createElement('div');
    deleteHandle.className = 'element-handle delete-handle';
    deleteHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteElement(element);
    });
    element.appendChild(deleteHandle);
}

function getNextZIndex(canvas) {
    const elements = canvas.querySelectorAll('.canvas-element');
    let maxZ = 0;
    elements.forEach(el => {
        const z = parseInt(el.style.zIndex) || 0;
        if (z > maxZ) maxZ = z;
    });
    return maxZ + 1;
}

function selectElement(element) {
    deselectElement();
    state.selectedElement = element;
    element.classList.add('selected');
}

function deselectElement() {
    if (state.selectedElement) {
        state.selectedElement.classList.remove('selected');
        state.selectedElement = null;
    }
}

function deleteElement(element) {
    element.remove();
    state.selectedElement = null;
    saveCurrentCanvas();
    checkPlaceholder(getActiveCanvas());
}

function checkPlaceholder(canvas) {
    if (!canvas) return;
    const placeholder = canvas.querySelector('.canvas-placeholder');
    const elements = canvas.querySelectorAll('.canvas-element');
    if (placeholder) {
        placeholder.style.display = elements.length === 0 ? 'flex' : 'none';
    }
}

// ========================================
// DRAG & DROP
// ========================================
function startDrag(e, element) {
    if (e.target.classList.contains('element-handle') || e.target.classList.contains('text-content')) return;
    e.preventDefault();
    state.isDragging = true;
    state.selectedElement = element;

    const rect = element.getBoundingClientRect();
    state.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    element.classList.add('dragging');
    selectElement(element);

    DOM.deleteZone.classList.remove('hidden');
    setTimeout(() => DOM.deleteZone.classList.add('visible'), 10);

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
    if (!state.isDragging || !state.selectedElement) return;
    const canvas = getActiveCanvas();
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    let x = e.clientX - canvasRect.left - state.dragOffset.x;
    let y = e.clientY - canvasRect.top - state.dragOffset.y;

    state.selectedElement.style.left = `${x}px`;
    state.selectedElement.style.top = `${y}px`;

    const deleteRect = DOM.deleteZone.getBoundingClientRect();
    const isOverDelete = e.clientX >= deleteRect.left && e.clientX <= deleteRect.right &&
        e.clientY >= deleteRect.top && e.clientY <= deleteRect.bottom;
    DOM.deleteZone.classList.toggle('hover', isOverDelete);
}

function endDrag(e) {
    if (!state.isDragging) return;
    if (state.selectedElement) {
        state.selectedElement.classList.remove('dragging');
        const deleteRect = DOM.deleteZone.getBoundingClientRect();
        if (e.clientX >= deleteRect.left && e.clientX <= deleteRect.right &&
            e.clientY >= deleteRect.top && e.clientY <= deleteRect.bottom) {
            deleteElement(state.selectedElement);
        }
    }
    state.isDragging = false;
    DOM.deleteZone.classList.remove('visible', 'hover');
    setTimeout(() => DOM.deleteZone.classList.add('hidden'), 300);
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    saveCurrentCanvas();
}

// ========================================
// RESIZE & ROTATE
// ========================================
function startResize(e, element) {
    e.preventDefault(); e.stopPropagation();
    state.isResizing = true;
    state.selectedElement = element;
    state.initialSize = { width: element.offsetWidth, height: element.offsetHeight };
    state.dragOffset = { x: e.clientX, y: e.clientY };

    // Store Initial Font Size for Text Elements
    if (element.classList.contains('text-element')) {
        const textContent = element.querySelector('.text-content');
        state.initialFontSize = parseFloat(window.getComputedStyle(textContent).fontSize) || 16;
    }

    selectElement(element);
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', endResize);
}

function onResize(e) {
    if (!state.isResizing || !state.selectedElement) return;
    const deltaX = e.clientX - state.dragOffset.x;
    const deltaY = e.clientY - state.dragOffset.y;

    // Update Width
    let newWidth = Math.max(80, state.initialSize.width + deltaX);
    state.selectedElement.style.width = `${newWidth}px`;

    const isImage = state.selectedElement.classList.contains('image-element');

    if (isImage) {
        // Keep Aspect Ratio for Images
        const aspectRatio = state.initialSize.height / state.initialSize.width;
        const newHeight = newWidth * aspectRatio;
        state.selectedElement.style.height = `${newHeight}px`;
    } else {
        // --- Text Element resizing with scaling ---

        // 1. Update Height
        let newHeight = Math.max(40, state.initialSize.height + deltaY);
        state.selectedElement.style.height = `${newHeight}px`;

        // 2. Scale Font based on height change ratio
        // We compare new height to initial height to determine growth factor
        const scaleFactor = newHeight / state.initialSize.height;
        const newFontSize = state.initialFontSize * scaleFactor;

        // 3. Apply new font size
        const textContent = state.selectedElement.querySelector('.text-content');
        if (textContent) {
            textContent.style.fontSize = `${newFontSize}px`;
        }
    }
}

function endResize() {
    state.isResizing = false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', endResize);
    saveCurrentCanvas();
}

function startRotate(e, element) {
    e.preventDefault(); e.stopPropagation();
    state.isRotating = true;
    state.selectedElement = element;
    const rect = element.getBoundingClientRect();
    state.elementCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    state.initialAngle = parseFloat(element.dataset.rotation) || 0;

    const initialMouseAngle = Math.atan2(e.clientY - state.elementCenter.y, e.clientX - state.elementCenter.x) * (180 / Math.PI);
    state.dragOffset = { angle: initialMouseAngle };
    selectElement(element);
    document.addEventListener('mousemove', onRotate);
    document.addEventListener('mouseup', endRotate);
}

function onRotate(e) {
    if (!state.isRotating || !state.selectedElement) return;
    const currentAngle = Math.atan2(e.clientY - state.elementCenter.y, e.clientX - state.elementCenter.x) * (180 / Math.PI);
    const newRotation = state.initialAngle + (currentAngle - state.dragOffset.angle);
    state.selectedElement.style.transform = `rotate(${newRotation}deg)`;
    state.selectedElement.dataset.rotation = newRotation;
}

function endRotate() {
    state.isRotating = false;
    document.removeEventListener('mousemove', onRotate);
    document.removeEventListener('mouseup', endRotate);
    saveCurrentCanvas();
}

// ========================================
// SAVE & LOAD LOGIC
// ========================================
function saveCurrentCanvas(specificCanvas = null) {
    let canvas = specificCanvas;
    if (!canvas) {
        if (state.selectedElement) canvas = state.selectedElement.closest('.canvas');
        else canvas = getActiveCanvas();
    }
    if (!canvas) return;

    const storageKey = getCanvasStorageKey(canvas);
    if (!storageKey) return;

    const elements = canvas.querySelectorAll('.canvas-element');
    const data = [];

    elements.forEach(el => {
        const elementData = {
            id: el.id,
            type: el.classList.contains('image-element') ? 'image' : 'text',
            x: parseFloat(el.style.left),
            y: parseFloat(el.style.top),
            width: el.offsetWidth,
            height: el.offsetHeight,
            rotation: parseFloat(el.dataset.rotation) || 0,
            zIndex: parseInt(el.style.zIndex) || 0
        };
        if (elementData.type === 'image') {
            const img = el.querySelector('img');
            elementData.content = img ? img.src : '';
        } else {
            const textContent = el.querySelector('.text-content');
            elementData.content = textContent ? textContent.textContent : '';
            // Save Font Size
            elementData.fontSize = parseFloat(window.getComputedStyle(textContent).fontSize);
        }
        data.push(elementData);
    });

    localStorage.setItem(storageKey, JSON.stringify(data));
    if (state.currentPage === 'planner') renderCalendar();
}

function loadCanvasElements(pageType) {
    if (pageType === 'journal') {
        loadSingleCanvas(DOM.journalLeftCanvas, STORAGE_KEYS.JOURNAL_CANVAS + DOM.journalDate.value);
        return;
    }

    let canvas, storageKey;
    switch (pageType) {
        case 'daily':
            canvas = DOM.dailyCanvas;
            if (!state.selectedDate) return;
            storageKey = STORAGE_KEYS.DAILY_CANVAS + formatDate(state.selectedDate);
            break;
        case 'vision':
            canvas = DOM.visionCanvas;
            storageKey = STORAGE_KEYS.VISION_CANVAS;
            break;
    }
    loadSingleCanvas(canvas, storageKey);
}

function loadSingleCanvas(canvas, storageKey) {
    if (!canvas || !storageKey) return;

    const elements = canvas.querySelectorAll('.canvas-element');
    elements.forEach(el => el.remove());

    const savedData = localStorage.getItem(storageKey);
    checkPlaceholder(canvas);

    if (!savedData) return;

    try {
        const data = JSON.parse(savedData);
        data.forEach(elData => {
            createCanvasElement(elData.type, elData, canvas);
        });
        checkPlaceholder(canvas);
    } catch (e) {
        console.error('Error loading canvas:', e);
    }
}

// ========================================
// JOURNAL & HISTORY
// ========================================
function formatDateThai(date) {
    const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function saveQuote() {
    localStorage.setItem(STORAGE_KEYS.QUOTE, DOM.quoteBox.textContent);
}

function saveJournalText() {
    const date = DOM.journalDate.value;
    localStorage.setItem(STORAGE_KEYS.JOURNAL_TEXT + date, DOM.journalText.innerHTML);
    renderJournalHistoryPanel();
}

function loadJournalForDate(date) {
    const savedHtml = localStorage.getItem(STORAGE_KEYS.JOURNAL_TEXT + date);
    DOM.journalText.innerHTML = savedHtml || '';
    loadCanvasElements('journal');
    renderJournalHistoryPanel();
}

function renderJournalHistoryPanel() {
    const listContainer = document.getElementById('journalHistoryList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const entries = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(STORAGE_KEYS.JOURNAL_TEXT)) {
            const dateStr = key.replace(STORAGE_KEYS.JOURNAL_TEXT, '');
            const content = localStorage.getItem(key);
            const textContent = content.replace(/<[^>]*>/g, '').trim();
            const imagesKey = STORAGE_KEYS.JOURNAL_CANVAS + dateStr;
            const imagesData = localStorage.getItem(imagesKey);
            const hasImages = imagesData && JSON.parse(imagesData).length > 0;

            if (textContent.length > 0 || hasImages) {
                entries.push({
                    date: dateStr,
                    preview: textContent.length > 0 ? textContent.substring(0, 50) : '[รูปภาพ]',
                    hasImages: hasImages
                });
            }
        }
    }

    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (entries.length === 0) {
        listContainer.innerHTML = '<div class="history-item" style="cursor: default; color: #888; background: transparent; border: none; text-align: center;">ยังไม่มีเรื่องราว</div>';
        return;
    }

    entries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-date">${formatDateThai(new Date(entry.date))}</div>
            <div class="history-preview">${entry.hasImages && entry.preview === '[รูปภาพ]' ? '🖼️ ' : ''}${entry.preview}</div>
        `;
        item.addEventListener('click', () => {
            DOM.journalDate.value = entry.date;
            loadJournalForDate(entry.date);
        });
        listContainer.appendChild(item);
    });
}

// ========================================
// IMAGE UPLOAD & PASTE
// ========================================
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        let targetCanvas = state.currentPage === 'journal' ? DOM.journalLeftCanvas : null;
        createCanvasElement('image', { content: event.target.result }, targetCanvas);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function handleJournalPaste(e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;
    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function (event) {
                let targetCanvas = DOM.journalLeftCanvas;
                createCanvasElement('image', { content: event.target.result }, targetCanvas);
            };
            reader.readAsDataURL(blob);
        }
    }
}

function clearCurrentCanvas() {
    if (state.currentPage === 'journal') {
        DOM.journalText.innerHTML = '';
        saveJournalText();
        const leftElements = DOM.journalLeftCanvas.querySelectorAll('.canvas-element');
        leftElements.forEach(el => el.remove());
        saveCurrentCanvas(DOM.journalLeftCanvas);
        renderJournalHistoryPanel();
    } else {
        const canvas = getActiveCanvas();
        if (canvas) {
            const elements = canvas.querySelectorAll('.canvas-element');
            elements.forEach(el => el.remove());
            saveCurrentCanvas(canvas);
            checkPlaceholder(canvas);
        }
    }
}

function setupFileDrop() {
    document.querySelectorAll('.canvas').forEach(canvas => {
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.style.borderColor = 'var(--color-terracotta)';
        });
        canvas.addEventListener('dragleave', (e) => {
            e.preventDefault();
            canvas.style.borderColor = '';
        });
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.style.borderColor = '';
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const rect = canvas.getBoundingClientRect();
                    createCanvasElement('image', {
                        content: event.target.result,
                        x: e.clientX - rect.left - 100,
                        y: e.clientY - rect.top - 100
                    }, canvas);
                };
                reader.readAsDataURL(files[0]);
            }
        });
    });
}

// ========================================
// THEME
// ========================================
function loadSavedTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme && savedTheme !== 'default') {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

function setTheme(theme) {
    if (theme === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    hideThemePicker();
}

function showThemePicker() {
    hideThemePicker();
    const popup = document.createElement('div');
    popup.className = 'theme-picker-popup';
    popup.innerHTML = `
        <h4>เลือกธีมสี</h4>
        <div class="theme-options">
            <div class="theme-option" data-theme="default" title="ธรรมชาติ"></div>
            <div class="theme-option" data-theme="ocean" title="มหาสมุทร"></div>
            <div class="theme-option" data-theme="forest" title="ป่าไม้"></div>
            <div class="theme-option" data-theme="sunset" title="พระอาทิตย์ตก"></div>
            <div class="theme-option" data-theme="lavender" title="ลาเวนเดอร์"></div>
            <div class="theme-option" data-theme="dark" title="โหมดมืด"></div>
        </div>
    `;
    const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'default';
    popup.querySelectorAll('.theme-option').forEach(option => {
        if (option.dataset.theme === currentTheme) option.classList.add('active');
        option.addEventListener('click', () => setTheme(option.dataset.theme));
    });
    document.querySelector('.sidebar').appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('visible'));
    setTimeout(() => document.addEventListener('click', handleThemePickerOutsideClick), 100);
}

function hideThemePicker() {
    document.querySelectorAll('.theme-picker-popup').forEach(p => p.remove());
    document.removeEventListener('click', handleThemePickerOutsideClick);
}

function handleThemePickerOutsideClick(e) {
    if (!e.target.closest('.theme-picker-popup') && !e.target.closest('.theme-btn')) {
        hideThemePicker();
    }
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    DOM.bookCover.addEventListener('click', openBook);
    DOM.closeBookBtn.addEventListener('click', closeBook);
    DOM.themeBtn.addEventListener('click', showThemePicker);

    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchPage(item.dataset.page);
            if (item.dataset.page === 'vision') loadCanvasElements('vision');
        });
    });

    DOM.prevMonth.addEventListener('click', () => navigateMonth(-1));
    DOM.nextMonth.addEventListener('click', () => navigateMonth(1));
    DOM.quoteBox.addEventListener('blur', saveQuote);

    DOM.journalDate.addEventListener('change', () => loadJournalForDate(DOM.journalDate.value));
    DOM.journalText.addEventListener('blur', saveJournalText);
    DOM.journalText.addEventListener('paste', handleJournalPaste);

    DOM.addTextBtn.addEventListener('click', () => {
        const el = createCanvasElement('text', { content: '' });
        if (el) el.querySelector('.text-content').focus();
    });

    DOM.addImageBtn.addEventListener('click', () => DOM.imageInput.click());
    DOM.imageInput.addEventListener('change', handleImageUpload);
    DOM.clearCanvasBtn.addEventListener('click', clearCurrentCanvas);

    // New Slider Event
    if (DOM.fontSizeSlider) {
        DOM.fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            // Change: Affects ONLY the quote box
            DOM.quoteBox.style.fontSize = size + 'px';
            localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.canvas-element')) deselectElement();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' && state.selectedElement) deleteElement(state.selectedElement);
        if (e.key === 'Escape') deselectElement();
    });

    setupFileDrop();
}

document.addEventListener('DOMContentLoaded', init);