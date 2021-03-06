const express          = require('express');
const router           = express.Router();
const courseController = require('../controllers/courseController');
const studentController = require('../controllers/studentController');
const { catchErrors }    = require('../handlers/errorHandlers');

router.use('/student', validateStudentConnection);
router.use('/instructor', validateInstructorConnection);
router.use('/assistant', validateAssistantConnection);

router.get('/', 
    checkRedirect,
    catchErrors(courseController.getCourses)
);
router.post('/connect', 
    catchErrors(courseController.connect)
);

router.get('/student',
    catchErrors(studentController.screenShare)
);

router.get('/screens', 
    validateProctorConnection,
    catchErrors(studentController.updateScreenshot)
);

router.get('/view', 
    validateProctorConnection,
    catchErrors(courseController.getScreenViewer)
);

router.get('/students', 
    validateProctorConnection,
    catchErrors(courseController.getConnectedStudents)
);

router.get('/record',
    (req, res) => {res.render('screenRecorder.pug')}
)

// User accounts
router.post('/register', (req, res) => {
    console.log(req.body);
    res.send(req.body);
});

router.post('/login', (req, res) => {
    console.log(req.body);
    res.send(req.body);
});

function checkRedirect (req, res, next) {
    if (req.session.student) {
        return res.redirect('/student');
    } else if (req.session.instructor) {
        return res.redirect('/screens');
    } else if (req.session.assistant) {
        return res.redirect('/screens');
    }
    next();
}

function validateStudentConnection (req, res, next) {
    console.log('validating student')
    if (!req.session.authenticated || !req.session.student) {
        return res.redirect('/');
    } else {
        next();
    }
}

function validateProctorConnection (req, res, next) {
    if (!(req.session.authenticated && (req.session.assistant || req.session.instructor))) {
        return res.redirect('/');
    } else {
        next();
    }
}

function validateAssistantConnection (req, res, next) {
    if (!req.session.authenticated || !req.session.assistant) {
        return res.redirect('/');
    } else {
        next();
    }
}

function validateInstructorConnection (req, res, next) {
    if (!req.session.authenticated || !req.session.instructor) {
        return res.redirect('/');
    } else {
        next();
    }
}

module.exports = router;