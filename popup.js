function setAutoSkip(event) {
    autoSkip = event.target.checked
    updateStorage()
}

function setHideBanners(event) {
    hideBanners = event.target.checked
    updateStorage()
}

function updateStorage() {
    console.log('update storage:', autoSkip, hideBanners)
    browser.storage.sync.set({ skipButtonSettings: { autoSkip: autoSkip, hideBanners: hideBanners }})
}

function sendManualSkip() {
    browser.tabs.query({
        active: true,
        currentWindow: true
    }).then(tabs => tabs.forEach(tab => {
        browser.tabs.executeScript(tab.id, { code: 'manualSkip()' })
    }))
}

// Default settings
let autoSkip = false
let hideBanners = true

let autoSkipCheck = document.getElementById('autoSkip')
let hideBannersCheck = document.getElementById('hideBanners')
let manualSkipBtn = document.getElementById('manualSkip')
browser.storage.sync.get('skipButtonSettings').then(({ skipButtonSettings }) => {
    if (skipButtonSettings) {
        console.log('settings loaded:', skipButtonSettings)
        autoSkip = skipButtonSettings.autoSkip
        hideBanners = skipButtonSettings.hideBanners
    } else {
        updateStorage()
    }
    autoSkipCheck.checked = autoSkip
    hideBannersCheck.checked = hideBanners
})

autoSkipCheck.addEventListener('input', setAutoSkip)
hideBannersCheck.addEventListener('input', setHideBanners)
manualSkipBtn.addEventListener('click', sendManualSkip)
