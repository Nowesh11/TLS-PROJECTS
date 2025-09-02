const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getForms,
    getForm,
    createForm,
    updateForm,
    deleteForm,
    createFormField,
    updateFormField,
    deleteFormField,
    getFormResponses,
    getFormResponse,
    createFormResponse,
    deleteFormResponse,
    getFormStats,
    exportFormResponses
} = require('../controllers/forms');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const formId = req.params.id;
        const uploadPath = path.join(__dirname, '../../uploads/forms', formId);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Form CRUD routes
router.route('/')
    .get(getForms)
    .post(protect, authorize('admin', 'manager'), createForm);

router.route('/:id')
    .get(getForm)
    .put(protect, authorize('admin', 'manager'), updateForm)
    .delete(protect, authorize('admin', 'manager'), deleteForm);

// Form fields routes
router.route('/:id/fields')
    .post(protect, authorize('admin', 'manager'), createFormField);

router.route('/:id/fields/:fieldId')
    .put(protect, authorize('admin', 'manager'), updateFormField)
    .delete(protect, authorize('admin', 'manager'), deleteFormField);

// Form responses routes
router.route('/:id/responses')
    .get(protect, authorize('admin', 'manager'), getFormResponses)
    .post(upload.any(), createFormResponse); // Public endpoint for form submission

router.route('/:id/responses/:responseId')
    .get(protect, authorize('admin', 'manager'), getFormResponse)
    .delete(protect, authorize('admin', 'manager'), deleteFormResponse);

// Form statistics and export routes
router.route('/:id/stats')
    .get(protect, authorize('admin', 'manager'), getFormStats);

router.route('/:id/responses/export')
    .get(protect, authorize('admin', 'manager'), exportFormResponses);

module.exports = router;