const User = require('../models/User');
const Book = require('../models/Book');
const Project = require('../models/Project');
const Activity = require('../models/Activity');

// Get dashboard statistics and aggregate data
exports.getDashboardStats = async (req, res) => {
    try {
        const [userCount, bookCount, projectCount, activityCount] = await Promise.all([
            User.countDocuments(),
            Book.countDocuments(),
            Project.countDocuments({ status: 'active' }),
            Activity.countDocuments({
                createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) }
            })
        ]);

        // Get user growth data for chart
        const userGrowth = await User.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Get activity distribution by type
        const activityDistribution = await Activity.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            stats: {
                userCount,
                bookCount, 
                projectCount,
                activityCount
            },
            charts: {
                userGrowth: formatUserGrowthData(userGrowth),
                activityDistribution: formatActivityDistribution(activityDistribution)
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};

// Get recent activities (last 30 days)
exports.getRecentActivities = async (req, res) => {
    try {
        const activities = await Activity.find({
            createdAt: {
                $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name');

        res.json(activities);
    } catch (error) {
        console.error('Recent activities error:', error);
        res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
};

// Helper function to format chart data
function formatUserGrowthData(data) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
        labels: data.map(item => `${months[item._id.month - 1]} ${item._id.year}`),
        datasets: [{
            label: 'New Users',
            data: data.map(item => item.count),
            borderColor: 'var(--primary-blue, #3B82F6)',
            tension: 0.4
        }]
    };
}

function formatActivityDistribution(data) {
    const colors = [
        'var(--primary-blue, #3B82F6)', 
        'var(--success-color, #10B981)', 
        'var(--warning-color, #F59E0B)', 
        'var(--error-color, #EF4444)', 
        'var(--purple-500, #8B5CF6)'
    ];
    
    return {
        labels: data.map(item => item._id),
        datasets: [{
            data: data.map(item => item.count),
            backgroundColor: colors.slice(0, data.length)
        }]
    };
}

// Add this method to auto-clear activities older than 1 month
exports.autoCleanOldActivities = async (req, res) => {
    try {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const result = await Activity.deleteMany({
            createdAt: { $lt: oneMonthAgo }
        });
        
        console.log(`Auto-cleared ${result.deletedCount} old activities`);
        
        if (res) {
            res.json({ 
                success: true, 
                deletedCount: result.deletedCount,
                message: `Cleared ${result.deletedCount} activities older than 1 month`
            });
        }
        
        return result;
    } catch (error) {
        console.error('Auto-clear activities error:', error);
        if (res) {
            res.status(500).json({ error: 'Failed to auto-clear old activities' });
        }
        throw error;
    }
};

// Schedule auto-clear to run daily
const scheduleAutoCleanup = () => {
    const runCleanup = async () => {
        try {
            await exports.autoCleanOldActivities();
        } catch (error) {
            console.error('Scheduled cleanup failed:', error);
        }
    };
    
    // Run immediately on server start
    runCleanup();
    
    // Then run every 24 hours
    setInterval(runCleanup, 24 * 60 * 60 * 1000);
};

// Export the scheduler
exports.scheduleAutoCleanup = scheduleAutoCleanup;