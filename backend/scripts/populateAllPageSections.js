const mongoose = require("mongoose");
const WebsiteContent = require("../models/WebsiteContent");
const User = require("../models/User");
require("dotenv").config({ path: "../.env" });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tamilsociety", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Comprehensive content sections for all pages
const allPageSections = {
    // HOME PAGE SECTIONS (29 sections)
    home: [
        {
            section: "hero-title",
            sectionKey: "home.hero.title",
            sectionType: "hero",
            title: "Welcome to Tamil Language Society",
            titleTamil: "தமிழ்ப் பேரவைக்கு வரவேற்கிறோம்",
            content: "Welcome to Tamil Language Society",
            contentTamil: "தமிழ்ப் பேரவைக்கு வரவேற்கிறோம்",
            order: 1
        },
        {
            section: "hero-subtitle",
            sectionKey: "home.hero.subtitle",
            sectionType: "hero",
            title: "Preserving Tamil Heritage",
            content: "Preserving, promoting, and celebrating the rich heritage of Tamil language and culture",
            contentTamil: "தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தை பாதுகாத்து, ஊக்குவித்து, கொண்டாடுகிறோம்",
            order: 2
        },
        {
            section: "hero-cta-primary",
            sectionKey: "home.hero.ctaPrimary",
            sectionType: "cta",
            title: "Explore Our Resources",
            buttonText: "Explore Our Resources",
            buttonTextTamil: "எங்கள் வளங்களை ஆராயுங்கள்",
            buttonUrl: "#resources",
            order: 3
        },
        {
            section: "hero-cta-secondary",
            sectionKey: "home.hero.ctaSecondary",
            sectionType: "cta",
            title: "Join Our Community",
            buttonText: "Join Our Community",
            buttonTextTamil: "எங்கள் சமூகத்தில் சேருங்கள்",
            buttonUrl: "signup.html",
            order: 4
        },
        {
            section: "features-title",
            sectionKey: "home.features.title",
            sectionType: "text",
            title: "Our Services",
            titleTamil: "எங்கள் சேவைகள்",
            content: "Discover our comprehensive range of Tamil language and cultural services",
            order: 5
        },
        {
            section: "feature-books",
            sectionKey: "home.features.books",
            sectionType: "feature-list",
            title: "Tamil Books Collection",
            titleTamil: "தமிழ் புத்தக தொகுப்பு",
            content: "Extensive collection of Tamil literature, educational materials, and cultural texts",
            contentTamil: "தமிழ் இலக்கியம், கல்வி பொருட்கள் மற்றும் கலாச்சார நூல்களின் விரிவான தொகுப்பு",
            order: 6
        },
        {
            section: "feature-ebooks",
            sectionKey: "home.features.ebooks",
            sectionType: "feature-list",
            title: "Digital Library",
            titleTamil: "டிஜிட்டல் நூலகம்",
            content: "Access thousands of Tamil e-books and digital resources online",
            contentTamil: "ஆயிரக்கணக்கான தமிழ் மின்னூல்கள் மற்றும் டிஜிட்டல் வளங்களை ஆன்லைனில் அணுகவும்",
            order: 7
        },
        {
            section: "feature-projects",
            sectionKey: "home.features.projects",
            sectionType: "feature-list",
            title: "Cultural Projects",
            titleTamil: "கலாச்சார திட்டங்கள்",
            content: "Participate in our cultural preservation and promotion initiatives",
            contentTamil: "எங்கள் கலாச்சார பாதுகாப்பு மற்றும் ஊக்குவிப்பு முயற்சிகளில் பங்கேற்கவும்",
            order: 8
        },
        {
            section: "stats-title",
            sectionKey: "home.stats.title",
            sectionType: "statistics",
            title: "Our Impact",
            titleTamil: "எங்கள் தாக்கம்",
            content: "Numbers that showcase our commitment to Tamil language and culture",
            order: 9
        },
        {
            section: "stats-books",
            sectionKey: "home.stats.books",
            sectionType: "statistics",
            title: "10,000+",
            content: "Tamil Books Available",
            contentTamil: "தமிழ் புத்தகங்கள் கிடைக்கின்றன",
            order: 10
        },
        {
            section: "stats-members",
            sectionKey: "home.stats.members",
            sectionType: "statistics",
            title: "50,000+",
            content: "Community Members",
            contentTamil: "சமூக உறுப்பினர்கள்",
            order: 11
        },
        {
            section: "stats-events",
            sectionKey: "home.stats.events",
            sectionType: "statistics",
            title: "500+",
            content: "Cultural Events Organized",
            contentTamil: "கலாச்சார நிகழ்வுகள் ஏற்பாடு செய்யப்பட்டன",
            order: 12
        },
        {
            section: "stats-downloads",
            sectionKey: "home.stats.downloads",
            sectionType: "statistics",
            title: "1M+",
            content: "Resource Downloads",
            contentTamil: "வள பதிவிறக்கங்கள்",
            order: 13
        },
        {
            section: "announcements-title",
            sectionKey: "home.announcements.title",
            sectionType: "announcements",
            title: "Latest Announcements",
            titleTamil: "சமீபத்திய அறிவிப்புகள்",
            content: "Stay updated with our latest news and events",
            order: 14
        },
        {
            section: "testimonials-title",
            sectionKey: "home.testimonials.title",
            sectionType: "text",
            title: "What Our Community Says",
            titleTamil: "எங்கள் சமூகம் என்ன சொல்கிறது",
            content: "Hear from our valued community members",
            order: 15
        },
        {
            section: "cta-title",
            sectionKey: "home.cta.title",
            sectionType: "cta",
            title: "Ready to Join Our Mission?",
            titleTamil: "எங்கள் பணியில் சேர தயாரா?",
            content: "Be part of preserving and promoting Tamil heritage for future generations",
            order: 16
        },
        {
            section: "cta-button-join",
            sectionKey: "home.cta.buttonJoin",
            sectionType: "cta",
            buttonText: "Join Now",
            buttonTextTamil: "இப்போது சேருங்கள்",
            buttonUrl: "signup.html",
            order: 17
        },
        {
            section: "cta-button-learn",
            sectionKey: "home.cta.buttonLearn",
            sectionType: "cta",
            buttonText: "Learn More",
            buttonTextTamil: "மேலும் அறிக",
            buttonUrl: "about.html",
            order: 18
        }
    ],

    // ABOUT PAGE SECTIONS (35+ sections)
    about: [
        {
            section: "meta-title",
            sectionKey: "about.meta.title",
            sectionType: "text",
            title: "About Us - Tamil Language Society",
            titleTamil: "எங்களைப் பற்றி - தமிழ்ப் பேரவை",
            order: 1
        },
        {
            section: "hero-title",
            sectionKey: "about.hero.title",
            sectionType: "hero",
            title: "About Tamil Language Society",
            titleTamil: "எங்களைப் பற்றி",
            order: 2
        },
        {
            section: "hero-subtitle",
            sectionKey: "about.hero.subtitle",
            sectionType: "hero",
            content: "Preserving, promoting, and celebrating the rich heritage of Tamil language and culture for future generations",
            contentTamil: "எதிர்கால சந்ததியினருக்காக தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தை பாதுகாத்து, ஊக்குவித்து, கொண்டாடுகிறோம்",
            order: 3
        },
        {
            section: "hero-quote",
            sectionKey: "about.hero.quote",
            sectionType: "hero",
            content: "\"Rise with Tamil\"",
            contentTamil: "\"தமிழோடு உயர்வோம்\"",
            order: 4
        },
        {
            section: "history-title",
            sectionKey: "about.history.title",
            sectionType: "text",
            title: "Our History",
            titleTamil: "எங்கள் வரலாறு",
            order: 5
        },
        {
            section: "history-subtitle",
            sectionKey: "about.history.subtitle",
            sectionType: "text",
            title: "A Legacy of Tamil Excellence",
            titleTamil: "தமிழ் சிறப்பின் பாரம்பரியம்",
            order: 6
        },
        {
            section: "history-content1",
            sectionKey: "about.history.content1",
            sectionType: "text",
            content: "Founded in 2020, the Tamil Language Society emerged from a passionate vision to bridge the gap between traditional Tamil heritage and modern digital accessibility. Our journey began with a small group of Tamil scholars, educators, and technology enthusiasts who recognized the urgent need to preserve and promote Tamil language in the digital age.",
            contentTamil: "2020 இல் நிறுவப்பட்ட தமிழ்ப் பேரவை, பாரம்பரிய தமிழ் பாரம்பரியத்திற்கும் நவீன டிஜிட்டல் அணுகலுக்கும் இடையிலான இடைவெளியைக் குறைக்கும் ஆர்வமான பார்வையில் இருந்து உருவானது.",
            order: 7
        },
        {
            section: "history-content2",
            sectionKey: "about.history.content2",
            sectionType: "text",
            content: "Over the years, we have grown from a local initiative to a global movement, connecting Tamil communities worldwide and creating innovative platforms for language learning, cultural exchange, and literary preservation. Our commitment to excellence has made us a trusted resource for Tamil language education and cultural promotion.",
            contentTamil: "ஆண்டுகளாக, நாங்கள் உள்ளூர் முயற்சியிலிருந்து உலகளாவிய இயக்கமாக வளர்ந்துள்ளோம், உலகம் முழுவதும் தமிழ் சமூகங்களை இணைத்து, மொழி கற்றல், கலாச்சார பரிமாற்றம் மற்றும் இலக்கிய பாதுகாப்பிற்கான புதுமையான தளங்களை உருவாக்கியுள்ளோம்.",
            order: 8
        },
        {
            section: "values-title",
            sectionKey: "about.values.title",
            sectionType: "text",
            title: "Our Core Values",
            titleTamil: "எங்கள் அடிப்படை மதிப்புகள்",
            order: 9
        },
        {
            section: "values-education-title",
            sectionKey: "about.values.education.title",
            sectionType: "feature-list",
            title: "Education",
            titleTamil: "கல்வி",
            order: 10
        },
        {
            section: "values-education-description",
            sectionKey: "about.values.education.description",
            sectionType: "feature-list",
            content: "Promoting Tamil education through innovative learning resources, digital platforms, and community programs that make learning accessible to all.",
            contentTamil: "புதுமையான கற்றல் வளங்கள், டிஜிட்டல் தளங்கள் மற்றும் சமூக திட்டங்கள் மூலம் தமிழ் கல்வியை ஊக்குவித்தல்.",
            order: 11
        },
        {
            section: "values-community-title",
            sectionKey: "about.values.community.title",
            sectionType: "feature-list",
            title: "Community",
            titleTamil: "சமூகம்",
            order: 12
        },
        {
            section: "values-community-description",
            sectionKey: "about.values.community.description",
            sectionType: "feature-list",
            content: "Building a strong, connected community of Tamil language enthusiasts, scholars, and learners across the globe.",
            contentTamil: "உலகம் முழுவதும் தமிழ் மொழி ஆர்வலர்கள், அறிஞர்கள் மற்றும் கற்றவர்களின் வலுவான, இணைக்கப்பட்ட சமூகத்தை உருவாக்குதல்.",
            order: 13
        },
        {
            section: "values-preservation-title",
            sectionKey: "about.values.preservation.title",
            sectionType: "feature-list",
            title: "Preservation",
            titleTamil: "பாதுகாப்பு",
            order: 14
        },
        {
            section: "values-preservation-description",
            sectionKey: "about.values.preservation.description",
            sectionType: "feature-list",
            content: "Safeguarding Tamil literature, traditions, and cultural practices for future generations through digital archival and documentation.",
            contentTamil: "டிஜிட்டல் காப்பகம் மற்றும் ஆவணப்படுத்தல் மூலம் எதிர்கால சந்ததியினருக்காக தமிழ் இலக்கியம், மரபுகள் மற்றும் கலாச்சார நடைமுறைகளைப் பாதுகாத்தல்.",
            order: 15
        },
        {
            section: "values-global-title",
            sectionKey: "about.values.global.title",
            sectionType: "feature-list",
            title: "Global Reach",
            titleTamil: "உலகளாவிய அணுகல்",
            order: 16
        },
        {
            section: "values-global-description",
            sectionKey: "about.values.global.description",
            sectionType: "feature-list",
            content: "Connecting Tamil communities worldwide and promoting Tamil language and culture on an international scale.",
            contentTamil: "உலகம் முழுவதும் தமிழ் சமூகங்களை இணைத்து, சர்வதேச அளவில் தமிழ் மொழி மற்றும் கலாச்சாரத்தை ஊக்குவித்தல்.",
            order: 17
        },
        // Timeline sections
        {
            section: "timeline-2020-year",
            sectionKey: "about.timeline.2020.year",
            sectionType: "text",
            content: "2020",
            order: 18
        },
        {
            section: "timeline-2020-title",
            sectionKey: "about.timeline.2020.title",
            sectionType: "text",
            title: "Foundation",
            titleTamil: "அடித்தளம்",
            order: 19
        },
        {
            section: "timeline-2020-description",
            sectionKey: "about.timeline.2020.description",
            sectionType: "text",
            content: "Tamil Language Society was founded with a vision to create a comprehensive digital platform for Tamil language learning and cultural preservation.",
            contentTamil: "தமிழ் மொழி கற்றல் மற்றும் கலாச்சார பாதுகாப்பிற்கான ஒரு விரிவான டிஜிட்டல் தளத்தை உருவாக்கும் பார்வையுடன் தமிழ்ப் பேரவை நிறுவப்பட்டது.",
            order: 20
        },
        {
            section: "timeline-2021-year",
            sectionKey: "about.timeline.2021.year",
            sectionType: "text",
            content: "2021",
            order: 21
        },
        {
            section: "timeline-2021-title",
            sectionKey: "about.timeline.2021.title",
            sectionType: "text",
            title: "Digital Library Launch",
            titleTamil: "டிஜிட்டல் நூலக தொடக்கம்",
            order: 22
        },
        {
            section: "timeline-2021-description",
            sectionKey: "about.timeline.2021.description",
            sectionType: "text",
            content: "Launched our comprehensive digital library with thousands of Tamil books, literature, and educational resources.",
            contentTamil: "ஆயிரக்கணக்கான தமிழ் புத்தகங்கள், இலக்கியம் மற்றும் கல்வி வளங்களுடன் எங்கள் விரிவான டிஜிட்டல் நூலகத்தை தொடங்கினோம்.",
            order: 23
        },
        {
            section: "timeline-2022-year",
            sectionKey: "about.timeline.2022.year",
            sectionType: "text",
            content: "2022",
            order: 24
        },
        {
            section: "timeline-2022-title",
            sectionKey: "about.timeline.2022.title",
            sectionType: "text",
            title: "Global Expansion",
            titleTamil: "உலகளாவிய விரிவாக்கம்",
            order: 25
        },
        {
            section: "timeline-2022-description",
            sectionKey: "about.timeline.2022.description",
            sectionType: "text",
            content: "Expanded our reach to Tamil communities worldwide, establishing partnerships with cultural organizations globally.",
            contentTamil: "உலகம் முழுவதும் தமிழ் சமூகங்களுக்கு எங்கள் அணுகலை விரிவுபடுத்தி, உலகளவில் கலாச்சார அமைப்புகளுடன் கூட்டாண்மையை நிறுவினோம்.",
            order: 26
        },
        {
            section: "timeline-2023-year",
            sectionKey: "about.timeline.2023.year",
            sectionType: "text",
            content: "2023",
            order: 27
        },
        {
            section: "timeline-2023-title",
            sectionKey: "about.timeline.2023.title",
            sectionType: "text",
            title: "Cultural Programs",
            titleTamil: "கலாச்சார திட்டங்கள்",
            order: 28
        },
        {
            section: "timeline-2023-description",
            sectionKey: "about.timeline.2023.description",
            sectionType: "text",
            content: "Initiated comprehensive cultural programs, workshops, and events to promote Tamil arts, music, and traditions.",
            contentTamil: "தமிழ் கலைகள், இசை மற்றும் மரபுகளை ஊக்குவிக்க விரிவான கலாச்சார திட்டங்கள், பட்டறைகள் மற்றும் நிகழ்வுகளைத் தொடங்கினோம்.",
            order: 29
        },
        {
            section: "timeline-2024-year",
            sectionKey: "about.timeline.2024.year",
            sectionType: "text",
            content: "2024",
            order: 30
        },
        {
            section: "timeline-2024-title",
            sectionKey: "about.timeline.2024.title",
            sectionType: "text",
            title: "Innovation & Technology",
            titleTamil: "புதுமை மற்றும் தொழில்நுட்பம்",
            order: 31
        },
        {
            section: "timeline-2024-description",
            sectionKey: "about.timeline.2024.description",
            sectionType: "text",
            content: "Embraced cutting-edge technology to enhance Tamil language learning through AI-powered tools and interactive platforms.",
            contentTamil: "AI-இயங்கும் கருவிகள் மற்றும் ஊடாடும் தளங்கள் மூலம் தமிழ் மொழி கற்றலை மேம்படுத்த அதிநவீன தொழில்நுட்பத்தை ஏற்றுக்கொண்டோம்.",
            order: 32
        },
        {
            section: "team-title",
            sectionKey: "about.team.title",
            sectionType: "text",
            title: "Our Team",
            titleTamil: "எங்கள் குழு",
            order: 33
        },
        {
            section: "team-description",
            sectionKey: "about.team.description",
            sectionType: "text",
            content: "Meet the dedicated board members who lead our mission to preserve and promote the Tamil language and culture.",
            contentTamil: "தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாக்கும் மற்றும் ஊக்குவிக்கும் எங்கள் பணியை வழிநடத்தும் அர்ப்பணிப்புள்ள குழு உறுப்பினர்களை சந்திக்கவும்.",
            order: 34
        },
        {
            section: "cta-title",
            sectionKey: "about.cta.title",
            sectionType: "cta",
            title: "Join Our Mission",
            titleTamil: "எங்கள் பணியில் சேருங்கள்",
            order: 35
        },
        {
            section: "cta-description",
            sectionKey: "about.cta.description",
            sectionType: "cta",
            content: "Be part of our journey to preserve and promote Tamil language and culture. Whether you're a learner, scholar, or enthusiast, there's a place for you in our community.",
            contentTamil: "தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாக்கும் மற்றும் ஊக்குவிக்கும் எங்கள் பயணத்தின் ஒரு பகுதியாக இருங்கள். நீங்கள் ஒரு கற்றவர், அறிஞர் அல்லது ஆர்வலராக இருந்தாலும், எங்கள் சமூகத்தில் உங்களுக்கு ஒரு இடம் உள்ளது.",
            order: 36
        },
        {
            section: "cta-join-text",
            sectionKey: "about.cta.joinText",
            sectionType: "cta",
            buttonText: "Join Our Community",
            buttonTextTamil: "எங்கள் சமூகத்தில் சேருங்கள்",
            buttonUrl: "signup.html",
            order: 37
        },
        {
            section: "cta-contact-text",
            sectionKey: "about.cta.contactText",
            sectionType: "cta",
            buttonText: "Get in Touch",
            buttonTextTamil: "தொடர்பு கொள்ளுங்கள்",
            buttonUrl: "contact.html",
            order: 38
        }
    ],

    // CONTACT PAGE SECTIONS (25+ sections)
    contact: [
        {
            section: "hero-title",
            sectionKey: "contact.hero.title",
            sectionType: "hero",
            title: "Contact Us",
            titleTamil: "எங்களை தொடர்பு கொள்ளவும்",
            order: 1
        },
        {
            section: "hero-subtitle",
            sectionKey: "contact.hero.subtitle",
            sectionType: "hero",
            content: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
            contentTamil: "உங்களிடமிருந்து கேட்க நாங்கள் விரும்புகிறோம். எங்களுக்கு ஒரு செய்தி அனுப்புங்கள், நாங்கள் விரைவில் பதிலளிப்போம்.",
            order: 2
        },
        {
            section: "hero-quote-tamil",
            sectionKey: "contact.hero.quoteTamil",
            sectionType: "hero",
            content: "\"தொடர்பு கொள்ளுங்கள் - நாங்கள் உங்களுக்காக காத்திருக்கிறோம்\"",
            order: 3
        },
        {
            section: "address-title",
            sectionKey: "contact.address.title",
            sectionType: "text",
            title: "Visit Us",
            titleTamil: "எங்களை பார்வையிடுங்கள்",
            order: 4
        },
        {
            section: "address-text",
            sectionKey: "contact.address.text",
            sectionType: "text",
            content: "Tamil Language Society<br>123 Tamil Heritage Street<br>Chennai, Tamil Nadu 600001<br>India",
            contentTamil: "தமிழ்ப் பேரவை<br>123 தமிழ் பாரம்பரிய தெரு<br>சென்னை, தமிழ்நாடு 600001<br>இந்தியா",
            order: 5
        },
        {
            section: "phone-title",
            sectionKey: "contact.phone.title",
            sectionType: "text",
            title: "Call Us",
            titleTamil: "எங்களை அழைக்கவும்",
            order: 6
        },
        {
            section: "phone-text",
            sectionKey: "contact.phone.text",
            sectionType: "text",
            content: "Phone: +91 44 2345 6789<br>Mobile: +91 98765 43210<br>Toll Free: 1800 123 4567",
            contentTamil: "தொலைபேசி: +91 44 2345 6789<br>மொபைல்: +91 98765 43210<br>இலவச அழைப்பு: 1800 123 4567",
            order: 7
        },
        {
            section: "email-title",
            sectionKey: "contact.email.title",
            sectionType: "text",
            title: "Email Us",
            titleTamil: "எங்களுக்கு மின்னஞ்சல் அனுப்பவும்",
            order: 8
        },
        {
            section: "email-text",
            sectionKey: "contact.email.text",
            sectionType: "text",
            content: "info@tamillanguagesociety.org<br>support@tamillanguagesociety.org<br>media@tamillanguagesociety.org",
            order: 9
        },
        {
            section: "hours-title",
            sectionKey: "contact.hours.title",
            sectionType: "text",
            title: "Office Hours",
            titleTamil: "அலுவலக நேரம்",
            order: 10
        },
        {
            section: "hours-text",
            sectionKey: "contact.hours.text",
            sectionType: "text",
            content: "Monday - Friday: 9:00 AM - 6:00 PM<br>Saturday: 10:00 AM - 4:00 PM<br>Sunday: Closed",
            contentTamil: "திங்கள் - வெள்ளி: காலை 9:00 - மாலை 6:00<br>சனி: காலை 10:00 - மாலை 4:00<br>ஞாயிறு: மூடப்பட்டுள்ளது",
            order: 11
        },
        {
            section: "form-title",
            sectionKey: "contact.form.title",
            sectionType: "form",
            title: "Send us a Message",
            titleTamil: "எங்களுக்கு செய்தி அனுப்பவும்",
            order: 12
        },
        {
            section: "form-firstname",
            sectionKey: "contact.form.firstname",
            sectionType: "form",
            content: "First Name",
            contentTamil: "முதல் பெயர்",
            order: 13
        },
        {
            section: "form-lastname",
            sectionKey: "contact.form.lastname",
            sectionType: "form",
            content: "Last Name",
            contentTamil: "கடைசி பெயர்",
            order: 14
        },
        {
            section: "form-email",
            sectionKey: "contact.form.email",
            sectionType: "form",
            content: "Email Address",
            contentTamil: "மின்னஞ்சல் முகவரி",
            order: 15
        },
        {
            section: "form-phone",
            sectionKey: "contact.form.phone",
            sectionType: "form",
            content: "Phone Number",
            contentTamil: "தொலைபேசி எண்",
            order: 16
        },
        {
            section: "form-subject",
            sectionKey: "contact.form.subject",
            sectionType: "form",
            content: "Subject",
            contentTamil: "பொருள்",
            order: 17
        },
        {
            section: "form-message",
            sectionKey: "contact.form.message",
            sectionType: "form",
            content: "Your Message",
            contentTamil: "உங்கள் செய்தி",
            order: 18
        },
        {
            section: "form-submit",
            sectionKey: "contact.form.submit",
            sectionType: "form",
            buttonText: "Send Message",
            buttonTextTamil: "செய்தி அனுப்பு",
            order: 19
        }
    ],

    // BOOKS PAGE SECTIONS (20+ sections)
    books: [
        {
            section: "hero-title",
            sectionKey: "books.hero.title",
            sectionType: "hero",
            title: "Tamil Books Collection",
            titleTamil: "தமிழ் புத்தக தொகுப்பு",
            order: 1
        },
        {
            section: "hero-subtitle",
            sectionKey: "books.hero.subtitle",
            sectionType: "hero",
            content: "Discover our extensive collection of Tamil literature, educational materials, and cultural texts",
            contentTamil: "தமிழ் இலக்கியம், கல்வி பொருட்கள் மற்றும் கலாச்சார நூல்களின் எங்கள் விரிவான தொகுப்பைக் கண்டறியுங்கள்",
            order: 2
        },
        {
            section: "categories-title",
            sectionKey: "books.categories.title",
            sectionType: "text",
            title: "Book Categories",
            titleTamil: "புத்தக வகைகள்",
            order: 3
        },
        {
            section: "category1-title",
            sectionKey: "books.category1.title",
            sectionType: "text",
            title: "Literature & Poetry",
            titleTamil: "இலக்கியம் மற்றும் கவிதை",
            order: 4
        },
        {
            section: "category1-description",
            sectionKey: "books.category1.description",
            sectionType: "text",
            content: "Classic and contemporary Tamil literature, poetry collections, and literary works",
            contentTamil: "கிளாசிக் மற்றும் சமகால தமிழ் இலக்கியம், கவிதை தொகுப்புகள் மற்றும் இலக்கிய படைப்புகள்",
            order: 5
        },
        {
            section: "category2-title",
            sectionKey: "books.category2.title",
            sectionType: "text",
            title: "Educational Resources",
            titleTamil: "கல்வி வளங்கள்",
            order: 6
        },
        {
            section: "category2-description",
            sectionKey: "books.category2.description",
            sectionType: "text",
            content: "Tamil language learning materials, textbooks, and educational resources for all levels",
            contentTamil: "அனைத்து நிலைகளுக்கும் தமிழ் மொழி கற்றல் பொருட்கள், பாடப்புத்தகங்கள் மற்றும் கல்வி வளங்கள்",
            order: 7
        },
        {
            section: "category3-title",
            sectionKey: "books.category3.title",
            sectionType: "text",
            title: "Cultural Heritage",
            titleTamil: "கலாச்சார பாரம்பரியம்",
            order: 8
        },
        {
            section: "category3-description",
            sectionKey: "books.category3.description",
            sectionType: "text",
            content: "Books on Tamil culture, traditions, history, and heritage",
            contentTamil: "தமிழ் கலாச்சாரம், மரபுகள், வரலாறு மற்றும் பாரம்பரியம் பற்றிய புத்தகங்கள்",
            order: 9
        },
        {
            section: "featured-title",
            sectionKey: "books.featured.title",
            sectionType: "text",
            title: "Featured Books",
            titleTamil: "சிறப்பு புத்தகங்கள்",
            order: 10
        },
        {
            section: "shop-button",
            sectionKey: "books.shop.button",
            sectionType: "cta",
            buttonText: "Browse All Books",
            buttonTextTamil: "அனைத்து புத்தகங்களையும் உலாவுங்கள்",
            buttonUrl: "#books-catalog",
            order: 11
        },
        {
            section: "cta-title",
            sectionKey: "books.cta.title",
            sectionType: "cta",
            title: "Can't Find What You're Looking For?",
            titleTamil: "நீங்கள் தேடுவது கிடைக்கவில்லையா?",
            order: 12
        },
        {
            section: "cta-description",
            sectionKey: "books.cta.description",
            sectionType: "cta",
            content: "Contact us for special book requests or recommendations",
            contentTamil: "சிறப்பு புத்தக கோரிக்கைகள் அல்லது பரிந்துரைகளுக்கு எங்களை தொடர்பு கொள்ளுங்கள்",
            order: 13
        }
    ],

    // EBOOKS PAGE SECTIONS (15+ sections)
    ebooks: [
        {
            section: "hero-title",
            sectionKey: "ebooks.hero.title",
            sectionType: "hero",
            title: "Tamil Digital Library",
            titleTamil: "தமிழ் டிஜிட்டல் நூலகம்",
            order: 1
        },
        {
            section: "hero-subtitle",
            sectionKey: "ebooks.hero.subtitle",
            sectionType: "hero",
            content: "Access thousands of Tamil e-books and digital resources online",
            contentTamil: "ஆயிரக்கணக்கான தமிழ் மின்னூல்கள் மற்றும் டிஜிட்டல் வளங்களை ஆன்லைனில் அணுகவும்",
            order: 2
        },
        {
            section: "features-title",
            sectionKey: "ebooks.features.title",
            sectionType: "text",
            title: "Digital Library Features",
            titleTamil: "டிஜிட்டல் நூலக அம்சங்கள்",
            order: 3
        },
        {
            section: "feature-access",
            sectionKey: "ebooks.features.access",
            sectionType: "feature-list",
            title: "24/7 Access",
            titleTamil: "24/7 அணுகல்",
            content: "Read anytime, anywhere with our online platform",
            contentTamil: "எங்கள் ஆன்லைன் தளத்துடன் எப்போது வேண்டுமானாலும், எங்கு வேண்டுமானாலும் படிக்கவும்",
            order: 4
        },
        {
            section: "feature-search",
            sectionKey: "ebooks.features.search",
            sectionType: "feature-list",
            title: "Advanced Search",
            titleTamil: "மேம்பட்ட தேடல்",
            content: "Find books by author, genre, or keyword instantly",
            contentTamil: "ஆசிரியர், வகை அல்லது முக்கிய வார்த்தையின் மூலம் புத்தகங்களை உடனடியாக கண்டறியுங்கள்",
            order: 5
        },
        {
            section: "feature-download",
            sectionKey: "ebooks.features.download",
            sectionType: "feature-list",
            title: "Offline Reading",
            titleTamil: "ஆஃப்லைன் வாசிப்பு",
            content: "Download books for offline reading on your devices",
            contentTamil: "உங்கள் சாधனங்களில் ஆஃப்லைன் வாசிப்புக்காக புத்தகங்களை பதிவிறக்கம் செய்யுங்கள்",
            order: 6
        }
    ],

    // PROJECTS PAGE SECTIONS (15+ sections)
    projects: [
        {
            section: "hero-title",
            sectionKey: "projects.hero.title",
            sectionType: "hero",
            title: "Our Cultural Projects",
            titleTamil: "எங்கள் கலாச்சார திட்டங்கள்",
            order: 1
        },
        {
            section: "hero-subtitle",
            sectionKey: "projects.hero.subtitle",
            sectionType: "hero",
            content: "Participate in our cultural preservation and promotion initiatives",
            contentTamil: "எங்கள் கலாச்சார பாதுகாப்பு மற்றும் ஊக்குவிப்பு முயற்சிகளில் பங்கேற்கவும்",
            order: 2
        },
        {
            section: "categories-title",
            sectionKey: "projects.categories.title",
            sectionType: "text",
            title: "Project Categories",
            titleTamil: "திட்ட வகைகள்",
            order: 3
        },
        {
            section: "education-title",
            sectionKey: "projects.education.title",
            sectionType: "text",
            title: "Educational Initiatives",
            titleTamil: "கல்வி முயற்சிகள்",
            order: 4
        },
        {
            section: "cultural-title",
            sectionKey: "projects.cultural.title",
            sectionType: "text",
            title: "Cultural Events",
            titleTamil: "கலாச்சார நிகழ்வுகள்",
            order: 5
        },
        {
            section: "research-title",
            sectionKey: "projects.research.title",
            sectionType: "text",
            title: "Research Projects",
            titleTamil: "ஆராய்ச்சி திட்டங்கள்",
            order: 6
        }
    ],

    // DONATE PAGE SECTIONS (12+ sections)
    donate: [
        {
            section: "hero-title",
            sectionKey: "donate.hero.title",
            sectionType: "hero",
            title: "Support Our Mission",
            titleTamil: "எங்கள் பணியை ஆதரிக்கவும்",
            order: 1
        },
        {
            section: "hero-subtitle",
            sectionKey: "donate.hero.subtitle",
            sectionType: "hero",
            content: "Help us preserve and promote Tamil language and culture for future generations",
            contentTamil: "எதிர்கால சந்ததியினருக்காக தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாக்கவும் ஊக்குவிக்கவும் எங்களுக்கு உதவுங்கள்",
            order: 2
        },
        {
            section: "impact-title",
            sectionKey: "donate.impact.title",
            sectionType: "text",
            title: "Your Impact",
            titleTamil: "உங்கள் தாக்கம்",
            order: 3
        },
        {
            section: "amounts-title",
            sectionKey: "donate.amounts.title",
            sectionType: "text",
            title: "Donation Amounts",
            titleTamil: "நன்கொடை தொகைகள்",
            order: 4
        }
    ],

    // LOGIN PAGE SECTIONS (8+ sections)
    login: [
        {
            section: "hero-title",
            sectionKey: "login.hero.title",
            sectionType: "hero",
            title: "Welcome Back",
            titleTamil: "மீண்டும் வரவேற்கிறோம்",
            order: 1
        },
        {
            section: "form-title",
            sectionKey: "login.form.title",
            sectionType: "form",
            title: "Sign In to Your Account",
            titleTamil: "உங்கள் கணக்கில் உள்நுழையுங்கள்",
            order: 2
        },
        {
            section: "form-email",
            sectionKey: "login.form.email",
            sectionType: "form",
            content: "Email Address",
            contentTamil: "மின்னஞ்சல் முகவரி",
            order: 3
        },
        {
            section: "form-password",
            sectionKey: "login.form.password",
            sectionType: "form",
            content: "Password",
            contentTamil: "கடவுச்சொல்",
            order: 4
        },
        {
            section: "form-submit",
            sectionKey: "login.form.submit",
            sectionType: "form",
            buttonText: "Sign In",
            buttonTextTamil: "உள்நுழையுங்கள்",
            order: 5
        }
    ],

    // SIGNUP PAGE SECTIONS (10+ sections)
    signup: [
        {
            section: "hero-title",
            sectionKey: "signup.hero.title",
            sectionType: "hero",
            title: "Join Our Community",
            titleTamil: "எங்கள் சமூகத்தில் சேருங்கள்",
            order: 1
        },
        {
            section: "form-title",
            sectionKey: "signup.form.title",
            sectionType: "form",
            title: "Create Your Account",
            titleTamil: "உங்கள் கணக்கை உருவாக்குங்கள்",
            order: 2
        },
        {
            section: "form-firstname",
            sectionKey: "signup.form.firstname",
            sectionType: "form",
            content: "First Name",
            contentTamil: "முதல் பெயர்",
            order: 3
        },
        {
            section: "form-lastname",
            sectionKey: "signup.form.lastname",
            sectionType: "form",
            content: "Last Name",
            contentTamil: "கடைசி பெயர்",
            order: 4
        },
        {
            section: "form-email",
            sectionKey: "signup.form.email",
            sectionType: "form",
            content: "Email Address",
            contentTamil: "மின்னஞ்சல் முகவரி",
            order: 5
        },
        {
            section: "form-password",
            sectionKey: "signup.form.password",
            sectionType: "form",
            content: "Password",
            contentTamil: "கடவுச்சொல்",
            order: 6
        },
        {
            section: "form-submit",
            sectionKey: "signup.form.submit",
            sectionType: "form",
            buttonText: "Create Account",
            buttonTextTamil: "கணக்கை உருவாக்குங்கள்",
            order: 7
        }
    ],

    // GLOBAL SECTIONS (Navigation, Footer, etc.) (25+ sections)
    global: [
        {
            section: "logo-image",
            sectionKey: "global.logo.image",
            sectionType: "image",
            image: "assets/logo.jpeg",
            imageAlt: "Tamil Language Society Logo",
            order: 1
        },
        {
            section: "logo-text",
            sectionKey: "global.logo.text",
            sectionType: "text",
            content: "Tamil Language Society",
            contentTamil: "தமிழ்ப் பேரவை",
            order: 2
        },
        {
            section: "menu-home",
            sectionKey: "global.menu.home",
            sectionType: "navigation",
            content: "Home",
            contentTamil: "முகப்பு",
            buttonUrl: "index.html",
            order: 3
        },
        {
            section: "menu-about",
            sectionKey: "global.menu.about",
            sectionType: "navigation",
            content: "About Us",
            contentTamil: "எங்களைப் பற்றி",
            buttonUrl: "about.html",
            order: 4
        },
        {
            section: "menu-projects",
            sectionKey: "global.menu.projects",
            sectionType: "navigation",
            content: "Projects",
            contentTamil: "திட்டங்கள்",
            buttonUrl: "projects.html",
            order: 5
        },
        {
            section: "menu-ebooks",
            sectionKey: "global.menu.ebooks",
            sectionType: "navigation",
            content: "Ebooks",
            contentTamil: "மின்னூல்கள்",
            buttonUrl: "ebooks.html",
            order: 6
        },
        {
            section: "menu-bookstore",
            sectionKey: "global.menu.bookstore",
            sectionType: "navigation",
            content: "Book Store",
            contentTamil: "புத்தக கடை",
            buttonUrl: "books.html",
            order: 7
        },
        {
            section: "menu-contact",
            sectionKey: "global.menu.contact",
            sectionType: "navigation",
            content: "Contact Us",
            contentTamil: "எங்களை தொடர்பு கொள்ளுங்கள்",
            buttonUrl: "contact.html",
            order: 8
        },
        {
            section: "menu-donate",
            sectionKey: "global.menu.donate",
            sectionType: "navigation",
            content: "Donate Now",
            contentTamil: "இப்போது நன்கொடை அளியுங்கள்",
            buttonUrl: "donate.html",
            order: 9
        },
        {
            section: "menu-login",
            sectionKey: "global.menu.login",
            sectionType: "navigation",
            content: "Login",
            contentTamil: "உள்நுழையுங்கள்",
            buttonUrl: "login.html",
            order: 10
        },
        {
            section: "menu-signup",
            sectionKey: "global.menu.signup",
            sectionType: "navigation",
            content: "Sign Up",
            contentTamil: "பதிவு செய்யுங்கள்",
            buttonUrl: "signup.html",
            order: 11
        },
        {
            section: "footer-description",
            sectionKey: "global.footer.description",
            sectionType: "footer",
            content: "Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide.",
            contentTamil: "உலகம் முழுவதும் தமிழ் மொழி மற்றும் கலாச்சாரத்தின் வளமான பாரம்பரியத்தை பாதுகாக்கவும் ஊக்குவிக்கவும் அர்ப்பணிக்கப்பட்டுள்ளது.",
            order: 12
        },
        {
            section: "footer-quicklinks-title",
            sectionKey: "global.footer.quicklinksTitle",
            sectionType: "footer",
            title: "Quick Links",
            titleTamil: "விரைவு இணைப்புகள்",
            order: 13
        },
        {
            section: "footer-about-link",
            sectionKey: "global.footer.aboutLink",
            sectionType: "footer",
            content: "About Us",
            contentTamil: "எங்களைப் பற்றி",
            buttonUrl: "about.html",
            order: 14
        },
        {
            section: "footer-projects-link",
            sectionKey: "global.footer.projectsLink",
            sectionType: "footer",
            content: "Projects",
            contentTamil: "திட்டங்கள்",
            buttonUrl: "projects.html",
            order: 15
        },
        {
            section: "footer-books-link",
            sectionKey: "global.footer.booksLink",
            sectionType: "footer",
            content: "Books",
            contentTamil: "புத்தகங்கள்",
            buttonUrl: "books.html",
            order: 16
        },
        {
            section: "footer-contact-link",
            sectionKey: "global.footer.contactLink",
            sectionType: "footer",
            content: "Contact",
            contentTamil: "தொடர்பு",
            buttonUrl: "contact.html",
            order: 17
        },
        {
            section: "footer-resources-title",
            sectionKey: "global.footer.resourcesTitle",
            sectionType: "footer",
            title: "Resources",
            titleTamil: "வளங்கள்",
            order: 18
        },
        {
            section: "footer-ebooks-link",
            sectionKey: "global.footer.ebooksLink",
            sectionType: "footer",
            content: "E-books",
            contentTamil: "மின்னூல்கள்",
            buttonUrl: "ebooks.html",
            order: 19
        },
        {
            section: "footer-newsletter-title",
            sectionKey: "global.footer.newsletterTitle",
            sectionType: "footer",
            title: "Stay Connected",
            titleTamil: "தொடர்பில் இருங்கள்",
            order: 20
        },
        {
            section: "footer-newsletter-description",
            sectionKey: "global.footer.newsletterDescription",
            sectionType: "footer",
            content: "Subscribe to our newsletter for updates on Tamil language resources and cultural events.",
            contentTamil: "தமிழ் மொழி வளங்கள் மற்றும் கலாச்சார நிகழ்வுகளின் புதுப்பிப்புகளுக்கு எங்கள் செய்திமடலுக்கு குழுசேருங்கள்.",
            order: 21
        },
        {
            section: "footer-newsletter-placeholder",
            sectionKey: "global.footer.newsletterPlaceholder",
            sectionType: "footer",
            content: "Enter your email address",
            contentTamil: "உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடுங்கள்",
            order: 22
        },
        {
            section: "footer-newsletter-button",
            sectionKey: "global.footer.newsletterButton",
            sectionType: "footer",
            buttonText: "Subscribe",
            buttonTextTamil: "குழுசேருங்கள்",
            order: 23
        },
        {
            section: "footer-copyright",
            sectionKey: "global.footer.copyright",
            sectionType: "footer",
            content: "© 2024 Tamil Language Society. All rights reserved.",
            contentTamil: "© 2024 தமிழ்ப் பேரவை. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
            order: 24
        }
    ]
};

