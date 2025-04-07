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
      alert('请填写URL正则表达式');
      return;
    }

    try {
      new RegExp(urlPattern);
    } catch (e) {
      alert('请输入有效的正则表达式');
      return;
    }

    // 验证webhook URL（如果有填写）
    if (webhook) {
      try {
        new URL(webhook);
      } catch (e) {
        alert('请输入有效的webhook URL');
        return;
      }
    }

    // 保存到Chrome存储
    chrome.storage.sync.set({
      urlPattern,
      webhook
    }, () => {
      alert('配置已保存');
      window.close();
    });
  });
});