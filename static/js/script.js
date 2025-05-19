// script.js,这里可以放置一些通用的JavaScript代码
// 例如：事件监听、DOM操作等

// 水质地图与时序分析主逻辑
// 依赖: ECharts (已在base.html引入)

let waterQualityData = [];
let currentProvince = '';
let currentBasin = '';
let currentSection = '';
let currentIndicators = ['水温(℃)'];
let currentDateRange = null;

// 省份中心点经纬度（简化版，可补充完整）
const provinceCenters = {
    '北京市': [116.41, 39.90],
    '天津市': [117.20, 39.13],
    '河北省': [114.48, 38.03],
    '山西省': [112.55, 37.87],
    '内蒙古自治区': [111.65, 40.82],
    '辽宁省': [123.43, 41.80],
    '吉林省': [125.32, 43.82],
    '黑龙江省': [126.63, 45.75],
    '上海市': [121.47, 31.23],
    '江苏省': [118.78, 32.07],
    '浙江省': [120.19, 30.26],
    '安徽省': [117.27, 31.86],
    '福建省': [119.30, 26.08],
    '江西省': [115.89, 28.68],
    '山东省': [117.00, 36.67],
    '河南省': [113.65, 34.76],
    '湖北省': [114.31, 30.59],
    '湖南省': [113.00, 28.21],
    '广东省': [113.26, 23.13],
    '广西壮族自治区': [108.33, 22.84],
    '海南省': [110.35, 20.02],
    '重庆市': [106.55, 29.56],
    '四川省': [104.07, 30.67],
    '贵州省': [106.71, 26.57],
    '云南省': [102.73, 25.04],
    '西藏自治区': [91.11, 29.97],
    '陕西省': [108.95, 34.27],
    '甘肃省': [103.73, 36.03],
    '青海省': [101.78, 36.56],
    '宁夏回族自治区': [106.27, 38.47],
    '新疆维吾尔自治区': [87.62, 43.82],
    '台湾省': [121.50, 25.05],
    '香港特别行政区': [114.17, 22.28],
    '澳门特别行政区': [113.54, 22.19]
};

// 初始化页面
window.addEventListener('DOMContentLoaded', async function() {
    await loadWaterQualitySummary();
    bindFilterEvents();
});

// 加载水质分层数据
async function loadWaterQualitySummary() {
    const res = await fetch('/api/water_quality/summary');
    waterQualityData = await res.json();
    fillProvinceSelect();
    renderProvinceMap();
}

// 填充省份下拉
function fillProvinceSelect() {
    const provinceSelect = document.getElementById('provinceSelect');
    provinceSelect.innerHTML = '<option value="">请选择</option>';
    for (const p of waterQualityData) {
        provinceSelect.innerHTML += `<option value="${p.province}">${p.province}</option>`;
    }
}

// 填充流域下拉
function fillBasinSelect(province) {
    const basinSelect = document.getElementById('basinSelect');
    basinSelect.innerHTML = '<option value="">请选择</option>';
    if (!province) return;
    const p = waterQualityData.find(x => x.province === province);
    if (!p) return;
    const basins = new Set();
    for (const b of p.basins) {
        if (b.basin) basins.add(b.basin);
    }
    for (const b of basins) {
        basinSelect.innerHTML += `<option value="${b}">${b}</option>`;
    }
}

// 填充断面下拉
function fillSectionSelect(province, basin) {
    const sectionSelect = document.getElementById('sectionSelect');
    sectionSelect.innerHTML = '<option value="">请选择</option>';
    if (!province || !basin) return;
    const p = waterQualityData.find(x => x.province === province);
    if (!p) return;
    for (const b of p.basins) {
        if (b.basin === basin && b.section) {
            sectionSelect.innerHTML += `<option value="${b.section}">${b.section}</option>`;
        }
    }
}

