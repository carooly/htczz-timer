# 资源优化实施方案

本文档提供了针对黄庭禅站桩计时器应用的资源优化策略，重点关注图片和音频资源的加载速度优化。

## 一、图片资源优化

### 1. 图片格式转换

**当前问题**：项目中使用了大量JPG格式的图片，未充分利用现代图片格式的优势。

**优化建议**：

- **转换为WebP格式**：WebP比JPG小约25-35%，同时保持相似的视觉质量
- **为iOS设备提供AVIF格式**：作为WebP的补充，提供更优的压缩率
- **保留JPG作为后备格式**：确保兼容性

**实施步骤**：

```bash
# 使用Squoosh CLI批量转换图片（需安装Node.js）
npm install -g @squoosh/cli

# 转换竖屏背景图片为WebP
for file in img/portrait/*.jpg; do
  squoosh-cli --webp auto --avif auto --output-dir img/portrait/optimized/ "$file"
done

# 转换横屏背景图片为WebP
for file in img/landscape/*.jpg; do
  squoosh-cli --webp auto --avif auto --output-dir img/landscape/optimized/ "$file"
done
```

### 2. 响应式图片实现

**当前问题**：所有设备使用相同分辨率的图片，浪费带宽。

**优化建议**：

- 为不同屏幕尺寸创建不同分辨率版本
- 使用`srcset`和`sizes`属性实现自动选择

**代码修改**：

修改`script.js`中的`loadBackgroundImages`函数：

```javascript
function loadBackgroundImages() {
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    if (isPortrait) {
        // 根据设备像素比和屏幕宽度选择适当分辨率的图片
        if (dpr > 1.5 && window.innerWidth > 768) {
            backgroundImages = [
                './img/portrait/optimized/portrait-bg1-2x.webp',
                './img/portrait/optimized/portrait-bg2-2x.webp',
                './img/portrait/optimized/portrait-bg3-2x.webp',
                './img/portrait/optimized/portrait-bg4-2x.webp'
            ];
        } else {
            backgroundImages = [
                './img/portrait/optimized/portrait-bg1-1x.webp',
                './img/portrait/optimized/portrait-bg2-1x.webp',
                './img/portrait/optimized/portrait-bg3-1x.webp',
                './img/portrait/optimized/portrait-bg4-1x.webp'
            ];
        }
    } else {
        // 横屏图片类似处理
        if (dpr > 1.5 && window.innerWidth > 1024) {
            backgroundImages = [
                './img/landscape/optimized/landscape-bg1-2x.webp',
                './img/landscape/optimized/landscape-bg2-2x.webp'
            ];
        } else {
            backgroundImages = [
                './img/landscape/optimized/landscape-bg1-1x.webp',
                './img/landscape/optimized/landscape-bg2-1x.webp'
            ];
        }
    }
    
    // 检查浏览器是否支持WebP，不支持则使用JPG后备
    checkWebPSupport().then(support => {
        if (!support) {
            // 替换为JPG版本
            backgroundImages = backgroundImages.map(img => img.replace('.webp', '.jpg'));
        }
        
        // 继续处理预加载等
        preloadImages();
    });
}

// 添加WebP支持检测函数
function checkWebPSupport() {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.height === 2);
        img.onerror = () => resolve(false);
        img.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
}
```

### 3. 图片懒加载实现

**当前问题**：当前代码预加载所有图片，增加初始加载时间。

**优化建议**：

- 仅预加载第一张和下一张图片
- 其他图片在需要时动态加载

**代码修改**：

