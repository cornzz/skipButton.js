const button = document.createElement('div')
button.classList.add('customSkipBtn')
button.style = `
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
button.innerText = 'Skip >'

const dateOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3
}

let logging = false
let autoSkip = false
let hideBanners = true
let isYoutube = false
let initInterval = null
let clickYTSkipInterval = null
let buttonActive = false

const observer = new MutationObserver(() => check())

function log(...message) {
    if (logging) {
        const date = new Date()
        console.log(`# skipButton.js # ${date.toLocaleString('de-DE', dateOptions)}: ${message}`)
    }
}

function clickYTSkip() {
    log('attempting to click yt skip button...')
    const YTSkipButtons = document.querySelectorAll('.ytp-ad-skip-button')
    if (YTSkipButtons.length === 0) {
        clearInterval(clickYTSkipInterval)
        clickYTSkipInterval = null
    } else {
        log('clicking yt skip button...')
        YTSkipButtons.forEach(btn => btn.click())
    }
}

function skip(videoNode) {
    log('skipping ad...')
    if (!isNaN(videoNode.duration)) {
        videoNode.currentTime = videoNode.duration
        if (isYoutube && !clickYTSkipInterval) {
            clickYTSkipInterval = setInterval(clickYTSkip, 300)
        }
    }
}

function removeButtons() {
    const buttons = document.querySelectorAll('.customSkipBtn')
    buttons.forEach(button => button.remove())
    buttonActive = false
}

function adPlaying() {
    return document.querySelectorAll('.ytp-ad-player-overlay').length !== 0
}

function closeBanners() {
    const bannerBtns = document.querySelectorAll('.ytp-ad-overlay-close-button')
    bannerBtns.forEach(btn => {
        log('hiding banner...')
        btn.click()
    })
}

function check() {
    log('checking for ads...')
    if (adPlaying()) {
        document.querySelectorAll('video').forEach(video => {
            if (autoSkip) {
                log('autoskipping...')
                skip(video)
            } else if (!buttonActive) {
                log('adding skip button...')
                const newButton = button.cloneNode(true)
                newButton.onclick = () => skip(video)
                const rect = video.getBoundingClientRect()
                console.log(rect)
                newButton.style.top = `${String(rect.bottom - 200)}px`
                newButton.style.left = `${String(rect.right - 100)}px`
                document.body.appendChild(newButton)
                buttonActive = true
            }
        })
    } else if (buttonActive && !adPlaying()) {
        removeButtons()
    }
    if (hideBanners) {
        closeBanners()
    }
}

function updateSettings(settings) {
    log(`settings updated: autoSkip=${settings.autoSkip}, hideBanners=${settings.hideBanners}`)
    autoSkip = settings.autoSkip
    hideBanners = settings.hideBanners
    check()
}

function manualSkip() {
    log('manual skip...')
    document.querySelectorAll('video').forEach(video => {
        skip(video)
    })
    // Propagate to all child iframes
    document.querySelectorAll('iframe').forEach(iframe => {
        const iframeWindow = iframe.contentWindow
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
        browser.storage.sync.get('skipButtonSettings').then(({ skipButtonSettings }) => {
            if (skipButtonSettings) updateSettings(skipButtonSettings)
        })
    }
}

console.log('loaded skipButton.js.')
const url = window.location.toString()
isYoutube = /.*(\/|\.)youtube\..*/.test(url)
if (isYoutube) {
    log('detected youtube domain, waiting for ad container...')
    init()
    initInterval = setInterval(init, 300)
}
browser.storage.onChanged.addListener(changes => {
    if ('skipButtonSettings' in changes) updateSettings(changes.skipButtonSettings.newValue)
})
window.addEventListener('message', message => { if (message.data === 'manualSkip') manualSkip() })