// 绑定筛选事件
function bindFilterEvents() {
    document.getElementById('provinceSelect').addEventListener('change', function() {
        currentProvince = this.value;
        fillBasinSelect(currentProvince);
        fillSectionSelect(currentProvince, '');
        renderProvinceMap();
    });
    document.getElementById('basinSelect').addEventListener('change', function() {
        currentBasin = this.value;
        fillSectionSelect(currentProvince, currentBasin);
        renderBasinMap();
    });
    document.getElementById('sectionSelect').addEventListener('change', function() {
        currentSection = this.value;
        renderSectionMap();
        renderSectionTrend();
    });
    document.getElementById('indicatorSelect').addEventListener('change', function() {
        currentIndicators = Array.from(this.selectedOptions).map(opt => opt.value);
        renderSectionTrend();
    });
    document.getElementById('applyFilterBtn').addEventListener('click', function() {
        // 时间范围格式: 04-01 ~ 04-29
        const val = document.getElementById('dateRange').value.trim();
        if (/\d{2}-\d{2}\s*~\s*\d{2}-\d{2}/.test(val)) {
            const [start, end] = val.split('~').map(s => s.trim());
            currentDateRange = {start, end};
        } else {
            currentDateRange = null;
        }
        renderSectionTrend();
    });
}

// 渲染省级分层地图（ECharts）
function renderProvinceMap() {
    const dom = document.getElementById('waterQualityMap');
    if (!dom) return;
    const myChart = echarts.init(dom);
    // 省级平均水质类别
    const data = waterQualityData.map(p => ({name: p.province, value: p.avg_level ? Number(p.avg_level.toFixed(2)) : null}));
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
        .then(res => res.json())
        .then(geoJson => {
            echarts.registerMap('china', geoJson);
            myChart.setOption({
                tooltip: {trigger: 'item', formatter: p => `${p.name}<br>平均水质类别: ${p.value ? p.value : '无'}`},
                visualMap: {
                    min: 1, max: 6, left: 'left', top: 'bottom',
                    text: ['劣Ⅴ', 'Ⅰ'], inRange: {color: ['#2DC937','#99C140','#E7B416','#DB7B2B','#CC3232','#660000']},
                    calculable: true
                },
                series: [{
                    name: '省级水质',
                    type: 'map',
                    map: 'china',
                    roam: true,
                    data: data,
                    emphasis: {label: {show: true}},
                }]
            });
            myChart.on('click', function(params) {
                document.getElementById('provinceSelect').value = params.name;
                currentProvince = params.name;
                fillBasinSelect(currentProvince);
                renderBasinMap();
            });
        });
}

// 渲染流域热力图（ECharts散点）
function renderBasinMap() {
    const dom = document.getElementById('waterQualityMap');
    if (!dom || !currentProvince) return;
    const myChart = echarts.init(dom);
    // 取该省所有流域下断面
    const p = waterQualityData.find(x => x.province === currentProvince);
    if (!p) return;
    const basinSections = p.basins.filter(b => b.basin === currentBasin && b.section);
    // 断面气泡坐标优先用geo，否则用省份中心
    const scatterData = basinSections.map((b, i) => {
        let lng = null, lat = null;
        if (b.geo && b.geo.lng && b.geo.lat) {
            lng = b.geo.lng; lat = b.geo.lat;
        } else if (provinceCenters[currentProvince]) {
            lng = provinceCenters[currentProvince][0] + (Math.random() - 0.5) * 0.5;
            lat = provinceCenters[currentProvince][1] + (Math.random() - 0.5) * 0.5;
        } else {
            lng = 116 + Math.random();
            lat = 39 + Math.random();
        }
        return {
            name: b.section,
            value: [lng, lat, b.avg_metrics['溶解氧(mg/L)'] || 0],
            label: {show: false},
            section: b.section,
            basin: b.basin
        };
    });
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
        .then(res => res.json())
        .then(geoJson => {
            echarts.registerMap('china', geoJson);
            myChart.setOption({
                geo: {
                    map: 'china', roam: true, label: {show: false},
                    itemStyle: {areaColor: '#e0f7fa', borderColor: '#111'}
                },
                tooltip: {trigger: 'item', formatter: p => `${p.name}<br>溶解氧: ${p.value[2]}`},
                visualMap: {
                    min: 0, max: 15, left: 'left', top: 'bottom',
                    text: ['高溶解氧', '低溶解氧'], inRange: {color: ['#e0f3f8','#abd9e9','#74add1','#4575b4','#313695']},
                    calculable: true
                },
                series: [{
                    name: '断面溶解氧',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: scatterData,
                    symbolSize: val => 10 + (val[2] || 0) * 2,
                    emphasis: {label: {show: true}},
                }]
            });
            myChart.on('click', function(params) {
                // 自动设置省份、流域、断面下拉框
                document.getElementById('provinceSelect').value = currentProvince;
                document.getElementById('basinSelect').value = params.data.basin;
                document.getElementById('sectionSelect').value = params.data.section;
                currentBasin = params.data.basin;
                currentSection = params.data.section;
                renderSectionTrend();
            });
        });
}

