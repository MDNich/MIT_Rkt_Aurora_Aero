// base constants
const baseConstants = {
    dateRenderFormat: "YYYY-MM-DD h:mm a",
};

// base urls
const baseUrls = {
    searchAPI: '/api/search/',
    searchPage: '/item/search/',
    itemTagPreviewAPI: '/item/api_tag_preview/',
    itemCategAPI: '/api/item-categories/',
    itemListAPI: '/api/items/',
    itemMediaAPI: '/api/item-media/',
    itemMediaCategoryAPI: '/api/item-media-categories/',
    sessionAPI: '/session/api_list/',
    datasetAPI: '/dataset/api_list/',
    itemDownloadAPI: '/item/api_payload/'
};

// baseUI ref
const baseUI = {
    rootHTML: $('html'),
    mainBody: $('body'),
    scrollToTopBtn: $('#return_to_top'),
    colorToggle: $('#color_mode_toggle'),
};

// nexus loading animation
const nexusLoading = function (targetDiv, options) {
    this.defaults = {
        stoppable: false,
        message: 'Processing...',
        theme: 'light',
        start: false,  // dont start unless explicitly told
    };
    this.targetDiv = targetDiv;
    this.settings = $.extend({}, this.defaults, options);

    this.setup = function () {
        // init
        $.Loading.setDefaults(this.settings);
    };

    this.isLoading = function () {
        // Check if the 'element' is loading
        return this.targetDiv.is(':loading');
    };

    this.show = function () {
        this.targetDiv.loading('start');
    };

    this.resize = function () {
        this.targetDiv.loading('resize');
    };

    this.stop = function () {
        this.targetDiv.loading('stop');
    };

    this.destroy = function () {
        // noinspection CssInvalidPseudoSelector
        this.targetDiv.loading('destroy');
    };

    this.destroyAll = function () {
        // noinspection CssInvalidPseudoSelector
        $(":loading").loading('destroy');
    };

    this.stopAll = function () {
        // noinspection CssInvalidPseudoSelector
        $(":loading").loading('stop');
    };
};

// nexus notifications
const nexusNotifier = function (options) {
    this.defaults = {
        // can be: alert, success, warning, error, info
        type: 'success',
        layout: 'topRight',
        text: 'Your action was successful!',
        progressBar: false,
        animation: {
            open: 'noty_effects_open',
            close: 'noty_effects_close',
        },
        closeWith: ['click', 'button'],
        id: baseUtils.getUniqueGuid(),
        theme: 'bootstrap-v4',
        killer: true,
    };
    this.settings = $.extend({}, this.defaults, options);
    this.notification = new Noty(this.settings);
    this.show = function () {
        this.notification.show();
    }
};

// base utility object
const baseUtils = {
    showLoading: function (control = 'start', targetDiv = null, message = null) {
        let target;
        // set target div to body if null
        if (targetDiv === null) {
            target = baseUI.mainBody;
        } else {
            target = targetDiv;
        }

        let opts = {};
        if (message !== null && message.trim() !== '') {
            opts = {
                message: message,
            }
        }

        const nexusLoader = new nexusLoading(target, opts);

        // show loading only if target div isn't already loading
        if (control === 'start' && !nexusLoader.isLoading()) {
            nexusLoader.setup();
            nexusLoader.show();
        } else if (control === 'resize') {
            nexusLoader.resize();
        } else if (control === 'destroyAll') {
            nexusLoader.destroyAll();
        } else if (control === 'stopAll') {
            nexusLoader.stopAll();
        } else {
            nexusLoader.stop();
        }

    },
    notify: function (message, type = 'success', timeout = 4000, callbacks = null) {
        if (callbacks === null) {
            callbacks = {};
        }
        new nexusNotifier({
            text: message,
            type: type,
            timeout: timeout,
            callbacks: callbacks
        }).show();
    },
    getUniqueId: function () {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return Math.random().toString(36).substr(2, 9);
    },
    getUniqueGuid: function () {
        // taken from noty.js
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0;
            let v = c === 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    }
};

const colorModeTracker = {
    colorMode: '',
    initColorMode: function () {
        // this was obtained from the cookie by the server
        // and then added to the html before serving.
        this.colorMode = baseUI.rootHTML.attr('data-color-mode');
        // set toggle state on first load
        baseUI.colorToggle.prop('checked', this.colorMode === 'dark');
    },
    updateColorMode: function () {
        this.colorMode = baseUI.colorToggle.is(':checked') ? 'dark' : 'light';
        // save as cookie
        Cookies.set('colormode', this.colorMode);
        // trigger reload so that the server gets the cookie
        // and sets the attr on the html and colors are
        // applied when the page is served.
        window.location.reload();
    }
};