```javascript
// 优化预加载函数
function preloadImages() {
    // 仅预加载当前和下一张图片
    const currentImg = new Image();
    currentImg.src = backgroundImages[currentBgIndex];
    
    // 预加载下一张图片
    const nextIndex = (currentBgIndex + 1) % backgroundImages.length;
    const nextImg = new Image();
    nextImg.src = backgroundImages[nextIndex];
    
    // 设置第一张背景
    backgroundContainer.style.backgroundImage = `url('${backgroundImages[currentBgIndex]}')`;
    
    // 更新图片列表显示
    updateImageList();
}

// 修改changeBackground函数
function changeBackground() {
    // 检查是否达到切换间隔时间
    const now = Date.now();
    if (now - lastBgChangeTime < bgInterval && !forceChange) {
        return;
    }
    
    lastBgChangeTime = now;
    forceChange = false;
    
    // 计算下一个背景索引
    if (bgRandomCheckbox.checked) {
        // 随机选择下一张图片
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * backgroundImages.length);
        } while (newIndex === currentBgIndex && backgroundImages.length > 1);
        currentBgIndex = newIndex;
    } else {
        // 顺序切换
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
    }
    
    // 获取下一个背景图片URL
    const nextBgUrl = backgroundImages[currentBgIndex];
    
    // 预加载下下张图片
    const nextNextIndex = (currentBgIndex + 1) % backgroundImages.length;
    const nextNextImg = new Image();
    nextNextImg.src = backgroundImages[nextNextIndex];
    
    // 应用背景效果
    const effect = bgEffectSelect.value;
    applyBackgroundEffect(nextBgUrl, effect);
}
```

## 二、音频资源优化

### 1. 音频格式优化

**当前问题**：项目中已有opus格式，但可进一步优化码率和文件大小。

**优化建议**：

- 使用多个码率版本适配不同网络条件
- 添加更高效的压缩选项

**工具推荐**：

使用FFmpeg进行音频优化：

```bash
# 安装FFmpeg（需要预先安装）

# 为music1创建多个码率版本
ffmpeg -i mp3/music1.mp3 -c:a libopus -b:a 64k mp3/music1-low.opus  # 低码率（64kbps）
ffmpeg -i mp3/music1.mp3 -c:a libopus -b:a 96k mp3/music1-medium.opus  # 中码率（96kbps）
ffmpeg -i mp3/music1.mp3 -c:a libopus -b:a 128k mp3/music1-high.opus  # 高码率（128kbps）

# 为music2创建多个码率版本
ffmpeg -i mp3/music2.mp3 -c:a libopus -b:a 64k mp3/music2-low.opus
ffmpeg -i mp3/music2.mp3 -c:a libopus -b:a 96k mp3/music2-medium.opus
ffmpeg -i mp3/music2.mp3 -c:a libopus -b:a 128k mp3/music2-high.opus
```

### 2. 音频自适应加载优化

**代码修改**：