// 渲染断面气泡（可扩展为地图气泡）
function renderSectionMap() {
    // 可选：实现断面级别的气泡地图
}

// 渲染断面时序折线图
let sectionTrendNoData = false;
async function renderSectionTrend() {
    if (!currentProvince || !currentBasin || !currentSection) {
        clearSectionTrendNoData();
        return;
    }
    const dom = document.getElementById('sectionTrendChart');
    if (!dom) return;
    const myChart = echarts.init(dom);
    // 请求断面时序数据
    let url = `/api/water_quality/section_data?province=${encodeURIComponent(currentProvince)}&basin=${encodeURIComponent(currentBasin)}&section=${encodeURIComponent(currentSection)}`;
    if (currentIndicators && currentIndicators.length > 0) {
        url += `&indicator=${currentIndicators.map(encodeURIComponent).join(',')}`;
    }
    if (currentDateRange) {
        url += `&start_time=${encodeURIComponent(currentDateRange.start)}&end_time=${encodeURIComponent(currentDateRange.end)}`;
    }
    const res = await fetch(url);
    const timeseries = await res.json();
    if (!Array.isArray(timeseries) || timeseries.length === 0) {
        myChart.clear();
        myChart.setOption({
            title: {text: '无数据', left: 'center', top: 'middle', textStyle: {color: '#e74c3c', fontSize: 20}},
            xAxis: {show: false},
            yAxis: {show: false},
            series: []
        });
        sectionTrendNoData = true;
        return;
    }
    // 构造ECharts折线图数据
    const xData = timeseries.map(d => d.time || d['监测时间']);
    const series = (currentIndicators.length ? currentIndicators : Object.keys(timeseries[0]).filter(k => k !== 'time')).map(ind => ({
        name: ind,
        type: 'line',
        data: timeseries.map(d => parseFloat(d[ind]) || null),
        smooth: true
    }));
    myChart.clear();
    myChart.setOption({
        tooltip: {trigger: 'axis'},
        legend: {data: series.map(s => s.name)},
        xAxis: {type: 'category', data: xData},
        yAxis: {type: 'value'},
        series: series
    });
    sectionTrendNoData = false;
}
function clearSectionTrendNoData() {
    const dom = document.getElementById('sectionTrendChart');
    if (!dom) return;
    const myChart = echarts.init(dom);
    myChart.clear();
    sectionTrendNoData = false;
}

// ===== 图表下载功能 =====

// 生成文件名
function getFormattedFileName(baseName = '断面时序图') {
    // 获取选择器值
    const province = document.getElementById('provinceSelect').value || '全国';
    const basin = document.getElementById('basinSelect').value || '全流域';
    const section = document.getElementById('sectionSelect').value || '全断面';
    
    // 获取指标并处理单位
    const indicators = Array.from(document.getElementById('indicatorSelect').selectedOptions)
        .map(opt => opt.text.replace(/\(.*?\)/g, '').trim())
        .join('+');

    // 清理非法字符
    const clean = (str) => str.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '');

    // 日期部分
    const dateStr = new Date().toISOString().slice(0,10);

    return `${clean(province)}_${clean(basin)}_${clean(section)}_${clean(indicators)}_${baseName}_${dateStr}`;
}

// 下载断面时序折线图（ECharts）
document.getElementById('downloadSectionChartBtn')?.addEventListener('click', function() {
    const dom = document.getElementById('sectionTrendChart');
    if (!dom) return;
    const myChart = echarts.getInstanceByDom(dom);
    if (!myChart) return;

    const dataUrl = myChart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff',
        excludeComponents: ['toolbox']
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${getFormattedFileName('断面时序图')}.png`;
    a.click();
});

document.getElementById('downloadTrendChartBtn')?.addEventListener('click', function() {
    const dom = document.getElementById('sectionTrendChart');
    if (!dom) return;
    const myChart = echarts.getInstanceByDom(dom);
    if (!myChart) return;

    const dataUrl = myChart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff',
        excludeComponents: ['toolbox']
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${getFormattedFileName('断面时序图')}.png`;
    a.click();
});

