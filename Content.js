let lastUrl = location.href; 

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

function hasReloadedPage() {
    return window.performance.getEntriesByType("navigation") && window.performance.getEntriesByType("navigation")[0].type === 'reload';
}

function onUrlChange() {
    try {
        const isPullRequestURL = location.href.split('/').some((urlSection) => urlSection === 'pullrequest');
        if (isPullRequestURL) {
            addPullRequestButtons();
        }
    } catch (error) {
        console.warn('[Azure Utils Chrome Extension] An unexpected error ocurred. ', error);        
    }
}


function addPullRequestButtons() {
    let PRHeaderHTML = document.getElementsByClassName("pr-header-branches")[0]
    PRHeaderHTML.children[0].insertAdjacentHTML('afterEnd','<div id="azure-utils-ext-src-branch-btn">Copy</div>');
    PRHeaderHTML.children[PRHeaderHTML.children.length-1].insertAdjacentHTML('afterEnd','<div id="azure-utils-ext-target-branch-btn">Copy</div>');

    let srcBranchBtnElement = document.getElementById("azure-utils-ext-src-branch-btn");
    let targetBranchBtnElement = document.getElementById("azure-utils-ext-target-branch-btn");

    let style_normal = "margin: 0px 4px 0px 3px; width: 40px; display: inline; padding: 2px 3px; background-color: var(--palette-black-alpha-6,rgba(0, 0, 0, 0.06)); color: var(--text-primary-color,rgba(0, 0, 0, 0.9)); cursor: pointer;"
    let style_hover = "margin: 0px 4px 0px 3px; width: 40px; display: inline; padding: 2px 3px; background-color: var(--palette-black-alpha-10,rgba(0, 0, 0, .1)); color: var(--text-primary-color,rgba(0, 0, 0, 0.9)); cursor: pointer;"
    let style_click = "margin: 0px 4px 0px 3px; width: 40px; display: inline; padding: 2px 3px; background-color: rgba(85,163,98,1) !important; color: var(--text-primary-color,rgba(0, 0, 0, 0.9)); cursor: pointer;";

    function configureBtnForBranch(aBranch, prHeaderChild) {
        aBranch.style = style_normal; 
        
        aBranch.addEventListener('mouseenter', e => {
            e.currentTarget.style = style_hover;
        });
        
        aBranch.addEventListener('mouseleave', e => {
            e.currentTarget.style = style_normal;
        });
        
        aBranch.addEventListener('click', e => {
            e.currentTarget.style = style_click;
            aBranch.innerHTML = "Copied!";
            navigator.clipboard.writeText(
                PRHeaderHTML.children[prHeaderChild].innerHTML
            )
            setTimeout(() => {
                aBranch.innerHTML = "Copy";
                aBranch.style = style_normal;
            } , 1500)
        });
    }

    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'b') {
            srcBranchBtnElement.click();
        }
    })

    configureBtnForBranch(srcBranchBtnElement, 0);
    configureBtnForBranch(targetBranchBtnElement, PRHeaderHTML.children.length-2);
}
