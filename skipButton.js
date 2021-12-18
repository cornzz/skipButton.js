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

let initInterval = null
let autoSkip = false
let skipBtnActive = false
let clickSkipInterval = null
let hideBanners = true
let logging = true

const observer = new MutationObserver(() => check())

function log(message) {
    if (logging) {
        console.log(`# skipButton.js: ${message}`)
    }
}

function clickYtSkipBtn() {
    log('attempting to click skip...')
    const ytSkipBtns = document.getElementsByClassName('ytp-ad-skip-button')
    if (Array.from(ytSkipBtns).length === 0) {
        clearInterval(clickSkipInterval)
        clickSkipInterval = null
        removeSkipBtn()
        return
    }
    log('clicking skip button...')
    Array.from(ytSkipBtns).forEach(b => b.click())
}

function skip(videoNode) {
    log('skipping ad...')
    videoNode.currentTime = videoNode.duration
    if (!clickSkipInterval) {
        clickSkipInterval = setInterval(clickYtSkipBtn, 300)
    }
}

function removeSkipBtn() {
    Array.from(document.getElementsByClassName('customSkipBtn'))
        .forEach(btn => btn.remove())
    skipBtnActive = false
}

function isAdPlaying() {
    return document.getElementsByClassName('ytp-ad-player-overlay').length !== 0
}

function closeBanners() {
    const bannerBtns = document.getElementsByClassName('ytp-ad-overlay-close-button')
    Array.from(bannerBtns).forEach(btn => {
        log('closing banner...')
        btn.click()
    })
}

function check() {
    log('checking for ads...')
    if (!skipBtnActive && isAdPlaying() && !clickSkipInterval) {
        document.querySelectorAll('video').forEach(v => {
            if (autoSkip) {
                log('autoskipping...')
                skip(v)
            } else if (!skipBtnActive) {
                log('adding skip button...')
                const thisSkipBtn = skipBtn.cloneNode(true)
                thisSkipBtn.onclick = () => skip(v)
                const rect = v.getBoundingClientRect()
                thisSkipBtn.style.top = `${String(rect.bottom - 250)}px`
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

function init() {
    // This element contains ad videos and banners -> check for ads every time it changes
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

log('loaded skipButton.js.')
const url = window.location.toString()
if (/.*(\/|\.)youtube\..*/.test(url)) {
    log('detected youtube domain, waiting for ad container...')
    initInterval = setInterval(init, 1000)
}
browser.storage.onChanged.addListener(updateSettings);