// ====== 水质数据上传三级联动与拖拽上传 ======
// 省市流域断面数据初始化
let uploadWaterData = {};

// ====== 下载CSV模板按钮逻辑 ======
// 创建并插入按钮（如果页面已有可复用则跳过）
let downloadTemplateBtn = document.getElementById('downloadWaterTemplateBtn');
if (!downloadTemplateBtn) {
    downloadTemplateBtn = document.createElement('button');
    downloadTemplateBtn.id = 'downloadWaterTemplateBtn';
    downloadTemplateBtn.type = 'button';
    downloadTemplateBtn.className = 'btn btn-outline-secondary w-100 mb-2';
    downloadTemplateBtn.style.display = 'none';
    downloadTemplateBtn.innerHTML = '<i class="fas fa-download me-2"></i>下载CSV模板';
    // 插入到上传表单下方
    const form = document.getElementById('waterUploadForm');
    form.parentNode.insertBefore(downloadTemplateBtn, form.nextSibling);
}

function updateDownloadTemplateBtnVisibility() {
    const province = document.getElementById('uploadProvinceSelect').value;
    const basin = document.getElementById('uploadBasinSelect').value;
    const section = document.getElementById('uploadSectionSelect').value;
    if (province && basin && section) {
        downloadTemplateBtn.style.display = '';
    } else {
        downloadTemplateBtn.style.display = 'none';
    }
}

// 绑定三级联动时同步按钮显示
function bindUploadWaterSelectEvents() {
    document.getElementById('uploadProvinceSelect').addEventListener('change', function() {
        fillUploadBasinSelect(this.value);
        fillUploadSectionSelect(this.value, '');
        updateDownloadTemplateBtnVisibility();
    });
    document.getElementById('uploadBasinSelect').addEventListener('change', function() {
        fillUploadSectionSelect(document.getElementById('uploadProvinceSelect').value, this.value);
        updateDownloadTemplateBtnVisibility();
    });
    document.getElementById('uploadSectionSelect').addEventListener('change', function() {
        updateDownloadTemplateBtnVisibility();
    });
}

// 下载模板按钮点击事件
if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener('click', function() {
        const province = document.getElementById('uploadProvinceSelect').value;
        const basin = document.getElementById('uploadBasinSelect').value;
        const section = document.getElementById('uploadSectionSelect').value;
        if (!(province && basin && section)) return;

        const url = `/api/water_quality/template?province=${encodeURIComponent(province)}&basin=${encodeURIComponent(basin)}&section=${encodeURIComponent(section)}`;
        
        fetch(url).then(res => {
            if (!res.ok) throw new Error('模板下载失败');
            
            // 从响应头中提取文件名
            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = section + '.csv'; // 默认文件名
            
            // 解析RFC 5987编码的文件名
            if (contentDisposition) {
                const utf8Filename = contentDisposition.match(/filename\*=(?:UTF-8'')?(.+)/i);
                if (utf8Filename) {
                    filename = decodeURIComponent(utf8Filename[1]);
                } else {
                    const legacyFilename = contentDisposition.match(/filename="(.+?)"/i);
                    if (legacyFilename) {
                        filename = decodeURIComponent(legacyFilename[1]);
                    }
                }
            }

            return res.blob().then(blob => ({ blob, filename }));
        }).then(({ blob, filename }) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename; // 显式设置文件名
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(a.href);
                a.remove();
            }, 100);
        }).catch(() => {
            alert('模板下载失败，请稍后重试');
        });
    });
}

