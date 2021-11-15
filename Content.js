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
                reject();
            }
        }, 200);
    });
 }

const State = {
    BtnBranchBtn_isTextHoverActive: {
        source: false,
        target: false
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
waitForElement(".pr-header-branches", 9000).then(() => {
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          onUrlChange();
        }
      }).observe(document, {subtree: true, childList: true});
      
      if (hasReloadedPage()) {
          onUrlChange();
      }
})

function hasReloadedPage() {
    return window.performance.getEntriesByType("navigation") && window.performance.getEntriesByType("navigation")[0].type === 'reload';
}

function isButtonRendered() {
    return !!document.getElementById("azure-utils-ext-src-branch-btn");
}

function onUrlChange() {
    try {
        const isPullRequestURL = location.href.split('/').some((urlSection) => urlSection === 'pullrequest');
        if (isPullRequestURL && !isButtonRendered()) {
            addPullRequestButtons();
        }
    } catch (error) {
        console.warn('[Azure Utils Chrome Extension] An unexpected error ocurred. ', error);        
    }
}


function addPullRequestButtons() {
    const buttonHTML = (branchType) => {
    return `<div id="azure-utils-ext-${branchType}-branch-btn" style="position: relative;" title="Copy ${branchType} branch to clipboard" class="bolt-clipboard-button hash-copy-button repos-commit-header-hash"><button aria-label="Copy to clipboard" class="bolt-button bolt-icon-button enabled subtle icon-only bolt-focus-treatment" data-focuszone="" data-is-focusable="true" role="button" tabindex="0" type="button"><span aria-hidden="true" class="left-icon flex-noshrink fabric-icon ms-Icon--Copy medium">${buttonTextHoverHTML(branchType)}</span></button></div>`
    } 

    const buttonTextHoverHTML = (branchType) => {
        return `<div id="azure-utils-ext-${branchType}-branch-btn-text-hover" class="bolt-tooltip bolt-callout absolute flex-row" id="__bolt-tooltip-24" style="display: none;" role="tooltip"><div class="bolt-callout-content" role="tooltip"><div class="bolt-tooltip-content body-m">Copied ${branchType} to Clipboard!</div></div></div>`
    }

    const PR_HeaderElement = document.getElementsByClassName("pr-header-branches")[0]
    PR_HeaderElement.children[0].insertAdjacentHTML('afterEnd',buttonHTML("source"));
    PR_HeaderElement.children[PR_HeaderElement.children.length-1].insertAdjacentHTML('afterEnd',buttonHTML("target"));

    const srcBranchBtnElement = document.getElementById("azure-utils-ext-source-branch-btn");
    const targetBranchBtnElement = document.getElementById("azure-utils-ext-target-branch-btn");
    const btnCustomStyles = "margin: 0px 4px 0px 3px; width: 40px; display: inline; padding: 2px 3px; color: var(--text-primary-color,rgba(0, 0, 0, 0.9)); cursor: pointer;";
    const buttonTextHoverCSS = "white-space: nowrap; left: 1em; bottom: -1em; position: absolute; z-index: 9; vertical-align: middle; line-height: normal;";
    
    function configureBtnForBranch(aBranch, prHeaderChild, branchType) {
        aBranch.style = btnCustomStyles; 

        aBranch.addEventListener('click', _ => {
            if (!State.isTextHoverActive(branchType)) {
                State.setTextHoverAsActive(branchType);
                document.getElementById(`azure-utils-ext-${branchType}-branch-btn-text-hover`).style = `${buttonTextHoverCSS} animation: tooltip-fade-in 300ms ease-in;`;
    
                if (PR_HeaderElement.children[prHeaderChild]) {
                    navigator.clipboard.writeText(PR_HeaderElement.children[prHeaderChild].innerHTML);
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

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'b') {
            srcBranchBtnElement.click();
        }
    });

    configureBtnForBranch(srcBranchBtnElement, 0, "source");
    configureBtnForBranch(targetBranchBtnElement, PR_HeaderElement.children.length-2, "target");
}
