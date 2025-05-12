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
