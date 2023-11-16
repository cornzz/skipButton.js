const autoSkipCheck = document.getElementById('autoSkip')
const hideSponsoredCheck = document.getElementById('hideSponsored')
const manualSkipBtn = document.getElementById('manualSkip')

autoSkipCheck.addEventListener('input', setOption('autoSkip'))
hideSponsoredCheck.addEventListener('input', setOption('hideSponsored'))
manualSkipBtn.addEventListener('click', sendManualSkip)

// Default settings
let settings = {
    autoSkip: false,
    hideSponsored: true
}

// Load current settings and set popup values
browser.storage.sync.get('skipButtonSettings').then(({ skipButtonSettings }) => {
    if (skipButtonSettings) {
        settings = skipButtonSettings
    } else {
        updateStorage()
    }
    autoSkipCheck.checked = settings.autoSkip
    hideSponsoredCheck.checked = settings.hideSponsored
})

function setOption(option) {
    return (event) => {
        settings[option] = event.target.checked
        updateStorage()
    }
}

function updateStorage() {
    browser.storage.sync.set({ skipButtonSettings: settings })
}

function sendManualSkip() {
    browser.tabs.query({
        active: true,
        currentWindow: true
    }).then(tabs => tabs.forEach(tab => {
        browser.scripting.executeScript({
            target: { allFrames: true, tabId: tab.id },
            func: () => typeof manualSkip !== 'undefined' && manualSkip()
        })
    }))
}
