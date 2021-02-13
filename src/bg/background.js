let new_tab_extensions = [];
// set initial index for rotation of new tabs
let new_tab_index = 0;

chrome.runtime.onInstalled.addListener(function () {
  // get the 'new tab' extensions and store them locally
  filterNewTabExtensions(storeNewTabExtensions);

  initExtUpdate();
});

chrome.runtime.onStartup.addListener(function () {
  // get the 'new tab' extensions and store them locally
  filterNewTabExtensions(storeNewTabExtensions);

  initExtUpdate();
});

// listen for new tab opened event
chrome.tabs.onCreated.addListener(function (event) {
  // new tabs don't always have a url when opened
  // wait for url to render from update listener below then load
  // then set this flag after update is complete
  let newTabUpdated = false;

  chrome.tabs.onUpdated.addListener(function (id, info, tab) {
    if (tab.url === "chrome://newtab/" && !newTabUpdated && tab.openerTabId) {
      // tab can 'update' a lot on creation
      // set flag to prevent infinite tab creation loop from functions below once the "chrome://newtab/" url is loaded
      newTabUpdated = true;
      // make sure opened tab was a direct 'new tab' open as apposed to a link triggering a new tab
      // set the next new tab
      setNextTab();
      // on open of new tab, close any other previously opened new tabs
      closeOtherNewTabs();
      }
  });
});

// refresh when on popup load to make sure popup elements are updated on uninstall/reinstall of exts
chrome.runtime.onMessage.addListener(function (request) {
  if (request.greeting === 'refresh') {
    filterNewTabExtensions(storeNewTabExtensions);
  }
});

// when user chooses extension from popup, open that chosen extension and close any other previously opened new tabs
chrome.runtime.onMessage.addListener(function (request) {
  if (request.greeting === 'openTab') {
    let popup_picked_nt_ext = request.id;
    openPickedTab();

    function openPickedTab() {
      let index = new_tab_extensions.findIndex(x => x.id === popup_picked_nt_ext);

      for (var extension of new_tab_extensions) {
        extension.enabled = true;
        enableExtension(extension.id);
      }

      for (let i = 0; i < new_tab_extensions.length; i++) {
        if (i !== index) {
          new_tab_extensions[i].enabled = false;
          disableExtension(new_tab_extensions[i].id);
        }
      }

      chrome.tabs.create({});
      closeOtherNewTabs();
    }
  }
});

function initExtUpdate() {
  // continually update extensions
  setInterval(function () {
    filterNewTabExtensions(storeNewTabExtensions);
  }, 5000);
}

// disable all extensions from array and then enable the current index to set active new tab
function setNextTab() {
  let new_tab_ext_count = new_tab_extensions.length;
  new_tab_index++;
  if (new_tab_index > new_tab_ext_count - 1) {
    new_tab_index = 0;
  }

  for (var extension of new_tab_extensions) {
    enableExtension(extension.id);
  }

  for (let i = 0; i < new_tab_extensions.length; i++) {
    if (i !== new_tab_index) {
      disableExtension(new_tab_extensions[i].id);
    }
  }
}

// filter installed extensions for 'new tab' extensions
function filterNewTabExtensions(callback) {
  chrome.management.getAll(function (extensions) {
    let result = extensions.filter(function (extension) {
      return extension.permissions.includes('newTabPageOverride');
    });
    callback(result);
  });
}

// store the filtered new tab extensions for quick access
function storeNewTabExtensions(extensions) {
  let sorted_exts = sortExtensions(extensions);
  new_tab_extensions = sorted_exts;
  chrome.storage.sync.set({
    'extensions': sorted_exts
  });
}

// sort extensions so order is always maintained
function sortExtensions(exts) {
  if (exts.length < 2) {
    return exts;
  } else if (exts.length > 1) {
    return exts.sort(function (a, b) {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
  }
}

// get stored new tab extensions
function retrieveNewTabExtensions(callback) {
  chrome.storage.sync.get('extensions', callback);
}

// disable passed in extension
function disableExtension(extId, callback) {
  chrome.management.setEnabled(extId, false, callback);
}

// enable passed in extension
function enableExtension(extId) {
  chrome.management.setEnabled(extId, true);
}

// on open of new tab, close any other previously opened new tabs
function closeOtherNewTabs() {
  chrome.tabs.query({
    active: false,
    url: 'chrome://newtab/'
  }, function (tabs) {
    for (let tab of tabs) {
      chrome.tabs.remove(tab.id);
    }
  });
}