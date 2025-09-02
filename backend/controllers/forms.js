const Form = require('../models/Form');
const FormField = require('../models/FormField');
const FormResponse = require('../models/FormResponse');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// @desc    Get all forms
// @route   GET /api/forms
// @access  Public (filtered by query params)
exports.getForms = asyncHandler(async (req, res, next) => {
    let query = {};
    
    // Filter by target type and ID
    if (req.query.target_type) {
        query.target_type = req.query.target_type;
    }
    
    if (req.query.target_id) {
        query.target_id = req.query.target_id;
    }
    
    if (req.query.role) {
        query.role = req.query.role;
    }
    
    // Only show active forms for public access
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
        query.is_active = true;
        query.available_date = { $lte: new Date() };
        query.deadline_date = { $gte: new Date() };
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const total = await Form.countDocuments(query);
    
    const forms = await Form.find(query)
        .populate('fields')
        .populate('target_id')
        .sort({ created_at: -1 })
        .skip(startIndex)
        .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }
    
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }
    
    res.status(200).json({
        success: true,
        count: forms.length,
        total,
        pagination,
        data: forms
    });
});

// @desc    Get single form
// @route   GET /api/forms/:id
// @access  Public
exports.getForm = asyncHandler(async (req, res, next) => {
    const form = await Form.findById(req.params.id)
        .populate('fields')
        .populate('target_id');
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    res.status(200).json({
        success: true,
        data: form
    });
});

