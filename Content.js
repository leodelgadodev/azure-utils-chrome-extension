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
    const buttonHTML = (tagId, branchType) => {
    return `<div id=${tagId} title="Copy ${branchType} branch to clipboard" class="bolt-clipboard-button hash-copy-button repos-commit-header-hash"><button aria-label="Copy to clipboard" class="bolt-button bolt-icon-button enabled subtle icon-only bolt-focus-treatment" data-focuszone="" data-is-focusable="true" role="button" tabindex="0" type="button"><span aria-hidden="true" class="left-icon flex-noshrink fabric-icon ms-Icon--Copy medium"></span></button></div>`
    } 

    const buttonTextHoverHTML = (tagId, branchType) => {
        return `<div id=${tagId} class="bolt-tooltip bolt-callout absolute flex-row" id="__bolt-tooltip-24" role="tooltip" style="left: 5%; top: 5%; position: absolute; z-index: 9;"><div class="bolt-callout-content" role="tooltip"><div class="bolt-tooltip-content body-m">Copied ${branchType} to Clipboard!</div></div></div>`
    }

    const PR_HeaderElement = document.getElementsByClassName("pr-header-branches")[0]
    PR_HeaderElement.children[0].insertAdjacentHTML('afterEnd',buttonHTML("azure-utils-ext-src-branch-btn", "source"));
    PR_HeaderElement.children[PR_HeaderElement.children.length-1].insertAdjacentHTML('afterEnd',buttonHTML("azure-utils-ext-target-branch-btn", "target"));

    const srcBranchBtnElement = document.getElementById("azure-utils-ext-src-branch-btn");
    const targetBranchBtnElement = document.getElementById("azure-utils-ext-target-branch-btn");
    const btnCustomStyles = "margin: 0px 4px 0px 3px; width: 40px; display: inline; padding: 2px 3px; color: var(--text-primary-color,rgba(0, 0, 0, 0.9)); cursor: pointer;"

    function configureBtnForBranch(aBranch, prHeaderChild, branchType) {
        aBranch.style = btnCustomStyles; 
        const prHeaderContainer = document.getElementsByClassName("repos-pr-header")[0];
        
        aBranch.addEventListener('click', _ => {
            prHeaderContainer.children[0].insertAdjacentHTML('afterEnd', 
                buttonTextHoverHTML("azure-utils-ext-src-branch-btn-msg", branchType)
            );
            
            navigator.clipboard.writeText(PR_HeaderElement.children[prHeaderChild].innerHTML);
            
            setTimeout(() => {
                document.getElementById("azure-utils-ext-src-branch-btn-msg").style = "left: 5%; top: 5%; position: absolute; z-index: 9;  animation: tooltip-fade-out 300ms ease-in;";
                setTimeout(() => {
                    document.getElementById("azure-utils-ext-src-branch-btn-msg").remove();
                }, 300)
            }, 900)
        });
    }

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'b') {
            srcBranchBtnElement.click();
        }
    })

    configureBtnForBranch(srcBranchBtnElement, 0, "source");
    configureBtnForBranch(targetBranchBtnElement, PR_HeaderElement.children.length-2, "target");
}
