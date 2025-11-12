// 全局变量
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let isControlPanelVisible = false;
let lastTapTime = 0;

// 背景图片相关
let backgroundImages = [];
let currentBgIndex = 0;
let bgInterval = 60000; // 默认60秒
let bgIntervalId = null;

// 背景音乐相关
let musicFiles = [];
let currentMusicIndex = 0;
let isMusicEnabled = true;
let musicVolume = 1;

// DOM元素
const timerDisplay = document.getElementById('timerDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');
const layoutBtn = document.getElementById('layoutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');
const controlPanel = document.getElementById('controlPanel');
const statusIndicator = document.getElementById('statusIndicator');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const helpPanel = document.getElementById('helpPanel');
const closeHelp = document.getElementById('closeHelp');
console.log('closeHelp element after DOM load:', closeHelp);
const backgroundContainer = document.getElementById('backgroundContainer');
const backgroundOverlay = document.getElementById('backgroundOverlay');
const backgroundMusic = document.getElementById('backgroundMusic');
const bgEffectSelect = document.getElementById('bgEffectSelect');
const bgRandomCheckbox = document.getElementById('bgRandomCheckbox');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const musicModeSelect = document.getElementById('musicModeSelect');
const musicEnabledCheckbox = document.getElementById('musicEnabledCheckbox');
const themeSelect = document.getElementById('themeSelect');
const fontSizeSlider = document.getElementById('fontSizeSlider');
const fontSizeValue = document.getElementById('fontSizeValue');
const musicSelect = document.getElementById('musicSelect'); // 新增音频选择元素
const imageSelect = document.getElementById('imageSelect');
const customIntervalInput = document.getElementById('customIntervalInput');

// 设置面板元素
// 注意：所有DOM元素已在前面定义完成

// 检查所有必需的DOM元素是否存在
function checkRequiredElements() {
    console.log('Checking required elements...');
    console.log('closeHelp element in checkRequiredElements:', closeHelp);
    
    const requiredElements = [
        { element: timerDisplay, name: 'timerDisplay' },
        { element: startPauseBtn, name: 'startPauseBtn' },
        { element: resetBtn, name: 'resetBtn' },
        { element: layoutBtn, name: 'layoutBtn' },
        { element: settingsBtn, name: 'settingsBtn' },
        { element: helpBtn, name: 'helpBtn' },
        { element: controlPanel, name: 'controlPanel' },
        { element: settingsPanel, name: 'settingsPanel' },
        { element: closeSettings, name: 'closeSettings' },
        { element: helpPanel, name: 'helpPanel' },
        { element: closeHelp, name: 'closeHelp' },
        { element: backgroundContainer, name: 'backgroundContainer' },
        { element: backgroundOverlay, name: 'backgroundOverlay' },
        { element: backgroundMusic, name: 'backgroundMusic' },
        { element: volumeSlider, name: 'volumeSlider' },
        { element: volumeValue, name: 'volumeValue' },
        { element: musicEnabledCheckbox, name: 'musicEnabledCheckbox' },
        { element: themeSelect, name: 'themeSelect' },
        { element: fontSizeSlider, name: 'fontSizeSlider' },
        { element: fontSizeValue, name: 'fontSizeValue' },
        { element: imageSelect, name: 'imageSelect' },
        { element: musicSelect, name: 'musicSelect' } // 新增音频选择元素
    ];
    
    const missingElements = requiredElements.filter(item => !item.element);
    
    if (missingElements.length > 0) {
        console.warn('以下必需的DOM元素未找到:', missingElements.map(item => item.name).join(', '));
        return false;
    }
    
    console.log('All required elements found');
    return true;
}


// 初始化函数
function init() {
    console.log('Initializing app...');
    // 检查必需的DOM元素是否存在
    if (!checkRequiredElements()) {
        console.error('初始化失败：缺少必需的DOM元素');
        return;
    }
    console.log('Initialization successful, setting up event listeners...');
    
	// 检测离线状态
    checkOnlineStatus();
    
    // 监听网络状态变化
    window.addEventListener('online', () => {
        const mode = checkOnlineStatus();
        showStatus('网络已连接', 2000);
        
        // 检查是否有更新
        if (mode === 'online') {
            checkForUpdates();
        }
    });
    
    window.addEventListener('offline', () => {
        checkOnlineStatus();
        showStatus('离线模式', 3000);
    });
    
    // 监听Service Worker消息
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                showUpdateNotification(event.data.version);
            }
        });
    }

    // 检测屏幕方向
    detectOrientation();
    
    // 加载背景图片和音乐
    loadBackgroundImages();
    loadBackgroundMusic();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 开始背景图片循环
    startBackgroundCycle();
    
    // 显示状态提示
    showStatus('准备开始', 2000);
}

