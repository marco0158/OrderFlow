// 创建并显示悬浮按钮
function createFloatButton() {
  const btn = document.createElement('div');
  btn.className = 'orderflow-float-btn';
  document.body.appendChild(btn);
  return btn;
}

// 创建并显示Toast消息
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'orderflow-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// 执行脚本1
async function executeScript1() {
  const headers = [
    "商务名称", "项目经理", "客户名称", "项目名称", "项目类型", "下单时间",
    "落地平台", "客户类型", "执行状态", "KPI指标(元)", "完成值(元)",
    "完成进度", "起止时间", "时间进度", "品牌", "备注", "问题",
    "工单ID", "关联合同", "下单总金额（元）"
  ];

  function getElementValues() {
    try {
      const inputInners = Array.from(document.querySelectorAll('.el-input__inner'));
      const rangeInputs = Array.from(document.querySelectorAll('.el-range-input'));
      const textareaInners = Array.from(document.querySelectorAll('.el-textarea__inner'));
      const combinedValues = [];

      inputInners.slice(0, 12).forEach(e => combinedValues.push(e.value));
      rangeInputs.length >= 2 && combinedValues.push(`${rangeInputs[0].value} 至 ${rangeInputs[1].value}`);
      inputInners.slice(13, 15).forEach(e => combinedValues.push(e.value));
      textareaInners.slice(0, 2).forEach(e => combinedValues.push(e.value));
      inputInners.slice(15, 18).forEach(e => combinedValues.push(e.value));
      return combinedValues;
    } catch (error) {
      console.error('获取元素值时出错:', error);
      return [];
    }
  }

  function createDataObject(values) {
    try {
      return headers.reduce((obj, header, idx) => {
        obj[header] = values[idx]?.trim() || '';
        return obj;
      }, {});
    } catch (error) {
      console.error('创建数据对象时出错:', error);
      return {};
    }
  }

  function convertToObjectString(data) {
    try {
      return Object.entries(data)
        .map(([k, v]) => v ? `${k} ${v.replace(/\s+/g, ' ')}` : `${k}`)
        .join('\n');
    } catch (error) {
      console.error('转换数据对象时出错:', error);
      return '';
    }
  }

  const listProcessor = (() => {
    const normalizeSpaces = str => String(str)
      .replace(/[\s\u200B-\u200D\u2060\u2423\u3000\uFEFF]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const getValidColumns = () => {
      const cols = document.querySelectorAll('th:not(.is-hidden, .gutter)');
      return cols.length > 0 ? cols.length : 1;
    };

    const processWithRetry = (resolve, maxAttempts = 7, interval = 500) => {
      let attempts = 0;
      const tryProcess = () => {
        const cells = Array.from(document.querySelectorAll('td:not(.is-hidden)'));
        if (cells.length % getValidColumns() === 0 || attempts >= maxAttempts) {
          resolve(generateOutput(cells));
        } else {
          setTimeout(tryProcess, interval);
          attempts++;
        }
      };
      tryProcess();
    };

    const generateOutput = cells => {
      const columns = Math.max(getValidColumns(), 1);
      return cells.reduce((acc, cell, idx) => {
        if (idx % columns === 0) acc.push([]);

        let content = cell.querySelector('.cell')?.textContent || '';
        content = normalizeSpaces(content)
          .replace(/[\u00A0\u1680\u202F]/g, ' ')
          .replace(/\s+/g, ' ');

        acc[acc.length - 1].push(content);
        return acc;
      }, [])
      .map(row => {
        const cleanRow = row.join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        return cleanRow;
      })
      .join('\n')
      .replace(/(\n)\1+/g, '$1')
      .trim();
    };

    return { processWithRetry, generateOutput };
  })();

  try {
    const formattedString = convertToObjectString(createDataObject(getElementValues()));
    const listOutput = await new Promise(resolve => {
      const observer = new MutationObserver(() => {
        listProcessor.processWithRetry(resolve);
      });
      observer.observe(document.body, { subtree: true, childList: true });
      listProcessor.processWithRetry(resolve);
    });

    window.orderflow = `${formattedString}\n合同总金额，包括硬广和软性\n${listOutput}`;
    return true;
  } catch (error) {
    console.error('主程序出错:', error);
    return false;
  }
}

// 执行脚本2
async function executeScript2(orderflowData) {
  try {
    // 等待页面加载完成
    await new Promise(resolve => {
      const checkReady = () => {
        const editor = document.querySelector('.zone-container.editor-kit-container');
        if (editor) {
          resolve();
        } else {
          setTimeout(checkReady, 500);
        }
      };
      checkReady();
    });

    // 输入操作
    const editableDiv = document.querySelector('.zone-container.editor-kit-container');
    if (editableDiv) {
      const firstAceLine = editableDiv.querySelector('.ace-line');
      if (firstAceLine) {
        const firstSpan = firstAceLine.querySelector('span');
        if (firstSpan) {
          // 将所有换行符替换为空格
          const singleLineText = orderflowData.replace(/\n/g, ' ');
          
          // 创建文本节点并插入
          const textNode = document.createTextNode(singleLineText);
          firstAceLine.insertBefore(textNode, firstSpan);
          editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }

    // 点击按钮
    const button = document.querySelector('.O1LW3q6vLke6g3le7GKf > .ud__button');
    if (button) {
      button.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      return true;
    }
    return false;
  } catch (error) {
    console.error('执行脚本2时出错:', error);
    return false;
  }
}

// 主程序
chrome.storage.sync.get(['urlPattern'], async result => {
  const { urlPattern } = result;
  if (!urlPattern) return;

  try {
    const regex = new RegExp(urlPattern);
    if (regex.test(window.location.href)) {
      const floatBtn = createFloatButton();
      floatBtn.addEventListener('click', async () => {
        // 执行脚本1
        const script1Success = await executeScript1();
        if (!script1Success) {
          showToast('❌ 脚本1执行失败');
          return;
        }

        // 添加延迟确保数据处理完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 验证orderflow变量
        if (!window.orderflow) {
          showToast('❌ 数据处理失败');
          return;
        }

        // 打开新标签页并传递数据
        const newTabUrl = 'https://aily.feishu.cn/universal/landing?to=ai/gui/chat/a_5ab23e57daba459089828860ad67fd85';
        chrome.runtime.sendMessage({ 
          action: 'openNewTab', 
          url: newTabUrl,
          orderflowData: window.orderflow
        });
      });
    }

    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'executeScript2') {
        executeScript2(request.orderflowData).then(async success => {
          if (success) {
            // 清理编辑器内容
            const aceLine = document.querySelector('.ace-line');
            if (aceLine) {
              const spans = aceLine.querySelectorAll('span');
              spans.forEach(span => {
                if (!span.hasAttribute('data-enter')) {
                  span.textContent = '';
                }
              });
              // 清理直接文本节点
              Array.from(aceLine.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                  node.textContent = '';
                }
              });
            }

            // 获取webhook配置
            const { webhook } = await new Promise(resolve => {
              chrome.storage.sync.get(['webhook'], result => resolve(result));
            });

            if (webhook) {
              try {
                // 发送webhook消息
                const response = await fetch(webhook, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    msg_type: 'text',
                    content: {
                      text: `OrderFlow执行成功\n${request.orderflowData}`
                    }
                  })
                });

                const data = await response.json();
                if (data.code === 0) {
                  showToast('🎉运行成功，已发送通知');
                  // 清理编辑器内容
                  const aceLine = document.querySelector('.ace-line');
                  if (aceLine) {
                    const spans = aceLine.querySelectorAll('span');
                    spans.forEach(span => {
                      if (!span.hasAttribute('data-enter')) {
                        span.textContent = '';
                      }
                    });
                    // 清理直接文本节点
                    Array.from(aceLine.childNodes).forEach(node => {
                      if (node.nodeType === Node.TEXT_NODE) {
                        node.textContent = '';
                      }
                    });
                  }
                } else {
                  console.error('Webhook响应错误:', data);
                  showToast('🎉运行成功，通知发送失败');
                }
              } catch (error) {
                console.error('发送webhook消息失败:', error);
                showToast('🎉运行成功，通知发送失败');
              }
            } else {
              showToast('🎉运行成功');
            }
            // 清理页面元素和监听器
            const floatBtn = document.querySelector('.orderflow-float-btn');
            if (floatBtn) {
              floatBtn.remove();
            }
            chrome.runtime.onMessage.removeListener(arguments.callee);
          } else {
            showToast('❌ 脚本2执行失败');
          }
        });
      } else if (request.action === 'showLoginMessage') {
        showToast('❕请先登录');
      }
      sendResponse({ received: true });
    });
  } catch (error) {
    console.error('正则匹配出错:', error);
  }
});