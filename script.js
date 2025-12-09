document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация
    const CONFIG = {
        logoUrls: {
            site: 'https://author.today/favicon.ico',
            ideas: 'https://ideas.author.today/static/images/logos/smNkD4BSL0z1hQIvCkPnhCk79Pr7im7r7JigePK2VUzT2471OxjxYqnkQITbr6UX-logo-1024.png?size=100'
        },
        qrSize: 400,
        defaultUrl: 'https://author.today/u/andreipodvalny'
    };

    // Элементы DOM
    const elements = {
        urlInput: document.getElementById('url-input'),
        charCount: document.getElementById('char-count'),
        clearBtn: document.getElementById('clear-btn'),
        optionCards: document.querySelectorAll('.option-card'),
        imageUpload: document.getElementById('image-upload'),
        uploadArea: document.getElementById('upload-area'),
        fileInput: document.getElementById('file-input'),
        fileInfo: document.getElementById('file-info'),
        filePreview: document.getElementById('file-preview'),
        fileName: document.getElementById('file-name'),
        removeFile: document.getElementById('remove-file'),
        colorOptions: document.querySelectorAll('.color-option'),
        generateBtn: document.getElementById('generate-btn'),
        downloadBtn: document.getElementById('download-btn'),
        qrCode: document.getElementById('qr-code'),
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        errorMessage: document.getElementById('error-message'),
        previewUrl: document.getElementById('preview-url'),
        previewImage: document.getElementById('preview-image'),
        previewColor: document.getElementById('preview-color'),
        zoomIn: document.getElementById('zoom-in'),
        zoomOut: document.getElementById('zoom-out'),
        resetZoom: document.getElementById('reset-zoom'),
        notification: document.getElementById('notification'),
        notificationText: document.getElementById('notification-text')
    };

    // Состояние приложения
    const state = {
        selectedOption: 'logo',
        customImage: null,
        selectedColor: '#000000',
        currentQRCode: null,
        zoomLevel: 1
    };

    // Инициализация
    function init() {
        updateCharCount();
        setupEventListeners();
        generateQRCode();
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Счётчик символов
        elements.urlInput.addEventListener('input', updateCharCount);
        
        // Очистка поля
        elements.clearBtn.addEventListener('click', () => {
            elements.urlInput.value = '';
            updateCharCount();
            elements.urlInput.focus();
        });

        // Выбор опции изображения
        elements.optionCards.forEach(card => {
            card.addEventListener('click', () => {
                const option = card.dataset.option;
                selectOption(option);
            });
        });

        // Загрузка файла
        elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
        elements.uploadArea.addEventListener('dragover', handleDragOver);
        elements.uploadArea.addEventListener('drop', handleDrop);
        elements.fileInput.addEventListener('change', handleFileSelect);
        elements.removeFile.addEventListener('click', removeCustomImage);

        // Выбор цвета
        elements.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                const color = option.dataset.color;
                selectColor(color, option);
            });
        });

        // Генерация QR-кода
        elements.generateBtn.addEventListener('click', generateQRCode);
        elements.urlInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                generateQRCode();
            }
        });

        // Скачивание
        elements.downloadBtn.addEventListener('click', downloadQRCode);

        // Управление масштабом
        elements.zoomIn.addEventListener('click', () => adjustZoom(0.1));
        elements.zoomOut.addEventListener('click', () => adjustZoom(-0.1));
        elements.resetZoom.addEventListener('click', resetZoom);
    }

    // Обновление счётчика символов
    function updateCharCount() {
        const count = elements.urlInput.value.length;
        elements.charCount.textContent = count;
    }

    // Выбор опции изображения
    function selectOption(option) {
        // Обновление UI
        elements.optionCards.forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.option === option) {
                card.classList.add('selected');
            }
        });

        // Показ/скрытие загрузки файла
        if (option === 'custom') {
            elements.imageUpload.style.display = 'block';
        } else {
            elements.imageUpload.style.display = 'none';
        }

        state.selectedOption = option;
        updatePreviewInfo();
    }

    // Обработка перетаскивания файла
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        elements.uploadArea.style.borderColor = '#4361ee';
        elements.uploadArea.style.background = 'rgba(67, 97, 238, 0.05)';
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        elements.uploadArea.style.borderColor = '';
        elements.uploadArea.style.background = '';
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                handleImageFile(file);
            } else {
                showError('Пожалуйста, выберите файл изображения');
            }
        }
    }

    // Обработка выбора файла
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        } else if (file) {
            showError('Пожалуйста, выберите файл изображения');
        }
    }

    function handleImageFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            state.customImage = {
                src: e.target.result,
                name: file.name
            };
            
            // Обновление UI
            elements.filePreview.src = e.target.result;
            elements.fileName.textContent = file.name;
            elements.fileInfo.style.display = 'flex';
            elements.uploadArea.style.display = 'none';
            
            selectOption('custom');
            showNotification('Изображение успешно загружено');
        };
        
        reader.onerror = () => {
            showError('Ошибка при чтении файла');
        };
        
        reader.readAsDataURL(file);
    }

    function removeCustomImage() {
        state.customImage = null;
        elements.fileInfo.style.display = 'none';
        elements.uploadArea.style.display = 'block';
        elements.fileInput.value = '';
        selectOption('logo');
    }

    // Выбор цвета
    function selectColor(color, element) {
        // Обновление UI
        elements.colorOptions.forEach(option => {
            option.classList.remove('selected');
        });
        element.classList.add('selected');

        state.selectedColor = color;
        updatePreviewInfo();
    }

    // Получение URL изображения в зависимости от выбранной опции
    function getImageUrl() {
        switch (state.selectedOption) {
            case 'logo':
                return CONFIG.logoUrls.site;
            case 'ideas':
                return CONFIG.logoUrls.ideas;
            case 'custom':
                return state.customImage ? state.customImage.src : CONFIG.logoUrls.site;
            default:
                return CONFIG.logoUrls.site;
        }
    }

    // Обновление информации в предпросмотре
    function updatePreviewInfo() {
        // URL
        const url = elements.urlInput.value || CONFIG.defaultUrl;
        elements.previewUrl.textContent = url.length > 50 ? url.substring(0, 47) + '...' : url;

        // Изображение
        const imageNames = {
            logo: 'Логотип сайта',
            ideas: 'Идеи Author.Today',
            custom: state.customImage ? state.customImage.name : 'Своё изображение'
        };
        elements.previewImage.textContent = imageNames[state.selectedOption];

        // Цвет
        const colorNames = {
            '#000000': 'Чёрный',
            '#2196F3': 'Синий',
            '#4CAF50': 'Зелёный',
            '#FF9800': 'Оранжевый',
            '#9C27B0': 'Фиолетовый',
            '#E91E63': 'Розовый'
        };
        elements.previewColor.textContent = colorNames[state.selectedColor];
    }

    // Загрузка изображения
    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = () => resolve(img);
            img.onerror = () => {
                // Если не удалось загрузить, используем fallback
                const fallback = new Image();
                fallback.onload = () => resolve(fallback);
                fallback.onerror = reject;
                fallback.src = CONFIG.logoUrls.site;
            };
            
            img.src = url;
        });
    }

    // Генерация QR-кода
    async function generateQRCode() {
        try {
            // Показать загрузку
            showLoading();
            
            // Получить данные
            const url = elements.urlInput.value.trim() || CONFIG.defaultUrl;
            const imageUrl = getImageUrl();
            
            // Загрузить изображение
            const image = await loadImage(imageUrl);
            
            // Очистить предыдущий QR-код
            if (state.currentQRCode) {
                state.currentQRCode.clear();
                elements.qrCode.innerHTML = '';
            }
            
            // Создать новый QR-код
            state.currentQRCode = new QRCode(elements.qrCode, {
                text: url,
                width: CONFIG.qrSize,
                height: CONFIG.qrSize,
                colorDark: state.selectedColor,
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Подождать создание QR-кода
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Добавить изображение в центр
            addImageToQRCode(image);
            
            // Обновить информацию
            updatePreviewInfo();
            
            // Активировать кнопку скачивания
            elements.downloadBtn.disabled = false;
            
            // Скрыть загрузку
            hideLoading();
            
            showNotification('QR-код успешно создан');
            
        } catch (error) {
            console.error('Ошибка генерации QR-кода:', error);
            showError('Не удалось создать QR-код. Проверьте ссылку и попробуйте снова.');
        }
    }

    // Добавление изображения в центр QR-кода
    function addImageToQRCode(image) {
        const canvas = elements.qrCode.querySelector('canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const size = canvas.width * 0.2; // 20% от размера QR-кода
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        
        // Белый фон
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 5, y - 5, size + 10, size + 10);
        
        // Сохраняем состояние контекста
        ctx.save();
        
        // Круглый клип для изображения
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Рисуем изображение
        ctx.drawImage(image, x, y, size, size);
        
        // Восстанавливаем состояние
        ctx.restore();
        
        // Белая обводка
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Управление масштабом
    function adjustZoom(delta) {
        state.zoomLevel = Math.max(0.5, Math.min(3, state.zoomLevel + delta));
        updateZoom();
    }

    function resetZoom() {
        state.zoomLevel = 1;
        updateZoom();
    }

    function updateZoom() {
        const qrContainer = elements.qrCode;
        qrContainer.style.transform = `scale(${state.zoomLevel})`;
        qrContainer.style.transition = 'transform 0.3s ease';
    }

    // Скачивание QR-кода
    function downloadQRCode() {
        const canvas = elements.qrCode.querySelector('canvas');
        if (!canvas) {
            showError('Сначала создайте QR-код');
            return;
        }
        
        try {
            const link = document.createElement('a');
            const username = extractUsername(elements.urlInput.value) || 'qrcode';
            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `qr-code-${username}-${timestamp}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            showNotification('QR-код успешно скачан');
        } catch (error) {
            console.error('Ошибка скачивания:', error);
            showError('Не удалось скачать QR-код');
        }
    }

    // Извлечение имени пользователя из URL
    function extractUsername(url) {
        try {
            const match = url.match(/author\.today\/u\/([^\/?#]+)/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    }

    // Уведомления
    function showNotification(message) {
        elements.notificationText.textContent = message;
        elements.notification.style.display = 'flex';
        
        setTimeout(() => {
            elements.notification.style.display = 'none';
        }, 3000);
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.error.style.display = 'flex';
        hideLoading();
    }

    function showLoading() {
        elements.loading.style.display = 'flex';
        elements.error.style.display = 'none';
    }

    function hideLoading() {
        elements.loading.style.display = 'none';
    }

    // Запуск приложения
    init();
});
