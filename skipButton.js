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

const observer = new MutationObserver(check)
const dateOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3
}
const logging = true
const adPlaying = () => document.querySelector('.ytp-ad-player-overlay') !== null
const getSponsored = () => [
    ...document.getElementsByTagName('ytd-ad-slot-renderer'),
    ...document.getElementsByTagName('ytd-player-legacy-desktop-watch-ads-renderer')
]

let settings = {
    autoSkip: false,
    hideSponsored: true
}
let skipButton = null
let initialCheck = false

// Skips an ad video
function skip(videoNode) {
    console.log('skipping...', videoNode)
    if (!isNaN(videoNode.duration)) {
        videoNode.currentTime = videoNode.duration
        // if (isYoutube) {
        //     setTimeout(() => handleAd(true), 300)
        // }
    }
}

// Main check function, run on DOM mutations
function check(mutations) {
    const [addedNodes, removedNodes] =
        mutations
            .filter(mutation => mutation.type === 'childList')
            .reduce(([added, removed], mutation) => [
                [...added, ...mutation.addedNodes],
                [...removed, ...mutation.removedNodes]
            ], [[], []])
    const adStarted = addedNodes.some(node => node.classList?.contains('ytp-ad-player-overlay'))
    const adStopped = removedNodes.some(node => node.classList?.contains('ytp-ad-player-overlay'))
    const adEndScreen = addedNodes.some(node => node.id?.startsWith('ad-action-interstitial'))
    const sponsored = addedNodes.filter(node =>
        ['YTD-AD-SLOT-RENDERER', 'YTD-PLAYER-LEGACY-DESKTOP-WATCH-ADS-RENDERER'].includes(node.tagName)
    )
    const t = addedNodes.some(node => node.classList?.contains('html5-video-player'))
    if (t) console.log('####@@@@', t)
    if (adStarted) console.log('@@@ STARTED')
    if (adStopped) console.log('@@@ STOPPED')
    if (adEndScreen) console.log('@@@ ENDSCREEN')
    if (adStarted) handleAd()
    if (adStopped && skipButton) {
        skipButton.remove()
        skipButton = null
    }
    if (adEndScreen) handleAdEndScreen()
    if (sponsored.length) handleSponsored(sponsored)

    if (!initialCheck) {
        console.log('initial check...')
        // Check if ad already playing
        handleAd(true)
        initialCheck = true
    }
}

function handleAd(needToCheck) {
    console.log('handling ad...', needToCheck, adPlaying(), document.querySelectorAll('video'))
    if (!needToCheck || adPlaying()) {
        const videoNode = document.querySelector('video')
        if (settings.autoSkip) {
            skip(videoNode)
        } else if (!skipButton) {
            skipButton = button.cloneNode(true)
            skipButton.onclick = () => skip(videoNode)
            const rect = videoNode.getBoundingClientRect()
            skipButton.style.top = `${String(rect.bottom - 200)}px`
            skipButton.style.left = `${String(rect.right - 100)}px`
            document.body.appendChild(skipButton)
        }
    }
}

function handleAdEndScreen() {
    if (settings.autoSkip) {
        const YTskipButton = document.querySelector('.ytp-ad-skip-button-modern')
        console.log('!@#!@# ENDSCREEN', YTskipButton)
        YTskipButton.click()
    }
}

function handleSponsored(sponsored) {
    console.log('handling sponsored', sponsored, getSponsored())
    if (settings.hideSponsored) {
        if (sponsored) {
            sponsored.forEach(node => node.remove())
        } else {
            getSponsored().forEach(node => node.remove())
        }
    }
}

// Updates settings and runs check function
function updateSettings(newSettings, dontCheck) {
    console.log('settings update...')
    settings = newSettings
    if (dontCheck) return
    handleAd(true)
    handleSponsored()
}

async function init() {
    console.log('try init...')
    const [appContainer] = document.getElementsByTagName('ytd-app')
    if (appContainer) {
        console.log('found app container, initializing...')
        // Start observer
        observer.observe(appContainer, { childList: true, subtree: true })
        // Load settings
        browser.storage.sync.get('skipButtonSettings').then(({ skipButtonSettings }) => {
            if (skipButtonSettings) updateSettings(skipButtonSettings, true)
        })
        return true
    } else {
        // App container not ready, retry in 300 ms
        await new Promise(resolve => setTimeout(resolve, 300));
        return false
    }
}

// Manually skip any running video
function manualSkip() {
    document.querySelectorAll('video').forEach(video => skip(video))
    // Propagate to all child iframes
    document.querySelectorAll('iframe').forEach(iframe => {
        const iframeWindow = iframe.contentWindow
        if (iframeWindow) {
            iframeWindow.postMessage('manualSkip', '*')
        }
    })
}

console.log('loaded skipButton.js.')
const isYoutube = /.*(\/|\.)youtube\..*/.test(window.location.toString())
if (isYoutube) {
    while (!init()) {}
}

// Add event listeners for settings changes
browser.storage.onChanged.addListener(changes => {
    if (changes.skipButtonSettings) updateSettings(changes.skipButtonSettings.newValue)
})
window.addEventListener('message', message => { if (message.data === 'manualSkip') manualSkip() })
