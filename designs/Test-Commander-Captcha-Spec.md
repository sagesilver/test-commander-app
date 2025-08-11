# Test Commander – Firebase App Check + reCAPTCHA Enterprise Integration Spec

## 1. Purpose

This document describes how to implement Firebase App Check with **reCAPTCHA Enterprise** for the Test Commander web application.  
The goal is to protect Firebase resources (Firestore, Storage, etc.) from unauthorized use while keeping the user experience frictionless.

---

## 2. Cost & Licensing

- **Firebase App Check** is free.
- **reCAPTCHA Enterprise** is billed separately via Google Cloud if usage exceeds the free tier.
- **Free Tier**: 1 million assessments/month per Google Cloud project.
- **Above free tier**: ~USD $1 per 1,000 extra assessments.
- Most Test Commander deployments will stay under the free tier unless serving millions of protected requests monthly.

---

## 3. Why Use reCAPTCHA Enterprise (vs legacy reCAPTCHA v3/v2)

- It is the **recommended** and **supported** option for production web apps using Firebase App Check.
- Improved bot detection using machine learning risk analysis.
- Can run completely **invisible** for legitimate users (no “click traffic lights” prompts in normal cases).
- Integrates cleanly with Google Cloud security tools.
- Future-proof: legacy reCAPTCHA v3/v2 are being phased out for App Check.

---

## 4. User Experience Behaviour

- **Invisible by default**: Runs in the background without user interaction.
- **Challenge appears only if**:
  - Google’s risk analysis detects suspicious activity (bot-like behaviour, automation tools, headless browsers, etc.).
  - Debug mode/misconfiguration in development.
- **Token Lifetime**: Default ~1 hour.
  - With `isTokenAutoRefreshEnabled: true`, tokens refresh automatically without user prompts.
- For normal users:
  - No visible captcha during login or normal app usage.
  - Challenge is rare and only shown to high-risk sessions.

---

## 5. Development vs Production

- **Development**:
  - Use the **Debug Provider** (no site key required, no charges).
  - Tokens are generated locally without contacting reCAPTCHA Enterprise.
  - Enforcement is OFF in Firebase console for dev/testing services.
- **Production**:
  - Use **reCAPTCHA Enterprise Provider** with a site key from Google Cloud Console.
  - Enforcement is ON for protected Firebase services.

---

## 6. Setup Steps

### Step 1: Enable App Check in Firebase Console
1. Go to your Firebase project (`test-commander-project`).
2. Navigate to **Build → App Check**.
3. Click **Get Started** and register your web app.
4. Choose **reCAPTCHA Enterprise** as the attestation provider.

### Step 2: Create reCAPTCHA Enterprise Site Key
1. In Google Cloud Console, enable the **reCAPTCHA Enterprise API**.
2. Create a new **site key** (type: Web application).
3. Link it to your Firebase project.

### Step 3: Integrate App Check SDK in Code
```javascript
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "test-commander-project.firebaseapp.com",
  projectId: "test-commander-project",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY'),
  isTokenAutoRefreshEnabled: true // Keeps tokens fresh automatically
});
```

### Step 4: Enable Enforcement in Firebase Console
1. After verifying integration works, go to **App Check → Enforcement**.
2. Enable for services like Firestore, Storage, and Functions.
3. Optionally roll out gradually to monitor impact.

---

## 7. Security Benefits

- Blocks direct/unauthorized REST API calls to Firebase services from outside the verified app.
- Reduces abuse (e.g., automated scraping, data injection).
- Works alongside Firebase Auth for layered security.

---

## 8. Recommendations for Test Commander

- Use Debug Provider in local dev to avoid friction during testing.
- Switch to reCAPTCHA Enterprise in production for real protection.
- Keep enforcement off until App Check metrics in the console confirm all legitimate clients are passing.
- Monitor monthly usage to stay within free tier and avoid charges.

---

## 9. References

- [Firebase App Check Docs](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Enterprise Docs](https://cloud.google.com/recaptcha-enterprise/docs)
- [Google Cloud Pricing for reCAPTCHA Enterprise](https://cloud.google.com/recaptcha-enterprise/pricing)