```javascript
// 修改loadBackgroundMusic函数
function loadBackgroundMusic() {
    musicFiles = [
        {
            name: 'music1.opus',
            sources: [
                { url: './mp3/music1-low.opus', type: 'audio/opus', bitrate: '64k' },
                { url: './mp3/music1-medium.opus', type: 'audio/opus', bitrate: '96k' },
                { url: './mp3/music1-high.opus', type: 'audio/opus', bitrate: '128k' }
            ]
        },
        {
            name: 'music2.opus', 
            sources: [
                { url: './mp3/music2-low.opus', type: 'audio/opus', bitrate: '64k' },
                { url: './mp3/music2-medium.opus', type: 'audio/opus', bitrate: '96k' },
                { url: './mp3/music2-high.opus', type: 'audio/opus', bitrate: '128k' }
            ]
        }
    ];
    
    // 按需预加载 - 仅预加载第一个音乐的最低码率版本
    if (musicFiles.length > 0) {
        preloadAudio(musicFiles[0].sources[0].url);
    }
    
    // 设置第一首音乐（使用当前网络状况下的最佳码率）
    if (musicFiles.length > 0) {
        setAudioSourceWithAdaptiveBitrate(backgroundMusic, musicFiles[0]);
        backgroundMusic.volume = musicVolume;
        
        // 仅在用户交互后加载音频（避免浏览器自动播放限制）
        // 实际加载会在用户首次点击播放时进行
    }
    
    updateMusicList();
}

// 修改setAudioSourceWithAdaptiveBitrate函数
function setAudioSourceWithAdaptiveBitrate(audioElement, musicData) {
    // 清除之前的source元素
    while (audioElement.firstChild) {
        audioElement.removeChild(audioElement.firstChild);
    }
    
    // 根据网络状况和电池状态选择最佳码率
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const battery = navigator.battery || navigator.getBattery && navigator.getBattery();
    let selectedSource;
    
    // 默认选择中码率
    selectedSource = musicData.sources.find(s => s.bitrate === '96k') || musicData.sources[0];
    
    if (connection) {
        // 检测网络类型和有效带宽
        const effectiveType = connection.effectiveType || '4g';
        
        console.log('当前网络类型:', effectiveType);
        
        // 根据网络类型选择合适的码率
        if (effectiveType.includes('2g') || effectiveType.includes('slow-2g')) {
            // 2G网络选择最低码率
            selectedSource = musicData.sources.find(s => s.bitrate === '64k') || musicData.sources[0];
        } else if (effectiveType.includes('3g')) {
            // 3G网络选择中等码率
            selectedSource = musicData.sources.find(s => s.bitrate === '96k') || musicData.sources[0];
        } else {
            // 4G/5G/WiFi选择高质量码率
            selectedSource = musicData.sources.find(s => s.bitrate === '128k') || musicData.sources[0];
        }
        
        // 如果用户设置了节省数据
        if (connection.saveData) {
            selectedSource = musicData.sources.find(s => s.bitrate === '64k') || musicData.sources[0];
        }
    }
    
    // 添加电池状态检测（省电模式下使用更低码率）
    if (battery) {
        battery.then(batteryInfo => {
            if (batteryInfo.charging === false && batteryInfo.level < 0.2) {
                // 电池电量低于20%且未充电，使用低码率
                const lowBitrateSource = musicData.sources.find(s => s.bitrate === '64k');
                if (lowBitrateSource) {
                    // 只在音频未播放时切换码率
                    if (audioElement.paused) {
                        selectedSource = lowBitrateSource;
                        updateAudioSource(audioElement, selectedSource);
                    }
                }
            }
        });
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
}

// 辅助函数：更新音频源
function updateAudioSource(audioElement, source) {
    while (audioElement.firstChild) {
        audioElement.removeChild(audioElement.firstChild);
    }
    
    const sourceElement = document.createElement('source');
    sourceElement.src = source.url;
    sourceElement.type = source.type;
    
    audioElement.appendChild(sourceElement);
    audioElement.src = source.url;
    
    // 如果正在播放，重新加载并继续播放
    if (!audioElement.paused) {
        const currentTime = audioElement.currentTime;
        audioElement.load();
        audioElement.currentTime = currentTime;
        audioElement.play();
    }
}
```

### 3. 音频按需加载实现

**代码修改**：

```javascript
// 修改相关事件监听器，实现音频按需加载
function setupEventListeners() {
    // ... 现有代码 ...
    
    // 修改音乐启用复选框事件
    musicEnabledCheckbox.addEventListener('change', function() {
        isMusicEnabled = this.checked;
        
        if (isMusicEnabled) {
            // 用户启用音乐时才加载
            if (musicFiles.length > 0) {
                // 确保音频已加载
                if (backgroundMusic.src === '') {
                    setAudioSourceWithAdaptiveBitrate(backgroundMusic, musicFiles[currentMusicIndex]);
                    backgroundMusic.load();
                }
                
                // 尝试播放（需要用户交互触发）
                backgroundMusic.play().catch(error => {
                    console.log('自动播放失败（需要用户交互）:', error);
                    showStatus('请点击播放按钮开始音乐', 3000);
                });
            }
        } else {
            // 暂停并重置音频
            backgroundMusic.pause();
        }
        
        // 保存设置
        saveSettings();
    });
    
    // 添加用户交互时的音频加载
    document.addEventListener('click', function userInteractionHandler() {
        // 仅在首次交互时加载音频
        if (isMusicEnabled && backgroundMusic.src === '' && musicFiles.length > 0) {
            setAudioSourceWithAdaptiveBitrate(backgroundMusic, musicFiles[currentMusicIndex]);
            backgroundMusic.load();
            
            // 尝试自动播放
            backgroundMusic.play().catch(error => {
                console.log('自动播放失败:', error);
            });
        }
        
        // 移除事件监听器，避免重复加载
        document.removeEventListener('click', userInteractionHandler);
    }, { once: true });
    
    // ... 其他现有事件监听器 ...
}
```

