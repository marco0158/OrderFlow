document.addEventListener('DOMContentLoaded', () => {
  const urlPatternInput = document.getElementById('urlPattern');
  const webhookInput = document.getElementById('webhook');
  const saveBtn = document.getElementById('saveBtn');

  // 加载已保存的配置
  chrome.storage.sync.get(['urlPattern', 'webhook'], (result) => {
    urlPatternInput.value = result.urlPattern || '';
    webhookInput.value = result.webhook || '';
  });

  // 保存配置
  saveBtn.addEventListener('click', () => {
    const urlPattern = urlPatternInput.value.trim();
    const webhook = webhookInput.value.trim();

    // 验证URL正则表达式
    if (!urlPattern) {
      const notificationOptions = {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('images/icon128.png'),
        title: 'OrderFlow',
        message: '请填写URL正则表达式',
        priority: 2
      };
      chrome.notifications.create('orderFlowValidationNotification', notificationOptions);
      return;
    }

    try {
      new RegExp(urlPattern);
    } catch (e) {
      const notificationOptions = {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('images/icon128.png'),
        title: 'OrderFlow',
        message: '请输入有效的正则表达式',
        priority: 2
      };
      chrome.notifications.create('orderFlowValidationNotification', notificationOptions);
      return;
    }

    // 验证webhook URL（如果有填写）
    if (webhook) {
      try {
        new URL(webhook);
      } catch (e) {
        const notificationOptions = {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('images/icon128.png'),
          title: 'OrderFlow',
          message: '请输入有效的webhook URL',
          priority: 2
        };
        chrome.notifications.create('orderFlowValidationNotification', notificationOptions);
        return;
      }
    }

    // 保存到Chrome存储
    chrome.storage.sync.set({
      urlPattern,
      webhook
    }, () => {
      const notificationOptions = {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('images/icon128.png'),
        title: 'OrderFlow',
        message: '配置已保存',
        priority: 2,
        requireInteraction: true
      };

      chrome.notifications.create('orderFlowSaveNotification', notificationOptions, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.error('通知创建失败:', chrome.runtime.lastError);
          alert('配置已保存');
        }
        // 3秒后关闭通知
        setTimeout(() => {
          chrome.notifications.clear(notificationId);
          window.close();
        }, 2000);
      });
    });
  });
});