// for tracking selections in the UI.
const selectionTracker = function (div) {
    this.rootDiv = div;
    this.selectedItems = new Set();
    this.isSelected = function (guid) {
        return this.selectedItems.has(guid);
    };
    // get the list of guids of the selected items
    this.getSelectedItems = function () {
        return Array.from(this.selectedItems);
    };
    this.setSelectedItems = function (selectionList) {
        this.selectedItems = new Set(selectionList);
    };
    // get the current num of selected items
    this.getSelectedItemCount = function () {
        return this.selectedItems.size;
    };
    this.addToSelected = function (guid) {
        this.selectedItems.add(guid);
    };
    this.removeFromSelected = function (guid) {
        if (this.selectedItems.has(guid)) {
            this.selectedItems.delete(guid);
        }
    };
    this.resetSelection = function () {
        // first reset the data structure.
        this.selectedItems = new Set();
        // update select-all status
        this.rootDiv.updateSelectAllStatus();
        // update count display.
        this.rootDiv.updateSelectedCountDiv(this.getSelectedItemCount());
        // manually uncheck all boxes in the current page. The boxes on other pages
        // are only set on load, using this.selectedItems, so as long as that's empty
        // we're good.
        this.rootDiv.updateDisplayedCheckBoxes(false);
    }
};

// base DT config
const nexusDatatable = function (targetDiv, options) {
    this.targetDiv = targetDiv;
    // base datatables config
    this.defaults = {
        // nexus specific attrs
        "enableProcessing": true,
        "processingText": 'Loading...',
        // end of nexus specific attrs
        "processing": false,
        "paging": true,
        "searching": true,
        "ordering": true,
        "info": false,
        "deferRender": true,  // defer drawing rows until requested
        "orderClasses": false,// disable for performance
        "lengthMenu": [[10, 25, 50], [10, 25, 50]], // [values, displayed options]
        "scrollX": true,
        "serverSide": true,
        "order": [],  // no initial ordering. Backend sorts it by date, by default.
        "orderMulti": false,  // multi column sort
        "ajax": {
            "error": function (jqXHR, textStatus, errorThrown) {
                baseUtils.notify(
                    "There was an unknown error with your request. Please check your network and try again.",
                    "error");
            },
        },
        dom: "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-5'B><'col-sm-7'p>>",
        buttons: []
    };
    // recursively, while creating a new obj, merge options into defaults
    this.settings = $.extend(true, {}, this.defaults, options);

    const enableProcessing = this.settings.enableProcessing;
    const processingText = this.settings.processingText;
    let processingDiv = this.settings.processingDiv;

    this.getTable = function () {
        return this.targetDiv.on('processing.dt', function (e, settings, processing) {
            if (enableProcessing) {
                if (processingDiv) {
                    processingDiv.css('visibility', processing ? 'visible' : 'hidden');
                } else {
                    baseUtils.showLoading(
                        processing ? 'start' : 'stop',
                        targetDiv,
                        processingText
                    );
                }
            }
        }).DataTable(this.settings);
    };
};

// Difference b/w 2 sets
Set.prototype.difference = function (otherSet) {
    let diff = new Set();
    for (let elem of this) {
        if (!otherSet.has(elem))
            diff.add(elem);
    }
    return diff;
};

// Capitalize first char of string
String.prototype.title = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/*
* Current ways of communicating in Nexus with the backend are implementations of XMLHttpRequest using jQuery.ajax()
* which has a terrible API and can result in 'callback-hell'.
* The new fetch() API of JavaScript uses Promises with a much cleaner API replacing callbacks with
* thenables and/or async/await.
* This will be the defacto standard of communicating with the back-end moving forward and should be used wherever
* possible.
* */
class FetchClient {
    constructor({body, headers, abortSignal, json}) {
        this._body = body || {};
        this._headers = new Headers({
            ...{
                'Accept': 'application/json',
                // hidden form field for AJAX requests, needed for session/basic auth
                "X-CSRFToken": jQuery("[name=csrfmiddlewaretoken]").val(),
            }, ...headers
        });
        this._abortSignal = abortSignal || null;
        this._json = json || false;
    }

    _getFormData(body) {
        let formData = new FormData();
        for (let key in body) {
            formData.append(key, body[key]);
        }
        return formData;
    }

