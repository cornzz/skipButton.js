function setOption(option) {
    return (event) => {
        settings[option] = event.target.checked
        updateStorage()
    }
}

function updateStorage() {
    console.log('update storage:', settings)
    browser.storage.sync.set({ skipButtonSettings: settings })
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
let settings = {
    autoSkip: false,
    hideBanners: true,
    hideSponsored: true
}

const autoSkipCheck = document.getElementById('autoSkip')
const hideBannersCheck = document.getElementById('hideBanners')
const hideSponsoredCheck = document.getElementById('hideSponsored')
const manualSkipBtn = document.getElementById('manualSkip')

browser.storage.sync.get('skipButtonSettings').then(({ skipButtonSettings }) => {
    if (skipButtonSettings) {
        console.log('settings loaded:', skipButtonSettings)
        settings = skipButtonSettings
    } else {
        updateStorage()
    }
    autoSkipCheck.checked = settings.autoSkip
    hideBannersCheck.checked = settings.hideBanners
    hideSponsoredCheck.checked = settings.hideSponsored
})

autoSkipCheck.addEventListener('input', setOption('autoSkip'))
hideBannersCheck.addEventListener('input', setOption('hideBanners'))
hideSponsoredCheck.addEventListener('input', setOption('hideSponsored'))
manualSkipBtn.addEventListener('click', sendManualSkip)
