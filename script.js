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
        networkStatus.textContent = isOnline ? '已连接网络' : '未连接网络';
        networkStatus.className = isOnline ? 'status-online' : 'status-offline';
    }
    
    if (appStatus) {
        appStatus.textContent = isPWA ? '已安装为应用' : '浏览器模式运行';
    }
    
    if (installBtn && isPWA) {
        installBtn.style.display = 'none';
    } else if (installBtn) {
        installBtn.style.display = 'inline-block';
    }
}

// 初始化PWA安装按钮
function initPWAInstallButton() {
    // 检测是否支持安装
    let deferredPrompt;
    const installBtn = document.getElementById('installPWA');
    
    if (!installBtn) {
        console.log('安装按钮元素不存在');
        return;
    }
    
    // 监听beforeinstallprompt事件
    window.addEventListener('beforeinstallprompt', (e) => {
        // 阻止Chrome 67及更早版本自动显示安装提示
        e.preventDefault();
        // 保存事件以便稍后触发
        deferredPrompt = e;
        // 显示安装按钮
        installBtn.style.display = 'inline-block';
    });
    
    // 点击安装按钮时触发安装
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            showStatus('安装不可用', 2000);
            return;
        }
        
        // 显示安装提示
        deferredPrompt.prompt();
        
        // 等待用户响应
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`用户 ${outcome === 'accepted' ? '接受' : '拒绝'} 了安装`);
        
        // 无论结果如何，我们只能使用deferredPrompt一次
        deferredPrompt = null;
        
        // 隐藏安装按钮
        installBtn.style.display = 'none';
    });
    
    // 检查应用是否已经安装
    window.addEventListener('appinstalled', () => {
        console.log('应用已安装');
        // 隐藏安装按钮
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    });
}

// 检查更新
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        }).catch(error => {
            console.error('检查更新失败:', error);
        });
    }
}