// 获取省份、流域、断面数据（可复用waterQualityData）
function fillUploadProvinceSelect() {
    const select = document.getElementById('uploadProvinceSelect');
    select.innerHTML = '<option value="">请选择</option>';
    for (const p of waterQualityData) {
        select.innerHTML += `<option value="${p.province}">${p.province}</option>`;
    }
}
function fillUploadBasinSelect(province) {
    const select = document.getElementById('uploadBasinSelect');
    select.innerHTML = '<option value="">请选择</option>';
    if (!province) return;
    const p = waterQualityData.find(x => x.province === province);
    if (!p) return;
    const basins = new Set();
    for (const b of p.basins) {
        if (b.basin) basins.add(b.basin);
    }
    for (const b of basins) {
        select.innerHTML += `<option value="${b}">${b}</option>`;
    }
}
function fillUploadSectionSelect(province, basin) {
    const select = document.getElementById('uploadSectionSelect');
    select.innerHTML = '<option value="">请选择</option>';
    if (!province || !basin) return;
    const p = waterQualityData.find(x => x.province === province);
    if (!p) return;
    for (const b of p.basins) {
        if (b.basin === basin && b.section) {
            select.innerHTML += `<option value="${b.section}">${b.section}</option>`;
        }
    }
}
// 绑定三级联动
function bindUploadWaterSelectEvents() {
    document.getElementById('uploadProvinceSelect').addEventListener('change', function() {
        fillUploadBasinSelect(this.value);
        fillUploadSectionSelect(this.value, '');
    });
    document.getElementById('uploadBasinSelect').addEventListener('change', function() {
        fillUploadSectionSelect(document.getElementById('uploadProvinceSelect').value, this.value);
    });
}
// 拖拽上传区域
const dropZone = document.getElementById('waterDropZone');
const fileInput = document.getElementById('waterFileInput');
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => {e.preventDefault(); dropZone.classList.add('bg-light');});
dropZone.addEventListener('dragleave', e => {e.preventDefault(); dropZone.classList.remove('bg-light');});
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('bg-light');
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        document.getElementById('waterDropText').textContent = fileInput.files[0].name;
    }
});
fileInput.addEventListener('change', function() {
    if (fileInput.files.length) {
        document.getElementById('waterDropText').textContent = fileInput.files[0].name;
    } else {
        document.getElementById('waterDropText').textContent = '拖拽或点击选择CSV文件';
    }
});
// 打开模态框时初始化
const uploadModal = document.getElementById('uploadWaterModal');
uploadModal?.addEventListener('show.bs.modal', function() {
    fillUploadProvinceSelect();
    fillUploadBasinSelect('');
    fillUploadSectionSelect('', '');
    document.getElementById('waterDropText').textContent = '拖拽或点击选择CSV文件';
    fileInput.value = '';
});
bindUploadWaterSelectEvents();

// ====== 水质数据上传校验与提交 ======
document.getElementById('startWaterUploadBtn')?.addEventListener('click', async function() {
    const province = document.getElementById('uploadProvinceSelect').value;
    const basin = document.getElementById('uploadBasinSelect').value;
    const section = document.getElementById('uploadSectionSelect').value;
    const fileInput = document.getElementById('waterFileInput');
    const status = document.getElementById('waterUploadStatus');
    const progressBar = document.getElementById('waterUploadBar');
    const progressBox = document.getElementById('waterUploadProgress');
    if (!province || !basin || !section) {
        status.textContent = '请选择省份、流域和断面';
        return;
    }
    if (!fileInput.files.length) {
        status.textContent = '请上传CSV文件';
        return;
    }
    const file = fileInput.files[0];
    if (!file.name.endsWith('.csv')) {
        status.textContent = '仅支持CSV文件';
        return;
    }
    // 读取并校验CSV内容
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const header = '省份,流域,断面名称,监测时间,水质类别,水温(℃),pH(无量纲),溶解氧(mg/L),电导率(μS/cm),浊度(NTU),高锰酸盐指数(mg/L),氨氮(mg/L),总磷(mg/L),总氮(mg/L),叶绿素α(mg/L),藻密度(cells/L),站点情况';
    if (lines.length < 2 || lines[0].replace(/\s/g,'') !== header.replace(/\s/g,'')) {
        status.textContent = 'CSV格式不正确，首行应为：' + header;
        return;
    }
    // 校验每行字段数
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < 17) {
            status.textContent = `第${i+1}行字段数不足17列`;
            return;
        }
    }
    // 通过校验，准备上传
    status.textContent = '校验通过，正在上传...';
    progressBox.style.display = '';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    try {
        const formData = new FormData();
        formData.append('province', province);
        formData.append('basin', basin);
        formData.append('section', section);
        formData.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/water_quality/upload');
        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                const percent = Math.round(e.loaded / e.total * 100);
                progressBar.style.width = percent + '%';
                progressBar.textContent = percent + '%';
            }
        };
        xhr.onload = function() {
            if (xhr.status === 200) {
                status.textContent = '上传并合并成功';
            } else {
                status.textContent = '上传失败: ' + xhr.responseText;
            }
        };
        xhr.onerror = function() {
            status.textContent = '上传出错';
        };
        xhr.send(formData);
    } catch (e) {
        status.textContent = '上传异常: ' + e;
    }
});

