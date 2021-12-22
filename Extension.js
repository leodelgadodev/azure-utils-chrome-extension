// import { waitForElement } from "./Utils";
// import { azureUtilsExtState } from "./State.mjs";

/**
* Wait for an element before resolving a promise
* @param {String} querySelector - Selector of element to wait for
* @param {Integer} timeout - Milliseconds to wait before timing out, or 0 for no timeout              
*/
function waitForElement(querySelector, timeout=0) {
    const startTime = new Date().getTime();
    return new Promise((resolve, reject)=>{
        const timer = setInterval(()=>{
            const now = new Date().getTime();
            if(document.querySelector(querySelector)){
                clearInterval(timer);
                resolve();
            }else if(timeout && now - startTime >= timeout){
                clearInterval(timer);
                reject(querySelector);
            }
        }, 200);
    });
 }

const State = {
    BtnBranchBtn_isTextHoverActive: {
        source: false,
        target: false,
        'created-branch': false
    },
    isTextHoverActive: (branchType) => {
        return State.BtnBranchBtn_isTextHoverActive[branchType];
    },
    setTextHoverAsActive: (branchType) => {
        State.BtnBranchBtn_isTextHoverActive[branchType] = true;
    },
    setTextHoverAsInative: (branchType) => {
        State.BtnBranchBtn_isTextHoverActive[branchType] = false;
    }
}

let lastUrl = location.href; 
new MutationObserver(() => { // fixes extension loading only once when visiting azure
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        waitForCreatePrMessagebar();
        waitForPullRequestPage();
    }
}).observe(document, {subtree: true, childList: true});
    
if (hasReloadedPage()) {
    waitForCreatePrMessagebar();
    waitForPullRequestPage();
}


function waitForCreatePrMessagebar() {
    if (isGitRepositoryUrl()) {
        waitForElement(".bolt-messagebar.severity-info", 8000).then(() => { // fixes first visit not loading extension
            onUrlChangeForCreatePR();
        }).catch((querySelector) => {
            console.warn(`[Azure Devops Utils Extension] Element ${querySelector} not found.`)
        })
    }
}

function waitForPullRequestPage() {
    if (isPullRequestPageUrl()) {
        waitForElement(".pr-header-branches", 9000).then(() => { // fixes first visit not loading extension
            onUrlChange();
        }).catch((querySelector) => {
            console.warn(`[Azure Devops Utils Extension] Element ${querySelector} not found.`)
        })
    }
}

function onUrlChangeForCreatePR() {
    if (hasCreatePrMessagebar() && !isCreatePRCopyBranchBtnRendered()) {
        const createPR_branchUrl = document.getElementsByClassName('monospaced-text bolt-link')[0]
        createPR_branchUrl.insertAdjacentHTML('afterEnd', buttonHTML("created-branch", 'display: inline-block;'));
        const createPrBranchBtnElement = document.getElementById("azure-utils-ext-created-branch-branch-btn");
        configureBtnFor(createPrBranchBtnElement, undefined, "created-branch", createPR_branchUrl);
    }
}

function hasReloadedPage() {
    return window.performance.getEntriesByType("navigation") && window.performance.getEntriesByType("navigation")[0].type === 'reload';
}

function isGitRepositoryUrl() {
    return location.href.split('/').some((urlSection) => urlSection === '_git');
}

function isPullRequestPageUrl() {
    return location.href.split('/').some((urlSection) => urlSection === 'pullrequest');
}

function isCopyBranchBtnRendered() { // fixes button rendering multiple times
    return !!document.getElementById("azure-utils-ext-source-branch-btn");
}

function isCreatePRCopyBranchBtnRendered() {
    return !!document.getElementById("azure-utils-ext-created-branch-branch-btn");
}

function hasCreatePrMessagebar() {
    return document.getElementsByClassName('monospaced-text bolt-link')[0] !== undefined
}