## 三、Service Worker优化

**当前问题**：当前Service Worker缓存所有资源，增加初始加载时间和存储空间。

**优化建议**：

- 实施分层缓存策略
- 优先缓存关键资源
- 非关键资源延迟缓存

**代码修改**：

```javascript
// 修改sw.js中的缓存策略
const CACHE_NAME = 'htzz-timer-app-v1.0.0';
const API_CACHE_NAME = 'htzz-timer-api-cache';

// 核心资源 - 立即缓存
const coreResources = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './sw.js'
];

// 图标资源 - 按需缓存
const iconResources = [
    './img/icon-128.png',
    './img/icon-192.png',
    './img/icon-512.png'
];

// 背景和音频资源 - 延迟缓存
const backgroundResources = [
    './img/portrait/optimized/portrait-bg1-1x.webp',
    './img/portrait/optimized/portrait-bg2-1x.webp',
    './img/landscape/optimized/landscape-bg1-1x.webp',
    './img/landscape/optimized/landscape-bg2-1x.webp'
];

const audioResources = [
    './mp3/music1-low.opus',
    './mp3/music2-low.opus'
];

// 安装Service Worker - 只缓存核心资源
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('安装新版本缓存:', CACHE_NAME);
                // 只缓存核心资源
                return cache.addAll(coreResources);
            })
            .then(() => {
                console.log('核心资源已缓存');
                return self.skipWaiting();
            })
    );
});

// 激活Service Worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // 删除所有旧版本的缓存
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('htzz-timer-app')) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // 通知所有客户端有新版本可用
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: CACHE_NAME
                    });
                });
            });
            return self.clients.claim();
        })
    );
});

// 在空闲时缓存额外资源
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'CACHE_ADDITIONAL_RESOURCES') {
        event.waitUntil(
            caches.open(CACHE_NAME).then(function(cache) {
                console.log('开始缓存额外资源');
                return Promise.all([
                    // 缓存图标资源
                    cache.addAll(iconResources).catch(err => {
                        console.warn('部分图标资源缓存失败:', err);
                    }),
                    // 缓存低分辨率背景和低码率音频
                    cache.addAll([...backgroundResources, ...audioResources]).catch(err => {
                        console.warn('部分额外资源缓存失败:', err);
                    })
                ]);
            }).then(() => {
                console.log('额外资源缓存完成');
                // 通知客户端
                event.source.postMessage({
                    type: 'ADDITIONAL_RESOURCES_CACHED'
                });
            })
        );
    }
});

// 修改fetch事件处理，使用网络优先策略获取非核心资源
self.addEventListener('fetch', function(event) {
    // 对于核心资源，使用缓存优先策略
    if (coreResources.includes(event.request.url) || 
        event.request.url.includes('manifest.json') || 
        event.request.url.includes('sw.js')) {
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    // 如果缓存中有请求的资源，则返回缓存版本
                    if (response) {
                        return response;
                    }
                    
                    // 否则从网络获取
                    return fetch(event.request).then(function(response) {
                        // 检查是否为有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // 克隆响应以进行缓存
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }).catch(function() {
                        // 网络请求失败时，尝试返回缓存的离线页面
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
                })
        );
    } else {
        // 对于非核心资源，使用网络优先策略
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    // 检查是否为有效响应
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        // 如果响应无效，尝试从缓存获取
                        return caches.match(event.request);
                    }
                    
                    // 克隆响应以进行缓存
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                })
                .catch(function() {
                    // 网络请求失败时，尝试返回缓存
                    return caches.match(event.request).then(function(response) {
                        // 如果缓存中有，返回缓存版本
                        if (response) {
                            return response;
                        }
                        
                        // 对于图片和音频，如果缓存中也没有，返回一个空响应
                        if (event.request.destination === 'image' || 
                            event.request.destination === 'audio') {
                            return new Response('', { status: 404 });
                        }
                        
                        // 对于文档请求，返回index.html
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
                })
        );
    }
});
```

