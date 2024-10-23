/*
 * Copyright 2018-2024 ANSYS, Inc. Unauthorized use, distribution, or duplication is prohibited.
 *
 * Restricted Rights Legend
 *
 * Use, duplication, or disclosure of this
 * software and its documentation by the
 * Government is subject to restrictions as
 * set forth in subdivision [(b)(3)(ii)] of
 * the Rights in Technical Data and Computer
 * Software clause at 52.227-7013.
 */
/*
 *  *************************************************************
 *   Copyright 2023-2024 ANSYS, Inc. Unauthorized use, distribution,
 *                           or duplication is prohibited.
 *   All Rights Reserved.
 *
 *   Restricted Rights Legend
 *
 *   Use, duplication, or disclosure of this
 *   software and its documentation by the
 *   Government is subject to restrictions as
 *   set forth in subdivision [(b)(3)(ii)] of
 *   the Rights in Technical Data and Computer
 *   Software clause at 52.227-7013.
 *  *************************************************************
 */

// We need thisScriptDir to have the URL without any query parameters.
// Then we get rid of the file name from the pathname.
// Last, we remove "angular/" if found.
const viewerScriptUrl = new URL(document.currentScript.src);
let viewerScriptDir = viewerScriptUrl.origin + viewerScriptUrl.pathname;
viewerScriptDir = viewerScriptDir.substring(0, viewerScriptDir.lastIndexOf('/')) + '/';
viewerScriptDir = viewerScriptDir.replace("/angular/", "/");
// Ensure the required modules are loaded: jquery, inflate, unzip, ANSYSViewer
const AnsysNexusViewerDepends = [["jQuery", "utils/jquery.min.js"],
    ["JSUnzip", "utils/js-unzip.js"],
    ["JSInflate", "utils/js-inflate.js"],
    ["jQueryContextMenuCSS", "novnc/vendor/jQuery-contextMenu/jquery.contextMenu.min.css"],
    ["jQueryContextMenu", "novnc/vendor/jQuery-contextMenu/jquery.contextMenu.min.js"],
    ["jQueryContextMenuUI", "novnc/vendor/jQuery-contextMenu/jquery.ui.position.min.js"],
    ["GLTFViewer", "ANSYSViewer_min.js"],
    ["", "threejs/three.js"],
    ["", "threejs/OrbitControls.js"],
    ["", "threejs/ArcballControls.js"],
    ["", "threejs/GLTFLoader.js"],
    ["", "threejs/DRACOLoader.js"],
    ["", "threejs/VRButton.js"]
];

