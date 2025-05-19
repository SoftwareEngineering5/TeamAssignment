// static/js/radar_export.js
function formatChartFileName() {
    const getSelectedText = (elementId) => {
        const select = document.getElementById(elementId);
        return select.options[select.selectedIndex].text;
    };

    const ranchName = getSelectedText('marineFarmSelect')
        .replace(/\s+/g, '')
        .replace(/\(/g, '（').replace(/\)/g, '）');

    const fishName = getSelectedText('fishSpecies')
        .replace(/\s+/g, '')
        .replace(/\(/g, '（').replace(/\)/g, '）');

    const attributeName = getSelectedText('dataAttribute');

    return `${ranchName}_${fishName}_${attributeName}_水质数据雷达图_${new Date().toISOString().slice(0,10)}`
        .replace(/[\\/:*?"<>|]/g, '');
}

// 修改后的下载事件处理
document.getElementById('downloadChartBtn').addEventListener('click', function() {
    if (!fishRadarChart) return;
    
    const link = document.createElement('a');
    link.download = `${formatChartFileName()}.png`;
    link.href = getHighQualityChartImage(fishRadarChart);
    link.click();
});

function getHighQualityChartImage(chart, scale = 2) {
    const originalCanvas = chart.canvas;
    const tempCanvas = document.createElement('canvas');
    
    tempCanvas.width = originalCanvas.width * scale;
    tempCanvas.height = originalCanvas.height * scale;
    tempCanvas.style.width = originalCanvas.width + 'px';
    tempCanvas.style.height = originalCanvas.height + 'px';

    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.scale(scale, scale);
    tempCtx.drawImage(originalCanvas, 0, 0);
    
    return tempCanvas.toDataURL('image/png');
}