    _handleNetworkError(err) {
        // If it was an error on the client
        if (!Array.isArray(err)) {
            // TypeErrors are generic, so use a generic message.
            const clientErr = err.name === 'TypeError' ?
                new Error("There was an unknown error with your request. Please check your network and try again.")
                : err;
            return Promise.reject(clientErr);
        }

        // use response text from backend, if present
        let message = '';
        let [status, body] = err;
        if (Object.keys(body).length > 0) {
            // In the case of datatables, the response is nested inside the body.
            /*
            body = {data: {…}, recordsFiltered: 1, recordsTotal: 1, draw: 1}
            data:
                detail: "UNIQUE constraint failed: data_item.guid"
                __proto__: Object
            draw: 1
            recordsFiltered: 1
            recordsTotal: 1
            * */
            if ('data' in body) {
                body = body['data'];
            }

            /* Error response bodies from Django REST are of the form.
            * {"what_failed":"why_it_failed",...}
            * OR
            * {"what_failed":["why_it_failed_reason_1","why_it_failed_reason_2",...],...}
            * */
            for (let key in body) {
                // if there are many things that went wrong,
                // just display the first one and then let the
                // user fix their mistake from there. Don't spam
                // with too many messages.
                const err = body[key];
                if (err.length > 0) {
                    // error can be one string message or an array of messages.
                    if (Array.isArray(err)) {
                        message = err[0];
                    } else {
                        message = err;
                    }
                    break;
                }
            }
        }

        if (!message) {
            switch (status) {
                case 500:
                    message = 'There was a problem with the server. Please try again.';
                    break;
                case 404:
                    message = 'The requested item(s) could not be found.';
                    break;
                case 403:
                    message = 'You do not have permissions to perform this action.';
                    break;
                case 400:
                    message = 'Please check your input and try again.';
                    break;
                case 413:
                    message = 'The uploaded item exceeds the maximum allowed size.';
                    break;
                default:
                    message = 'There was an unknown error accessing the server. Please try again.';
                    break;
            }
        }

        // throw to be handled later.
        return Promise.reject(new Error(message.title()));
    }

    async _send(method, url) {
        let body;
        // build body based on request type
        if (this._json) {
            body = JSON.stringify(this._body);
            // text/plain is default, so specify json
            this._headers.append('Content-Type', 'application/json');
        } else {
            // fetch will decide content-type automatically.
            body = this._getFormData(this._body);
        }
        // build request
        let fetchInit = null;
        if (method !== 'GET') {
            fetchInit = {
                method: method,
                body: body,
                headers: this._headers,
                signal: this._abortSignal,
            }
        }
        // fire
        return await fetch(url, fetchInit).then(response => {
            return Promise.all([response, response.text()]);
        }).then(([response, body]) => {
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(body);
            } catch (e) {
                jsonResponse = {};
            }
            if (response.ok) {
                return Promise.resolve(jsonResponse);
            } else {
                return Promise.reject([response.status, jsonResponse]);
            }
        }).catch(this._handleNetworkError);
    }

    async get(url) {
        return await this._send('GET', url);
    }

    async post(url) {
        return await this._send('POST', url);
    }

    async put(url) {
        return await this._send('PUT', url);
    }

    async patch(url) {
        return await this._send('PATCH', url);
    }

    async delete(url) {
        return await this._send('DELETE', url);
    }
}

/*
* A basic implementation of a queue using
* arrays.
* */
class Queue {
    constructor(...items) {
        this._queue = [...items];
    }

    get size() {
        return this._queue.length;
    }

    isEmpty() {
        return this.size === 0;
    }

    enqueue(item) {
        this._queue.push(item);
    }

    dequeue() {
        if (!this.isEmpty()) {
            return this._queue.shift();
        }
        return null;
    }

    peek() {
        if (!this.isEmpty()) {
            return this._queue[0];
        }
        return null;
    }

    clear() {
        this._queue = [];
    }
}


$(document).ready(function () {
    // set color mode client side
    colorModeTracker.initColorMode();

    // color mode switch event handler
    baseUI.colorToggle.change(function () {
        colorModeTracker.updateColorMode();
    });

    // scroll-to-top function
    $(window).scroll(function () {
        if ($(this).scrollTop() >= 700) {
            baseUI.scrollToTopBtn.fadeIn();
        } else {
            baseUI.scrollToTopBtn.fadeOut();
        }
    });
    // scroll to top actions for every page.
    baseUI.scrollToTopBtn.click(function (e) {
        e.preventDefault();
        window.scroll({
            top: 0,
            behavior: 'smooth'
        });
    });

    // hide navbar when in iframe
    if (window.location !== window.parent.location) {
        $("#main_navbar_container").hide();
        denyNewTab = true;
    }

    // bs-multiselect defaults
    $.fn.selectpicker.Constructor.BootstrapVersion = '4';
    $.fn.selectpicker.Constructor.DEFAULTS.iconBase = 'fas';
    $.fn.selectpicker.Constructor.DEFAULTS.tickIcon = 'fa-check';
    $.fn.selectpicker.Constructor.DEFAULTS.style = 'btn-outline-secondary';
});