// 检测当前运行模式
function detectRunningMode() {
    const isOnline = navigator.onLine;
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.matchMedia('(display-mode: fullscreen)').matches ||
                  window.matchMedia('(display-mode: minimal-ui)').matches;
    
    let mode = 'online';
    let modeText = '在线模式';
    
    if (!isOnline) {
        mode = 'offline';
        modeText = '离线模式';
    } else if (isPWA) {
        mode = 'pwa';
        modeText = 'PWA应用模式';
    }
    
    return { mode, modeText, isOnline, isPWA };
}

// 添加网络状态检测函数
function checkOnlineStatus() {
    const { mode, modeText, isOnline, isPWA } = detectRunningMode();
    
    if (mode === 'offline') {
        showStatus('离线模式 - 计时器可正常使用', 3000);
    } else if (mode === 'pwa') {
        showStatus('PWA应用模式 - 独立运行', 2000);
    }
    
    // 更新帮助面板中的模式信息
    updateHelpPanelModeInfo(mode, modeText, isOnline, isPWA);
    
    return mode;
}

// 更新帮助面板中的模式信息
function updateHelpPanelModeInfo(mode, modeText, isOnline, isPWA) {
    const currentMode = document.getElementById('currentMode');
    const networkStatus = document.getElementById('networkStatus');
    const appStatus = document.getElementById('appStatus');
    const installBtn = document.getElementById('installPWA');
    
    if (currentMode) {
        currentMode.textContent = modeText;
        currentMode.className = `mode-${mode}`;
    }
    
    if (networkStatus) {
        networkStatus.textContent = isOnline ? '已连接' : '已断开';
        networkStatus.className = isOnline ? 'status-online' : 'status-offline';
    }
    
    if (appStatus) {
        appStatus.textContent = isPWA ? 'PWA应用' : '浏览器';
        appStatus.className = isPWA ? 'app-pwa' : 'app-browser';
    }
    
    // 更新安装按钮状态
    if (installBtn) {
        if (isPWA) {
            installBtn.disabled = true;
            installBtn.textContent = '✅ 已安装';
            installBtn.style.background = '#9e9e9e';
        } else {
            installBtn.disabled = false;
            installBtn.textContent = '📱 添加到桌面';
            installBtn.style.background = '#4fc3f7';
        }
    }
}

// 初始化安装按钮事件监听器
function initPWAInstallButton() {
    const installBtn = document.getElementById('installPWA');
    if (installBtn) {
        installBtn.addEventListener('click', function() {
            if (window.showPWAInstall) {
                window.showPWAInstall();
            } else {
                alert('安装功能暂不可用，请稍后重试。');
            }
        });
    }
}

// 检查更新
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.update().then(() => {
                    console.log('Service Worker更新检查完成');
                }).catch(error => {
                    console.log('更新检查失败:', error);
                });
            }
        });
    }
}

// 显示更新通知
function showUpdateNotification(version) {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-content">
            <span>新版本已就绪！</span>
            <button onclick="reloadForUpdate()">立即更新</button>
            <button onclick="this.parentElement.parentElement.remove()">稍后</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 5秒后自动消失
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// 重新加载以应用更新
function reloadForUpdate() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.unregister().then(() => {
                    window.location.reload();
                });
            } else {
                window.location.reload();
            }
        });
    } else {
        window.location.reload();
    }
}


// 检测屏幕方向
function detectOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    document.body.className = isPortrait ? 'portrait' : 'landscape';
    
    // 监听屏幕方向变化
    window.addEventListener('resize', () => {
        const isPortrait = window.innerHeight > window.innerWidth;
        document.body.className = isPortrait ? 'portrait' : 'landscape';
        
        // 重新加载背景图片
        loadBackgroundImages();
        // 应用当前背景图片
        if (backgroundImages.length > 0) {
            backgroundContainer.style.backgroundImage = `url('${backgroundImages[currentBgIndex % backgroundImages.length]}')`;
        }
    });
}

