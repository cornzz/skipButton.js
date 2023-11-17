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

const logging = false
const observer = new MutationObserver(check)
const AD_OVERLAY_CLASS = 'ytp-ad-player-overlay'
const AD_ENDSCREEN_CLASS = 'ytp-ad-action-interstitial'
const YT_SKIP_CLASS = 'ytp-ad-skip-button-modern'
const SPONSORED_CLASSES = ['YTD-AD-SLOT-RENDERER', 'YTD-PLAYER-LEGACY-DESKTOP-WATCH-ADS-RENDERER']
const adPlaying = () => document.querySelector(`.${AD_OVERLAY_CLASS}`) !== null
const getSponsored = () => SPONSORED_CLASSES.flatMap(className => [...document.getElementsByTagName(className)])
const log = (message, ...args) => logging && console.log(`skipButton.js: ${message}`, ...args)

let settings = {
    autoSkip: false,
    hideSponsored: true
}
let skipButton = null
let initialCheck = false

// Skips an ad video
function skip(videoNode) {
    log('skipping...')
    if (!isNaN(videoNode.duration)) {
        videoNode.currentTime = videoNode.duration
    }
}

// Main check function, run on DOM mutations
function check(mutations) {
    const [addedNodes, removedNodes] = mutations.reduce(
        ([added, removed], mutation) => {
            return mutation.type !== 'childList' ? [added, removed] : [
                [...added, ...mutation.addedNodes],
                [...removed, ...mutation.removedNodes]
            ]
        },
        [[], []]
    )
    const adStarted = addedNodes.some(node =>
        node.classList?.contains(AD_OVERLAY_CLASS) ||
        node.id === 'movie_player' && node.querySelector(`.${AD_OVERLAY_CLASS}`)
    )
    const adStopped = removedNodes.some(node => node.classList?.contains(AD_OVERLAY_CLASS))
    const adEndScreen = addedNodes.some(node =>
        node.classList?.contains(AD_ENDSCREEN_CLASS) ||
        node.id === 'movie_player' && node.querySelector(`.${AD_ENDSCREEN_CLASS}`)
    )
    const sponsored = addedNodes.filter(node => SPONSORED_CLASSES.includes(node.tagName))

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
        const YTSkipButton = document.querySelector(`.${YT_SKIP_CLASS}`)
        YTSkipButton.click()
    }
}

function handleSponsored(sponsored) {
    log('handling sponsored...')
    if (settings.hideSponsored) {
        (sponsored || getSponsored()).forEach(node => node.remove())
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
        // Load settings
        browser.storage.sync.get('skipButtonSettings').then(({ skipButtonSettings }) => {
            if (skipButtonSettings) updateSettings(skipButtonSettings, true)
        })
        // Start observer
        observer.observe(appContainer, { childList: true, subtree: true })
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

(async () => {
    console.log(`skipButton.js: loaded (host: ${window.location.host})`)
    const isYoutube = /^https?:\/\/([a-z]+\.)?youtube\.com.*/.test(window.location.toString())
    if (isYoutube) {
        let initAttempts = 0
        while (!await init() && initAttempts < 100) {
            initAttempts++
        }

        // Add event listeners for settings changes
        browser.storage.onChanged.addListener(({ skipButtonSettings }) => {
            if (skipButtonSettings) updateSettings(skipButtonSettings.newValue)
        })
    }
})()
