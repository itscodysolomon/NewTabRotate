$(document).ready(function () {
    // make sure new tab extension list is up to date
    refreshExtensions();

    // fade in transition on popup
    $('body').addClass('opacity-full');

    $('#more-info h3').click(function() {
        $('#more-info-content').slideToggle('fast');
    });

    // set extension list container and fill it with the new tab extensions
    const extension_list_container = $('#extension-list');
    getExtensions(createElements);

    // get 'new tab' filtered extensions from storage
    function getExtensions(callback) {
        chrome.storage.sync.get('extensions', function (data) {
            callback(data);
        });
    }

    // fill the list container with 'new tab' extensions
    function createElements(data) {
        if (data.extensions.length > 0) {
            for (let i = 0; i < data.extensions.length; i++) {
                extension_list_container.append(`
            <li id='${data.extensions[i].id}' class='enabled-${data.extensions[i].enabled}'> <a href='#' title='${data.extensions[i].name}' alt='${data.extensions[i].name}'>
            <img src='${getIcon(data.extensions[i].icons)}' title='${data.extensions[i].name}' alt='${data.extensions[i].name}'></a>
            </li>
            `);
            }
        }
        onExtClick(data);

        // get largest available icon for each extension and use 'missing icon' if no available icons
        function getIcon(icons) {
            if (icons) {
                let largestIcon = icons.length - 1;
                return icons[largestIcon].url;
            } else {
                return '/icons/icon-missing.png'
            }
        }
    }

    // add event listener to each new tab list item to open that new tab extension on click
    function onExtClick(data) {
        for (let i = 0; i < data.extensions.length; i++) {
            var item = document.getElementById(data.extensions[i].id);
            item.addEventListener('click', function () {
                openTab(data.extensions[i].id);
            });
        }
    }

    // open chosen new tab extension on click
    function openTab(id) {
        chrome.runtime.sendMessage({
            greeting: 'openTab',
            id: id
        });
    }

    // refresh extensions to check for installed or uninstalled extensions
    function refreshExtensions() {
        chrome.runtime.sendMessage({
            greeting: 'refresh'
        });
    }
});