// 加载背景图片
function loadBackgroundImages() {
    // 根据屏幕方向加载不同的背景图片
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isPortrait) {
        // 竖屏设备使用竖屏背景图片
        backgroundImages = [
            './img/portrait/portrait-bg1.jpg',
            './img/portrait/portrait-bg2.jpg',
            './img/portrait/portrait-bg3.jpg',
            './img/portrait/portrait-bg4.jpg'
        ];
    } else {
        // 横屏设备使用横屏背景图片
        backgroundImages = [
            './img/landscape/landscape-bg1.jpg',
            './img/landscape/landscape-bg2.jpg'
        ];
    }

	// 预加载图片
    backgroundImages.forEach(imgUrl => {
        const img = new Image();
        img.src = imgUrl;
    });
    
    // 设置第一张背景
    if (backgroundImages.length > 0) {
        backgroundContainer.style.backgroundImage = `url('${backgroundImages[0]}')`;
    }
    
    // 更新图片列表显示
    updateImageList();
}

// 更新图片列表显示
function updateImageList() {
    if (backgroundImages.length === 0) {
        imageSelect.innerHTML = '<option value="">没有找到图片</option>';
        return;
    }
    
    let html = '';
    backgroundImages.forEach((imgUrl, index) => {
        const isSelected = index === currentBgIndex ? 'selected' : '';
        html += `<option value="${index}" ${isSelected}>${imgUrl}</option>`;
    });
    
    imageSelect.innerHTML = html;
}

// 更新音频列表显示
function updateMusicList() {
    if (!musicSelect) return;
    
    if (musicFiles.length === 0) {
        musicSelect.innerHTML = '<option value="">没有找到音频文件</option>';
        return;
    }
    
    // 添加空白选项作为第一项
    let html = '<option value="">选择音频文件...</option>';
    musicFiles.forEach((music, index) => {
        html += `<option value="${index}">${music.name}</option>`;
    });
    
    musicSelect.innerHTML = html;
}

// 预加载音频文件
function preloadAudio(url) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    return audio;
}

// 加载背景音乐
function loadBackgroundMusic() {
	// 使用opus格式音频文件，并支持动态码率适配
    musicFiles = [
        {
            name: 'music1.opus',
            sources: [
                { url: './mp3/music1.opus', type: 'audio/opus', bitrate: '128k' }
                // 可以在这里添加更多不同码率的版本
            ]
        },
        {
            name: 'music2.opus', 
            sources: [
                { url: './mp3/music2.opus', type: 'audio/opus', bitrate: '128k' }
                // 可以在这里添加更多不同码率的版本
            ]
        }
    ];
    
    // 预加载所有音乐文件
    musicFiles.forEach(music => {
        // 预加载默认版本
        preloadAudio(music.sources[0].url);
    });
    
	// 设置第一首音乐
    if (musicFiles.length > 0) {
        // 使用动态码率适配加载音频
        setAudioSourceWithAdaptiveBitrate(backgroundMusic, musicFiles[0]);
        backgroundMusic.volume = musicVolume;
        
        // 预加载音乐
        backgroundMusic.load();
    }
    
    // 更新音频列表显示
    updateMusicList();
}

// 根据网络状况动态选择音频码率
function setAudioSourceWithAdaptiveBitrate(audioElement, musicData) {
    // 清除之前的source元素
    while (audioElement.firstChild) {
        audioElement.removeChild(audioElement.firstChild);
    }
    
    // 根据网络状况选择最佳码率
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    let selectedSource;
    
    if (connection) {
        // 检测网络类型和有效带宽
        const effectiveType = connection.effectiveType || '4g'; // 获取网络类型
        
        console.log('当前网络类型:', effectiveType);
        
        // 根据网络类型选择合适的码率
        if (effectiveType.includes('2g') || effectiveType.includes('slow-2g')) {
            // 2G网络选择最低码率
            selectedSource = musicData.sources[0]; // 使用默认码率
        } else if (effectiveType.includes('3g')) {
            // 3G网络选择中等码率
            selectedSource = musicData.sources.find(s => s.bitrate === '128k') || musicData.sources[0];
        } else {
            // 4G/5G/WiFi选择高质量码率
            selectedSource = musicData.sources[0]; // 使用默认码率
        }
    } else {
        // 无法检测网络状况，使用默认码率
        selectedSource = musicData.sources[0];
    }
    
    // 创建source元素
    const sourceElement = document.createElement('source');
    sourceElement.src = selectedSource.url;
    sourceElement.type = selectedSource.type;
    
    // 添加source元素到audio标签
    audioElement.appendChild(sourceElement);
    
    // 同时设置fallback src
    audioElement.src = selectedSource.url;
    
    console.log(`已选择音频: ${selectedSource.url} (${selectedSource.bitrate})`);
    
    // 监听网络变化，动态调整音频质量
    if (connection) {
        connection.addEventListener('change', () => {
            // 只在音频未播放时重新选择码率
            if (audioElement.paused) {
                console.log('网络状况变化，重新选择音频码率');
                setAudioSourceWithAdaptiveBitrate(audioElement, musicData);
            }
        });
    }
}