function onUrlChange() {
    try {
        if (!isCopyBranchBtnRendered()) {
            addPullRequestButtons();
        }

    } catch (error) {
        console.warn('[Azure Utils Chrome Extension] An unexpected error ocurred. ', error);        
    }
}

function buttonHTML(branchType, customCSS) {
    return `<div id="azure-utils-ext-${branchType}-branch-btn" style="position: relative; ${customCSS}" title="Copy branch to clipboard" class="bolt-clipboard-button hash-copy-button repos-commit-header-hash"><button aria-label="Copy to clipboard" class="bolt-button bolt-icon-button enabled subtle icon-only bolt-focus-treatment" data-focuszone="" data-is-focusable="true" role="button" tabindex="0" type="button"><span aria-hidden="true" class="left-icon flex-noshrink fabric-icon ms-Icon--Copy medium">${buttonTextHoverHTML(branchType)}</span></button></div>`
} 

function buttonTextHoverHTML(branchType) {
    return `<div id="azure-utils-ext-${branchType}-branch-btn-text-hover" class="bolt-tooltip bolt-callout absolute flex-row" id="__bolt-tooltip-24" style="display: none;" role="tooltip"><div class="bolt-callout-content" role="tooltip"><div class="bolt-tooltip-content body-m">Copied ${branchType} to Clipboard!</div></div></div>`
}


function addPullRequestButtons() {
    const PR_HeaderElement = document.getElementsByClassName("pr-header-branches")[0]
    PR_HeaderElement.children[0].insertAdjacentHTML('afterEnd',buttonHTML("source"));
    PR_HeaderElement.children[PR_HeaderElement.children.length-1].insertAdjacentHTML('afterEnd',buttonHTML("target"));

    const srcBranchBtnElement = document.getElementById("azure-utils-ext-source-branch-btn");
    const targetBranchBtnElement = document.getElementById("azure-utils-ext-target-branch-btn");

    configureBtnFor(srcBranchBtnElement, 0, "source", PR_HeaderElement);
    configureBtnFor(targetBranchBtnElement, PR_HeaderElement.children.length-2, "target", PR_HeaderElement);

    document.addEventListener('keydown', e => {
        if (srcBranchBtnElement !== null && e.ctrlKey && e.key === 'b') {
            srcBranchBtnElement.click();
        } else {
            console.warn('[Azure Devops Utils Extension] unable to use Ctrl+B shortcut, is html element rendered?')
        }
    });
}

function configureBtnFor(aBranch, prHeaderChild, branchType, branchTextHTML) {
    aBranch.style = "margin: 0px 4px 0px 3px; width: 40px; display: inline; padding: 2px 3px; color: var(--text-primary-color,rgba(0, 0, 0, 0.9)); cursor: pointer;";; 
    const buttonTextHoverCSS = "white-space: nowrap; left: 1em; bottom: -1em; position: absolute; z-index: 9; vertical-align: middle; line-height: normal;";
    
    aBranch.addEventListener('click', _ => {
        if (!State.isTextHoverActive(branchType)) {
            State.setTextHoverAsActive(branchType);
            document.getElementById(`azure-utils-ext-${branchType}-branch-btn-text-hover`).style = `${buttonTextHoverCSS} animation: tooltip-fade-in 300ms ease-in;`;

            if (prHeaderChild !== undefined && branchTextHTML.children[prHeaderChild]) {
                navigator.clipboard.writeText(branchTextHTML.children[prHeaderChild].innerHTML);
            } else {
                navigator.clipboard.writeText(branchTextHTML.innerHTML);
            }
            
            setTimeout(() => {
                document.getElementById(`azure-utils-ext-${branchType}-branch-btn-text-hover`).style = `${buttonTextHoverCSS} animation: tooltip-fade-out 300ms ease-in;`;
                setTimeout(() => {
                    document.getElementById(`azure-utils-ext-${branchType}-branch-btn-text-hover`).style = "display: none;";
                    State.setTextHoverAsInative(branchType);
                }, 300)
            }, 900)
        }
    });
}


