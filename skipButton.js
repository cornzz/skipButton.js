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
    right: 0;
    bottom: 130px;
`
button.innerText = 'Skip >'

const observer = new MutationObserver(check)
const dateOptions = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3
}
const logging = false
const adPlaying = () => document.querySelector('.ytp-ad-player-overlay') !== null
const getSponsored = () => [
    ...document.getElementsByTagName('ytd-ad-slot-renderer'),
    ...document.getElementsByTagName('ytd-player-legacy-desktop-watch-ads-renderer')
]
const log = (message, ...args) => logging && console.log(`skipButton.js: ${message}`, ...args)

let settings = {
    autoSkip: false,
    hideSponsored: true
}
let skipButton = null
let initialCheck = false

// Skips an ad video
function skip(videoNode) {
    log('skipping...', videoNode)
    if (!isNaN(videoNode.duration)) {
        videoNode.currentTime = videoNode.duration
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
    const adStarted = addedNodes.some(node =>
        node.classList?.contains('ytp-ad-player-overlay') ||
        node.id === 'movie_player' && node.querySelector('.ytp-ad-player-overlay')
    )
    const adStopped = removedNodes.some(node => node.classList?.contains('ytp-ad-player-overlay'))
    const adEndScreen = addedNodes.some(node =>
        node.classList?.contains('ytp-ad-action-interstitial') ||
        node.id === 'movie_player' && node.querySelector('.ytp-ad-action-interstitial')
    )
    const sponsored = addedNodes.filter(node =>
        ['YTD-AD-SLOT-RENDERER', 'YTD-PLAYER-LEGACY-DESKTOP-WATCH-ADS-RENDERER'].includes(node.tagName)
    )

    if (adStarted) handleAd()
    if (adStopped && skipButton) {
        skipButton.remove()
        skipButton = null
    }
    if (adEndScreen) handleAdEndScreen()
    if (sponsored.length) handleSponsored(sponsored)

    if (!initialCheck) {
        // Check if ad was already playing before observer started
        log('initial check...')
        handleAd(true)
        initialCheck = true
    }
}

function handleAd(needToCheck) {
    log('handling ad...')
    if (!needToCheck || adPlaying()) {
        const videoNodes = document.querySelectorAll('video')
        for (const videoNode of videoNodes) {
            if (settings.autoSkip) {
                skip(videoNode)
            } else if (!skipButton && !videoNode.paused) {
                skipButton = button.cloneNode(true)
                skipButton.onclick = () => skip(videoNode)
                const target = videoNode.parentElement.parentElement
                target.appendChild(skipButton)
            }
        }
    }
}

function handleAdEndScreen() {
    if (settings.autoSkip) {
        const YTskipButton = document.querySelector('.ytp-ad-skip-button-modern')
        YTskipButton.click()
    }
}

function handleSponsored(sponsored) {
    log('handling sponsored...')
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
    log('settings update...')
    settings = newSettings
    if (dontCheck) return
    handleAd(true)
    handleSponsored()
}

async function init() {
    const [appContainer] = document.getElementsByTagName('ytd-app')
    if (appContainer) {
        log('found app container, initializing...')
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
}

console.log(`skipButton.js: loaded (host: ${window.location.host})`)
const isYoutube = /^https?:\/\/([a-z]+\.)?youtube\.com.*/.test(window.location.toString())
if (isYoutube) {
    while (!init()) {}
}

// Add event listeners for settings changes
browser.storage.onChanged.addListener(changes => {
    if (isYoutube && changes.skipButtonSettings) updateSettings(changes.skipButtonSettings.newValue)
})