for (const depLoad of AnsysNexusViewerDepends) {
    // Only load if not already loaded
    if ((depLoad[0].length === 0) || (!window.hasOwnProperty(depLoad[0]))) {
        if (depLoad[1].endsWith(".js")) {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = viewerScriptDir + depLoad[1];
            script.async = false;  // async=false ensures scripts are loaded in order, because jquery context menus depend on jquery
            document.getElementsByTagName('head')[0].appendChild(script);
        } else if (depLoad[1].endsWith(".css")) {
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = viewerScriptDir + depLoad[1];
            link.async = false;
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    }
}

// register the web component
if (!window.customElements.get('ansys-nexus-viewer')) {
    var interval = setInterval(define_component_after_scripts_load, 200);
}

// Define HTML template(s)
const AnsysNexusViewerTemplate = document.createElement('template');
AnsysNexusViewerTemplate.innerHTML = `
<style>
.ansys-nexus-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0px;
  padding: 0px;
}
.ansys-nexus-proxy {
  margin:auto;
  width:9.375rem;
  height:6.5625rem;
}
.ansys-nexus-play {
  position: absolute;
  width: 2.5rem;
  height: 3.125rem;
  top:50%; left: 50%; transform: translate(-50%, -50%);
  pointer-events:none;
  display: none;
}
.ansys-nexus-proxy:hover + .ansys-nexus-play {
  display: block;
}

.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid #888;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #888 transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

</style>
<div class="ansys-nexus-viewer" style="position:relative">
<img class="ansys-nexus-proxy" id="proxy-img" src="` + viewerScriptDir + `images/proxy_viewer.png" style="display:none">
<img class="ansys-nexus-play" id="proxy-play" src="` + viewerScriptDir + `images/play.png">
<div class="ansys-nexus-viewer" id="render-div" style="display: none"><h1>Viewer Active</h1></div>
<div class="lds-ring" id="render-wait" style="position:absolute;right:0;top:0;display:none"><div></div><div></div><div></div><div></div></div>
</div>`;


// Interface to the GLTFViewer renderer
class GLTFViewerGlue {
    constructor(parent) {
        this._parent = parent;
        this._renderer = null;
        this._webgl_support = null;
    }

    internalRenderer() {
        return this._renderer;
    }

    renderImage() {
        if (this._renderer) {
            return this._renderer.GetRenderedImage();
        }
        return null;
    }

    mouseIn(e) {
        // When the mouse enters an active viewer, mark it as more "recent"
        this._parent.refreshInstance();
    }

    divID() {
        return 'avz-viewer-' + this._parent.guid;
    }

    resizeRenderer(width, height) {
        if (this._renderer === null) return;
        this._renderer.UpdateLayout();
    }

    setPerspective(on) {
        if (this._renderer === null) return;
        this._renderer.scene.navigator.persp = on;
    }

    parts() {
        if (this._renderer === null) return [];
        return this._renderer.GetParts();
    }

    setSrc(url, extension) {
        if (this._renderer === null) return;
        this._renderer.AddFiles(null, url, extension, GLTFViewer.LT_REPLACE);
    }

    setActive(on) {
        let renderDiv = this._parent.querySelector('#render-div');
        if (on) {
            if (this._webgl_support === null) this._webgl_support = webgl_support();
            if (this._webgl_support) {
                // Default options
                let options = {
                    showLogo: false,
                    showFileOpen: false,
                    allowEdit: false,
                    showHighlight: false,
                    showAbout: false,
                    showMarkup: false,
                    showOptions: false,
                    showViewport: false,
                    showExplode: false
                };
                // override from parent
                if (this._parent.renderer_options !== null) {
                    options = this._parent.renderer_options;
                    if (typeof (options) === 'string') options = JSON.parse(options);
                }
                // The avz renderer needs to go into a div with a unique global id
                renderDiv.innerHTML = '<div class="ansys-nexus-viewer" id="' + this.divID() + '"></div>';
                let avzDiv = this._parent.querySelector('#' + this.divID());
                avzDiv.addEventListener('mouseenter', this.mouseIn.bind(this));
                this._renderer = new GLTFViewer(this.divID(), this._parent.src, this._parent.src_ext, viewerScriptDir, options);
                this.setPerspective(this._parent.perspective);
            } else {
                // Display WebGL error message
                renderDiv.innerHTML = '<div class="ansys-nexus-viewer" id="' + this.divID() + '"></div>';
                let avzDiv = this._parent.querySelector('#' + this.divID());
                avzDiv.innerHTML = '<em>Warning: WebGL is not supported by this browser.<br>3D interactive geometry will not be displayed.</em>';
            }
        } else {
            // Handle deactivation
            if (this._renderer !== null) this._renderer.Clear();
            this._renderer = null;
            renderDiv.innerHTML = '';
        }
    }
}


// A list of the created instances
var AnsysNexusViewerInstanceList = [];
// A list of the currently active instances
var AnsysNexusViewerActiveInstanceList = [];
// The real limit varies based on browser implementations. Some browsers limit per-domain (cross-pages)
// and some limit per-tab or per-page.  The maximum is usually 8 or 16.  4 reflects the idea that other
// WebGL-based components might be in use and the fact that we cannot track over tabs/pages.
const AnsysNexusViewerMaxActiveInstances = 4;
// Internal "uid" generation.  Not a true UID, but a sequence of unique strings
var AnsysNexusViewerBaseUID = 0xC6476AE;

// Define the new element <ansys-nexus-viewer>
class AnsysNexusViewer extends HTMLElement {

    // Called at object creation
    constructor() {
        super();
        this._guid = this.generateUID();
        this._renderer = "webgl";  // 'webgl', 'three' or 'envnc'
        this._renderer_options = null;  // pass-thru to the renderer
        this._src = null;  // 3D data source URL
        this._src_ext = null; // 3D data source extension (type) used with data URI src values
        this._proxy_img = null;  // proxy image URL
        this._proxy_size = [0, 0]; // The size of the proxy image
        this._observer = null; // resizing observer
        this._perspective = false;  // perspective mode
        this._aspect_ratio = null;  // aspect_ratio override
        this._render_instance = null; // The specific instance for the target renderer
        this._proxy_only = null;  // if not null, proxy hover message. No activation possible.
        this._scene_scale = 0.; // null,0.=recenter/rescale, <0.=recenter, no scaling, >0.=new size.
        this._scene_translate = null; // null=recenter to 0,0,0 otherwise, recenter to specifed point.
        this._vr_support = "disable"; // "disable", "enable", "ifavailable"
        this._ui = "";  // 'envnc' renderer uses this to selected a UI.  'none' or 'simple'
    }

    //  Called when added to the DOM
    connectedCallback() {
        // root of the local instance DOM
        this.appendChild(AnsysNexusViewerTemplate.content.cloneNode(true));
        // register the new instance
        AnsysNexusViewerInstanceList.push(this);
        // parse the element attributes
        const guid = this.getAttribute('guid');
        if (guid !== null) {
            this._guid = guid;
        }
        const renderer = this.getAttribute('renderer');
        if (renderer !== null) {
            this._renderer = renderer;
        }
        const perspective = this.getAttribute('perspective');
        if (perspective !== null) {
            this.perspective = (perspective === 'true');
        }
        const scene_scale = this.getAttribute('scene_scale');
        if (scene_scale !== null) {
            this._scene_scale = parseFloat(scene_scale);
        } else {
            this._scene_scale = 0.;
        }
        this.scene_translate = this.getAttribute('scene_translate');
        const vr_support = this.getAttribute('vr_support');
        if (vr_support !== null) {
            this._vr_support = vr_support;
        }
        // If WebXR is not available, we may disable it.
        if (this._vr_support === 'ifavailable') {
            this._vr_support = 'disable';
            if (navigator.xr) {
                this._vr_support = 'enable';
            }
        }

        // some items can be null
        this._renderer_options = this.getAttribute('renderer_options');
        this.aspect_ratio = this.getAttribute('aspect_ratio');
        this.src_ext = this.getAttribute('src_ext');
        this.src = this.getAttribute('src');
        this.proxy_img = this.getAttribute('proxy_img');
        this.proxy_only = this.getAttribute('proxy_only');
        if (this._renderer === 'webgl') {
            this._render_instance = new GLTFViewerGlue(this);
        } else if (this._renderer === 'envnc') {
            this._render_instance = new EnVNCViewerGlue(this);
        } else if ((this._renderer === 'sgeo') || (this._renderer === 'three')) {
            this._render_instance = new ThreeJSViewerGlue(this);
        }
        const ui = this.getAttribute('ui');
        if (ui !== null) {
            this._ui = ui;
        }
        // Don't activate until all fields are set
        let activate = this.getAttribute('active');
        if (activate === null) {
            // If we have a source but no proxy, then activate
            activate = (this.src !== null) && (this._proxy_img === null);
        } else {
            activate = (activate === 'true')
        }
        if (activate) {
            this._indirectActivate(activate);
        } else {
            this._setVisibility(false);
        }
        let proxyElem = this.querySelector('#proxy-img');
        if (this.proxy_only === null) {
            proxyElem.onclick = this._proxyClicked.bind(this);
        } else {
            let proxyPlayElem = this.querySelector('#proxy-play');
            proxyPlayElem.style.display = 'none';
            proxyElem.setAttribute("title", this.proxy_only);
        }
        proxyElem.onload = this._proxyLoaded.bind(this);

        // Use ResizeObserver if at all possible.  If not, fall back to
        // a much more expensive setInterval() approach.
        try {
            this._observer = new ResizeObserver(this._directObserverCallback.bind(this));
            this._observer.observe(this.querySelector('#render-div'));
        } catch (error) {
            setInterval(this._indirectObserverCallback.bind(this), 500);
        }
    }

    // Called when removed from the DOM
    disconnectedCallback() {
        this.active = false;
        let idx = AnsysNexusViewerInstanceList.indexOf(this);
        if (idx >= 0) {
            AnsysNexusViewerInstanceList.splice(idx, 1);
        }
    }

    // Instance management
    generateUID() {
        AnsysNexusViewerBaseUID += 1;
        return AnsysNexusViewerBaseUID.toString();
    }

    _freeActiveInstance() {
        // Make sure that there is room for at least one additional active instance
        if (AnsysNexusViewerActiveInstanceList.length >= AnsysNexusViewerMaxActiveInstances) {
            // items at the head are the oldest...
            AnsysNexusViewerActiveInstanceList[0].active = false;
        }
    }

    refreshInstance() {
        // If the user begins to interact with an instance, that instance can
        // be made to look more recent so that it is not reaped in the original
        // activation order
        const idx = AnsysNexusViewerActiveInstanceList.indexOf(this);
        if (idx >= 0) {
            AnsysNexusViewerActiveInstanceList.push(AnsysNexusViewerActiveInstanceList.splice(idx, 1)[0]);
        }
    }

    // Activation GUI handling
    _proxyClicked() {
        this.active = true;
    }

    // Grab the proxy image size (for aspect ratio control)
    _proxyLoaded() {
        let proxyElem = this.querySelector('#proxy-img');
        this._proxy_size = [proxyElem.width, proxyElem.height];
    }

    // Resize handling: enforce aspect ratios, etc
    _indirectObserverCallback() {
        // Three resizing cases:
        // 1) aspect_ratio is null - assume external styles are controlling things
        if (this.aspect_ratio === null) return;
        // 2) aspect_ratio is a number - use it
        let aspectRatio = this.aspect_ratio;
        // 3) aspect_ratio is proxy - use the proxy image aspect ratio: this._proxy_size
        if ((this.aspect_ratio === "proxy") && (this._proxy_size[1] > 0)) {
            aspectRatio = this._proxy_size[0] / this._proxy_size[1];
        }
        // Apply the aspect ratio to the div
        let renderDiv = this.querySelector('#render-div');
        let newHeight = Math.round(renderDiv.clientWidth / aspectRatio);
        let oldHeight = renderDiv.clientHeight;
        if (oldHeight != newHeight) {
            renderDiv.style.height = newHeight + 'px';
            this._render_instance.resizeRenderer(renderDiv.clientWidth, newHeight);
        }
    }

    _directObserverCallback() {
        setTimeout(this._indirectObserverCallback.bind(this), 0);
    }

    // display either the proxy image or the renderer div
    _setVisibility(on) {
        let proxyElem = this.querySelector('#proxy-img');
        let renderDiv = this.querySelector('#render-div');
        if (on) {
            proxyElem.style.display = 'none';
            renderDiv.style.display = 'block';
        } else {
            proxyElem.style.display = 'block';
            renderDiv.style.display = 'none';
        }
    }

    // Display the spinning wait logo
    loadingStatus(on) {
        let waitDiv = this.querySelector('#render-wait');
        if (on) {
            waitDiv.style.display = 'block';
        } else {
            waitDiv.style.display = 'none';
        }
    }

    // The various modules may be loaded async
    // If the GLTFViewer module has been loaded, this function returns true
    _dependentModulesLoaded() {
        return (typeof webgl_support === "function");
    }

    // We have been asked to activate via html attribute, we might need to try later...
    _indirectActivate(on) {
        if (this._dependentModulesLoaded()) {
            this.active = on;
        } else {
            setTimeout(this._indirectActivate.bind(this, on), 10);
        }
    }

    // Find the file(type) extension name for the target URI
    urlType(url) {
        if (url === null) return null;
        let newUrl = new URL(url, viewerScriptDir);
        let pathname = newUrl.pathname;
        if (pathname.toLowerCase().endsWith('avz')) return 'AVZ';
        if (pathname.toLowerCase().endsWith('scdoc')) return 'SCDOC';
        if (pathname.toLowerCase().endsWith('dsco')) return 'SCDOC';
        if (pathname.toLowerCase().endsWith('evsn')) return 'EVSN';
        if (pathname.toLowerCase().endsWith('glb')) return 'GLB';
        return null;
    }

    // Return a data URI for a PNG representation of the current rendered image
    renderImage() {
        if (this.active) {
            return this._render_instance.renderImage();
        }
        return null;
    }

    // properties
    // guid (read only)
    get guid() {
        return this._guid;
    }

    // renderer (read only)
    get renderer() {
        return this._renderer;
    }

    // renderer_options (read only)
    get renderer_options() {
        return this._renderer_options;
    }

    // parts (read only)
    get parts() {
        if (this.active) {
            return this._render_instance.parts();
        }
        return [];
    }

    // internal_render_instance (read only)
    get internal_render_instance() {
        if (this.active) {
            return this._render_instance.internalRenderer();
        }
        return null;
    }

    // active
    set active(value) {
        const idx = AnsysNexusViewerActiveInstanceList.indexOf(this);
        if (value) {
            if (idx < 0) {
                // Make sure there is space for this instance to become active
                this._freeActiveInstance();
                // activate
                AnsysNexusViewerActiveInstanceList.push(this);
                this._setVisibility(true)
                // Actually activate the instance
                this._render_instance.setActive(true);
                const event = new CustomEvent('active-changed', {detail: {active: true}});
                this.dispatchEvent(event);
            }
        } else {
            if (idx >= 0) {
                // deactivate
                AnsysNexusViewerActiveInstanceList.splice(idx, 1);
                this._setVisibility(false);
                // Actually deactivate the instance
                this._render_instance.setActive(false);
                const event = new CustomEvent('active-changed', {detail: {active: false}});
                this.dispatchEvent(event);
                const parts_event = new CustomEvent('parts-changed', {detail: {}});
                this.dispatchEvent(parts_event);
            }
        }
    }

    get active() {
        return AnsysNexusViewerActiveInstanceList.indexOf(this) >= 0;
    }

    // perspective
    set perspective(value) {
        if (value != this._perspective) {
            this._perspective = value;
            if (this._render_instance !== null) this._render_instance.setPerspective(value);
            const event = new CustomEvent('perspective-changed', {detail: {perspective: this._perspective}});
            this.dispatchEvent(event);
        }
    }

    get perspective() {
        return this._perspective;
    }

    // aspect_ratio ('proxy' or a float)
    set aspect_ratio(value) {
        if (value != this._aspect_ratio) {
            this._aspect_ratio = value;
            const event = new CustomEvent('aspect-ratio-changed', {detail: {aspect_ratio: this._aspect_ratio}});
            this.dispatchEvent(event);
        }
    }

    get aspect_ratio() {
        return this._aspect_ratio;
    }

    // src
    set src(value) {
        this._src = value;
        // Update the source extension if the extension has not been set
        if ((value !== null) && (this.src_ext === null)) {
            this.src_ext = this.urlType(value);
        }
        if (this._render_instance !== null) this._render_instance.setSrc(value, this._src_ext);
        const event = new CustomEvent('src-changed', {
            detail: {
                src: this._src,
                ext: this._src_ext
            }
        });
        this.dispatchEvent(event);
    }

    get src() {
        return this._src;
    }

    // src_ext
    set src_ext(value) {
        if (value != this._src_ext) {
            this._src_ext = value;
        }
    }

    get src_ext() {
        return this._src_ext;
    }

    // proxy_img
    set proxy_img(value) {
        if (value != this._proxy_img) {
            this._proxy_img = value;
            let proxy_elem = this.querySelector('#proxy-img');
            proxy_elem.src = this._proxy_img;
            proxy_elem.style.height = '100%';
            proxy_elem.style.width = '100%';
            const event = new CustomEvent('proxy-img-changed', {detail: {proxy_img: this._proxy_img}});
            this.dispatchEvent(event);
        }
    }

    get proxy_img() {
        return this._proxy_img;
    }

    // proxy_only
    set proxy_only(value) {
        this._proxy_only = value;
    }

    get proxy_only() {
        return this._proxy_only;
    }

    get vr_support() {
        return this._vr_support;
    }

    get scene_scale() {
        return this._scene_scale;
    }

    set scene_translate(value) {
        if (typeof value === 'string' || value instanceof String) {
            this._scene_translate = eval(value);
        } else {
            this._scene_translate = value;
        }
    }

    get scene_translate() {
        return this._scene_translate;
    }
}

function define_component_after_scripts_load() {
    // Make sure that both the GLTFViewer and THREE scripts have loaded
    if (window['THREE'] && window['GLTFViewer']) {
        clearInterval(interval);
        if (window.customElements.get('ansys-nexus-viewer') === undefined) {
            window.customElements.define('ansys-nexus-viewer', AnsysNexusViewer);
        }
        if (window.customElements.get('ansys-adr-viewer') === undefined) {
            let AnsysADRViewer = class extends AnsysNexusViewer {};
            window.customElements.define('ansys-adr-viewer', AnsysADRViewer);
        }
    }
}



class EnVNCViewerGlue{constructor(parent){this._parent=parent;this._renderer=null;this._token='';}
internalRenderer(){return this._renderer;}
renderImage(){if(this._renderer){let rfb=this._renderer.rfb;return rfb.renderImage();}
return null;}
mouseIn(e){this._parent.refreshInstance();}
divID(){return'vnc-viewer-'+this._parent.guid;}
resizeRenderer(width,height){if(this._renderer===null)return;this._renderer.sendResizeCommand();}
setPerspective(on){if(this._renderer===null)return;}
parts(){if(this._renderer===null)return[];return this._renderer.parts();}
setSrc(url,extension){if(this._renderer===null)return;}
setActive(on){let renderDiv=this._parent.querySelector('#render-div');let token=null;if(!this._parent.renderer_options){this.displayError("Error starting session: Component needs renderer_options, containing a dict with http and ws entries for connecting to the web socket server.");return;}
let options_dict=null;try{options_dict=JSON.parse(this._parent.renderer_options);if(!options_dict){this.displayError("Error starting session: Component's renderer_options are empty or unreadable.");return;}}catch(e){this.displayError("Error starting session: Component's renderer_options could not be parsed as a dictionary.");return;}
if(options_dict["connect_to_running_ens"]!==true){if(options_dict["http"]===undefined||options_dict["ws"]===undefined){this.displayError("Error starting session: Component's renderer_options dict must contain entries named 'http' and 'ws'");return;}
if(on){let http_url=new URL(options_dict["http"]);http_url.pathname="/v1/reserve/local_envision";let parent_src=this._parent.src;let question_mark_loc=-1;if(parent_src){question_mark_loc=parent_src.indexOf('?');if(question_mark_loc>-1){parent_src=parent_src.substring(0,question_mark_loc);}
if(parent_src.endsWith(".evsn")||parent_src.endsWith(".csf")||parent_src.endsWith(".ply")||parent_src.endsWith(".stl")){http_url.pathname="/v1/reserve/local_envision";}else{http_url.pathname="/v1/reserve/local_ensight";}}
let separator="?";if(options_dict["extra_query_args"]!==undefined){http_url.search=http_url.search+separator+options_dict["extra_query_args"];separator="&";}
if(options_dict["security_token"]!==undefined){http_url.search=http_url.search+separator+"security_token="+options_dict["security_token"];separator="&";}
if(this._parent.src!==null){http_url.search=http_url.search+separator+"target_pathname="+this._parent.src;separator="&";}
fetch(http_url).then(function(response){if(!response.ok){throw new Error(response.statusText);}else{return response.json();}}).then(function(response_dict){token=response_dict["token"];if(!token){throw new Error("Bad response from session reservation");}
this._token=token;this.setupActiveDiv();let vncDiv=this._parent.querySelector('#'+this.divID());vncDiv.addEventListener('mouseenter',this.mouseIn.bind(this));let ws_url=new URL(options_dict["ws"]);if(!ws_url.search){ws_url.search="?token="+this._token;}else{ws_url.search+="&token="+this._token;}
if(options_dict["extra_query_args"]!==undefined){ws_url.search+=separator+options_dict["extra_query_args"];}
this.createRenderer(vncDiv,ws_url,http_url);}.bind(this)).catch((error)=>{this.displayError("Error activating session: "+error);});}else{if(this._renderer!==null){this._renderer.disconnect();this._renderer=null;}
if(this._token){let http_url=new URL(options_dict["http"]);http_url.pathname="/v1/release/"+this._token;fetch(http_url).then((response)=>{if(!response.ok){}}).catch((error)=>{this.displayError("Error deactivating session: "+error);});}
this._token='';renderDiv.innerHTML='';}}else{if(options_dict["ws"]===undefined){this.displayError("Error starting session: Component's renderer_options dict must contain entry named 'ws'");return;}
if(on){this.setupActiveDiv();let vncDiv=this._parent.querySelector('#'+this.divID());vncDiv.addEventListener('mouseenter',this.mouseIn.bind(this));let ws_url=new URL(options_dict["ws"]);if(options_dict["extra_query_args"]!==undefined){ws_url.search+="?"+options_dict["extra_query_args"];}
try{this.createRenderer(vncDiv,ws_url,null);}catch(error){this.displayError("Error activating session: "+error);}}else{if(this._renderer!==null){this._renderer.disconnect();this._renderer=null;}
this._token='';renderDiv.innerHTML='';}}}
createRenderer(vncDiv,ws_url,http_url){if(this._parent._ui=="none"){let load_promise=eval("import('/ansys242/nexus/novnc/app/envncbase.js')");load_promise.then(EnVNCBase=>{this._renderer=new EnVNCBase.default(vncDiv,ws_url,http_url);});}else{let load_promise=eval("import('/ansys242/nexus/novnc/app/envncsimpleviewer.js')");load_promise.then(EnVNCSimpleViewer=>{this._renderer=new EnVNCSimpleViewer.default(vncDiv,ws_url,http_url);});}}
displayError(err_str){let renderDiv=this._parent.querySelector('#render-div');renderDiv.innerHTML="<h1>"+err_str+"</h1>";}
setupActiveDiv(){let renderDiv=this._parent.querySelector('#render-div');renderDiv.innerHTML=`<style>#noVNC_fallback_error{z-index:1000;visibility:hidden;}#noVNC_fallback_error.noVNC_open{visibility:visible;}#noVNC_fallback_error>div{max-width:90%;padding:15px;transition:0.5s ease-in-out;transform:translateY(-50px);opacity:0;text-align:center;font-weight:bold;color:#fff;border-radius:10px;box-shadow:6px 6px 0px rgba(0,0,0,0.5);background:rgba(200,55,55,0.8);}#noVNC_fallback_error.noVNC_open>div{transform:translateY(0);opacity:1;}#noVNC_fallback_errormsg{font-weight:normal;}#noVNC_fallback_errormsg.noVNC_message{display:inline-block;text-align:left;font-family:monospace;white-space:pre-wrap;}#noVNC_fallback_error.noVNC_location{font-style:italic;font-size:0.8em;color:rgba(255,255,255,0.8);}#noVNC_fallback_error.noVNC_stack{max-height:50vh;padding:10px;margin:10px;font-size:0.8em;text-align:left;font-family:monospace;white-space:pre;border:1px solid rgba(0,0,0,0.5);background:rgba(0,0,0,0.2);overflow:auto;}#noVNC_transition{display:none;position:fixed;top:0;left:0;bottom:0;right:0;color:white;background:rgba(0,0,0,0.5);z-index:50;align-items:center;justify-content:center;flex-direction:column;}:root.noVNC_loading#noVNC_transition,:root.noVNC_connecting#noVNC_transition,:root.noVNC_disconnecting#noVNC_transition,:root.noVNC_reconnecting#noVNC_transition{display:flex;}:root:not(.noVNC_reconnecting)#noVNC_cancel_reconnect_button{display:none;}#noVNC_transition_text{font-size:1.5em;}.en_partlist{display:none;position:absolute;top:25px;left:4px;height:flex;max-height:50%;overflow-y:auto;color:black;background-color:rgba(255,255,255,.9);font-weight:bold;z-index:10;padding:3px 5px 4px 5px;border:thin solid black;}.en_partlist>*{pointer-events:auto;}.en_ui_toggle{display:none;position:absolute;top:2px;left:2px;width:20px;height:20px;background-color:transparent;}.en_ui_toggle>*{pointer-events:auto;}#video_controls{background-color:#F0F0F0;bottom:0;left:0;display:none;position:absolute;pointer-events:none;flex-direction:row;align-items:center;padding-top:2px;padding-bottom:2px;}#video_controls>*{pointer-events:auto;display:flex;flex-direction:row;align-items:center;}.slider{-webkit-appearance:none;min-width:150px;max-width:300px;height:2px;background:#d3d3d3;outline:none;opacity:0.7;-webkit-transition:.2s;transition:opacity.2s;}.slider:hover{opacity:1;}.slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:10px;height:18px;background:#007A98;cursor:pointer;}.slider::-moz-range-thumb{width:10px;height:18px;border-radius:0;background:#007A98;cursor:pointer;}.frame_label{min-width:50px;max-width:200px;margin-left:5px;margin-right:5px;color:#000;}#toggle_controls{bottom:0;right:0;display:none;position:absolute;pointer-events:none;background-color:#F0F0F0;flex-direction:row;align-items:center;padding-top:2px;padding-bottom:2px;}#toggle_controls>*{pointer-events:auto;display:flex;flex-direction:row;align-items:center;}.toggle_control_icon{margin-left:5px;}#ens_timestep_monitor{display:none;}</style>`+'<div class="ansys-nexus-viewer noVNC_loading" id="'+this.divID()+'">'+`<!--<div id="noVNC_fallback_error"class="noVNC_vcenter"><div><div>noVNC encountered an error:</div><br><div id="noVNC_fallback_errormsg"></div></div></div>--><!--EnSight UI toggle--><div id="ens_ui_toggle"class="en_ui_toggle"><img id='ens_ui_toggle_img'src='/ansys242/nexus/novnc/app/images/icons/menu_20_gray.png'/></div><!--EnSight part list--><div id="ens_partlist"class="en_partlist"><fieldset id="partlist"name="partlist"><legend>Part List</legend></fieldset></div><!--EnSight var list--><div id="ens_varlist"class="en_partlist"><fieldset id="varlist"name="varlist"><legend>Variable List</legend></fieldset></div><!--EnSight play/pause controls--><div id="video_controls"><input type="image"id="play-pause"
alt="Play/Pause"
src='/ansys242/nexus/novnc/app/images/icons/playf_off.svg'
playing='false'/><input type="range"id="seek-bar"class="slider"value="0"min="0"max="1000"/><label for="seek-bar"id="current-frame"class="frame_label">[1/1]</label></div><!--EnSight toggle controls--><div id="toggle_controls"><!--Toggle jump to end of timestep slider--><div id="ens_timestep_monitor"class="toggle_control_icon"><input type="image"alt="Jump to end of slider"
id="noVNC_timestep_monitor"
src="/ansys242/nexus/novnc/app/images/icons/play_once_mode.svg"
data-toggle="true"
title="Jump to end of slider"/></div><!--Toggle Overlay hidden lines--><div id="ens_hid_ln_toggle"class="toggle_control_icon"><input type="image"alt="Overlay hidden lines"
id="noVNC_hid_ln_button"
src="/ansys242/nexus/novnc/app/images/icons/ang10_Part_hiddenline_off.svg"
data-toggle="false"
title="Overlay hidden lines"/></div><!--Toggle Part Highlighting--><div id="ens_part_hl_toggle"class="toggle_control_icon"><input type="image"alt="Part Highlight"
src="/ansys242/nexus/novnc/app/images/icons/highlight3.svg"
data-toggle="false"
id="noVNC_hl_button"
title="Part Highlight"/></div><!--Fit geometry to viewport--><div id="ens_fit_viewport_btn"class="toggle_control_icon"><input type="image"alt="Fit the geometry to the current viewport"
src="/ansys242/nexus/novnc/app/images/icons/fit.svg"
id="noVNC_fit_viewport_btn"
title="Fit geometry to viewport"/></div><!--Reset view of current viewport--><div id="ens_reset_view_btn"class="toggle_control_icon"><input type="image"alt="Reset view"
src="/ansys242/nexus/novnc/app/images/icons/reset3.svg"
id="noVNC_reset_view_btn"
title="Reset view of current viewport"/></div><!--Toggle fullscreen--><div id="ens_fullscreen_toggle"class="toggle_control_icon"><input type="image"alt="Fullscreen"
src="/ansys242/nexus/novnc/app/images/fullscreen.svg"
id="noVNC_fullscreen_button"
title="Full screen"/></div></div><!--Status Dialog--><div id="noVNC_status"style="display:none;"></div><!--Transition Screens--><div id="noVNC_transition"><div id="noVNC_transition_text"></div><div><input type="button"id="noVNC_cancel_reconnect_button"value="Cancel"class="noVNC_submit"/></div><div class="noVNC_spinner"></div></div><div id="noVNC_container"><!--HTML5 Canvas--><div id="noVNC_screen"><canvas id="noVNC_canvas"width="0"height="0">Canvas not supported.</canvas></div></div></div>`;}}const vp_src=`uniform vec4 u_color;uniform vec4 u_viewportsize;attribute float pointradius;flat varying mat4 outProjectionMatrix;flat varying vec4 sphere_pos_r;flat varying vec4 glColor;varying vec4 glTexCoord[2];const float maxPointSize=500.0;vec2 getViewportSize(){return u_viewportsize.xy;}
void vp_program(void){mat4 glModelViewProjectionMatrix=projectionMatrix*modelViewMatrix;mat4 glModelViewMatrix=modelViewMatrix;const bool perVertexSizeFlag=false;const bool perVertexColorFlag=false;const bool perVertexTex1d=false;const bool perVertexAlphaTex1d=false;vec4 pointcolor=vec4(1.0,0.0,0.0,1.0);float sphradius=pointradius;float pointattrib=0.0;float pointalphaattrib=0.0;vec2 texcoord=vec2(1.0);const bool isAMDShader=false;vec4 worldpos=vec4(position.xyz,1.0);vec4 eyepos0=glModelViewMatrix*worldpos;vec4 eyepos=eyepos0;vec4 screenpos=glModelViewProjectionMatrix*worldpos;float pointsize,splatsize;{vec4 basepos0=eyepos;vec4 projCorner0=screenpos;vec2 viewport=getViewportSize();if(false){pointsize=sphradius*2.0;vec4 projCorner1=projCorner0;projCorner1.xy+=(texcoord/viewport)*(pointsize*projCorner0.w);vec4 basepos1=inverse(glModelViewProjectionMatrix)*projCorner1;basepos1/=basepos1.w;sphradius=length(basepos1.xyz-basepos0.xyz)*0.707;if(isAMDShader){screenpos=projCorner1;eyepos=glModelViewMatrix*basepos1;}}
else{mat4 glModelViewMatrixTranspose=transpose(glModelViewMatrix);vec3 dirx=normalize(glModelViewMatrixTranspose[0].xyz);vec3 diry=normalize(glModelViewMatrixTranspose[1].xyz);vec2 texaxis=texcoord*sphradius;vec4 basepos1=worldpos+vec4(dirx*texaxis.x+diry*texaxis.y,0.0);vec4 projCorner1=glModelViewProjectionMatrix*basepos1;vec4 diff=vec4(projCorner1.xy,projCorner0.xy)/vec4(projCorner1.ww,projCorner0.ww)*viewport.xyxy;diff.xy-=diff.zw;pointsize=max(diff.x,diff.y);if(isAMDShader){const float threshold=0.707;float veclen=length(diff.xy);if(veclen<threshold){diff.xy/=viewport*(veclen+1e-10);diff.xy*=threshold*projCorner1.w;projCorner1.xy=projCorner0.xy+diff.xy;}
screenpos=projCorner1;eyepos=glModelViewMatrix*basepos1;}}
splatsize=min(max(viewport.x,viewport.y),maxPointSize);}
gl_PointSize=clamp(pointsize,1.1,splatsize);gl_Position=screenpos;glColor=pointcolor;glTexCoord[0]=vec4(pointattrib,texcoord,0.0);glTexCoord[1]=vec4(0.0,0.0,pointalphaattrib,0.0);sphere_pos_r=vec4(eyepos0.xyz,sphradius);outProjectionMatrix=projectionMatrix;}
void main(void){vp_program();}`;const fp_src=`flat varying mat4 outProjectionMatrix;flat varying vec4 sphere_pos_r;flat varying vec4 glColor;varying vec4 glTexCoord[2];float square(float x){return x*x;}
float GGX(float NdotH,float alphaG){vec2 t=vec2(NdotH,alphaG);t*=t;return t.y/square(t.x*(t.y-1.0)+1.0);}
float getLightingGlobalAmbient(){return 0.05;}
float getLightingDiffuse(){return 0.8;}
float getLightingSpecular(){return 0.2;}
float getLightingRoughness(){return 0.1;}
vec3 getLightingF0(){return vec3(0.05);}
vec3 shadeVertex(vec3 vertex,vec3 normal,vec3 albedo,float ks_scale){vec3 ambient=albedo*getLightingGlobalAmbient();vec3 diffuse=albedo*getLightingDiffuse();float dotNL=abs(normal.z);vec3 specular;{float ks=getLightingSpecular()*0.5*ks_scale*ks_scale;vec3 kS=getLightingF0()*ks;float rough=getLightingRoughness();specular=kS*GGX(dotNL,rough);}
return ambient+(diffuse+specular)*dotNL;}
void fp_main(inout vec4 io_color,inout float io_z){const bool isAMDShader=false;mat4 glProjectionMatrix=outProjectionMatrix;vec2 texcoord=isAMDShader?glTexCoord[0].yz:gl_PointCoord*vec2(2.0,-2.0)-vec2(1.0,-1.0);float zz=1.0-dot(texcoord,texcoord);if(zz<0.0)discard;float sphere_radius=sphere_pos_r.w;vec3 sphere_pos=sphere_pos_r.xyz;float z=sqrt(zz);vec3 normal=vec3(texcoord,z);vec4 spos=vec4(sphere_pos+normal*sphere_radius,1.0);vec4 fpos=glProjectionMatrix*spos;io_z=0.5*(fpos.z/fpos.w)+0.5;io_z=mix(gl_DepthRange.near,gl_DepthRange.far,io_z);vec3 basecolor=io_color.xyz;float ks_scale=1.0;io_color.xyz=shadeVertex(sphere_pos,normal,basecolor,ks_scale);}
void main(void){vec4 c=glColor;float z=gl_FragCoord.z;fp_main(c,z);gl_FragColor=c;gl_FragDepth=z;}`;function createPointSpriteShaderMaterial(){const matobj={uniforms:{u_color:{value:new THREE.Color(0xe3e3e3)},u_viewportsize:{value:{x:100.0,y:100.0,z:0.0,w:0.0}}},vertexShader:vp_src,fragmentShader:fp_src};return new THREE.ShaderMaterial(matobj);}
class ThreeJSNode{constructor(id){this.id=id;this.hash="";this.threejs_node=null;this._is_loaded=false;this.visited=false;}
is_loaded(scene){return this._is_loaded;}
dispose(){if(this.threejs_node){if(this.threejs_node.parent){this.threejs_node.parent.remove(this.threejs_node);}
this.threejs_node=null;}}
_load_check(scene,map,id){if(!id)return true;const node=map.get(id);if(!node){console.log("Warning: "+id+" not found in: "+map);return false;}
return node.is_loaded(scene);}}
class ThreeJSArray extends ThreeJSNode{constructor(id){super(id);this.url="";this.type="";this.dimension=1;this.count=0;}
complete_load(array){if(this.type==="Int8Array"){this.threejs_node=new THREE.BufferAttribute(new Int8Array(array),this.dimension,false);}else if(this.type==="Uint8Array"){this.threejs_node=new THREE.BufferAttribute(new Uint8Array(array),this.dimension,false);}else if(this.type==="Int16Array"){this.threejs_node=new THREE.BufferAttribute(new Int16Array(array),this.dimension,false);}else if(this.type==="Uint16Array"){this.threejs_node=new THREE.BufferAttribute(new Uint16Array(array),this.dimension,false);}else if(this.type==="Float32Array"){this.threejs_node=new THREE.BufferAttribute(new Float32Array(array),this.dimension,false);}else if(this.type==="Int32Array"){this.threejs_node=new THREE.BufferAttribute(new Int32Array(array),this.dimension,false);}else if(this.type==="Uint32Array"){this.threejs_node=new THREE.BufferAttribute(new Uint32Array(array),this.dimension,false);}else if(this.type==="Float64Array"){this.threejs_node=new THREE.BufferAttribute(new Float64Array(array),this.dimension,false);}else{this.threejs_node=new THREE.BufferAttribute(new Float32Array(array),this.dimension,false);}
this.threejs_node.needsUpdate=true;this._is_loaded=true;}}
class ThreeJSMaterial extends ThreeJSNode{constructor(id){super(id);this.type="MeshPhongMaterial";this.color=16777215;this.ambient=16777215;this.emissive=0;this.specular=1118481;this.shininess=30.;this.opacity=1.;}}
class ThreeJSVarmapping extends ThreeJSNode{constructor(id){super(id);this.partcolor=0;this.undefcolor=0;this.dispUndefType=0;this.dispFringeLimitType=0;this.levels=[0,1];this.texcoords=[0,1];this.tmin=0.001;this.tmax=0.999;}
compute_texcoord1D(x){let n=this.levels.length;let t;if(x<=this.levels[0])
t=this.texcoords[0];else if(x>=this.levels[n-1])
t=this.texcoords[n-1];else{t=0.0;for(let i=1;i<n;i++){if(x<=this.levels[i]){let dx=(x-this.levels[i-1])/(this.levels[i]-this.levels[i-1]+1e-38);t=(1.0-dx)*this.texcoords[i-1]+dx*this.texcoords[i];break;}}}
if(t<this.tmin)t=this.tmin;else if(t>this.tmax)t=this.tmax;return t;}}
class ThreeJSTexture extends ThreeJSNode{constructor(id){super(id);this.texblock_id=null;this.array=null;this.width=0;this.height=0;this.depth=1;this.format=4;this.type=1;this.wrapmode=0;this.replacemode=0;this.name="";this.transparent=false;}
build_texture(){let tex_pow=1;while((2**tex_pow)<this.width)tex_pow+=1;const num_bytes=this.width*this.height*this.depth*this.format;const pixels=new Uint8Array(num_bytes);const raw=window.atob(this.array);if(num_bytes!=raw.length){pixels.fill(0xff);}else{for(let i=0;i<num_bytes;i+=4){pixels[i]=raw.charCodeAt(i);pixels[i+1]=raw.charCodeAt(i+1);pixels[i+2]=raw.charCodeAt(i+2);pixels[i+3]=raw.charCodeAt(i+3);if(pixels[i+3]!=255){this.transparent=true;}}}
let texture=new THREE.DataTexture(pixels,this.width,this.height);texture.format=THREE.RGBAFormat;texture.type=THREE.UnsignedByteType;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;}}
class ThreeJSVariable extends ThreeJSNode{constructor(id){super(id);this.varblock_id=null;this.name="";this.units="/";this.unitlabel="";this.transparent=false;this.mapping=new ThreeJSVarmapping(0);this.tex1d=new ThreeJSTexture(0);}
compute_texcoords1D(srcBufAttribute,dstBufAttribute){for(let i=0;i<srcBufAttribute.count;i++){let u=srcBufAttribute.getX(i);let t=this.mapping.compute_texcoord1D(u);dstBufAttribute.setX(i,t);dstBufAttribute.setY(i,0.5);}}}
class ThreeJSGeom extends ThreeJSNode{constructor(id){super(id);this.primitive="";this.bounds=null;this.conn_arr_id=null;this.coord_arr_id=null;this.norm_arr_id=null;this.varcoord_arr_id=null;this.pointradius_arr_id=null;this.variable_id=null;this.varmapping_id=null;this.avarmapping_id=null;this.tex1d_id=null;this.atex1d_id=null;this.tex2d_id=null;this.material_id=null;this.linewidth=1.;this.offset=false;}
is_loaded(scene){if(!this._load_check(scene,scene.arrays,this.conn_arr_id))return false;if(!this._load_check(scene,scene.arrays,this.coord_arr_id))return false;if(!this._load_check(scene,scene.arrays,this.norm_arr_id))return false;if(!this._load_check(scene,scene.arrays,this.varcoord_arr_id))return false;if(!this._load_check(scene,scene.arrays,this.pointradius_arr_id))return false;if(!this._load_check(scene,scene.variables,this.variable_id))return false;if(!this._load_check(scene,scene.varmappings,this.varmapping_id))return false;if(!this._load_check(scene,scene.varmappings,this.avarmapping_id))return false;if(!this._load_check(scene,scene.textures,this.tex1d_id))return false;if(!this._load_check(scene,scene.textures,this.atex1d_id))return false;if(!this._load_check(scene,scene.textures,this.tex2d_id))return false;if(!this._load_check(scene,scene.materials,this.material_id))return false;return true;}
get_bounds(scene){if(this.bounds===null)return null;let bounds=new THREE.Box3(new THREE.Vector3(this.bounds[0],this.bounds[1],this.bounds[2]),new THREE.Vector3(this.bounds[3],this.bounds[4],this.bounds[5]));return bounds;}
dispose(){let mesh=this.threejs_node;if(mesh.material.map){mesh.material.map.dispose();}
mesh.geometry.dispose();mesh.material.dispose();super.dispose();}
build_threejs_node(scene){if(this._is_loaded)return false;let mesh=this.threejs_node;if(!this.is_loaded(scene)){mesh.visible=false;return false;}
if(scene._verbose){console.log("Completing the node:",this);}
let geometry=mesh.geometry;this._bind_geom_array(geometry,scene.arrays,this.conn_arr_id,'connectivity',null,null);this._bind_geom_array(geometry,scene.arrays,this.coord_arr_id,'position',null,null);this._bind_geom_array(geometry,scene.arrays,this.norm_arr_id,'normal',null,null);this._bind_geom_array(geometry,scene.arrays,this.pointradius_arr_id,'pointradius',null,null);let variable_node=scene.variables.get(this.variable_id);let texture_mapping=false;if(variable_node&&this.varcoord_arr_id){const vararrnode=scene.arrays.get(this.varcoord_arr_id);if(vararrnode){const srcBufAtribute=vararrnode.threejs_node;let dstBufAttribute=new THREE.BufferAttribute(new Float32Array(srcBufAtribute.count*2),2,false);variable_node.compute_texcoords1D(srcBufAtribute,dstBufAttribute);dstBufAttribute.needsUpdate=true;geometry.setAttribute('uv',dstBufAttribute);texture_mapping=true;}}
let material=mesh.material;let material_node=scene.materials.get(this.material_id);if(material_node){if(this.offset){material.polygonOffset=true;material.polygonOffsetFactor=1.0;material.polygonOffsetUnits=4.0;}
if(this.primitive==="points"){material.uniforms.u_color=new THREE.Color(material_node.color);let w=window.innerWidth,h=window.innerHeight;console.log("Window size is ",w,",",h);material.uniforms.u_viewportsize.value=new THREE.Vector4(w,h,0,0);}else if(this.primitive==="lines"){material.color=material_node.color;material.linewidth=this.linewidth;material.opacity=material_node.opacity;material.transparent=(material_node.opacity<1.0);}else{if(!this.norm_arr_id){mesh.geometry.computeVertexNormals();}
material.color=new THREE.Color(material_node.color);material.ambient=new THREE.Color(material_node.ambient);material.emissive=new THREE.Color(material_node.emissive);material.specular=new THREE.Color(material_node.specular);material.shininess=material_node.shininess;material.opacity=material_node.opacity;material.transparent=(material_node.opacity<1.0);material.side=THREE.DoubleSide;material.flatShading=false;if(texture_mapping){material.map=variable_node.tex1d.build_texture();material.color=new THREE.Color(0xffffff);}}}
mesh.visible=true;this._is_loaded=true;return true;}
_bind_geom_array(geom,map,id,name,range,num_texels){if(!id)return;const arr=map.get(id);if(!arr)return;if(name==='connectivity'){geom.setIndex(arr.threejs_node);}else{let buffer_attribute=arr.threejs_node;if(range){buffer_attribute=buffer_attribute.clone();if(name==='uv'){let half_texel=1./num_texels;let min=range[0];let delta=range[1]-range[0];if(range[0]===range[1])delta=1.;delta=1.0/delta;delta=delta*(1.0-(2.0*half_texel));let max_tc=1.0-half_texel;for(let i=0;i<buffer_attribute.count;i++){let u=buffer_attribute.getX(i);if(u<range[0])u=range[0];if(u>range[1])u=range[1];u=(u-min)*delta+half_texel;buffer_attribute.setX(i,u);}}
buffer_attribute.needsUpdate=true;}
geom.setAttribute(name,buffer_attribute);}}}
class ThreeJSPart extends ThreeJSNode{constructor(id){super(id);this.name=name;this.geoms=[];}
is_loaded(scene){for(const geom_id of this.geoms){if(!this._load_check(scene.geoms,geom_id))return false;}
return true;}
get_bounds(scene){let bounds=new THREE.Box3();for(const geom_id of this.geoms){let geom_bounds=scene.geoms.get(geom_id).get_bounds(scene);if(geom_bounds===null)return null;bounds.expandByPoint(geom_bounds.min);bounds.expandByPoint(geom_bounds.max);}
return bounds;}}
class ThreeJSScene{constructor(parent){this._parent=parent;this.parts=new Map();this.geoms=new Map();this.variables=new Map();this.varmappings=new Map();this.textures=new Map();this.materials=new Map();this.arrays=new Map();this.unitsystem="SI";this.unitlabel_length="";this.json_root=null;this.loader_root=null;this._list_to_load=[];this._verbose=false;}
reset(){this.reset_json_root();this.reset_loader_root();this.unit_system="SI";this.unitlabel_length="";}
reset_loader_root(){if(this.loader_root){this._parent._scene.remove(this.loader_root);}
this.loader_root=null;}
reset_json_root(){if(this.json_root){for(const part of this.parts){part[1].dispose();}
for(const geom of this.geoms){geom[1].dispose();}
for(const variable of this.variables){variable[1].dispose();}
for(const material of this.materials){material[1].dispose();}
for(const varmap of this.varmappings){varmap[1].dispose();}
for(const tex of this.textures){tex[1].dispose();}
for(const array of this.arrays){array[1].dispose();}
this.parts.clear();this.geoms.clear();this.variables.clear();this.varmappings.clear();this.textures.clear();this.materials.clear();this.arrays.clear();this._parent._scene.remove(this.json_root);}
this.json_root=null;}
reset_visitors(){for(const part of this.parts){part[1].visited=false;}
for(const geom of this.geoms){geom[1].visited=false;}
for(const variable of this.variables){variable[1].visited=false;}
for(const varmap of this.varmappings){varmap[1].visited=false;}
for(const tex of this.textures){tex[1].visited=false;}
for(const material of this.materials){material[1].visited=false;}
for(const array of this.arrays){array[1].visited=false;}}
_keep_visited(map){for(const item of map){if(item[1].visited)continue;item[1].dispose();map.delete(item[0]);}}
prune_visitors(){this._keep_visited(this.parts);this._keep_visited(this.geoms);this._keep_visited(this.variables);this._keep_visited(this.varmappings);this._keep_visited(this.textures);this._keep_visited(this.materials);this._keep_visited(this.arrays);this._postEvent("parts-changed",{});}
loadData(url,extension){let gltf_load=false;if(extension!==null){for(const ext of["glb","gltf"]){if((extension.toLowerCase()===ext)||url.endsWith(ext)){gltf_load=true;break;}}}
if(gltf_load){this._parent._parent.loadingStatus(true);const loader=new THREE.GLTFLoader();const dracoLoader=new THREE.DRACOLoader();dracoLoader.setDecoderPath('/ansys242/nexus/threejs/libs/draco/');loader.setDRACOLoader(dracoLoader);loader.load(url,this._gltfLoadComplete.bind(this));}else{this._parent._parent.loadingStatus(true);fetch(url).then((response)=>{if(response.status===200){return response.json();}else{alert("Unable to fetch data from:"+url+" ("+response.status+")");this._parent._parent.loadingStatus(false);}}).then(this._loadedJSON.bind(this)).catch((error)=>{alert("Unable to process data from: "+url+" ("+error+")");this._parent._parent.loadingStatus(false);});}}
_gltfLoadComplete(gltf){this.reset();this._normalizeSceneBounds(gltf.scene,null);this.loader_root=gltf.scene;this._parent._scene.add(gltf.scene);this._parent._render();this._parent._parent.loadingStatus(false);this._postEvent("parts-changed",{});}
_normalizeSceneBounds(root,bounds){root.scale.set(1.,1.,1.);root.position.set(0.,0.,0.);let bbox=bounds;if(bounds===null){bbox=new THREE.Box3();bbox.setFromObject(root);}
const cent=bbox.getCenter(new THREE.Vector3());if(this._parent._parent.scene_scale==0.){const size=bbox.getSize(new THREE.Vector3());const maxAxis=Math.max(size.x,size.y,size.z);root.scale.multiplyScalar(1.0/maxAxis);}else if(this._parent._parent.scene_scale>0.){root.scale.multiplyScalar(1.0/this._parent._parent.scene_scale);}
bbox.setFromObject(root);bbox.getCenter(cent);cent.multiplyScalar(-1.);let base_point=new THREE.Vector3(0.,0.,0.);if(this._parent._parent.scene_translate){base_point.set(this._parent._parent.scene_translate[0],this._parent._parent.scene_translate[1],this._parent._parent.scene_translate[2]);}
cent.add(base_point);root.position.copy(cent);}
_loadedJSON(json){this.reset_loader_root();this.reset_visitors();if(this.json_root===null){this.json_root=new THREE.Group();this._parent._scene.add(this.json_root);}
if(this._verbose){console.log("JSON loaded:",json);}
this._validate_metadata(json);this._parse_arrays(json.arrays);this._parse_materials(json.materials);this._parse_variables(json.variables);this._parse_textures(json.textures);this._parse_geoms(json.geoms);this._parse_parts(json.parts);this.prune_visitors();this._parent._render();if(!this._list_to_load.length){this._parent._parent.loadingStatus(false);}}
_loadedNode(node,array){if(array!==null){node.complete_load(array);}
const index=this._list_to_load.indexOf(node);if(index>-1){this._list_to_load.splice(index,1);}
if(this._verbose){console.log("Loaded:",node)}
let refresh=false;for(const geom of this.geoms.values()){refresh|=geom.build_threejs_node(this);}
if(refresh)this._parent._render();if(this._list_to_load.length==0){this._parent._parent.loadingStatus(false);}}
_add_update(node){if(!node.hasOwnProperty("url")){node._is_loaded=true;return;}
node._is_loaded=false;this._list_to_load.push(node);fetch(node.url).then((response)=>{if(response.status===200){return response.arrayBuffer();}else{alert("Unable to fetch data from:"+node.url+" ("+response.status+")");this._parent._parent.loadingStatus(false);return null;}}).then(this._loadedNode.bind(this,node)).catch((error)=>{alert("Unable to process data from: "+node.url+" ("+error+")");this._parent._parent.loadingStatus(false);});}
_parse_arrays(items){for(const item of items){let array=this.arrays.get(item.hash);let rebuild=false;if(!array){array=new ThreeJSArray(item.hash);this.arrays.set(item.hash,array);rebuild=true;}else if(array.hash!=item.hash){rebuild=true;}
if(rebuild){array.hash=item.hash;array.url=item.url;array.type=item.type;array.dimension=item.dimension;array.count=item.count;this._add_update(array);}
array.visited=true;}}
_parse_materials(items){if(!items)return;for(const item of items){let material=this.materials.get(item.id);let rebuild=false;if(!material){material=new ThreeJSMaterial(item.id);this.materials.set(item.id,material);rebuild=true;}else if(material.hash!=item.hash){rebuild=true;}
if(rebuild){material.hash=item.hash;if(item.type!=="MeshPhongMaterial"){console.log("Unknown material type: ",item.type);}else{material.color=item.color;material.ambient=item.ambient;material.emissive=item.emissive;material.specular=item.specular;material.shininess=item.shininess;material.opacity=item.opacity;}
material._is_loaded=true;}
material.visited=true;}}
_parse_variables(items){if(!items)return;for(const item of items){let variable=this.variables.get(item.id);let rebuild=false;if(!variable){variable=new ThreeJSVariable(item.id);this.variables.set(item.id,variable);variable.threejs_node=null;rebuild=true;}else if(variable.hash!=item.hash){rebuild=true;}
if(rebuild){variable.hash=item.hash;variable.name=item.name;variable.units=item.units;variable.unitlabel=item.unitlabel;variable._is_loaded=true;if(variable.tex1d){variable.tex1d.width=item.width;variable.tex1d.height=item.height;variable.tex1d.array=item.array;}
if(variable.mapping){variable.mapping.levels=item.levels;variable.mapping.texcoords=item.texcoords_range;variable.mapping.tmin=variable.mapping.texcoords[0];variable.mapping.tmax=variable.mapping.texcoords[variable.mapping.texcoords.length-1];}}
variable.visited=true;}}
_parse_textures(items){if(!items)return;for(const item of items){let tex=this.textures.get(item.id);let rebuild=false;if(!tex){tex=new ThreeJSTexture(item.id);this.textures.set(item.id,tex);tex.threejs_node=new THREE.Texture();rebuild=true;}else if(tex.hash!=item.hash){rebuild=true;}
if(rebuild){tex.hash=item.hash;tex.array=item.array;tex.width=item.width;tex.height=item.height;tex.depth=item.depth;tex.format=item.format;tex.type=item.type;tex.wrapmode=item.wrapmode;tex.replacemode=item.replacemode;tex._is_loaded=true;}
variable.visited=true;}}
_parse_varmappings(items){if(!items)return;for(const item of items){let varmap=this.varmappings.get(item.id);let rebuild=false;if(!varmap){varmap=new ThreeJSVarmapping(item.id);this.variables.set(item.id,varmap);varmap.threejs_node=null;rebuild=true;}else if(varmap.hash!=item.hash){rebuild=true;}
if(rebuild){varmap.hash=item.hash;varmap.partcolor=item.partcolor;varmap.undefcolor=item.undefcolor;varmap.dispUndefType=item.dispUndefType;varmap.dispFringeLimitType=item.dispFringeLimitType;varmap.levels=item.levels;varmap.texcoords=item.texcoords;varmap.tmin=item.tmin;varmap.tmax=item.tmax;varmap._is_loaded=true;}
varmap.visited=true;}}
_parse_geoms(items){if(!items)return;for(const item of items){let geom=this.geoms.get(item.id);let rebuild=false;if(!geom){geom=new ThreeJSGeom(item.id);this.geoms.set(item.id,geom);rebuild=true;}else if(geom.hash!=item.hash){rebuild=true;}
if(rebuild){geom.linewidth=item.linewidth||1.;geom.offset=item.offset||false;geom.hash=item.hash;if(geom.primitive!==item.primitive){if(item.primitive==="points"){geom.threejs_node=new THREE.Points();geom.threejs_node.material=createPointSpriteShaderMaterial();}else if(item.primitive==="lines"){geom.threejs_node=new THREE.LineSegments();geom.threejs_node.material=new THREE.LineBasicMaterial();}else{geom.threejs_node=new THREE.Mesh();geom.threejs_node.material=new THREE.MeshPhongMaterial();}
geom.primitive=item.primitive;}
const attrnames=["conn_arr_id","coord_arr_id","norm_arr_id","varcoord_arr_id","pointradius_arr_id","variable_id","material_id","tex1d_id"];let id_changed=false;for(const name of attrnames){if(geom[name]!=item[name])id_changed=true;geom[name]=item[name];}
geom.bounds=item.bounds;if(!geom.is_loaded(this)){geom._is_loaded=false;if(geom.threejs_node)geom.threejs_node.visible=false;}else if(id_changed){geom._is_loaded=false;geom.build_threejs_node(this);}else{geom._is_loaded=true;if(geom.threejs_node)geom.threejs_node.visible=true;}}
geom.visited=true;}}
_parse_parts(items){if(!items)return;let some_changed=false;for(const item of items){let part=this.parts.get(item.id);let rebuild=false;if(!part){part=new ThreeJSPart(item.id);this.parts.set(item.id,part);part.threejs_node=new THREE.Group();this.json_root.add(part.threejs_node);rebuild=true;some_changed=true;}else if(part.hash!=item.hash){rebuild=true;some_changed=true;}
if(rebuild){part.hash=item.hash;part.name=item.name;part.threejs_node.name=item.name;part.geoms=item.geoms;part.threejs_node.clear();for(const geom_id of part.geoms){part.threejs_node.add(this.geoms.get(geom_id).threejs_node);}
part._is_loaded=true;this._postEvent("parts-changed",{});}
part.visited=true;}
if(some_changed){let bounds=this._JSON_bounds();this._normalizeSceneBounds(this.json_root,bounds);}}
_validate_metadata(json){if(!("metadata"in json)){throw"Incorrectly formatted geometry file.";}
if(json.metadata.magic!=="sgeo"){throw"Geometry file is not in the correct schema.";}
this.unitsystem=json.metadata.unitsystem||"";this.unitlabel_length=json.metadata.unitlabel_length||"";for(const name of["arrays","materials","variables","geoms","parts"]){if(!Array.isArray(json[name])){throw"Geometry file is not in the correct schema.";}}}
_JSON_bounds(){let bounds=new THREE.Box3();for(const item of this.parts){let part_box=item[1].get_bounds(this);if(part_box===null)return null;bounds.expandByPoint(part_box.min);bounds.expandByPoint(part_box.max);}
return bounds;}
_postEvent(name,details){if(this._parent._renderer===null)return;const parts_event=new CustomEvent(name,{bubbles:true,detail:details});const canvas=this._parent._renderer.domElement;canvas.dispatchEvent(parts_event);}}
class ThreeJSViewerGlue{constructor(parent){this._parent=parent;this._renderer=null;this._resizeObserver=null;this._visibilityObserver=null;this._visible_reset=false;this._scene=null;this._camera=null;this._light=null;this._webgl_support=null;this._scene_handler=new ThreeJSScene(this);}
internalRenderer(){return this;}
renderImage(){if(this._renderer){this._renderer.render(this._scene,this._camera);return this._renderer.domElement.toDataURL();}
return null;}
mouseIn(e){this._parent.refreshInstance();}
divID(){return'three-div-'+this._parent.guid;}
canvasID(){return'three-canvas-'+this._parent.guid;}
resizeRenderer(width,height){if(this._renderer===null)return;this._resizeCanvasToDisplaySize();}
setPerspective(on){if(this._renderer===null)return;}
parts(){if(this._renderer===null)return[];let part_list=[];for(const part of this._scene_handler.parts){part_list.push(part[1].name);}
return part_list;}
setSrc(url,extension){if(this._renderer===null)return;if(!url)return;this._scene_handler.loadData(url,extension);}
setActive(on){let renderDiv=this._parent.querySelector('#render-div');if(on){if(this._webgl_support===null)this._webgl_support=webgl_support();if(this._webgl_support){let inner='<div class="ansys-nexus-viewer" id="'+this.divID()+'">\n';inner+='<canvas id="'+this.canvasID()+'" tabIndex="0" style="margin:0;padding:0;border:0;"></canvas>\n';inner+='</div';renderDiv.innerHTML=inner;let threeDiv=this._parent.querySelector('#'+this.divID());threeDiv.addEventListener('mouseenter',this.mouseIn.bind(this));let threeCanvas=this._parent.querySelector('#'+this.canvasID());threeCanvas.style.background='radial-gradient(#e6e6e6, #c8c8d8)';this._scene=new THREE.Scene();this._scene.background=null;this._camera=new THREE.PerspectiveCamera(45,2.0,0.01,2000.);this._camera.position.z=2.5;this._renderer=new THREE.WebGLRenderer({canvas:threeCanvas,alpha:true});if(this._parent.vr_support==='enable'){renderDiv.appendChild(VRButton.createButton(this._renderer));this._renderer.xr.enabled=true;this._renderer.setAnimationLoop(this._render.bind(this));}
this._controls=new THREE.ArcballControls(this._camera,this._renderer.domElement,this._scene);this._controls.addEventListener('change',this._render.bind(this));this._controls.setGizmosVisible(false);this._controls.setCamera(this._camera);this._light=new THREE.PointLight(0xffffff,1.25,0.);this._lightUpdate();this._controls.addEventListener('change',this._lightUpdate.bind(this));this._scene.add(this._light);const length=0.12;const cone_len=0.035;const cone_base=0.020;this._triad=new THREE.AxesHelper(0.01);this._overlay(this._triad);const origin=new THREE.Vector3(0,0,0);const X=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),origin,length,0xff0000,cone_len,cone_base);this._overlay(X.line);this._overlay(X.cone);this._triad.add(X);const Y=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),origin,length,0x00ff00,cone_len,cone_base);this._overlay(Y.line);this._overlay(Y.cone);this._triad.add(Y);const Z=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),origin,length,0x0000ff,cone_len,cone_base);this._overlay(Z.line);this._overlay(Z.cone);this._triad.add(Z);this._scene.add(this._triad);this.setSrc(this._parent.src,this._parent.src_ext);this.setPerspective(this._parent.perspective);try{this._resizeObserver=new ResizeObserver(this._resizeCanvasToDisplaySize.bind(this));this._resizeObserver.observe(threeDiv,{box:'content-box'});this._visible_reset=false;this._visibilityObserver=new IntersectionObserver(this._canvasVisibilityChanged.bind(this));this._visibilityObserver.observe(renderDiv);}catch(error){}
threeCanvas.addEventListener('keydown',(e)=>{this._controls.reset();this._lightUpdate();this._render();});this._render();}else{renderDiv.innerHTML='<div class="ansys-nexus-viewer" id="'+this.divID()+'"></div>';let threeDiv=this._parent.querySelector('#'+this.divID());threeDiv.innerHTML='<em>Warning: WebGL is not supported by this browser.<br>3D interactive geometry will not be displayed.</em>';}}else{if(this._resizeObserver){this._resizeObserver.disconnect();this._resizeObserver=null;}
if(this._visibilityObserver){this._visibilityObserver.disconnect();this._visibilityObserver=null;}
this._renderer=null;this._scene=null;this._camera=null;this._light=null;this._data_root=null;renderDiv.innerHTML='';}}
_overlay(mesh){mesh.renderOrder=9999;mesh.onBeforeRender=function(renderer){renderer.clearDepth();};}
_lightUpdate(){this._light.position.copy(this._camera.position);}
_render(){if(this._triad){if(this._renderer.xr&&this._renderer.xr.isPresenting){this._triad.visible=false;}else{this._triad.visible=true;const localToCameraAxesPlacement=new THREE.Vector3(0.6*this._camera.aspect,-0.6,-2);this._camera.updateMatrixWorld();const axesPlacement=this._camera.localToWorld(localToCameraAxesPlacement.clone());this._triad.position.copy(axesPlacement);}}
if(this._renderer.xr&&this._renderer.xr.isPresenting){this._lightUpdate();}
this._renderer.render(this._scene,this._camera);}
_resizeCanvasToDisplaySize(){if(!this._renderer)return;const canvas=this._renderer.domElement;const width=canvas.parentElement.clientWidth;const height=canvas.parentElement.clientHeight;this._renderer.setSize(width,height,false);this._camera.aspect=width/height;this._camera.updateProjectionMatrix();this._renderer.render(this._scene,this._camera);}
_canvasVisibilityChanged(entries,observer){if(!this._renderer)return;if(this._parent.offsetParent===null){this._visible_reset=false;return;}
if(this._visible_reset)return;if(entries[0].isIntersecting){this._visible_reset=true;this._lightUpdate();this._render();}}}