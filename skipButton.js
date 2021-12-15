let skipBtn = document.createElement('div')
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

let autoSkip = false
let skipBtnActive = false
let clickSkipInterval = null
let autoCloseBanners = true
let logging = true

const observer = new MutationObserver(() => check())

function log(message) {
    if (logging) {
        console.log(`# skipButton.js: ${message}`)
    }
}

function skip(videoNode) {
    log('skipping ad...')
    videoNode.currentTime = videoNode.duration
    removeSkipBtn()
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
    let bannerBtns = document.getElementsByClassName('ytp-ad-overlay-close-button')
    Array.from(bannerBtns).forEach(btn => {
        log('closing banner...')
        btn.click()
    })
}

function check() {
    log('checking for ads...')
    if (!skipBtnActive && isAdPlaying()) {
        document.querySelectorAll('video').forEach(v => {
            if (autoSkip) {
                log('autoskipping...')
                skip(v)
            } else if (!skipBtnActive) {
                log('adding skip button...')
                let thisSkipBtn = skipBtn.cloneNode(true)
                thisSkipBtn.onclick = () => skip(v)
                let rect = v.getBoundingClientRect()
                thisSkipBtn.style.top = `${String(rect.bottom - 250)}px`
                thisSkipBtn.style.left = `${String(rect.right - 100)}px`
                document.body.appendChild(thisSkipBtn)
                skipBtnActive = true
            }
        })
    } else if (skipBtnActive && !isAdPlaying()) {
        removeSkipBtn()
    }
    if (autoCloseBanners) {
        closeBanners()
    }
}

function init() {
    const adContainer = document.getElementsByClassName('video-ads')[0]
    if (adContainer) {
        clearInterval(initInterval)
        log('found ad container, initialising...')
        observer.observe(adContainer, { childList: true })
        check()
    }
}

let initInterval = setInterval(init, 1000)
