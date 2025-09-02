const express = require('express');
const {
    getTeamMembers,
    getTeamMember,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    uploadTeamMemberImage,
    deleteTeamMemberImage
} = require('../controllers/team-members');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getTeamMembers);
router.get('/:id', getTeamMember);

// Protected admin routes
router.post('/', protect, authorize('admin'), createTeamMember);
router.put('/:id', protect, authorize('admin'), updateTeamMember);
router.delete('/:id', protect, authorize('admin'), deleteTeamMember);

// Image management routes
router.post('/:id/image', protect, authorize('admin'), uploadTeamMemberImage);
router.delete('/:id/image', protect, authorize('admin'), deleteTeamMemberImage);

module.exports = router;