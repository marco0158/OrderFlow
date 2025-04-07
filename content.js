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
    // 原表单数据的headers（若有保留需求可留，此处未提及调整，暂保留原逻辑）
    const formHeaders = [
        "商务名称", "项目经理", "客户名称", "项目名称", "项目类型", "下单时间",
        "落地平台", "客户类型", "执行状态", "KPI指标(元)", "完成值(元)",
        "完成进度", "起止时间", "时间进度", "品牌", "备注", "问题",
        "工单ID", "关联合同", "下单总金额（元）"
    ];

    // 表格数据对应的新表头，调整字段名
    const tableHeaders = [
        "软性ID", "软性执行ID", "行业", "软性合作方式", 
        "数量", "该项目总金额", "工单总金额", "执行时间", 
        "发布额确认月份", "执行者", "资源执行状态", "所属资源包", "资源备注"
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
            return formHeaders.reduce((obj, header, idx) => {
                obj[header] = values[idx] || '';
                return obj;
            }, {});
        } catch (error) {
            console.error('创建数据对象时出错:', error);
            return {};
        }
    }

    const listProcessor = (() => {
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
            const rowData = cells.reduce((acc, cell, idx) => {
                if (idx % columns === 0) acc.push([]);
                // 去除多余的空白字符
                let content = (cell.querySelector('.cell')?.textContent || '').trim();
                acc[acc.length - 1].push(content);
                return acc;
            }, []);

            // 将表格数据转换为对象数组，匹配新表头
            return rowData.map(row => 
                tableHeaders.reduce((obj, header, colIdx) => {
                    obj[header] = row[colIdx] || '';
                    return obj;
                }, {})
            );
        };

        return { processWithRetry, generateOutput };
    })();

    try {
        const formData = createDataObject(getElementValues());
        const tableData = await new Promise(resolve => {
            const observer = new MutationObserver(() => {
                listProcessor.processWithRetry(resolve);
            });
            observer.observe(document.body, { subtree: true, childList: true });
            listProcessor.processWithRetry(resolve);
        });

        // 仅对表格数据进行清洗
        for (let i = 0; i < tableData.length; i++) {
            const currentRow = tableData[i];
            const quantity = parseInt(currentRow['数量']);

            if (quantity > 1) {
                const industry = currentRow['行业'];
                const cooperationMode = currentRow['软性合作方式'];
                const newTotalAmount = (parseFloat(currentRow['该项目总金额']) / quantity).toString();
                const workOrderTotalAmount = currentRow['工单总金额'];
                const executionTime = currentRow['执行时间'];
                const resourcePackage = currentRow['所属资源包'];
                const remark = currentRow['资源备注'];

                for (let j = i + 1; j < i + 1 + quantity && j < tableData.length; j++) {
                    tableData[j]['行业'] = industry;
                    tableData[j]['软性合作方式'] = cooperationMode;
                    tableData[j]['该项目总金额'] = newTotalAmount;
                    tableData[j]['工单总金额'] = workOrderTotalAmount;
                    tableData[j]['执行时间'] = executionTime;
                    tableData[j]['所属资源包'] = resourcePackage;
                    tableData[j]['资源备注'] = remark;
                    tableData[j]['资源执行状态'] = currentRow['资源执行状态'];
                }

                currentRow['该项目总金额'] = newTotalAmount;
            }
        }

        // 删除数量不为 1 的数组
        const cleanedTableData = tableData.filter(row => parseInt(row['数量']) === 1);

        // 判断下单总金额（元）和表格数据中第一组数据的工单总金额
        const orderTotalAmount = parseFloat(formData['下单总金额（元）']);
        if (cleanedTableData.length > 0) {
            const firstWorkOrderTotalAmount = parseFloat(cleanedTableData[0]['工单总金额']);
            if (orderTotalAmount > firstWorkOrderTotalAmount) {
                const newRow = {
                    "软性ID": "",
                    "软性执行ID": "",
                    "行业": "硬广",
                    "软性合作方式": "硬广",
                    "数量": "1",
                    "该项目总金额": (orderTotalAmount - firstWorkOrderTotalAmount).toString(),
                    "工单总金额": firstWorkOrderTotalAmount.toString(),
                    "执行时间": "",
                    "发布额确认月份": "",
                    "执行者": "",
                    "资源执行状态": "",
                    "所属资源包": "",
                    "资源备注": ""
                };
                cleanedTableData.push(newRow);
            }
        }

        const outputJson = {
            ...formData,
            "表格数据": cleanedTableData
        };

        window.orderflow = JSON.stringify(outputJson, null, 2);
        window.orderflowReady = true; // 添加完成标志
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
        const firstAceLine = editor?.querySelector('.ace-line');
        const firstSpan = firstAceLine?.querySelector('span');
        const button = document.querySelector('.O1LW3q6vLke6g3le7GKf > .ud__button');
        
        if (editor && firstAceLine && firstSpan && button) {
          resolve();
        } else {
          setTimeout(checkReady, 500);
        }
      };
      checkReady();
    });

    // 输入操作
    const editableDiv = document.querySelector('.zone-container.editor-kit-container');
    const firstAceLine = editableDiv.querySelector('.ace-line');
    const firstSpan = firstAceLine.querySelector('span');
    
    // 将所有换行符替换为空格
    const singleLineText = orderflowData.replace(/\n/g, ' ');
    
    // 创建文本节点并插入
    const textNode = document.createTextNode(singleLineText);
    firstAceLine.insertBefore(textNode, firstSpan);
    editableDiv.dispatchEvent(new Event('input', { bubbles: true }));

    // 等待一段时间确保内容已经正确插入
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 点击按钮
    const button = document.querySelector('.O1LW3q6vLke6g3le7GKf > .ud__button');
    button.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    return true;
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

// 监听orderflowReady标志
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkOrderflowReady') {
        sendResponse({ ready: window.orderflowReady === true });
    }
});