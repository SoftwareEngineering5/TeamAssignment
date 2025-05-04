// 页面加载完成后初始化图表
document.addEventListener('DOMContentLoaded', function() {
    // 温度变化趋势图
    const temperatureCtx = document.getElementById('temperatureChart').getContext('2d');
    const temperatureChart = new Chart(temperatureCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
            datasets: [{
                label: '水温 (°C)',
                data: [15.2, 15.1, 15.0, 15.3, 15.5, 15.8, 16.0, 16.2, 16.1, 16.0, 15.8, 15.5],
                borderColor: '#0077b6',
                backgroundColor: 'rgba(0, 119, 182, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '温度 (°C)'
                    }
                }
            }
        }
    });

    // 盐度变化趋势图
    const salinityCtx = document.getElementById('salinityChart').getContext('2d');
    const salinityChart = new Chart(salinityCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
            datasets: [{
                label: '盐度 (‰)',
                data: [32.1, 32.2, 32.3, 32.4, 32.5, 32.6, 32.5, 32.4, 32.3, 32.2, 32.1, 32.0],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '盐度 (‰)'
                    }
                }
            }
        }
    });

    // 鱼类活动热力图（简化为柱状图）
    const fishActivityCtx = document.getElementById('fishActivityChart').getContext('2d');
    const fishActivityChart = new Chart(fishActivityCtx, {
        type: 'bar',
        data: {
            labels: ['区域A', '区域B', '区域C', '区域D', '区域E', '区域F'],
            datasets: [{
                label: '鱼类活动频率',
                data: [65, 42, 78, 53, 36, 91],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '活动频率'
                    }
                }
            }
        }
    });
});