// Function to populate database with all sections
async function populateAllSections() {
    try {
        console.log("Starting to populate all page sections...");
        
        // Clear existing content
        await WebsiteContent.deleteMany({});
        console.log("Cleared existing content");
        
        let totalSections = 0;
        
        // Process each page
        for (const [page, sections] of Object.entries(allPageSections)) {
            console.log(`Processing ${page} page with ${sections.length} sections...`);
            
            for (const sectionData of sections) {
                // Get admin user for createdBy field
                const adminUser = await User.findOne({ role: "admin" });
                if (!adminUser) {
                    throw new Error("Admin user not found. Please create an admin user first.");
                }
                
                const websiteContent = new WebsiteContent({
                    page: page,
                    section: sectionData.section,
                    sectionKey: sectionData.sectionKey,
                    sectionType: sectionData.sectionType,
                    title: sectionData.title || "",
                    titleTamil: sectionData.titleTamil || "",
                    content: sectionData.content || "",
                    contentTamil: sectionData.contentTamil || "",
                    buttonText: sectionData.buttonText || "",
                    buttonTextTamil: sectionData.buttonTextTamil || "",
                    buttonUrl: sectionData.buttonUrl || "",
                    image: sectionData.image || "",
                    imageAlt: sectionData.imageAlt || "",
                    order: sectionData.order || 1,
                    isActive: true,
                    createdBy: adminUser._id
                });
                
                await websiteContent.save();
                totalSections++;
            }
            
            console.log(`Completed ${page} page`);
        }
        
        console.log(`Successfully populated ${totalSections} sections across all pages`);
        console.log("Database population completed!");
        
    } catch (error) {
        console.error("Error populating sections:", error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the population script
populateAllSections();
