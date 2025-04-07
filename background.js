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
            // 检查orderflowReady状态
            const checkOrderflowReady = () => {
              chrome.tabs.sendMessage(sender.tab.id, { action: 'checkOrderflowReady' }, response => {
                if (response && response.ready) {
                  // 数据准备完成，执行脚本2
                  chrome.tabs.sendMessage(tabId, { 
                    action: 'executeScript2',
                    orderflowData: request.orderflowData
                  });
                } else {
                  // 继续等待并重试
                  setTimeout(checkOrderflowReady, 500);
                }
              });
            };
            checkOrderflowReady();
          }
        }
      });
    });
  }
  sendResponse({ received: true });
});