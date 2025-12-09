document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const urlInput = document.getElementById('url-input');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const qrCodeContainer = document.getElementById('qr-code');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const logoPreview = document.getElementById('logo-preview');
    const exampleButtons = document.querySelectorAll('.example-btn');
    
    // Элементы для информации
    const qrUrlElement = document.getElementById('qr-url');
    const qrUsernameElement = document.getElementById('qr-username');
    const userUsernameElement = document.getElementById('user-username');
    const userProfileElement = document.getElementById('user-profile');
    const avatarSourceElement = document.getElementById('avatar-source');
    const loadingDetailsElement = document.getElementById('loading-details');
    
    // Переменные для хранения данных
    let currentQRCode = null;
    let currentAvatarUrl = '';
    
    // Функция для извлечения имени пользователя из URL
    function extractUsername(url) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(part => part);
            
            // Ищем 'u' в пути и берем следующую часть
            const uIndex = pathParts.indexOf('u');
            if (uIndex !== -1 && uIndex < pathParts.length - 1) {
                return pathParts[uIndex + 1];
            }
            
            // Альтернативный метод: берем последнюю часть пути
            return pathParts[pathParts.length - 1];
        } catch (error) {
            console.error('Ошибка при извлечении имени пользователя:', error);
            return null;
        }
    }
    
    // Функция для генерации URL аватара
    function generateAvatarUrl(username) {
        if (!username) return null;
        return `https://author.today/u/${username}#&gid=1&pid=1`;
    }
    
    // Функция для получения прямого URL изображения
    // Это симуляция - в реальности нужно парсить страницу для получения прямого URL
    async function getDirectImageUrl(avatarUrl) {
        return new Promise((resolve) => {
            // В реальном приложении здесь должен быть запрос к серверу для парсинга страницы
            // Но из-за CORS мы не можем сделать это на клиенте
            
            // Создаем имитацию получения изображения
            // Используем заглушку аватара с Gravatar на основе имени пользователя
            const username = extractUsername(avatarUrl.replace('#&gid=1&pid=1', ''));
            if (username) {
                // Создаем детерминированный хеш для Gravatar
                let hash = 0;
                for (let i = 0; i < username.length; i++) {
                    hash = username.charCodeAt(i) + ((hash << 5) - hash);
                }
                
                // Генерируем Gravatar URL
                const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=256&d=identicon&r=PG`;
                resolve(gravatarUrl);
            } else {
                // Используем заглушку по умолчанию
                resolve('https://author.today/favicon.ico');
            }
        });
    }
    
    // Функция для загрузки изображения
    function loadImage(url) {
        return new Promise((resolve, reject) => {
            loadingDetailsElement.textContent = `Загрузка аватара...`;
            
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            
            img.onload = () => {
                console.log('Изображение успешно загружено:', url);
                loadingDetailsElement.textContent = `Аватар загружен (${img.width}×${img.height})`;
                resolve(img);
            };
            
            img.onerror = (error) => {
                console.error('Ошибка загрузки изображения:', url, error);
                loadingDetailsElement.textContent = `Ошибка загрузки, использую заглушку...`;
                
                // Пробуем загрузить заглушку
                const fallbackImg = new Image();
                fallbackImg.crossOrigin = 'Anonymous';
                fallbackImg.onload = () => resolve(fallbackImg);
                fallbackImg.onerror = () => reject(new Error('Не удалось загрузить изображение'));
                
                // Используем стандартную иконку пользователя как заглушку
                fallbackImg.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="%233498db"/><path d="M128 140c-30.9 0-56 25.1-56 56h112c0-30.9-25.1-56-56-56zm0-84c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40z" fill="%23ffffff"/></svg>`;
            };
            
            img.src = url;
        });
    }
    
    // Функция для создания QR-кода с аватаром
    async function generateQRCodeWithAvatar(profileUrl, avatarUrl) {
        try {
            // Показываем загрузку
            loadingElement.style.display = 'flex';
            qrCodeContainer.style.display = 'none';
            errorElement.style.display = 'none';
            downloadBtn.disabled = true;
            
            // Очищаем предыдущий QR-код
            if (currentQRCode) {
                currentQRCode.clear();
                qrCodeContainer.innerHTML = '';
            }
            
            // Извлекаем имя пользователя
            const username = extractUsername(profileUrl);
            
            // Обновляем информацию о пользователе
            if (username) {
                userUsernameElement.textContent = username;
                userProfileElement.textContent = profileUrl;
                qrUsernameElement.textContent = username;
            }
            
            qrUrlElement.textContent = profileUrl;
            
            // Обновляем информацию об источнике аватара
            avatarSourceElement.textContent = avatarUrl;
            
            // Получаем прямой URL изображения
            loadingDetailsElement.textContent = `Получение аватара для ${username || 'пользователя'}...`;
            const directImageUrl = await getDirectImageUrl(avatarUrl);
            
            // Загружаем аватар
            const avatarImg = await loadImage(directImageUrl);
            
            // Обновляем превью аватара
            logoPreview.src = avatarImg.src;
            logoPreview.classList.add('loaded');
            currentAvatarUrl = directImageUrl;
            
            // Создаем QR-код
            currentQRCode = new QRCode(qrCodeContainer, {
                text: profileUrl,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Ждем пока QR-код сгенерируется
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Получаем canvas с QR-кодом
            const canvas = qrCodeContainer.querySelector('canvas');
            if (!canvas) {
                throw new Error('Не удалось создать QR-код');
            }
            
            const ctx = canvas.getContext('2d');
            
            // Размер аватара (25% от размера QR-кода)
            const avatarSize = canvas.width * 0.25;
            const avatarX = (canvas.width - avatarSize) / 2;
            const avatarY = (canvas.height - avatarSize) / 2;
            
            // Создаем белый фон для аватара
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(avatarX - 8, avatarY - 8, avatarSize + 16, avatarSize + 16);
            
            // Рисуем круглый аватар
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            // Рисуем аватар
            ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
            
            ctx.restore();
            
            // Добавляем белую рамку вокруг аватара
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Добавляем тонкую темную рамку для контраста
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
            ctx.stroke();
            
            // Показываем QR-код
            loadingElement.style.display = 'none';
            qrCodeContainer.style.display = 'block';
            
            // Активируем кнопку скачивания
            downloadBtn.disabled = false;
            
        } catch (error) {
            console.error('Ошибка генерации QR-кода:', error);
            loadingElement.style.display = 'none';
            errorElement.textContent = `Ошибка: ${error.message}. Проверьте ссылку и попробуйте снова.`;
            errorElement.style.display = 'block';
            downloadBtn.disabled = true;
        }
    }
    
    // Функция для скачивания QR-кода
    function downloadQRCode() {
        const canvas = qrCodeContainer.querySelector('canvas');
        if (!canvas) {
            alert('Сначала создайте QR-код');
            return;
        }
        
        try {
            // Создаем временную ссылку для скачивания
            const username = extractUsername(urlInput.value) || 'author-today';
            const link = document.createElement('a');
            link.download = `qr-code-${username}-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Анимация успешного скачивания
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Скачано!';
            downloadBtn.style.background = '#27ae60';
            
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('Ошибка при скачивании:', error);
            alert('Не удалось скачать QR-код');
        }
    }
    
    // Функция для валидации и обработки URL
    function processProfileUrl(url) {
        let processedUrl = url.trim();
        
        // Если поле пустое, используем ссылку по умолчанию
        if (!processedUrl) {
            processedUrl = 'https://author.today/u/andreipodvalny';
            urlInput.value = processedUrl;
        }
        
        // Убеждаемся, что это ссылка на Author.Today
        if (!processedUrl.includes('author.today/u/')) {
            if (processedUrl.includes('author.today')) {
                // Пытаемся исправить формат
                if (!processedUrl.includes('/u/')) {
                    processedUrl = processedUrl.replace('author.today', 'author.today/u');
                }
            } else {
                // Добавляем базовый путь
                if (processedUrl.startsWith('http')) {
                    // Это другой сайт, не можем обработать
                    alert('Пожалуйста, введите ссылку на профиль Author.Today в формате: https://author.today/u/username');
                    return null;
                } else {
                    // Предполагаем, что это имя пользователя
                    processedUrl = `https://author.today/u/${processedUrl}`;
                }
            }
        }
        
        // Добавляем https:// если нет протокола
        if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
            processedUrl = 'https://' + processedUrl;
        }
        
        // Убираем возможные параметры после ссылки
        processedUrl = processedUrl.split('#')[0];
        
        urlInput.value = processedUrl;
        return processedUrl;
    }
    
    // Обработчик клика по кнопке генерации
    generateBtn.addEventListener('click', async () => {
        const profileUrl = processProfileUrl(urlInput.value);
        if (!profileUrl) return;
        
        const username = extractUsername(profileUrl);
        if (!username) {
            alert('Не удалось определить имя пользователя. Проверьте формат ссылки.');
            return;
        }
        
        // Генерируем URL для аватара
        const avatarUrl = generateAvatarUrl(username);
        
        // Генерируем QR-код
        await generateQRCodeWithAvatar(profileUrl, avatarUrl);
    });
    
    // Обработчик клика по кнопке скачивания
    downloadBtn.addEventListener('click', downloadQRCode);
    
    // Обработчик примеров ссылок
    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const exampleUrl = button.getAttribute('data-url');
            urlInput.value = exampleUrl;
            generateBtn.click();
        });
    });
    
    // Обработчик клавиши Enter в поле ввода
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });
    
    // Автоматическая генерация при загрузке страницы
    generateBtn.click();
});