在主线程代码中添加消息发送，触发额外资源缓存：

```javascript
// 在script.js的init函数末尾添加
function init() {
    // ... 现有初始化代码 ...
    
    // 页面加载完成一段时间后，请求Service Worker缓存额外资源
    setTimeout(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_ADDITIONAL_RESOURCES'
            });
        }
    }, 5000); // 5秒后缓存额外资源
    
    // 监听Service Worker消息
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'ADDITIONAL_RESOURCES_CACHED') {
                console.log('额外资源缓存完成，应用性能已优化');
            }
        });
    }
}
```

## 四、性能监控和分析

为了验证优化效果，建议添加性能监控代码：

```javascript
// 在script.js中添加性能监控函数
function initPerformanceMonitoring() {
    if ('performance' in window) {
        // 监听资源加载完成事件
        window.addEventListener('load', () => {
            setTimeout(() => {
                const resources = performance.getEntriesByType('resource');
                console.log('资源加载性能统计:');
                
                resources.forEach(resource => {
                    // 只记录图片和音频资源
                    if (resource.initiatorType === 'img' || 
                        resource.initiatorType === 'audio' ||
                        resource.name.includes('.mp3') || 
                        resource.name.includes('.opus')) {
                        console.log(`${resource.name}: ${resource.duration.toFixed(2)}ms`);
                    }
                });
                
                // 记录关键性能指标
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
                
                console.log(`页面完全加载时间: ${loadTime}ms`);
                console.log(`DOM准备完成时间: ${domReadyTime}ms`);
            }, 1000);
        });
        
        // 使用Performance Observer监控LCP等指标
        if ('PerformanceObserver' in window) {
            try {
                const po = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        console.log(`${entry.name}: ${entry.startTime.toFixed(2)}ms`);
                    });
                });
                
                po.observe({ entryTypes: ['largest-contentful-paint', 'first-input-delay'] });
            } catch (e) {
                console.error('无法初始化PerformanceObserver:', e);
            }
        }
    }
}

// 在DOMContentLoaded事件中调用
initPerformanceMonitoring();
```

## 五、实施顺序和优先级

1. **第一阶段（高优先级）**：
   - 实现基础图片格式转换（WebP）
   - 添加Netlify配置文件（已完成）
   - 优化Service Worker缓存策略

2. **第二阶段（中优先级）**：
   - 实现响应式图片加载
   - 实现音频自适应加载
   - 优化音频预加载策略

3. **第三阶段（低优先级）**：
   - 实现高级图片懒加载
   - 添加性能监控
   - 进一步优化用户体验

## 六、优化效果预期

通过实施上述优化措施，预计可以实现：

1. **初始加载时间减少**：预计减少40-60%
2. **资源加载大小减少**：预计减少30-50%
3. **页面交互延迟减少**：预计减少20-30%
4. **网络带宽使用减少**：预计减少40-60%

## 七、工具推荐

1. **图片优化工具**：
   - Squoosh (https://squoosh.app/) - 在线和CLI工具
   - ImageMagick - 命令行批处理工具
   - Sharp (Node.js库) - 可编程图片处理

2. **音频优化工具**：
   - FFmpeg - 强大的多媒体处理工具
   - Audacity - 开源音频编辑器

3. **性能分析工具**：
   - Chrome DevTools Performance面板
   - Lighthouse - 网站性能审计工具
   - WebPageTest - 多地区性能测试

4. **构建工具集成**：
   - 如果未来需要构建流程，可以考虑：
     - Webpack + 资源优化插件
     - Gulp + 图片/音频优化插件

## 八、后续维护建议

1. 定期检查并更新图片和音频资源
2. 监控用户反馈和性能指标
3. 根据访问数据调整资源优化策略
4. 随着浏览器支持变化，更新优化技术

通过实施这些优化措施，可以显著提高应用的加载速度和用户体验，特别是在网络条件有限的环境下。