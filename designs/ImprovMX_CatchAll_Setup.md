# Setting up Catch-All Email Forwarding with ImprovMX and Vercel DNS

## Overview
This guide explains how to set up free **catch-all email forwarding** so any address at your domain
(e.g., `test01@yourdomain.com`, `anything@yourdomain.com`) is automatically forwarded to a single inbox.

The example below uses:
- **Domain Registrar/DNS Host**: Vercel (DNS Management)
- **Email Forwarding Provider**: ImprovMX (Free Plan)
- **Destination Inbox**: Gmail

---

## 1. Create an ImprovMX Account
1. Go to [https://improvmx.com](https://improvmx.com) and sign up for a free account.
2. Add your domain (e.g., `yourdomain.com`).
3. Set your **destination email** (e.g., `you@gmail.com`) and verify it via the confirmation link sent to that address.

---

## 2. Get DNS Records from ImprovMX
1. In ImprovMX, click your domain.
2. Note the DNS records it gives you:

**MX Records**
| Type | Name  | Priority | Value                |
|------|-------|----------|----------------------|
| MX   | @     | 10       | mx1.improvmx.com.     |
| MX   | @     | 20       | mx2.improvmx.com.     |

**TXT Record (SPF)**
| Type | Name  | Value                                     |
|------|-------|-------------------------------------------|
| TXT  | @     | v=spf1 include:spf.improvmx.com ~all       |

---

## 3. Add DNS Records in Vercel
1. Log in to [Vercel](https://vercel.com) and go to your domain's settings.
2. Navigate to **DNS Records**.
3. Add the MX and TXT records from above **without deleting any existing A, CNAME, or TXT records**.

Example in Vercel:
- **Record 1:**  
  - Type: `MX`  
  - Name: *(leave blank)* or `@`  
  - Value: `mx1.improvmx.com.`  
  - Priority: `10`

- **Record 2:**  
  - Type: `MX`  
  - Name: *(leave blank)* or `@`  
  - Value: `mx2.improvmx.com.`  
  - Priority: `20`

- **Record 3:**  
  - Type: `TXT`  
  - Name: *(leave blank)* or `@`  
  - Value: `v=spf1 include:spf.improvmx.com ~all`  

---

## 4. Verify Setup in ImprovMX
1. Go back to ImprovMX and click **Recheck**.
2. Wait for green checkmarks on MX and SPF records (DNS propagation can take from a few minutes up to 24 hours).

---

## 5. Test the Catch-All
1. From any external email account, send an email to:  
   `test01@yourdomain.com`
2. Check your destination inbox (e.g., Gmail) — the message should arrive.  
3. Try more test addresses like `test100@yourdomain.com` — they should all arrive at the same inbox.

---

## 6. Use in Testing
You can now:
- Sign up for services using unique addresses at your domain.
- Receive all verification/reset/password emails in your central inbox.
- Click links or automate reading emails via Gmail API for automated test flows.

---

**Notes:**
- This method does not host your email — it simply forwards it.
- Sending outbound mail from these aliases requires SMTP configuration or an outbound email service.
