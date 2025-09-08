/**
 * Modern Chart Theme Manager
 * Automatically adapts chart colors based on current theme
 */

class ChartThemeManager {
    constructor() {
        this.currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.observers = new Set();
        this.init();
    }

    init() {
        // Watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    if (newTheme !== this.currentTheme) {
                        this.currentTheme = newTheme;
                        this.notifyObservers();
                    }
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    // Get current theme colors
    getThemeColors() {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        return {
            primary: computedStyle.getPropertyValue('--chart-primary').trim(),
            secondary: computedStyle.getPropertyValue('--chart-secondary').trim(),
            accent: computedStyle.getPropertyValue('--chart-accent').trim(),
            warning: computedStyle.getPropertyValue('--chart-warning').trim(),
            success: computedStyle.getPropertyValue('--chart-success').trim(),
            info: computedStyle.getPropertyValue('--chart-info').trim(),
            light: computedStyle.getPropertyValue('--chart-light').trim(),
            dark: computedStyle.getPropertyValue('--chart-dark').trim(),
            grid: computedStyle.getPropertyValue('--chart-grid').trim(),
            text: computedStyle.getPropertyValue('--chart-text').trim(),
            background: computedStyle.getPropertyValue('--chart-background').trim(),
            tooltipBg: computedStyle.getPropertyValue('--chart-tooltip-bg').trim(),
            tooltipBorder: computedStyle.getPropertyValue('--chart-tooltip-border').trim()
        };
    }

    // Get color palette array
    getColorPalette() {
        const colors = this.getThemeColors();
        return [
            colors.primary,
            colors.secondary,
            colors.accent,
            colors.warning,
            colors.success,
            colors.info
        ];
    }

    // Get gradient colors for backgrounds
    getGradientColors() {
        const colors = this.getThemeColors();
        return [
            `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            `linear-gradient(135deg, ${colors.accent}, ${colors.warning})`,
            `linear-gradient(135deg, ${colors.success}, ${colors.info})`,
            `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
            `linear-gradient(135deg, ${colors.warning}, ${colors.accent})`,
            `linear-gradient(135deg, ${colors.info}, ${colors.success})`
        ];
    }

    // Generate Chart.js configuration with theme colors
    getChartConfig(type = 'line', options = {}) {
        const colors = this.getThemeColors();
        const palette = this.getColorPalette();

        const baseConfig = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        font: {
                            family: 'Inter, system-ui, sans-serif',
                            size: 12,
                            weight: '500'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: colors.tooltipBg,
                    titleColor: colors.text,
                    bodyColor: colors.text,
                    borderColor: colors.tooltipBorder,
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 12,
                    titleFont: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 12,
                        weight: '400'
                    },
                    displayColors: true,
                    boxPadding: 6
                }
            },
            scales: this.getScalesConfig(type, colors)
        };

        return this.mergeDeep(baseConfig, options);
    }

    // Get scales configuration based on chart type
    getScalesConfig(type, colors) {
        if (type === 'doughnut' || type === 'pie' || type === 'polarArea') {
            return {};
        }

        return {
            x: {
                grid: {
                    color: colors.grid,
                    borderColor: colors.grid,
                    borderWidth: 1
                },
                ticks: {
                    color: colors.text,
                    font: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 11,
                        weight: '400'
                    }
                }
            },
            y: {
                grid: {
                    color: colors.grid,
                    borderColor: colors.grid,
                    borderWidth: 1
                },
                ticks: {
                    color: colors.text,
                    font: {
                        family: 'Inter, system-ui, sans-serif',
                        size: 11,
                        weight: '400'
                    }
                }
            }
        };
    }

    // Apply theme to existing chart
    updateChartTheme(chart) {
        if (!chart || !chart.config) return;

        const colors = this.getThemeColors();
        const palette = this.getColorPalette();

        // Update dataset colors
        if (chart.data && chart.data.datasets) {
            chart.data.datasets.forEach((dataset, index) => {
                const colorIndex = index % palette.length;
                const color = palette[colorIndex];

                if (chart.config.type === 'line') {
                    dataset.borderColor = color;
                    dataset.backgroundColor = this.hexToRgba(color, 0.1);
                    dataset.pointBackgroundColor = color;
                    dataset.pointBorderColor = colors.light;
                } else if (chart.config.type === 'bar') {
                    dataset.backgroundColor = this.hexToRgba(color, 0.8);
                    dataset.borderColor = color;
                    dataset.hoverBackgroundColor = color;
                } else if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
                    dataset.backgroundColor = palette.map(c => this.hexToRgba(c, 0.8));
                    dataset.borderColor = palette;
                    dataset.hoverBackgroundColor = palette;
                }
            });
        }

        // Update chart options
        const newConfig = this.getChartConfig(chart.config.type, chart.options);
        Object.assign(chart.options, newConfig);

        // Update chart
        chart.update('none');
    }

    // Convert hex to rgba
    hexToRgba(hex, alpha = 1) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return hex;
        
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Deep merge objects
    mergeDeep(target, source) {
        const output = Object.assign({}, target);
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // Register observer for theme changes
    onThemeChange(callback) {
        this.observers.add(callback);
        return () => this.observers.delete(callback);
    }

    // Notify all observers
    notifyObservers() {
        this.observers.forEach(callback => {
            try {
                callback(this.currentTheme, this.getThemeColors());
            } catch (error) {
                console.error('Error in theme change observer:', error);
            }
        });
    }

    // Create a new chart with theme support
    createChart(ctx, config) {
        const themeConfig = this.getChartConfig(config.type, config.options || {});
        const colors = this.getColorPalette();

        // Apply colors to datasets if not already set
        if (config.data && config.data.datasets) {
            config.data.datasets.forEach((dataset, index) => {
                const colorIndex = index % colors.length;
                const color = colors[colorIndex];

                if (!dataset.backgroundColor) {
                    if (config.type === 'line') {
                        dataset.backgroundColor = this.hexToRgba(color, 0.1);
                        dataset.borderColor = color;
                        dataset.pointBackgroundColor = color;
                    } else if (config.type === 'bar') {
                        dataset.backgroundColor = this.hexToRgba(color, 0.8);
                        dataset.borderColor = color;
                    } else if (config.type === 'doughnut' || config.type === 'pie') {
                        dataset.backgroundColor = colors.map(c => this.hexToRgba(c, 0.8));
                        dataset.borderColor = colors;
                    }
                }
            });
        }

        const finalConfig = {
            type: config.type,
            data: config.data,
            options: themeConfig
        };

        const chart = new Chart(ctx, finalConfig);

        // Register for theme updates
        this.onThemeChange(() => {
            this.updateChartTheme(chart);
        });

        return chart;
    }
}

// Global instance
window.chartThemeManager = new ChartThemeManager();

// Helper functions for easy access
window.createThemedChart = (ctx, config) => {
    return window.chartThemeManager.createChart(ctx, config);
};

window.updateChartTheme = (chart) => {
    return window.chartThemeManager.updateChartTheme(chart);
};

window.getChartColors = () => {
    return window.chartThemeManager.getColorPalette();
};

window.getChartThemeColors = () => {
    return window.chartThemeManager.getThemeColors();
};

// Auto-update existing charts on theme change
document.addEventListener('DOMContentLoaded', () => {
    // Find all existing Chart.js instances and register them for theme updates
    if (window.Chart && window.Chart.instances) {
        Object.values(window.Chart.instances).forEach(chart => {
            window.chartThemeManager.onThemeChange(() => {
                window.chartThemeManager.updateChartTheme(chart);
            });
        });
    }
});

console.log('Chart Theme Manager initialized');