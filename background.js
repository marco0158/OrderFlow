// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openNewTab') {
    // 打开新标签页
    chrome.tabs.create({ url: request.url }, newTab => {
      // 监听标签页更新
      chrome.tabs.onUpdated.addListener(function listener(tabId, info, tab) {
        if (tabId === newTab.id && info.status === 'complete') {
          // 检查URL是否包含登录页面
          if (tab.url.includes('accounts.feishu.cn')) {
            chrome.tabs.sendMessage(tabId, { action: 'showLoginMessage' });
          } else if (tab.url.includes('zhidemai.feishuapp.cn')) {
            // 等待一段时间后执行脚本2，并传递数据
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { 
                action: 'executeScript2',
                orderflowData: request.orderflowData
              });
            }, 2000);
          }
        }
      });
    });
  }
  sendResponse({ received: true });
});