// 显示更新通知
function showUpdateNotification(version) {
    const updateNotification = document.createElement('div');
    updateNotification.className = 'update-notification';
    updateNotification.innerHTML = `
        <div class="update-content">
            <p>有新版本可用</p>
            <div class="update-actions">
                <button id="updateNow" class="update-button update-now">立即更新</button>
                <button id="updateLater" class="update-button update-later">稍后</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(updateNotification);
    
    // 添加显示动画
    setTimeout(() => {
        updateNotification.classList.add('show');
    }, 10);
    
    // 立即更新按钮事件
    document.getElementById('updateNow').addEventListener('click', () => {
        updateNotification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(updateNotification);
            reloadForUpdate();
        }, 300);
    });
    
    // 稍后按钮事件
    document.getElementById('updateLater').addEventListener('click', () => {
        updateNotification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(updateNotification);
        }, 300);
    });
}

// 重新加载以应用更新
function reloadForUpdate() {
    // 显示更新中提示
    const updateStatus = document.createElement('div');
    updateStatus.className = 'update-status';
    updateStatus.textContent = '正在更新...';
    document.body.appendChild(updateStatus);
    
    // 延迟重新加载，让用户有时间看到提示
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// 检测屏幕方向
function detectOrientation() {
    // 添加事件监听器来检测方向变化
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // 初始化时检测一次
    handleOrientationChange();
    
    // 定期检查，确保方向正确
    setInterval(handleOrientationChange, 1000);
    
    // 添加触摸事件监听器来检测设备方向
    window.addEventListener('touchmove', handleDeviceOrientationChange, { passive: true });
    
    // 初始设置方向类
    updateOrientationClasses();
}

// 更新方向相关的CSS类
function updateOrientationClasses() {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isPortrait) {
        document.body.classList.add('orientation-portrait');
        document.body.classList.remove('orientation-landscape');
    } else {
        document.body.classList.add('orientation-landscape');
        document.body.classList.remove('orientation-portrait');
    }
}

// 处理设备方向变化
function handleDeviceOrientationChange() {
    // 尝试锁定屏幕方向为自动
    if (screen.orientation && screen.orientation.lock) {
        // 优先尝试 'any'，如果失败则尝试具体方向
        screen.orientation.lock('any')
            .then(() => console.log('屏幕方向已锁定为自动'))
            .catch(error => {
                console.warn('无法锁定屏幕方向:', error);
                // 如果 any 失败，尝试其他可能的方向
                tryLockOrientation(['portrait', 'landscape']);
            });
    } else if (screen.lockOrientation) {
        // 旧版API
        const lockSuccess = screen.lockOrientation('default');
        if (lockSuccess) {
            console.log('使用旧版API锁定屏幕方向');
        } else {
            console.warn('旧版API锁定屏幕方向失败');
        }
    } else {
        console.log('设备不支持屏幕方向锁定');
    }
}

// 尝试锁定到多个可能的方向
function tryLockOrientation(orientations) {
    if (!screen.orientation || !screen.orientation.lock) return;
    
    orientations.forEach(orientation => {
        try {
            screen.orientation.lock(orientation)
                .then(() => {
                    console.log(`成功锁定到${orientation}方向`);
                    return true;
                })
                .catch(() => console.warn(`无法锁定到${orientation}方向`));
        } catch (e) {
            console.warn(`尝试锁定到${orientation}方向时出错:`, e);
        }
    });
}

// 处理窗口大小和方向变化
function handleOrientationChange() {
    // 更新方向相关的CSS类
    updateOrientationClasses();
    
    // 刷新布局
    refreshLayout();
    
    // 根据方向调整UI元素
    adjustUIForOrientation();
}

// 刷新布局
function refreshLayout() {
    // 重置和重新计算布局
    if (timerDisplay) {
        // 确保计时器大小正确
        timerDisplay.style.fontSize = 'calc(10vmin + 5vmax)';
    }
}

// 根据方向调整UI
function adjustUIForOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // 调整控制按钮布局
    if (controlPanel) {
        if (isPortrait) {
            controlPanel.classList.remove('horizontal-layout');
            controlPanel.classList.add('vertical-layout');
        } else {
            controlPanel.classList.remove('vertical-layout');
            controlPanel.classList.add('horizontal-layout');
        }
    }
    
    // 调整字体大小以适应屏幕
    updateFontSize();
}

// 更新字体大小
function updateFontSize() {
    if (timerDisplay) {
        const size = fontSizeSlider ? fontSizeSlider.value : 100;
        const baseSize = isPortrait() ? '5vmax' : '10vmax';
        timerDisplay.style.fontSize = `calc(${baseSize} * ${size / 100})`;
    }
}

// 检测是否为竖屏
function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

// 加载背景图片
function loadBackgroundImages() {
    // 内置背景图片列表
    backgroundImages = [
        { id: 'nature1', name: '自然风景1', url: 'images/nature1.jpg' },
        { id: 'nature2', name: '自然风景2', url: 'images/nature2.jpg' },
        { id: 'abstract1', name: '抽象艺术1', url: 'images/abstract1.jpg' },
        { id: 'abstract2', name: '抽象艺术2', url: 'images/abstract2.jpg' },
        { id: 'minimal1', name: '极简主义1', url: 'images/minimal1.jpg' },
        { id: 'minimal2', name: '极简主义2', url: 'images/minimal2.jpg' },
        { id: 'gradient1', name: '渐变背景1', url: 'images/gradient1.jpg' },
        { id: 'gradient2', name: '渐变背景2', url: 'images/gradient2.jpg' }
    ];
    
    // 更新下拉列表
    updateImageList();
}

// 更新图片选择列表
function updateImageList() {
    if (!imageSelect) return;
    
    // 清空现有选项
    imageSelect.innerHTML = '';
    
    // 添加选项
    backgroundImages.forEach((image, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = image.name;
        if (index === currentBgIndex) {
            option.selected = true;
        }
        imageSelect.appendChild(option);
    });
}

// 更新音乐选择列表
function updateMusicList() {
    if (!musicSelect) return;
    
    // 清空现有选项
    musicSelect.innerHTML = '';
    
    // 添加选项
    musicFiles.forEach((music, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = music.name;
        if (index === currentMusicIndex) {
            option.selected = true;
        }
        musicSelect.appendChild(option);
    });
}

// 预加载音频
function preloadAudio(url) {
    const audio = new Audio();
    audio.src = url;
    audio.load();
    return audio;
}

// 加载背景音乐
function loadBackgroundMusic() {
    // 背景音乐列表
    musicFiles = [
        {
            id: 'calm1',
            name: '平静钢琴曲',
            lowQuality: 'music/calm1_low.mp3',
            highQuality: 'music/calm1_high.mp3',
            fallback: 'music/calm1.mp3'
        },
        {
            id: 'meditation1',
            name: '冥想音乐',
            lowQuality: 'music/meditation1_low.mp3',
            highQuality: 'music/meditation1_high.mp3',
            fallback: 'music/meditation1.mp3'
        },
        {
            id: 'nature1',
            name: '自然雨声',
            lowQuality: 'music/nature1_low.mp3',
            highQuality: 'music/nature1_high.mp3',
            fallback: 'music/nature1.mp3'
        },
        {
            id: 'focus1',
            name: '专注学习',
            lowQuality: 'music/focus1_low.mp3',
            highQuality: 'music/focus1_high.mp3',
            fallback: 'music/focus1.mp3'
        }
    ];
    
    // 更新下拉列表
    updateMusicList();
}

// 根据网络状况自适应设置音频源
function setAudioSourceWithAdaptiveBitrate(audioElement, musicData) {
    if (!audioElement || !musicData) return;
    
    // 检测网络状况
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.saveData);
    
    // 选择适当的音频质量
    let audioUrl;
    
    if (isSlowConnection) {
        audioUrl = musicData.lowQuality || musicData.fallback || musicData.url;
    } else {
        audioUrl = musicData.highQuality || musicData.fallback || musicData.url;
    }
    
    // 设置音频源
    if (audioUrl) {
        audioElement.src = audioUrl;
        return true;
    }
    
    return false;
}

// 开始背景图片循环
function startBackgroundCycle() {
    // 如果已经有循环，则清除
    if (bgIntervalId) {
        clearInterval(bgIntervalId);
    }
    
    // 设置新的循环
    bgIntervalId = setInterval(changeBackground, bgInterval);
}

// 切换背景图片
function changeBackground() {
    // 检查是否启用了随机模式
    const useRandom = bgRandomCheckbox && bgRandomCheckbox.checked;
    
    if (useRandom) {
        // 随机选择一个不重复的背景
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * backgroundImages.length);
        } while (newIndex === currentBgIndex && backgroundImages.length > 1);
        currentBgIndex = newIndex;
    } else {
        // 顺序切换
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
    }
    
    // 应用选中的背景
    const selectedImage = backgroundImages[currentBgIndex];
    if (selectedImage && selectedImage.url) {
        applyBackgroundEffect(selectedImage.url, bgEffectSelect ? bgEffectSelect.value : 'normal');
    }
    
    // 更新下拉列表选中项
    if (imageSelect) {
        imageSelect.value = currentBgIndex;
    }
}

// 应用背景效果
function applyBackgroundEffect(imageUrl, effect) {
    if (!backgroundContainer) return;
    
    // 创建新的背景图层
    const newBg = document.createElement('div');
    newBg.className = 'background-layer';
    newBg.style.backgroundImage = `url('${imageUrl}')`;
    
    // 根据效果应用不同的滤镜
    switch (effect) {
        case 'grayscale':
            newBg.style.filter = 'grayscale(100%)';
            break;
        case 'sepia':
            newBg.style.filter = 'sepia(70%)';
            break;
        case 'blur':
            newBg.style.filter = 'blur(5px)';
            break;
        case 'brightness':
            newBg.style.filter = 'brightness(120%)';
            break;
        case 'contrast':
            newBg.style.filter = 'contrast(150%)';
            break;
        default:
            newBg.style.filter = 'none';
    }
    
    // 添加到容器
    backgroundContainer.appendChild(newBg);
    
    // 触发重排
    newBg.offsetHeight;
    
    // 添加动画类
    setTimeout(() => {
        newBg.classList.add('fade-in');
    }, 10);
    
    // 移除旧的背景图层
    const oldLayers = backgroundContainer.querySelectorAll('.background-layer:not(.fade-in)');
    oldLayers.forEach(layer => {
        layer.classList.add('fade-out');
        setTimeout(() => {
            layer.remove();
        }, 500);
    });
}

// 格式化时间
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    // 根据是否有小时决定显示格式
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}

// 更新计时器显示
function updateTimer() {
    if (!timerDisplay) return;
    
    const now = Date.now();
    elapsedTime = now - startTime;
    timerDisplay.textContent = formatTime(elapsedTime);
}

// 开始计时器
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateTimer, 10);
    
    // 更新按钮状态
    if (startPauseBtn) {
        startPauseBtn.textContent = '暂停';
        startPauseBtn.classList.add('paused');
    }
    
    // 更新状态指示器
    if (statusIndicator) {
        statusIndicator.textContent = '运行中';
        statusIndicator.className = 'status-running';
    }
}

// 暂停计时器
function pauseTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timerInterval);
    
    // 更新按钮状态
    if (startPauseBtn) {
        startPauseBtn.textContent = '开始';
        startPauseBtn.classList.remove('paused');
    }
    
    // 更新状态指示器
    if (statusIndicator) {
        statusIndicator.textContent = '已暂停';
        statusIndicator.className = 'status-paused';
    }
}

// 切换计时器状态
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

// 重置计时器
function resetTimer() {
    pauseTimer();
    
    elapsedTime = 0;
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(elapsedTime);
    }
    
    // 更新状态指示器
    if (statusIndicator) {
        statusIndicator.textContent = '已重置';
        statusIndicator.className = 'status-reset';
    }
}

// 切换控制面板显示
function toggleControlPanel() {
    if (!controlPanel) return;
    
    isControlPanelVisible = !isControlPanelVisible;
    
    if (isControlPanelVisible) {
        controlPanel.classList.add('visible');
    } else {
        controlPanel.classList.remove('visible');
    }
}

// 切换布局
function toggleLayout() {
    if (!timerDisplay || !controlPanel) return;
    
    // 检查当前是否为紧凑布局
    const isCompact = document.body.classList.contains('compact-layout');
    
    if (isCompact) {
        // 切换到标准布局
        document.body.classList.remove('compact-layout');
        timerDisplay.style.fontSize = 'calc(10vmin + 5vmax)';
        
        if (layoutBtn) {
            layoutBtn.textContent = '紧凑';
        }
    } else {
        // 切换到紧凑布局
        document.body.classList.add('compact-layout');
        timerDisplay.style.fontSize = 'calc(8vmin + 4vmax)';
        
        if (layoutBtn) {
            layoutBtn.textContent = '标准';
        }
    }
}

// 显示设置面板
function showSettings() {
    if (!settingsPanel) return;
    
    // 保存当前设置到面板
    if (bgEffectSelect) bgEffectSelect.value = bgEffectSelect.value || 'normal';
    if (bgRandomCheckbox) bgRandomCheckbox.checked = bgRandomCheckbox.checked || false;
    if (volumeSlider) {
        volumeSlider.value = musicVolume * 100;
        updateVolumeDisplay();
    }
    if (musicModeSelect) musicModeSelect.value = musicModeSelect.value || 'continuous';
    if (musicEnabledCheckbox) musicEnabledCheckbox.checked = isMusicEnabled;
    if (themeSelect) themeSelect.value = themeSelect.value || 'default';
    if (fontSizeSlider) {
        fontSizeSlider.value = fontSizeSlider.value || 100;
        updateFontSizeDisplay();
    }
    if (customIntervalInput) customIntervalInput.value = bgInterval / 1000;
    
    // 显示设置面板
    settingsPanel.classList.add('visible');
}

// 隐藏设置面板
function hideSettings() {
    if (!settingsPanel) return;
    settingsPanel.classList.remove('visible');
}

// 显示帮助面板
function showHelp() {
    if (!helpPanel) return;
    
    // 更新帮助面板中的模式信息
    const { mode, modeText, isOnline, isPWA } = detectRunningMode();
    updateHelpPanelModeInfo(mode, modeText, isOnline, isPWA);
    
    // 显示帮助面板
    helpPanel.classList.add('visible');
}

// 隐藏帮助面板
function hideHelp() {
    if (!helpPanel) return;
    helpPanel.classList.remove('visible');
}

// 显示状态消息
function showStatus(message, duration = 2000) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-message';
    statusDiv.textContent = message;
    
    document.body.appendChild(statusDiv);
    
    // 触发重排
    statusDiv.offsetHeight;
    
    // 添加显示动画
    setTimeout(() => {
        statusDiv.classList.add('show');
    }, 10);
    
    // 设置定时隐藏
    setTimeout(() => {
        statusDiv.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(statusDiv);
        }, 300);
    }, duration);
}

// 更新音量显示
function updateVolumeDisplay() {
    if (!volumeValue || !volumeSlider) return;
    volumeValue.textContent = `${volumeSlider.value}%`;
}

// 更新字体大小显示
function updateFontSizeDisplay() {
    if (!fontSizeValue || !fontSizeSlider) return;
    fontSizeValue.textContent = `${fontSizeSlider.value}%`;
}

// 设置事件监听器
function setupEventListeners() {
    // 开始/暂停按钮
    if (startPauseBtn) {
        startPauseBtn.addEventListener('click', toggleTimer);
        
        // 添加双击检测（防止误触）
        startPauseBtn.addEventListener('touchstart', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            
            if (tapLength < 300 && tapLength > 0) {
                // 双击事件，不执行操作
                e.preventDefault();
            } else {
                // 单击事件，延迟执行以检测双击
                setTimeout(() => {
                    toggleTimer();
                }, 300);
            }
            
            lastTapTime = currentTime;
        });
    }
    
    // 重置按钮
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }
    
    // 布局切换按钮
    if (layoutBtn) {
        layoutBtn.addEventListener('click', toggleLayout);
    }
    
    // 设置按钮
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettings);
    }
    
    // 关闭设置按钮
    if (closeSettings) {
        closeSettings.addEventListener('click', hideSettings);
    }
    
    // 帮助按钮
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
    
    // 关闭帮助按钮
    if (closeHelp) {
        closeHelp.addEventListener('click', hideHelp);
    }
    
    // 点击设置面板外部关闭
    if (settingsPanel) {
        settingsPanel.addEventListener('click', function(e) {
            if (e.target === settingsPanel) {
                hideSettings();
            }
        });
    }
    
    // 点击帮助面板外部关闭
    if (helpPanel) {
        helpPanel.addEventListener('click', function(e) {
            if (e.target === helpPanel) {
                hideHelp();
            }
        });
    }
    
    // 背景效果选择
    if (bgEffectSelect) {
        bgEffectSelect.addEventListener('change', function() {
            const selectedImage = backgroundImages[currentBgIndex];
            if (selectedImage && selectedImage.url) {
                applyBackgroundEffect(selectedImage.url, this.value);
            }
        });
    }
    
    // 随机背景选项
    if (bgRandomCheckbox) {
        bgRandomCheckbox.addEventListener('change', function() {
            // 重启背景循环以应用新设置
            startBackgroundCycle();
        });
    }
    
    // 音量调节
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            updateVolumeDisplay();
            musicVolume = this.value / 100;
            if (backgroundMusic) {
                backgroundMusic.volume = musicVolume;
            }
        });
    }
    
    // 音乐模式选择
    if (musicModeSelect) {
        musicModeSelect.addEventListener('change', function() {
            // 根据选择的模式设置音频循环
            if (backgroundMusic) {
                if (this.value === 'loop') {
                    backgroundMusic.loop = true;
                } else {
                    backgroundMusic.loop = false;
                    // 如果是连续播放模式，添加ended事件监听器
                    backgroundMusic.addEventListener('ended', handleMusicEnded);
                }
            }
        });
    }
    
    // 音乐开关
    if (musicEnabledCheckbox) {
        musicEnabledCheckbox.addEventListener('change', function() {
            isMusicEnabled = this.checked;
            
            if (backgroundMusic) {
                if (isMusicEnabled) {
                    backgroundMusic.play().catch(e => {
                        console.log('音乐播放被阻止，需要用户交互');
                        showStatus('点击任意位置后重试音乐播放', 3000);
                    });
                } else {
                    backgroundMusic.pause();
                }
            }
        });
    }
    
    // 主题选择
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            applyTheme(this.value);
        });
    }
    
    // 字体大小调节
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', function() {
            updateFontSizeDisplay();
            updateFontSize();
        });
    }
    
    // 背景图片选择
    if (imageSelect) {
        imageSelect.addEventListener('change', function() {
            currentBgIndex = parseInt(this.value);
            const selectedImage = backgroundImages[currentBgIndex];
            if (selectedImage && selectedImage.url) {
                applyBackgroundEffect(selectedImage.url, bgEffectSelect ? bgEffectSelect.value : 'normal');
            }
        });
    }
    
    // 背景音乐选择
    if (musicSelect) {
        musicSelect.addEventListener('change', function() {
            currentMusicIndex = parseInt(this.value);
            const selectedMusic = musicFiles[currentMusicIndex];
            
            if (selectedMusic && backgroundMusic) {
                // 使用动态码率适配设置音频源
                setAudioSourceWithAdaptiveBitrate(backgroundMusic, selectedMusic);
                backgroundMusic.volume = musicVolume;
                
                // 如果音乐已启用，则播放
                if (isMusicEnabled) {
                    backgroundMusic.play().catch(e => {
                        console.log('音频播放被阻止，需要用户交互');
                    });
                }
            }
        });
    }
    
    // 自定义背景切换间隔
    if (customIntervalInput) {
        customIntervalInput.addEventListener('change', function() {
            let newInterval = parseInt(this.value) * 1000;
            if (!isNaN(newInterval) && newInterval > 0) {
                bgInterval = newInterval;
                startBackgroundCycle(); // 重启循环以应用新间隔
            }
        });
    }
    
    // 点击文档时尝试播放音乐（解决自动播放限制）
    document.addEventListener('click', function() {
        if (isMusicEnabled && backgroundMusic && backgroundMusic.paused) {
            backgroundMusic.play().catch(e => {
                console.log('尝试播放音乐失败:', e);
            });
        }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        // 空格键控制开始/暂停
        if (e.code === 'Space') {
            e.preventDefault(); // 防止页面滚动
            toggleTimer();
        }
        
        // R键重置
        if (e.code === 'KeyR') {
            resetTimer();
        }
        
        // S键显示/隐藏设置
        if (e.code === 'KeyS') {
            if (settingsPanel && settingsPanel.classList.contains('visible')) {
                hideSettings();
            } else {
                showSettings();
            }
        }
        
        // H键显示/隐藏帮助
        if (e.code === 'KeyH') {
            if (helpPanel && helpPanel.classList.contains('visible')) {
                hideHelp();
            } else {
                showHelp();
            }
        }
        
        // ESC键关闭所有面板
        if (e.code === 'Escape') {
            hideSettings();
            hideHelp();
        }
    });
    
    // 触摸事件：双击切换控制面板
    document.addEventListener('dblclick', function() {
        toggleControlPanel();
    });
    
    // 触摸事件：双击切换控制面板（移动设备）
    let touchStartTime = 0;
    let touchEndTime = 0;
    let tapCount = 0;
    
    document.addEventListener('touchstart', function() {
        touchStartTime = new Date().getTime();
    });
    
    document.addEventListener('touchend', function() {
        touchEndTime = new Date().getTime();
        
        // 如果触摸时间很短，认为是点击
        if (touchEndTime - touchStartTime < 200) {
            tapCount++;
            
            // 检测双击
            setTimeout(() => {
                if (tapCount === 2) {
                    toggleControlPanel();
                }
                tapCount = 0;
            }, 300);
        }
    });
    
    // 调整音频播放器事件
    if (backgroundMusic) {
        backgroundMusic.addEventListener('error', function(e) {
            console.error('音频加载错误:', e);
            showStatus('音频加载失败，尝试其他音频', 3000);
            
            // 尝试下一个音频
            currentMusicIndex = (currentMusicIndex + 1) % musicFiles.length;
            const nextMusic = musicFiles[currentMusicIndex];
            
            if (nextMusic) {
                setAudioSourceWithAdaptiveBitrate(backgroundMusic, nextMusic);
                if (isMusicEnabled) {
                    backgroundMusic.play().catch(e => {
                        console.log('音频播放被阻止');
                    });
                }
            }
        });
    }
}

// 处理音乐播放结束
function handleMusicEnded() {
    if (!backgroundMusic || !isMusicEnabled) return;
    
    // 根据音乐模式选择下一步操作
    if (musicModeSelect && musicModeSelect.value === 'continuous') {
        // 连续播放模式，播放下一首
        currentMusicIndex = (currentMusicIndex + 1) % musicFiles.length;
        const nextMusic = musicFiles[currentMusicIndex];
        
        if (nextMusic) {
            setAudioSourceWithAdaptiveBitrate(backgroundMusic, nextMusic);
            backgroundMusic.play().catch(e => {
                console.log('音频播放被阻止');
            });
            
            // 更新下拉列表选中项
            if (musicSelect) {
                musicSelect.value = currentMusicIndex;
            }
        }
    } else if (musicModeSelect && musicModeSelect.value === 'single') {
        // 单曲播放模式，停止
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    // loop模式由audio元素的loop属性处理
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