// 开始背景图片循环
function startBackgroundCycle() {
    if (bgIntervalId) {
        clearInterval(bgIntervalId);
    }
    
    bgIntervalId = setInterval(() => {
        changeBackground();
    }, bgInterval);
}

// 切换背景图片
function changeBackground() {
    if (backgroundImages.length === 0) return;
    
    // 计算下一张图片索引
    if (bgRandomCheckbox && bgRandomCheckbox.checked) {
        currentBgIndex = Math.floor(Math.random() * backgroundImages.length);
    } else {
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
    }
    
    // 应用切换效果
    const effect = bgEffectSelect ? bgEffectSelect.value : 'fade';
    applyBackgroundEffect(backgroundImages[currentBgIndex], effect);
    
    // 更新图片列表显示
    updateImageList();
}

// 应用背景切换效果
function applyBackgroundEffect(imageUrl, effect) {
    const newBg = document.createElement('div');
    newBg.className = 'background-container';
    newBg.style.backgroundImage = `url('${imageUrl}')`;
    newBg.style.opacity = '0';
    newBg.style.zIndex = '-3';
    
    document.body.appendChild(newBg);
    
    // 根据效果类型设置动画
    switch(effect) {
        case 'fade':
            setTimeout(() => {
                newBg.style.opacity = '1';
            }, 50);
            break;
        case 'slide':
            newBg.style.transform = 'translateX(100%)';
            setTimeout(() => {
                newBg.style.transform = 'translateX(0)';
                newBg.style.opacity = '1';
            }, 50);
            break;
        case 'zoom':
            newBg.style.transform = 'scale(1.1)';
            setTimeout(() => {
                newBg.style.transform = 'scale(1)';
                newBg.style.opacity = '1';
            }, 50);
            break;
    }
    
    // 移除旧背景
    setTimeout(() => {
        if (document.body.contains(backgroundContainer)) {
            document.body.removeChild(backgroundContainer);
        }
        
        // 更新背景容器引用
        backgroundContainer.id = '';
        newBg.id = 'backgroundContainer';
    }, 1500);
}

// 格式化时间显示（分:秒）
function formatTime(milliseconds) {
    let totalSeconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    
    // 确保两位数显示
    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');
    
    return `${minutes}:${seconds}`;
}

// 更新计时器显示
function updateTimer() {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(elapsedTime);
    }
}

// 开始计时
function startTimer() {
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateTimer, 100);
        isRunning = true;
        if (startPauseBtn) startPauseBtn.textContent = '⏸️';
        
        // 播放背景音乐
        if (isMusicEnabled && musicFiles.length > 0) {
            backgroundMusic.play().catch(e => {
                console.log('自动播放被阻止，需要用户交互');
            });
        }
        
        showStatus('计时中...', 2000);
    }
}

// 暂停计时
function pauseTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        if (startPauseBtn) startPauseBtn.textContent = '▶️';
        
        // 暂停背景音乐
        backgroundMusic.pause();
        
        showStatus('已暂停', 2000);
    }
}

// 切换开始/暂停状态
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

// 重置计时器
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    elapsedTime = 0;
    if (timerDisplay) timerDisplay.textContent = '00:00';
    if (startPauseBtn) startPauseBtn.textContent = '▶️';
    
    // 停止背景音乐
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    showStatus('已重置', 2000);
}

// 切换控制面板显示
function toggleControlPanel() {
    isControlPanelVisible = !isControlPanelVisible;
    if (controlPanel) {
        controlPanel.classList.toggle('visible', isControlPanelVisible);
    }
    
    if (isControlPanelVisible) {
        // 3秒后自动隐藏
        setTimeout(() => {
            if (isControlPanelVisible) {
                toggleControlPanel();
            }
        }, 3000);
    }
}