// @desc    Create new form
// @route   POST /api/forms
// @access  Private (Admin/Manager)
exports.createForm = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.created_by = req.user.id;
    
    const form = await Form.create(req.body);
    
    res.status(201).json({
        success: true,
        data: form
    });
});

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private (Admin/Manager)
exports.updateForm = asyncHandler(async (req, res, next) => {
    let form = await Form.findById(req.params.id);
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    form = await Form.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({
        success: true,
        data: form
    });
});

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private (Admin/Manager)
exports.deleteForm = asyncHandler(async (req, res, next) => {
    const form = await Form.findById(req.params.id);
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    // Delete associated files
    const uploadPath = path.join(__dirname, '../../uploads/forms', req.params.id);
    if (fs.existsSync(uploadPath)) {
        fs.rmSync(uploadPath, { recursive: true, force: true });
    }
    
    await form.deleteOne();
    
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Create form field
// @route   POST /api/forms/:id/fields
// @access  Private (Admin/Manager)
exports.createFormField = asyncHandler(async (req, res, next) => {
    const form = await Form.findById(req.params.id);
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    req.body.form_id = req.params.id;
    
    const field = await FormField.create(req.body);
    
    res.status(201).json({
        success: true,
        data: field
    });
});

// @desc    Update form field
// @route   PUT /api/forms/:id/fields/:fieldId
// @access  Private (Admin/Manager)
exports.updateFormField = asyncHandler(async (req, res, next) => {
    let field = await FormField.findOne({
        _id: req.params.fieldId,
        form_id: req.params.id
    });
    
    if (!field) {
        return next(new ErrorResponse(`Field not found`, 404));
    }
    
    field = await FormField.findByIdAndUpdate(req.params.fieldId, req.body, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({
        success: true,
        data: field
    });
});

// @desc    Delete form field
// @route   DELETE /api/forms/:id/fields/:fieldId
// @access  Private (Admin/Manager)
exports.deleteFormField = asyncHandler(async (req, res, next) => {
    const field = await FormField.findOne({
        _id: req.params.fieldId,
        form_id: req.params.id
    });
    
    if (!field) {
        return next(new ErrorResponse(`Field not found`, 404));
    }
    
    await field.deleteOne();
    
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get form responses
// @route   GET /api/forms/:id/responses
// @access  Private (Admin/Manager)
exports.getFormResponses = asyncHandler(async (req, res, next) => {
    const form = await Form.findById(req.params.id);
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const total = await FormResponse.countDocuments({ form_id: req.params.id });
    
    const responses = await FormResponse.find({ form_id: req.params.id })
        .populate('form_id')
        .sort({ submitted_at: -1 })
        .skip(startIndex)
        .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }
    
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }
    
    res.status(200).json({
        success: true,
        count: responses.length,
        total,
        pagination,
        data: responses
    });
});

// @desc    Get single form response
// @route   GET /api/forms/:id/responses/:responseId
// @access  Private (Admin/Manager)
exports.getFormResponse = asyncHandler(async (req, res, next) => {
    const response = await FormResponse.findOne({
        _id: req.params.responseId,
        form_id: req.params.id
    }).populate('form_id');
    
    if (!response) {
        return next(new ErrorResponse(`Response not found`, 404));
    }
    
    res.status(200).json({
        success: true,
        data: response
    });
});

// @desc    Create form response (submit form)
// @route   POST /api/forms/:id/responses
// @access  Public
exports.createFormResponse = asyncHandler(async (req, res, next) => {
    const form = await Form.findById(req.params.id).populate('fields');
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    // Check if form is active and within date range
    const now = new Date();
    if (!form.is_active) {
        return next(new ErrorResponse('This form is not currently active', 400));
    }
    
    if (now < form.available_date) {
        return next(new ErrorResponse('This form is not yet available', 400));
    }
    
    if (now > form.deadline_date) {
        return next(new ErrorResponse('This form has expired', 400));
    }
    
    // Extract form data and files
    const { user_name, user_email, user_phone, ...responseData } = req.body;
    
    // Create response object
    const responseObj = {
        form_id: req.params.id,
        user_name,
        user_email,
        user_phone,
        response_json: responseData,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        uploaded_files: []
    };
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            // Find the corresponding field
            const field = form.fields.find(f => f._id.toString() === file.fieldname);
            if (field && field.field_type === 'file') {
                responseObj.uploaded_files.push({
                    field_id: field._id,
                    original_name: file.originalname,
                    file_name: file.filename,
                    file_path: file.path,
                    file_size: file.size,
                    mime_type: file.mimetype
                });
            }
        }
    }
    
    // Create and validate response
    const formResponse = new FormResponse(responseObj);
    
    // Validate response against form fields
    const validationErrors = await formResponse.validateResponse();
    if (validationErrors.length > 0) {
        return next(new ErrorResponse(`Validation failed: ${validationErrors.join(', ')}`, 400));
    }
    
    await formResponse.save();
    
    res.status(201).json({
        success: true,
        message: 'Form submitted successfully',
        data: {
            reference_number: formResponse.reference_number,
            submitted_at: formResponse.submitted_at
        }
    });
});

// @desc    Delete form response
// @route   DELETE /api/forms/:id/responses/:responseId
// @access  Private (Admin/Manager)
exports.deleteFormResponse = asyncHandler(async (req, res, next) => {
    const response = await FormResponse.findOne({
        _id: req.params.responseId,
        form_id: req.params.id
    });
    
    if (!response) {
        return next(new ErrorResponse(`Response not found`, 404));
    }
    
    // Delete associated files
    response.uploaded_files.forEach(file => {
        if (fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
        }
    });
    
    await response.deleteOne();
    
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get form statistics
// @route   GET /api/forms/:id/stats
// @access  Private (Admin/Manager)
exports.getFormStats = asyncHandler(async (req, res, next) => {
    const form = await Form.findById(req.params.id).populate('fields');
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    // Get total submissions
    const totalSubmissions = await FormResponse.countDocuments({ form_id: req.params.id });
    
    // Get submissions over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const submissionsOverTime = await FormResponse.aggregate([
        {
            $match: {
                form_id: form._id,
                submitted_at: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$submitted_at"
                    }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
    
    // Get field statistics for select/radio/checkbox fields
    const fieldStats = {};
    
    for (const field of form.fields) {
        if (['select', 'radio', 'checkbox'].includes(field.field_type)) {
            const fieldId = field._id.toString();
            
            const responses = await FormResponse.find(
                { form_id: req.params.id },
                { response_json: 1 }
            );
            
            const valueCounts = {};
            
            responses.forEach(response => {
                const value = response.response_json[fieldId];
                if (value) {
                    if (Array.isArray(value)) {
                        // For checkbox fields
                        value.forEach(v => {
                            valueCounts[v] = (valueCounts[v] || 0) + 1;
                        });
                    } else {
                        // For select/radio fields
                        valueCounts[value] = (valueCounts[value] || 0) + 1;
                    }
                }
            });
            
            fieldStats[fieldId] = {
                field_name: field.label_en,
                field_type: field.field_type,
                value_counts: valueCounts
            };
        }
    }
    
    // Get recent submissions
    const recentSubmissions = await FormResponse.find({ form_id: req.params.id })
        .select('user_name user_email submitted_at status reference_number')
        .sort({ submitted_at: -1 })
        .limit(10);
    
    res.status(200).json({
        success: true,
        data: {
            total_submissions: totalSubmissions,
            submissions_over_time: submissionsOverTime,
            field_statistics: fieldStats,
            recent_submissions: recentSubmissions,
            form_info: {
                title: form.title,
                created_at: form.created_at,
                is_active: form.is_active,
                available_date: form.available_date,
                deadline_date: form.deadline_date
            }
        }
    });
});

// @desc    Export form responses as CSV
// @route   GET /api/forms/:id/responses/export
// @access  Private (Admin/Manager)
exports.exportFormResponses = asyncHandler(async (req, res, next) => {
    const form = await Form.findById(req.params.id).populate('fields');
    
    if (!form) {
        return next(new ErrorResponse(`Form not found with id of ${req.params.id}`, 404));
    }
    
    const responses = await FormResponse.find({ form_id: req.params.id })
        .sort({ submitted_at: -1 });
    
    if (responses.length === 0) {
        return next(new ErrorResponse('No responses found for this form', 404));
    }
    
    // Prepare CSV headers
    const headers = [
        { id: 'reference_number', title: 'Reference Number' },
        { id: 'user_name', title: 'Name' },
        { id: 'user_email', title: 'Email' },
        { id: 'user_phone', title: 'Phone' },
        { id: 'submitted_at', title: 'Submitted At' },
        { id: 'status', title: 'Status' }
    ];
    
    // Add field headers
    form.fields.forEach(field => {
        headers.push({
            id: field._id.toString(),
            title: field.label_en
        });
    });
    
    // Prepare CSV data
    const csvData = responses.map(response => {
        const row = {
            reference_number: response.reference_number,
            user_name: response.user_name,
            user_email: response.user_email,
            user_phone: response.user_phone || '',
            submitted_at: response.submitted_at.toISOString(),
            status: response.status
        };
        
        // Add field values
        form.fields.forEach(field => {
            const fieldId = field._id.toString();
            let value = response.response_json[fieldId] || '';
            
            // Handle file fields
            if (field.field_type === 'file') {
                const fileInfo = response.uploaded_files.find(f => f.field_id.toString() === fieldId);
                if (fileInfo) {
                    value = `${req.protocol}://${req.get('host')}/uploads/forms/${response.form_id}/${fileInfo.file_name}`;
                }
            } else if (Array.isArray(value)) {
                value = value.join(', ');
            }
            
            row[fieldId] = value;
        });
        
        return row;
    });
    
    // Generate CSV file
    const fileName = `form-responses-${form.slug}-${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../../uploads/temp', fileName);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
    });
    
    await csvWriter.writeRecords(csvData);
    
    // Send file as download
    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
        }
        
        // Clean up temp file
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error deleting temp file:', unlinkErr);
            }
        });
    });
});