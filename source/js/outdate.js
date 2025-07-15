// 文章时效性提示 - 简化版本，充分信任 Hexo/NexT 的结构化 HTML
(function() {
  'use strict';

  // 配置参数
  const CONFIG = {
    warningDays: 200,
    errorDays: 400,
    warningClass: 'note warning',
    errorClass: 'note danger',
    title: '文章时效性提示',
    template: '这是一篇{type}于 {time} 前的文章，部分信息可能已发生改变，请注意甄别。'
  };

  // 仅在文章页面执行（信任 NexT 主题的 DOM 结构）
  const postBody = document.querySelector('.post-body');
  if (!postBody) return;

  // 信任 Hexo 的结构化时间元素（使用标准 Schema.org microdata）
  const updateTimeEl = document.querySelector('time[itemprop*="dateModified"]');
  const publishTimeEl = document.querySelector('time[itemprop*="dateCreated"], time[itemprop*="datePublished"]');

  if (!publishTimeEl) return; // 静默失败，避免控制台噪音

  // 信任 Hexo 生成的 datetime 属性格式
  const referenceTime = updateTimeEl?.dateTime || publishTimeEl.dateTime;
  const diffDays = Math.floor((Date.now() - new Date(referenceTime)) / 86400000);

  // 简化的时间格式化
  const formatTimeAgo = days => {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return years ? `${years} 年${months ? ` ${months} 个月` : ''}` :
           months ? `${months} 个月` : `${days} 天`;
  };

  // 添加时效性提示
  if (diffDays > CONFIG.warningDays) {
    const notice = Object.assign(document.createElement('div'), {
      className: diffDays >= CONFIG.errorDays ? CONFIG.errorClass : CONFIG.warningClass,
      innerHTML: `<h5>${CONFIG.title}</h5><p>${CONFIG.template
        .replace('{time}', formatTimeAgo(diffDays))
        .replace('{type}', updateTimeEl ? '更新' : '发布')}</p>`
    });

    postBody.insertAdjacentElement('afterbegin', notice);
  }
})();