// 切换屏幕布局
function toggleLayout() {
    const isPortrait = document.body.classList.contains('portrait');
    document.body.className = isPortrait ? 'landscape' : 'portrait';
    if (layoutBtn) layoutBtn.textContent = isPortrait ? '↔️' : '↕️';
}

// 显示设置面板
function showSettings() {
    if (settingsPanel) {
        settingsPanel.classList.add('visible');
    }
}

// 隐藏设置面板
function hideSettings() {
    if (settingsPanel) {
        settingsPanel.classList.remove('visible');
    }
}

// 显示帮助面板
function showHelp() {
    if (helpPanel) {
        helpPanel.classList.add('visible');
    }
}

// 隐藏帮助面板
function hideHelp() {
    if (helpPanel) {
        helpPanel.classList.remove('visible');
    }
}

// 显示状态提示
function showStatus(message, duration = 2000) {
    if (statusIndicator) {
        statusIndicator.textContent = message;
        statusIndicator.classList.add('visible');
        
        setTimeout(() => {
            statusIndicator.classList.remove('visible');
        }, duration);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 调试信息
    console.log('Setting up event listeners...');
    console.log('closeHelp element:', closeHelp);
    
    // 按钮事件
    if (startPauseBtn) startPauseBtn.addEventListener('click', toggleTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);
    if (layoutBtn) layoutBtn.addEventListener('click', toggleLayout);
    if (settingsBtn) settingsBtn.addEventListener('click', showSettings);
    if (helpBtn) helpBtn.addEventListener('click', showHelp);
    if (closeSettings) closeSettings.addEventListener('click', hideSettings);
    if (closeHelp) closeHelp.addEventListener('click', hideHelp);
    
    // 设置面板分页事件
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.settings-content');
    
    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // 移除所有活动状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // 添加活动状态到当前标签和内容
                this.classList.add('active');
                const contentElement = document.getElementById(`${tabId}-content`);
                if (contentElement) {
                    contentElement.classList.add('active');
                }
            });
        });
    }
    
    // 双击事件（开始/暂停）
    if (document) document.addEventListener('dblclick', toggleTimer);
    
    // 单击事件（显示/隐藏控制面板）
    if (document) document.addEventListener('click', (e) => {
        // 检查点击是否在控制面板或按钮上
        const isClickOnControlPanel = controlPanel && controlPanel.contains(e.target);
        const isClickOnStartPauseBtn = startPauseBtn && startPauseBtn.contains(e.target);
        const isClickOnResetBtn = resetBtn && resetBtn.contains(e.target);
        const isClickOnLayoutBtn = layoutBtn && layoutBtn.contains(e.target);
        const isClickOnSettingsBtn = settingsBtn && settingsBtn.contains(e.target);
        const isClickOnHelpBtn = helpBtn && helpBtn.contains(e.target);
        const isClickOnSettingsPanel = settingsPanel && settingsPanel.contains(e.target);
        const isClickOnHelpPanel = helpPanel && helpPanel.contains(e.target);
        
        if (!isClickOnControlPanel && 
            !isClickOnStartPauseBtn && 
            !isClickOnResetBtn && 
            !isClickOnLayoutBtn && 
            !isClickOnSettingsBtn && 
            !isClickOnHelpBtn &&
            !isClickOnSettingsPanel &&
            !isClickOnHelpPanel) {
            toggleControlPanel();
        }
    });
    
    // 键盘快捷键
    if (document) document.addEventListener('keydown', (e) => {
        // 防止重复触发
        if (e.repeat) return;
        
        switch(e.code) {
            case 'Space': // 空格键 - 开始/暂停
                e.preventDefault();
                toggleTimer();
                break;
            case 'Enter': // 回车键 - 重置
                e.preventDefault();
                resetTimer();
                break;
            case 'KeyL': // L键 - 切换布局
                e.preventDefault();
                toggleLayout();
                break;
            case 'KeyS': // S键 - 显示设置
                e.preventDefault();
                showSettings();
                break;
            case 'Escape': // ESC键 - 隐藏设置或帮助
                e.preventDefault();
                hideSettings();
                hideHelp();
                break;
            case 'KeyB': // B键 - 切换背景
                e.preventDefault();
                changeBackground();
                break;
            case 'KeyM': // M键 - 切换音乐开关
                e.preventDefault();
                if (musicEnabledCheckbox) {
                    musicEnabledCheckbox.checked = !musicEnabledCheckbox.checked;
                    isMusicEnabled = musicEnabledCheckbox.checked;
                }
                break;
            case 'KeyH': // H键 - 显示帮助
                e.preventDefault();
                showHelp();
                break;
        }
    });
    
    // 设置面板事件
    // 背景间隔按钮事件
    const intervalButtons = document.querySelectorAll('.interval-btn');
    if (intervalButtons.length > 0) {
        intervalButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // 移除所有active类
                document.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active'));
                // 添加active类到当前按钮
                this.classList.add('active');
                
                // 设置间隔时间
                const interval = parseInt(this.getAttribute('data-interval'));
                bgInterval = interval * 1000;
                startBackgroundCycle();
            });
        });
    }
    
    // 自定义间隔输入事件
    if (customIntervalInput) {
        customIntervalInput.addEventListener('input', function() {
            // 移除所有按钮的active类
            document.querySelectorAll('.interval-btn').forEach(b => b.classList.remove('active'));
            
            // 验证输入值
            let value = parseInt(this.value);
            if (isNaN(value) || value < 5) {
                value = 5;
                this.value = value;
            } else if (value > 300) {
                value = 300;
                this.value = value;
            }
            
            // 设置间隔时间
            bgInterval = value * 1000;
            startBackgroundCycle();
        });
    }
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            musicVolume = volumeSlider.value / 100;
            if (volumeValue) volumeValue.textContent = `${volumeSlider.value}%`;
            if (backgroundMusic) backgroundMusic.volume = musicVolume;
        });
    }
    
    if (musicEnabledCheckbox) {
        musicEnabledCheckbox.addEventListener('change', () => {
            isMusicEnabled = musicEnabledCheckbox.checked;
            if (!isMusicEnabled && !isRunning && backgroundMusic) {
                backgroundMusic.pause();
            }
        });
    }
    
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', () => {
            const fontSize = fontSizeSlider.value;
            if (fontSizeValue) fontSizeValue.textContent = `${fontSize}%`;
            if (timerDisplay) timerDisplay.style.fontSize = `calc(20vw * ${fontSize / 100})`;
        });
    }
    
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const theme = themeSelect.value;
            applyTheme(theme);
        });
    }
    
    // 图片选择下拉框事件
    if (imageSelect) {
        imageSelect.addEventListener('change', function() {
            const index = parseInt(this.value);
            if (!isNaN(index) && index >= 0 && index < backgroundImages.length) {
                currentBgIndex = index;
                if (backgroundContainer) backgroundContainer.style.backgroundImage = `url('${backgroundImages[index]}')`;
                updateImageList();
            }
        });
    }
    
    // 音频列表选择事件
    if (musicSelect) {
        musicSelect.addEventListener('change', function() {
            const index = parseInt(this.value);
            
            // 如果选择了空白项，停止播放
            if (isNaN(index) || index < 0 || index >= musicFiles.length) {
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
                return;
            }
            
            // 预览播放对应的音频，使用动态码率适配
            setAudioSourceWithAdaptiveBitrate(backgroundMusic, musicFiles[index]);
            backgroundMusic.volume = musicVolume;
            backgroundMusic.play().catch(e => {
                console.log('音频播放被阻止，需要用户交互');
            });
        });
    }
    
    // 当离开设置页面时停止播放
    if (closeSettings) {
        closeSettings.addEventListener('click', function() {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
            hideSettings(); // 调用隐藏设置面板函数
        });
    }
    
    // 当点击设置面板外部时停止播放
    if (settingsPanel) {
        settingsPanel.addEventListener('click', function(e) {
            // 检查点击是否在设置面板外部
            if (e.target === settingsPanel) {
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
                hideSettings(); // 调用隐藏设置面板函数
            }
        });
    }
}

// 应用主题
function applyTheme(theme) {
    // 移除现有主题类
    document.body.classList.remove('theme-default', 'theme-dark', 'theme-light', 'theme-blue', 'theme-green');
    
    // 添加新主题类
    document.body.classList.add(`theme-${theme}`);
    
    // 根据主题调整背景遮罩
    switch(theme) {
        case 'dark':
            backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            break;
        case 'light':
            backgroundOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            break;
        case 'blue':
            backgroundOverlay.style.backgroundColor = 'rgba(0, 100, 200, 0.4)';
            break;
        case 'green':
            backgroundOverlay.style.backgroundColor = 'rgba(0, 150, 0, 0.4)';
            break;
        default:
            backgroundOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    init();
    // 初始化PWA安装按钮
    initPWAInstallButton();
});