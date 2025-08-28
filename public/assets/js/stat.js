let ws, maxPoints = 60, itemsPerPage = 10;
    let memoryData = Array(maxPoints).fill(0), cpuData = Array(maxPoints).fill(0), requestRateData = Array(maxPoints).fill(0), responseTimeData = Array(maxPoints).fill(0), timeLabels = Array(maxPoints).fill(''), networkDownData = Array(maxPoints).fill(0), networkUpData = Array(maxPoints).fill(0), apiStats = [], currentPage = 1;

    // Store previous values to prevent animation bugs and repetition
    let previousStats = {
      totalRequests: 0,
      requestsPerSecond: 0,
      dailyRequests: 0,
      totalEndpoints: 0,
      apiTotalRequests: 0,
      cpuUsage: 0,
      networkDown: 0,
      networkUp: 0,
      memoryUsage: 0
    };

    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${window.location.host}/ws/monitor`;
      console.log('Connecting to WebSocket:', wsUrl);
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        console.log('WebSocket connected');
        document.querySelector('.live-indicator').style.backgroundColor = '#10b981';
        document.body.style.opacity = '1';
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.stats) handleStatsUpdate(data.stats);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        document.querySelector('.live-indicator').style.backgroundColor = '#ef4444';
        document.body.style.opacity = '0.7';
        setTimeout(connectWebSocket, 3000);
      };
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.querySelector('.live-indicator').style.backgroundColor = '#ef4444';
        document.body.style.opacity = '0.7';
      };
    }

    function updateTime() {
      document.getElementById('currentTime').textContent = new Date().toLocaleString();
    }
    setInterval(updateTime, 1000);
    updateTime();

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Montserrat',sans-serif";

    const commonChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255,255,255,0.05)'
          },
          ticks: {
            padding: 10
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            padding: 10,
            maxTicksLimit: 10
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.9)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (context) => context.dataset.label + ': ' + context.parsed.y.toFixed(1)
          }
        }
      }
    };

    const systemChart = new Chart(document.getElementById('systemChart'), {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: 'Memory Usage',
          data: memoryData,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }, {
          label: 'CPU Usage',
          data: cpuData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }]
      },
      options: {
        ...commonChartOptions,
        scales: {
          ...commonChartOptions.scales,
          y: {
            ...commonChartOptions.scales.y,
            max: 100
          }
        },
        plugins: {
          ...commonChartOptions.plugins,
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });

    const requestChart = new Chart(document.getElementById('requestChart'), {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: 'Requests/Second',
          data: requestRateData,
          borderColor: '#f85149',
          backgroundColor: 'rgba(56,189,248,0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }]
      },
      options: commonChartOptions
    });

    const responseChart = new Chart(document.getElementById('responseChart'), {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: 'Avg Response Time (ms)',
          data: responseTimeData,
          borderColor: '#f472b6',
          backgroundColor: 'rgba(244,114,182,0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }]
      },
      options: {
        ...commonChartOptions,
        scales: {
          ...commonChartOptions.scales,
          y: {
            ...commonChartOptions.scales.y,
            ticks: {
              callback: value => value + ' ms'
            }
          }
        }
      }
    });

    const historyChart = new Chart(document.getElementById('historyChart'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Total Requests',
          data: [],
          backgroundColor: 'rgba(96,165,250,0.8)',
          borderColor: '#60a5fa',
          borderWidth: 1
        }, {
          label: 'API Requests',
          data: [],
          backgroundColor: 'rgba(129,140,248,0.8)',
          borderColor: '#818cf8',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255,255,255,0.05)'
            },
            ticks: {
              padding: 10
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              padding: 10,
              maxRotation: 45
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.9)',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true
          }
        }
      }
    });

    const networkChart = new Chart(document.getElementById('networkChart'), {
      type: 'line',
      data: {
        labels: timeLabels,
        datasets: [{
          label: 'Download',
          data: networkDownData,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }, {
          label: 'Upload',
          data: networkUpData,
          borderColor: '#fb923c',
          backgroundColor: 'rgba(251,146,60,0.1)',
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        }]
      },
      options: {
        ...commonChartOptions,
        plugins: {
          ...commonChartOptions.plugins,
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });

    const responseDistChart = new Chart(document.getElementById('responseDistChart'), {
      type: 'doughnut',
      data: {
        labels: ['Fast (<10000ms)', 'Medium (10000-30000ms)', 'Slow (30000-60000ms)', 'Very Slow (>60000ms)'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.9)',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12
          }
        }
      }
    });

    const methodChart = new Chart(document.getElementById('methodChart'), {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.9)',
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12
          }
        }
      }
    });

    function updateTimeSeriesData(newMemory, newCPU, newRequestRate, newResponseTime, newDownload, newUpload) {
      const now = new Date().toLocaleTimeString();

      timeLabels.shift();
      timeLabels.push(now);

      memoryData.shift();
      memoryData.push(parseFloat(newMemory) || 0);

      cpuData.shift();
      cpuData.push(parseFloat(newCPU) || 0);

      requestRateData.shift();
      requestRateData.push(parseFloat(newRequestRate) || 0);

      responseTimeData.shift();
      responseTimeData.push(parseFloat(newResponseTime) || 0);

      networkDownData.shift();
      networkDownData.push(parseFloat(newDownload) || 0);

      networkUpData.shift();
      networkUpData.push(parseFloat(newUpload) || 0);

      return {
        labels: timeLabels,
        memory: memoryData,
        cpu: cpuData,
        requests: requestRateData,
        responseTime: responseTimeData,
        download: networkDownData,
        upload: networkUpData
      }
    }

    function animateValue(element, start, end, duration, unit = '') {
      if (!element) return;

      const range = end - start;
      if (Math.abs(range) < 1) {
        element.textContent = end.toLocaleString() + unit;
        return;
      }

      const stepTime = Math.abs(Math.floor(duration / Math.abs(range)));
      const startTime = new Date().getTime();
      const endTime = startTime + duration;
      let timer;

      function run() {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const value = Math.round(end - remaining * range);
        element.textContent = value.toLocaleString() + unit;
        if (value === end) clearInterval(timer);
      }

      timer = setInterval(run, stepTime);
      run();
    }

    function updateMetricCard(elementId, newValue, oldValue = 0, unit = '') {
      const element = document.getElementById(elementId);
      if (!element) return;

      // Special handling for CPU - realtime direct update but check for changes to prevent repetition
      if (elementId === 'cpuUsage') {
        const currentDisplayed = parseFloat(element.textContent.replace('%', '')) || 0;
        const newCpuValue = parseFloat(newValue) || 0;

        // Only update if value actually changed (prevent repetition)
        if (Math.abs(newCpuValue - currentDisplayed) >= 0.1) {
          element.textContent = newCpuValue.toFixed(1) + unit;
        }
        return;
      }

      // Use smooth animation for other metrics
      animateValue(element, oldValue, newValue, 500, unit);
    }

    function renderRecentRequests(recentRequests) {
      const container = document.getElementById('recentRequestsList');
      if (!container || !recentRequests) return;

      // Filter only API requests (endpoints starting with /api/)
      const apiRequests = recentRequests.filter(req => req.endpoint && req.endpoint.startsWith('/api/'));

      container.innerHTML = '';

      if (apiRequests.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">No recent API requests</div>';
        return;
      }

      apiRequests.forEach((req, index) => {
        const timeAgo = Math.floor((Date.now() - req.timestamp) / 1000);
        const timeText = timeAgo < 60 ? `${timeAgo}s ago` : timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` : `${Math.floor(timeAgo / 3600)}h ago`;
        const statusClass = req.statusCode >= 200 && req.statusCode < 300 ? 'status-success' : req.statusCode >= 500 ? 'status-error' : 'status-warning';

        const div = document.createElement('div');
        div.className = 'recent-request glass-effect p-3 rounded-lg flex items-center justify-between';
        div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 rounded-full ${req.statusCode>=200&&req.statusCode<300?'bg-emerald-500':req.statusCode>=500?'bg-red-500':'bg-yellow-500'}"></div>
        <div>
          <div class="text-sm font-medium text-white">${req.method} ${req.endpoint}</div>
          <div class="text-xs text-gray-400">${req.maskedIp} • ${req.userAgent}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-sm ${statusClass} font-medium">${req.statusCode}</div>
        <div class="text-xs text-gray-400">${req.duration}ms • ${timeText}</div>
      </div>
    `;
        container.appendChild(div);
      });
    }

    function renderUserAgentStats(userAgentData) {
      const container = document.getElementById('userAgentStats');
      if (!container || !userAgentData) return;

      const sortedAgents = Object.entries(userAgentData).sort(([, a], [, b]) => b - a).slice(0, 5);
      container.innerHTML = '';

      sortedAgents.forEach(([agent, count]) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 glass-effect rounded-lg';
        div.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="ri-global-line text-blue-400"></i>
        <span class="text-white">${agent}</span>
      </div>
      <span class="text-gray-400">${count.toLocaleString()}</span>
    `;
        container.appendChild(div);
      });
    }

    function renderApiTable() {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const slicedStats = apiStats.slice(start, end);
      const tbody = document.getElementById('apiTableBody');

      tbody.innerHTML = '';
      slicedStats.forEach(([endpoint, data], index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td class="px-4 py-2">${start+index+1}</td>
      <td class="px-4 py-2">${endpoint.replace(/_/g,'/')}</td>
      <td class="px-4 py-2">${data.totalRequests.toLocaleString()}</td>
      <td class="px-4 py-2">${data.success.toLocaleString()}</td>
      <td class="px-4 py-2">${data.errors.toLocaleString()}</td>
      <td class="px-4 py-2">${data.avgResponseTime}</td>
      <td class="px-4 py-2">${data.errorRate}%</td>
      <td class="px-4 py-2">${data.successRate}%</td>
    `;
        tbody.appendChild(row);
      });

      const totalPages = Math.ceil(apiStats.length / itemsPerPage);
      document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
      document.getElementById('prevPage').disabled = currentPage === 1;
      document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    function updateHistoryChart(dailyData, apiDailyData) {
      const dates = Object.keys(dailyData).slice(-10).map(date => new Date(date).toLocaleDateString());
      const totalRequests = Object.keys(dailyData).slice(-10).map(date => dailyData[date]);
      const apiRequests = Object.keys(apiDailyData).slice(-10).map(date => apiDailyData[date] || 0);

      historyChart.data.labels = dates;
      historyChart.data.datasets[0].data = totalRequests;
      historyChart.data.datasets[1].data = apiRequests;
      historyChart.update('none');
    }

    function handleStatsUpdate(stats) {
      // Update metrics with proper value preservation and animation
      updateMetricCard('totalRequests', stats.requests.total, previousStats.totalRequests);
      previousStats.totalRequests = stats.requests.total;

      updateMetricCard('totalEndpoints', stats.system.totalEndpoints, previousStats.totalEndpoints);
      previousStats.totalEndpoints = stats.system.totalEndpoints;

      updateMetricCard('requestsPerSecond', parseFloat(stats.requests.perSecond), previousStats.requestsPerSecond);
      previousStats.requestsPerSecond = parseFloat(stats.requests.perSecond);

      updateMetricCard('apiTotalRequests', stats.requests.api.total, previousStats.apiTotalRequests);
      previousStats.apiTotalRequests = stats.requests.api.total;

      const today = new Date().toISOString().split('T')[0];
      const dailyRequestCount = stats.requests.daily?.[today] || 0;
      updateMetricCard('dailyRequests', dailyRequestCount, previousStats.dailyRequests);
      previousStats.dailyRequests = dailyRequestCount;

      // CPU usage - REALTIME update with no delay, but prevent repetition
      const newCpuUsage = parseFloat(stats.system.cpu.usage || 0);
      updateMetricCard('cpuUsage', newCpuUsage, previousStats.cpuUsage, '%');
      previousStats.cpuUsage = newCpuUsage;

      // Update network stats - realtime like before
      if (stats.network) {
        document.getElementById('networkDown').textContent = stats.network.download.speed || '0 MB/s';
        document.getElementById('networkUp').textContent = stats.network.upload.speed || '0 KB/s';

        previousStats.networkDown = stats.network.download.speedRaw || 0;
        previousStats.networkUp = stats.network.upload.speedRaw || 0;
      }

      // Store memory usage
      previousStats.memoryUsage = parseFloat(stats.system.memory.usagePercent || 0);

      // Update time series data with realtime values
      const timeSeriesData = updateTimeSeriesData(
        previousStats.memoryUsage,
        newCpuUsage, // Use realtime CPU value for charts
        stats.requests.perSecond,
        stats.overallAvgResponseTime,
        previousStats.networkDown,
        previousStats.networkUp
      );

      // Update charts
      systemChart.data.labels = timeSeriesData.labels;
      systemChart.data.datasets[0].data = timeSeriesData.memory;
      systemChart.data.datasets[1].data = timeSeriesData.cpu;
      systemChart.update('none');

      requestChart.data.labels = timeSeriesData.labels;
      requestChart.data.datasets[0].data = timeSeriesData.requests;
      requestChart.update('none');

      responseChart.data.labels = timeSeriesData.labels;
      responseChart.data.datasets[0].data = timeSeriesData.responseTime;
      responseChart.update('none');

      networkChart.data.labels = timeSeriesData.labels;
      networkChart.data.datasets[0].data = timeSeriesData.download;
      networkChart.data.datasets[1].data = timeSeriesData.upload;
      networkChart.update('none');

      // Update history chart
      if (stats.requests.daily && stats.requests.api.daily) {
        updateHistoryChart(stats.requests.daily, stats.requests.api.daily);
      }

      // Update enhanced stats
      if (stats.enhanced) {
        renderRecentRequests(stats.enhanced.recentRequests);
        renderUserAgentStats(stats.enhanced.topUserAgents);

        // Update response time distribution
        if (stats.enhanced.responseTimeDistribution) {
          const dist = stats.enhanced.responseTimeDistribution;
          responseDistChart.data.datasets[0].data = [dist.fast, dist.medium, dist.slow, dist.verySlow];
          responseDistChart.update('none');
        }

        // Update method distribution
        if (stats.enhanced.methodDistribution) {
          const methods = Object.keys(stats.enhanced.methodDistribution);
          const counts = Object.values(stats.enhanced.methodDistribution);
          methodChart.data.labels = methods;
          methodChart.data.datasets[0].data = counts;
          methodChart.update('none');
        }
      }

      // Update API stats table
      apiStats = Object.entries(stats.apiStats)
        .filter(([_, data]) => data.totalRequests > 0)
        .sort((a, b) => b[1].totalRequests - a[1].totalRequests);
      renderApiTable();
    }

    // Event listeners
    document.getElementById('prevPage').addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderApiTable();
      }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      if (currentPage < Math.ceil(apiStats.length / itemsPerPage)) {
        currentPage++;
        renderApiTable();
      }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        [systemChart, requestChart, responseChart, historyChart, networkChart, responseDistChart, methodChart].forEach(chart => chart.resize());
      }, 250);
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      const charts = [systemChart, requestChart, responseChart, historyChart, networkChart, responseDistChart, methodChart];
      if (document.hidden) {
        charts.forEach(chart => chart.stop());
      } else {
        charts.forEach(chart => {
          chart.start();
          chart.update('none');
        });
      }
    });

    // Initialize WebSocket connection
    connectWebSocket();