// ====== 水质数据导出三级联动与导出功能 ======
function fillExportProvinceSelect() {
    const select = document.getElementById('exportProvinceSelect');
    select.innerHTML = '<option value="">请选择</option>';
    for (const p of waterQualityData) {
        select.innerHTML += `<option value="${p.province}">${p.province}</option>`;
    }
}
function fillExportBasinSelect(province) {
    const select = document.getElementById('exportBasinSelect');
    select.innerHTML = '<option value="">请选择</option>';
    if (!province) return;
    const p = waterQualityData.find(x => x.province === province);
    if (!p) return;
    const basins = new Set();
    for (const b of p.basins) {
        if (b.basin) basins.add(b.basin);
    }
    for (const b of basins) {
        select.innerHTML += `<option value="${b}">${b}</option>`;
    }
}
function fillExportSectionSelect(province, basin) {
    const select = document.getElementById('exportSectionSelect');
    select.innerHTML = '<option value="">请选择</option>';
    if (!province || !basin) return;
    const p = waterQualityData.find(x => x.province === province);
    if (!p) return;
    for (const b of p.basins) {
        if (b.basin === basin && b.section) {
            select.innerHTML += `<option value="${b.section}">${b.section}</option>`;
        }
    }
}
function bindExportWaterSelectEvents() {
    document.getElementById('exportProvinceSelect').addEventListener('change', function() {
        fillExportBasinSelect(this.value);
        fillExportSectionSelect(this.value, '');
    });
    document.getElementById('exportBasinSelect').addEventListener('change', function() {
        const province = document.getElementById('exportProvinceSelect').value;
        fillExportSectionSelect(province, this.value);
    });
}
// 打开导出模态框时初始化
const exportModal = document.getElementById('exportWaterModal');
exportModal?.addEventListener('show.bs.modal', function() {
    fillExportProvinceSelect();
    fillExportBasinSelect('');
    fillExportSectionSelect('', '');
});
bindExportWaterSelectEvents();

// 导出按钮点击事件
function confirmExportAll(msg, callback) {
    if (window.confirm(msg)) callback();
}
document.getElementById('startWaterExportBtn')?.addEventListener('click', function() {
    const province = document.getElementById('exportProvinceSelect').value;
    const basin = document.getElementById('exportBasinSelect').value;
    const section = document.getElementById('exportSectionSelect').value;
    const format = document.getElementById('waterExportFormat').value;
    let msg = '';
    if (!province && !basin && !section) {
        msg = '未选择任何筛选条件，是否导出所有水质监测数据？';
    } else if (province && !basin && !section) {
        msg = `未选择流域和断面，是否导出【${province}】的所有水质监测数据？`;
    } else if (province && basin && !section) {
        msg = `未选择断面，是否导出【${province}→${basin}】的所有水质监测数据？`;
    }
    const doExport = () => {
        const params = new URLSearchParams();
        if (province) params.append('province', province);
        if (basin) params.append('basin', basin);
        if (section) params.append('section', section);
        params.append('format', format);
        const url = `/api/water_quality/export?${params.toString()}`;
        // 显示进度
        const status = document.getElementById('waterExportStatus');
        status.textContent = '正在导出...';
        fetch(url).then(async res => {
            if (!res.ok) {
                status.textContent = '导出失败';
                return;
            }
            const blob = await res.blob();
            // 获取文件名
            let filename = res.headers.get('Content-Disposition');
            if (filename) {
                const match = filename.match(/filename\*=UTF-8''(.+)/);
                if (match) filename = decodeURIComponent(match[1]);
                else filename = '水质监测数据.zip';
            } else {
                filename = '水质监测数据.zip';
            }
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            status.textContent = '导出完成';
        }).catch(() => {
            status.textContent = '导出失败';
        });
    };
    if (msg) {
        confirmExportAll(msg, doExport);
    } else {
        doExport();
    }
});


