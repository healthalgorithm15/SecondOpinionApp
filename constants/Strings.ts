/**
 * Praman AI - Centralized Strings Configuration
 * All UI text, medical disclaimers, and labels are managed here.
 */

export const STRINGS = {
  common: {
    appName: "Praman AI",
    login: "Login",
    logInLink: "Log in",
    alreadyAccount: "Already have an account? ",
    loggedInAs: "Logged in as",
    continue: "Continue",
    loading: 'Loading Report...',
    or: "OR",
    cancel: "Cancel",
    disclaimer: "By continuing, you agree to our Terms of Service and Privacy Policy.\nAI supports analysis. Final medical opinions are provided by licensed professionals.",
    protectData: "This step helps protect your account and personal medical information.",
    securityNote: "Your medical information is encrypted and handled securely.",
    white: "#FFF",
    securityDisclaimer: "Your information is protected using secure, medical-grade data handling practices.", //
  },

welcome: {
  title: "Praman AI",
  tagline: "Get Clarity before Medical Decisions",
  description: "Upload your medical reports. Our AI helps certified specialists review your case and provide expert, confidential second opinions.",
  bullet1: "AI assists analysis",
  bullet2: "Reviewed by licensed doctors",
  bullet3: "Secure & private data",
  getStarted: "Get Started",
  login: "Login",
  footerNote: "AI supports analysis. Final opinions are provided by licensed medical professionals"
},

  auth: {
    createAccount: "Create your Account",
    signUpInstructions: "Use your Email, Mobile number, or both to secure your account.",
    signUp: "Sign up",
    googleSignIn: "Sign in With Google",
    fullName: "Full name",
    mobile: "Mobile number",
    email: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    passwordHint: "Minimum 8 characters",
    mobileHint: "We'll send OTP to verify your number",
    otpTitle: "OTP",
    otpSub: "Verify Mobile number",
    otpInstruction: "Enter 6 digit code sent to your mobile number",
    otpSentTo: "Code sent to",
    verifyButton: "Verify & Continue",
    resendOtp: "Resend OTP",
    otpExpiry: "OTP expires in 10 minutes",
    verifyEmailTitle: "Check Mail",
    verifyEmailSub: "Verify your email address",
    emailSentTo: "A verification link has been sent to:",
    checkStatusBtn: "I've Verified My Email",
    didntReceiveEmail: "Didn’t receive the email?",
    resendEmail: "Resend verification email",
    useEmail: "Use Email instead",
    useMobile: "Use Mobile number instead",
    forgotPasswordTitle: "Forgot Password?",
    forgotPasswordSub: "Enter your email or mobile to reset your password.",
    resetPasswordTitle: "Reset Password",
    resetPasswordSub: "Create a new strong password for your account.",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    sendCode: "Send Verification Code",
    resetSuccess: "Password reset successfully!",
  },

  validation: {
    nameRequired: "Full name is required",
    passwordRequired: "Password is required",
    passwordShort: "Password must be at least 8 characters",
    invalidIdentifier: (mode: string) => `Please enter a valid ${mode}`,
    networkError: "Check your connection",
    passwordWeak: "Password must include an uppercase letter, a number, and a symbol",
  },

  patient: {
    setupTitle: "Complete Your Profile",
    setupSub: "Help our doctors understand your health background better.",
    greeting: "Hello", 
    birthDate: "Date of Birth",
    gender: "Gender",
    history: "Medical History",
    healthboardTitle: "My Profile & Healthboard",
    newUserDesc: "You don't have any existing health records. You want to upload medical records to get started?",
    acceptedFormats: "Accepted format: PDF, JPEG, PNG (Max size: 50MB)",
    uploadPdf: "Upload PDF",
    uploadPdfSub: "Select a file",
    scanPhoto: "Scan photo",
    scanPhotoSub: "Snap a picture of the report",
    tabExisting: "Upload to existing topic",
    recentReports: "Recent Reports", 
    addMore: "+ Add more documents", 
    continueReview: "Continue to Review", 
    tabNewThread: "Start a new thread",
    securityNote: "Your medical information is encrypted and handled securely.",
    aiDisclaimer: "AI supports analysis. Final medical opinions are provided by licensed medical professionals.",
  },

  status: {
    title: "Your Case Status",
    subtitle: "Track the progress of your submitted medical case",
    stepUploaded: "Documents uploaded",
    stepAi: "AI-supported organization completed",
    stepDoctor: "Specialist review in progress",
    estimateTime: "Estimated review time: 24-48 hours",
    backHome: "Back to Dashboard",
    needHelp: "Help & Support",
    caseSummary: "Case Summary"
  },

  settings: {
    title: "Account Settings",
    profile: "Profile",
    updatePassword: "Update Password",
    changePasswordSub: "Update your security credentials",
    logout: "Logout",
    logoutSub: "Sign out of your account",
    version: "Praman AI v1.0.4 (Beta)", // Updated to match your UI code
  },

  confirmation: {
    title: "Submission Confirmation",
    subtext: "Your medical documents have been successfully submitted for AI-supported organization and review by licensed medical professionals.",
    nextStepsTitle: "What happens next?",
    step1: "Your documents will be securely processed.",
    step2: "A licensed medical specialist will review your case.",
    step3: "You'll be notified via email when your second-opinion insights are ready.",
    backToDashboard: "Go to dashboard"
  },
  
  admin: {
    title: 'Admin Dashboard',
    subtitle: 'Manage medical professionals and cases',
    totalDoctors: 'Total Doctors',
    pendingCases: 'Pending Cases',
    activeReports: 'Active Reports',
    quickActions: 'Quick Actions',
    registerDoctor: '+ Register New Doctor',
    viewPending: 'View All Pending Approvals',
  },

  doctor: {
    portal: "Doctor's Portal",
    welcomeTitle: "Welcome, Doctor!",
    activationMsg: "Your account has been successfully activated.",
    assignedCases: "Assigned Cases",
    caseStats: (count: number) => `You have ${count} cases to review today`,
    urgent: "Urgent",
  }
};