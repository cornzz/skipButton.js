const skipBtn = document.createElement('div')
skipBtn.classList.add('customSkipBtn')
skipBtn.style = `
    position: absolute;
    width: 100px;
    height: 40px;
    cursor: pointer;
    border-radius: 3px;
    text-align: center;
    color: white;
    background-color: red;
    font-size: 24px;
    line-height: 40px;
    z-index: 1000;
`
skipBtn.innerText = 'Skip >'

let logging = false
let autoSkip = false
let hideBanners = true
let isYoutube = false
let initInterval = null
let clickSkipInterval = null
let skipBtnActive = false

const observer = new MutationObserver(() => check())

function log(message) {
    if (logging) {
        console.log(`# skipButton.js: ${message}`)
    }
}

function clickYtSkipBtn() {
    log('attempting to click yt skip button...')
    const ytSkipBtns = document.querySelectorAll('.ytp-ad-skip-button')
    if (ytSkipBtns.length === 0) {
        clearInterval(clickSkipInterval)
        clickSkipInterval = null
        removeSkipBtn()
        return
    }
    log('clicking yt skip button...')
    ytSkipBtns.forEach(btn => btn.click())
}

function skip(videoNode) {
    if (videoNode.duration !== NaN) {
    videoNode.currentTime = videoNode.duration
    if (isYoutube && !clickSkipInterval) {
        clickSkipInterval = setInterval(clickYtSkipBtn, 300)
        }
    }
}

function removeSkipBtn() {
    const skipBtns = document.querySelectorAll('.customSkipBtn')
    skipBtns.forEach(btn => btn.remove())
    skipBtnActive = false
}

function isAdPlaying() {
    return document.querySelectorAll('.ytp-ad-player-overlay').length !== 0
}

function closeBanners() {
    const bannerBtns = document.querySelectorAll('.ytp-ad-overlay-close-button')
    bannerBtns.forEach(btn => {
        log('closing banner...')
        btn.click()
    })
}

function check() {
    log('checking for ads...')
    if (isAdPlaying()) {
        document.querySelectorAll('video').forEach(v => {
            if (autoSkip) {
                log('autoskipping...')
                skip(v)
            } else if (!skipBtnActive) {
                log('adding skip button...')
                const thisSkipBtn = skipBtn.cloneNode(true)
                thisSkipBtn.onclick = () => skip(v)
                const rect = v.getBoundingClientRect()
                thisSkipBtn.style.top = `${String(rect.bottom - 200)}px`
                thisSkipBtn.style.left = `${String(rect.right - 100)}px`
                document.body.appendChild(thisSkipBtn)
                skipBtnActive = true
            }
        })
    } else if (skipBtnActive && !isAdPlaying()) {
        removeSkipBtn()
    }
    if (hideBanners) {
        closeBanners()
    }
}

function updateSettings(changes) {
    if (Object.keys(changes).includes('skipButtonSettings')) {
        let settings = changes.skipButtonSettings.newValue
        log(`settings updated: autoSkip=${settings.autoSkip}, hideBanners=${settings.hideBanners}`)
        autoSkip = settings.autoSkip
        hideBanners = settings.hideBanners
        check()
    }
}

function manualSkip() {
    log('manual skip...')
    document.querySelectorAll('video').forEach(v => {
        skip(v)
    })
    // Propagate to all child iframes
    document.querySelectorAll('iframe').forEach(i => {
        const iframeWindow = i.contentWindow
        if (iframeWindow) {
            iframeWindow.postMessage('manualSkip', '*')
        }
    })
}

function init() {
    // This element contains yt ad videos and banners -> check for ads every time it changes
    const adContainer = document.getElementsByClassName('video-ads')[0]
    if (adContainer) {
        log('found ad container, initialising...')
        clearInterval(initInterval)
        observer.observe(adContainer, { childList: true })
        browser.storage.sync.get('skipButtonSettings').then(obj => {
            if (Object.keys(obj).length !== 0) {
                let settings = obj.skipButtonSettings
                log(`settings loaded: autoSkip=${settings.autoSkip}, hideBanners=${settings.hideBanners}`)
                autoSkip = settings.autoSkip
                hideBanners = settings.hideBanners
            }
            check()
        })
    }
}

console.log('loaded skipButton.js.')
const url = window.location.toString()
isYoutube = /.*(\/|\.)youtube\..*/.test(url)
if (isYoutube) {
    log('detected youtube domain, waiting for ad container...')
    initInterval = setInterval(init, 1000)
}
browser.storage.onChanged.addListener(updateSettings)
window.addEventListener('message', message => { if (message.data === 'manualSkip') manualSkip() })
