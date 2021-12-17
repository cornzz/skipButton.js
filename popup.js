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

// Default settings
let autoSkip = false
let hideBanners = true

let autoSkipCheck = document.getElementById('autoSkip')
let hideBannersCheck = document.getElementById('hideBanners')
browser.storage.sync.get('skipButtonSettings').then(obj => {
    if (Object.keys(obj).length !== 0) {
        let settings = obj.skipButtonSettings
        console.log('settings loaded:', settings)
        autoSkip = settings.autoSkip
        hideBanners = settings.hideBanners
    } else {
        updateStorage()
    }
    autoSkipCheck.checked = autoSkip
    hideBannersCheck.checked = hideBanners
})

autoSkipCheck.addEventListener('input', setAutoSkip)
hideBannersCheck.addEventListener('input', setHideBanners)

function logStorageChange(changes) {
  
    let changedItems = Object.keys(changes);
    console.log(changes)
    // for (let item of changes) {
    //   console.log(item);
    // }
  }
  
  browser.storage.onChanged.addListener(logStorageChange);