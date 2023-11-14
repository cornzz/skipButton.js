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

const observer = new MutationObserver(() => check())
const dateOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3
}
const logging = false

let settings = {
    autoSkip: false,
    hideBanners: true,
    hideSponsored: true
}
let initInterval = null
let clickYTSkipInterval = null
let buttonActive = false

function log(...message) {
    if (logging) {
        const date = new Date()
        console.log(`# skipButton.js # ${date.toLocaleString('de-DE', dateOptions)}: ${message}`)
    }
}

// Clicks the skip button if additional information is displayed after the video ad
function clickYTSkip() {
    log('attempting to click yt skip button...')
    const YTSkipButtons = document.querySelectorAll('.ytp-ad-skip-button-modern')
    const isAdditionalInfo = document.querySelectorAll('.ytp-ad-action-interstitial-background')?.length
    if (YTSkipButtons.length === 0) {
        clearInterval(clickYTSkipInterval)
        clickYTSkipInterval = null
    } else if (isAdditionalInfo) {
        log('clicking yt skip button...')
        YTSkipButtons.forEach(btn => btn.click())
    }
}

// Skips an ad video
function skip(videoNode) {
    log('skipping ad...')
    if (!isNaN(videoNode.duration)) {
        videoNode.currentTime = videoNode.duration
        if (isYoutube && !clickYTSkipInterval) {
            clickYTSkipInterval = setInterval(clickYTSkip, 300)
        }
    }
}

// Removes our custom skip button
function removeButtons() {
    const buttons = document.querySelectorAll('.customSkipBtn')
    buttons.forEach(button => button.remove())
    buttonActive = false
}

// Checks if a YouTube ad is playing
function adPlaying() {
    return document.querySelectorAll('.ytp-ad-player-overlay').length !== 0
}

// Closes any open YouTube ad banners
function hideBanners() {
    const bannerBtns = document.querySelectorAll('.ytp-ad-overlay-close-button')
    bannerBtns.forEach(btn => {
        log('hiding banner...')
        btn.click()
    })
}

// Hides sponsored videos from search results / main page
function hideSponsored() {
    if (settings.hideSponsored) {
        const sponsoredVideos = Array.from(document.getElementsByTagName('ytd-ad-slot-renderer'))
        sponsoredVideos.forEach(sponsored => {
            log('hiding sponsored...')
            sponsored.remove()
        })
    }
}

// Main check function, run on DOM mutations and settings updates
function check() {
    log('checking for ads...')
    if (adPlaying()) {
        document.querySelectorAll('video').forEach(videoNode => {
            if (settings.autoSkip) {
                log('autoskipping...')
                skip(videoNode)
            } else if (!buttonActive) {
                log('adding skip button...')
                const newButton = button.cloneNode(true)
                newButton.onclick = () => skip(videoNode)
                const rect = videoNode.getBoundingClientRect()
                newButton.style.top = `${String(rect.bottom - 200)}px`
                newButton.style.left = `${String(rect.right - 100)}px`
                document.body.appendChild(newButton)
                buttonActive = true
            }
        })
    } else if (buttonActive && !adPlaying()) {
        removeButtons()
    }
    if (settings.hideBanners) {
        hideBanners()
    }
}

// Updates settings and runs check function
function updateSettings(newSettings) {
    log(`settings updated: ${JSON.stringify(newSettings)}`)
    settings = newSettings
    check()
}

// Manually skip any running video
function manualSkip() {
    log('manual skip...')
    document.querySelectorAll('video').forEach(video => skip(video))
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
const isYoutube = /.*(\/|\.)youtube\..*/.test(url)
let sponsoredInterval
if (isYoutube) {
    log('detected youtube domain, waiting for ad container...')
    init()
    initInterval = setInterval(init, 300)
    if (!sponsoredInterval) {
        sponsoredInterval = setInterval(hideSponsored, 1000)
    }
}

// Add event listeners for settings changes
browser.storage.onChanged.addListener(changes => {
    if ('skipButtonSettings' in changes) updateSettings(changes.skipButtonSettings.newValue)
})
window.addEventListener('message', message => { if (message.data === 'manualSkip') manualSkip() })
