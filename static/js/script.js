// 这里可以放置一些通用的JavaScript代码
// 例如：事件监听、DOM操作等

// 水质地图与时序分析主逻辑
// 依赖: ECharts (已在base.html引入)

let waterQualityData = [];
let currentProvince = '';
let currentBasin = '';
let currentSection = '';
let currentIndicators = ['水温(℃)'];
let currentDateRange = null;

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
    // 取该省所有流域下断面，模拟地理坐标（如有真实坐标可替换）
    const p = waterQualityData.find(x => x.province === currentProvince);
    if (!p) return;
    const basinSections = p.basins.filter(b => b.basin === currentBasin && b.section);
    // 生成随机坐标（如有真实坐标可用b.geo）
    const scatterData = basinSections.map((b, i) => ({
        name: b.section,
        value: [116 + Math.random(), 39 + Math.random(), b.avg_metrics['溶解氧(mg/L)'] || 0],
        label: {show: false},
        section: b.section
    }));
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
                document.getElementById('sectionSelect').value = params.name;
                currentSection = params.name;
                renderSectionTrend();
            });
        });
}

// 渲染断面气泡（可扩展为地图气泡）
function renderSectionMap() {
    // 可选：实现断面级别的气泡地图
}

// 渲染断面时序折线图
async function renderSectionTrend() {
    if (!currentProvince || !currentBasin || !currentSection) return;
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
        myChart.setOption({title: {text: '无数据', left: 'center'}});
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
    myChart.setOption({
        tooltip: {trigger: 'axis'},
        legend: {data: series.map(s => s.name)},
        xAxis: {type: 'category', data: xData},
        yAxis: {type: 'value'},
        series: series
    });
}
