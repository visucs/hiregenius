const env = require('../../config/env');

/**
 * Shared email base layout mirroring the responsive HTML design in Auth Service
 */
function wrapHtmlLayout({ title, heading, contentHtml, footerNoteHtml = '' }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">HireGenius AI</h1>
              <p style="color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;">Next-Generation Talent Acquisition Platform</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">${heading}</h2>
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
              ${footerNoteHtml}
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2026 HireGenius AI. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatDateTime(dateInput) {
  if (!dateInput) return 'To be confirmed';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * 1. INTERVIEW_SCHEDULED Template
 */
function interviewScheduledTemplate({ candidateName, jobTitle, company, scheduledAt, meetingLink }) {
  const name = candidateName || 'there';
  const formattedTime = formatDateTime(scheduledAt);
  const portalUrl = `${env.FRONTEND_BASE_URL}/candidate/interviews`;

  const meetingLinkButton = meetingLink ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 12px;">
      <tr>
        <td align="center">
          <a href="${meetingLink}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">
            Join Interview Meeting
          </a>
        </td>
      </tr>
    </table>
    <p style="color: #6b7280; font-size: 13px; line-height: 20px; text-align: center; margin: 0 0 20px 0;">
      Meeting Link: <a href="${meetingLink}" target="_blank" style="color: #4f46e5; word-break: break-all;">${meetingLink}</a>
    </p>
  ` : `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 12px;">
      <tr>
        <td align="center">
          <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">
            View in Interviews Portal
          </a>
        </td>
      </tr>
    </table>
  `;

  const contentHtml = `
    <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
      Hello ${name},<br><br>
      Great news! An interview has been scheduled for your application with <strong>${company || 'the hiring team'}</strong>.
    </p>

    <!-- Details Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 110px;">Position:</td>
          <td style="padding: 4px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${jobTitle || 'Role'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Company:</td>
          <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${company || 'Hiring Organization'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Date & Time:</td>
          <td style="padding: 4px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${formattedTime}</td>
        </tr>
      </table>
    </div>

    ${meetingLinkButton}

    <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 16px 0 0 0;">
      Please ensure you have a quiet environment and stable internet connection prior to the session. Best of luck!
    </p>
  `;

  const text = `Hello ${name},

An interview has been scheduled for your application for "${jobTitle || 'the position'}" with ${company || 'the hiring team'}.

Interview Details:
- Position: ${jobTitle || 'Role'}
- Company: ${company || 'Hiring Organization'}
- Date & Time: ${formattedTime}
${meetingLink ? `- Meeting Link: ${meetingLink}` : `- Manage interview in portal: ${portalUrl}`}

Best regards,
HireGenius AI Team`;

  return {
    subject: `Interview Scheduled: ${jobTitle || 'Position'} at ${company || 'HireGenius'}`,
    html: wrapHtmlLayout({
      title: 'Interview Scheduled',
      heading: 'Your Interview has been Scheduled',
      contentHtml,
      footerNoteHtml: `<p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;">You can view and manage all your scheduled interviews on your <a href="${portalUrl}" style="color: #4f46e5;">HireGenius Dashboard</a>.</p>`,
    }),
    text,
  };
}

/**
 * 2. INTERVIEW_CANCELLED Template
 */
function interviewCancelledTemplate({ candidateName, jobTitle, company, scheduledAt }) {
  const name = candidateName || 'there';
  const formattedTime = formatDateTime(scheduledAt);
  const portalUrl = `${env.FRONTEND_BASE_URL}/candidate/interviews`;

  const contentHtml = `
    <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
      Hello ${name},<br><br>
      Please be advised that your scheduled interview with <strong>${company || 'the hiring team'}</strong> has been cancelled.
    </p>

    <!-- Details Box -->
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 4px 0; color: #7f1d1d; font-size: 13px; font-weight: 600; width: 110px;">Position:</td>
          <td style="padding: 4px 0; color: #111827; font-size: 14px; font-weight: 600;">${jobTitle || 'Role'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #7f1d1d; font-size: 13px; font-weight: 600;">Company:</td>
          <td style="padding: 4px 0; color: #111827; font-size: 14px;">${company || 'Hiring Organization'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #7f1d1d; font-size: 13px; font-weight: 600;">Cancelled Slot:</td>
          <td style="padding: 4px 0; color: #111827; font-size: 14px;">${formattedTime}</td>
        </tr>
      </table>
    </div>

    <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 16px 0 24px 0;">
      The recruiter will reach out with further updates or rescheduling options if applicable. You can check the current status of your application anytime on your dashboard.
    </p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td align="center">
          <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #4b5563; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
            Go to Candidate Dashboard
          </a>
        </td>
      </tr>
    </table>
  `;

  const text = `Hello ${name},

Your interview for "${jobTitle || 'the position'}" with ${company || 'the hiring team'} (originally scheduled for ${formattedTime}) has been cancelled.

The recruiter will reach out with further updates if rescheduling is planned. You can check your application status here: ${portalUrl}

Best regards,
HireGenius AI Team`;

  return {
    subject: `Interview Cancelled: ${jobTitle || 'Position'} at ${company || 'HireGenius'}`,
    html: wrapHtmlLayout({
      title: 'Interview Cancelled',
      heading: 'Interview Cancellation Notice',
      contentHtml,
      footerNoteHtml: `<p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;">For questions, please contact your recruitment team directly via the platform.</p>`,
    }),
    text,
  };
}

/**
 * 3. STATUS_CHANGED Template (SHORTLISTED, HIRED, REJECTED)
 */
function statusChangedTemplate({ candidateName, jobTitle, company, status }) {
  const name = candidateName || 'there';
  const upperStatus = String(status || '').toUpperCase();
  const portalUrl = `${env.FRONTEND_BASE_URL}/candidate/applications`;

  let subject = '';
  let heading = '';
  let introHtml = '';
  let statusBadgeColor = '#4f46e5';
  let statusBadgeBg = '#eef2ff';
  let closingHtml = '';
  let ctaText = 'View Application Details';
  let includeCta = true;

  if (upperStatus === 'SHORTLISTED') {
    subject = `Great news! You have been shortlisted for ${jobTitle || 'Position'} at ${company || 'HireGenius'}`;
    heading = 'Congratulations! You are Shortlisted';
    statusBadgeColor = '#2563eb';
    statusBadgeBg = '#dbeafe';
    introHtml = `
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 16px 0;">
        Hello ${name},<br><br>
        We are thrilled to let you know that your application for <strong>${jobTitle || 'the position'}</strong> at <strong>${company || 'the hiring team'}</strong> has been <strong>shortlisted</strong>!
      </p>
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
        The recruitment team was impressed with your qualifications and experience. They will contact you shortly regarding the next steps in the evaluation process.
      </p>
    `;
    closingHtml = `
      <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 16px 0 0 0;">
        Keep up the great work and prepare for upcoming milestones on your candidate portal.
      </p>
    `;
  } else if (upperStatus === 'HIRED') {
    subject = `Job Offer / Hired: Welcome to ${company || 'the team'} as ${jobTitle || 'Candidate'}!`;
    heading = 'Congratulations on Your Offer!';
    statusBadgeColor = '#059669';
    statusBadgeBg = '#d1fae5';
    introHtml = `
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 16px 0;">
        Hello ${name},<br><br>
        We are ecstatic to share that you have been selected and <strong>hired</strong> for the position of <strong>${jobTitle || 'Role'}</strong> at <strong>${company || 'the organization'}</strong>!
      </p>
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
        The hiring committee was thoroughly impressed by your performance throughout the selection process. Official onboarding details will follow directly from the HR team.
      </p>
    `;
    closingHtml = `
      <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 16px 0 0 0;">
        Congratulations on this fantastic career milestone!
      </p>
    `;
    ctaText = 'View Offer & Application';
  } else if (upperStatus === 'REJECTED') {
    subject = `Application Update: ${jobTitle || 'Position'} at ${company || 'HireGenius'}`;
    heading = 'Application Status Update';
    statusBadgeColor = '#475569';
    statusBadgeBg = '#f1f5f9';
    introHtml = `
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 16px 0;">
        Hello ${name},<br><br>
        Thank you sincerely for taking the time to apply and interview for the <strong>${jobTitle || 'position'}</strong> role at <strong>${company || 'our organization'}</strong>.
      </p>
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
        After careful consideration, our hiring team has decided to pursue other candidates whose experience aligns more closely with our current requirements.
      </p>
    `;
    closingHtml = `
      <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 16px 0 0 0;">
        We were genuinely impressed with your talents and encourage you to apply for future opportunities that match your expertise. We wish you the very best in your job search and future career endeavors.
      </p>
    `;
    includeCta = false;
  } else {
    // Generic fallback for any other status
    subject = `Application Status Update: ${jobTitle || 'Position'}`;
    heading = 'Application Update';
    introHtml = `
      <p style="color: #4b5563; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
        Hello ${name},<br><br>
        Your application status for <strong>${jobTitle || 'the position'}</strong> at <strong>${company || 'the hiring team'}</strong> has been updated to <strong>${upperStatus}</strong>.
      </p>
    `;
  }

  const ctaButtonHtml = includeCta ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">
            ${ctaText}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  const contentHtml = `
    ${introHtml}

    <!-- Status Pill Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 110px;">Position:</td>
          <td style="padding: 4px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${jobTitle || 'Role'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">Company:</td>
          <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${company || 'Hiring Organization'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b; font-size: 13px; font-weight: 600;">New Status:</td>
          <td style="padding: 4px 0;">
            <span style="display: inline-block; font-size: 12px; font-weight: 700; color: ${statusBadgeColor}; background-color: ${statusBadgeBg}; padding: 3px 10px; border-radius: 999px;">
              ${upperStatus}
            </span>
          </td>
        </tr>
      </table>
    </div>

    ${ctaButtonHtml}
    ${closingHtml}
  `;

  const text = `Hello ${name},

Your application for "${jobTitle || 'the position'}" at ${company || 'the hiring team'} has been updated to: ${upperStatus}.

${upperStatus === 'SHORTLISTED' ? 'Congratulations on being shortlisted! The team will be in touch with next steps.' : ''}
${upperStatus === 'HIRED' ? 'Congratulations on your offer! Welcome aboard!' : ''}
${upperStatus === 'REJECTED' ? 'Thank you for your interest and time. While we are unable to proceed at this time, we wish you the very best in your search.' : ''}

Track your applications on your dashboard: ${portalUrl}

Best regards,
HireGenius AI Team`;

  return {
    subject,
    html: wrapHtmlLayout({
      title: subject,
      heading,
      contentHtml,
      footerNoteHtml: `<p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;">You can view your application status anytime at <a href="${portalUrl}" style="color: #4f46e5;">HireGenius Applications</a>.</p>`,
    }),
    text,
  };
}

/**
 * 4. JOB_ALERT Template (Batched, Opt-In)
 */
function jobAlertTemplate({
  candidateName,
  jobTitle,
  company,
  location,
  descriptionExcerpt,
  jobUrl,
  unsubscribeUrl,
}) {
  const name = candidateName || 'there';
  const subject = `New Job Opportunity: ${jobTitle || 'New Role'} at ${company || 'HireGenius'}`;
  const heading = 'Exciting new role matching your profile!';

  const contentHtml = `
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
      Hi ${name},
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
      A new role has just been posted on HireGenius AI that you may be interested in:
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <h3 style="color: #111827; margin: 0 0 6px 0; font-size: 18px; font-weight: 700;">${jobTitle || 'Open Position'}</h3>
      <p style="color: #4f46e5; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">${company || 'Confidential'} &bull; ${location || 'Remote'}</p>
      <p style="color: #4b5563; font-size: 14px; line-height: 22px; margin: 0;">
        ${descriptionExcerpt || 'Discover full job responsibilities, required qualifications, and apply directly via your HireGenius profile.'}
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${jobUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
        View Job & Apply
      </a>
    </div>

    <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 24px 0 0 0;">
      Best regards,<br>
      <strong>HireGenius AI Talent Network</strong>
    </p>
  `;

  const footerNoteHtml = `
    <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;">
      You received this email because you opted in to new job alerts on HireGenius.
    </p>
    <p style="color: #6b7280; font-size: 12px; line-height: 18px; margin: 0 0 8px 0;">
      <a href="${unsubscribeUrl}" style="color: #ef4444; text-decoration: underline;">Unsubscribe from Job Alerts</a>
    </p>
  `;

  const text = `Hello ${name},

A new job has just been posted on HireGenius AI:
Job: ${jobTitle || 'Open Position'}
Company: ${company || 'Confidential'}
Location: ${location || 'Remote'}

Description:
${descriptionExcerpt || ''}

View and apply: ${jobUrl}

Unsubscribe from job alerts:
${unsubscribeUrl}

Best regards,
HireGenius AI Talent Network`;

  return {
    subject,
    html: wrapHtmlLayout({
      title: subject,
      heading,
      contentHtml,
      footerNoteHtml,
    }),
    text,
  };
}

/**
 * 5. RESUME_UPDATED Template (Security Notification)
 */
function resumeUpdatedTemplate({ candidateName, filename, updatedAt }) {
  const name = candidateName || 'there';
  const formattedTime = formatDateTime(updatedAt);
  const subject = 'Security Notice: Your resume was updated on HireGenius';
  const heading = 'Your Resume Has Been Updated';

  const contentHtml = `
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
      Hello ${name},
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
      This is a security confirmation that your candidate profile resume on HireGenius AI was successfully updated.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table border="0" cellpadding="6" cellspacing="0" width="100%">
        <tr>
          <td style="color: #6b7280; font-size: 14px; width: 140px; font-weight: 500;">New Resume File:</td>
          <td style="color: #111827; font-size: 14px; font-weight: 600;">${filename || 'resume.pdf'}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Updated At:</td>
          <td style="color: #111827; font-size: 14px; font-weight: 600;">${formattedTime}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 16px; margin: 0 0 24px 0;">
      <p style="color: #991b1b; font-size: 13px; line-height: 20px; margin: 0;">
        <strong>Didn't make this change?</strong> If you did not upload a new resume, someone may have unauthorized access to your account. Please log in immediately and update your password, or contact security support.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 24px 0 0 0;">
      Best regards,<br>
      <strong>HireGenius AI Security Team</strong>
    </p>
  `;

  const text = `Hello ${name},

This is a security confirmation that your candidate resume on HireGenius AI was successfully updated.
File: ${filename || 'resume.pdf'}
Updated: ${formattedTime}

If you did NOT make this change, please log in and change your password immediately.

Best regards,
HireGenius AI Security Team`;

  return {
    subject,
    html: wrapHtmlLayout({
      title: subject,
      heading,
      contentHtml,
    }),
    text,
  };
}

/**
 * 6. WELCOME_PROFILE_SETUP Template (First-Ever Profile Setup)
 */
function welcomeProfileSetupTemplate({ candidateName }) {
  const name = candidateName || 'there';
  const subject = 'Welcome to HireGenius AI — Profile Setup Complete';
  const heading = 'Welcome to HireGenius AI!';
  const portalUrl = `${env.FRONTEND_BASE_URL || 'https://hiregenius-delta.vercel.app'}/jobs`;

  const contentHtml = `
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
      Hi ${name},
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
      Welcome to HireGenius AI! Your candidate profile is set up and your resume has been processed.
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
      Our AI-powered platform matches your skills directly with high-growth tech companies. You can now browse open roles and apply with 1-click intelligent screening.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${portalUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
        Explore Open Jobs
      </a>
    </div>

    <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 24px 0 0 0;">
      Best regards,<br>
      <strong>HireGenius AI Onboarding Team</strong>
    </p>
  `;

  const text = `Hello ${name},

Welcome to HireGenius AI! Your candidate profile is now set up and your resume has been received.

Explore open positions and apply directly: ${portalUrl}

Best regards,
HireGenius AI Team`;

  return {
    subject,
    html: wrapHtmlLayout({
      title: subject,
      heading,
      contentHtml,
    }),
    text,
  };
}

/**
 * 7. APPLICATION_RECEIVED_RECRUITER Template (Opt-In Recruiter Notification)
 */
function applicationReceivedRecruiterTemplate({ recruiterName, candidateName, jobTitle, applicationUrl }) {
  const name = recruiterName || 'there';
  const applicant = candidateName || 'A candidate';
  const title = jobTitle || 'your job opening';
  const subject = `New Application Received: ${applicant} applied for ${title}`;
  const heading = 'New Candidate Application';

  const contentHtml = `
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 20px 0;">
      Hello ${name},
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 24px; margin: 0 0 24px 0;">
      <strong>${applicant}</strong> has just submitted an application for <strong>${title}</strong>.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <table border="0" cellpadding="6" cellspacing="0" width="100%">
        <tr>
          <td style="color: #6b7280; font-size: 14px; width: 140px; font-weight: 500;">Applicant:</td>
          <td style="color: #111827; font-size: 14px; font-weight: 600;">${applicant}</td>
        </tr>
        <tr>
          <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Job Position:</td>
          <td style="color: #111827; font-size: 14px; font-weight: 600;">${title}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${applicationUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
        Review Application
      </a>
    </div>

    <p style="color: #6b7280; font-size: 13px; line-height: 20px; margin: 24px 0 0 0;">
      Best regards,<br>
      <strong>HireGenius AI Platform</strong>
    </p>
  `;

  const text = `Hello ${name},

${applicant} has just applied for ${title}.

Review the applicant profile and resume: ${applicationUrl}

Best regards,
HireGenius AI Platform`;

  return {
    subject,
    html: wrapHtmlLayout({
      title: subject,
      heading,
      contentHtml,
    }),
    text,
  };
}

module.exports = {
  interviewScheduledTemplate,
  interviewCancelledTemplate,
  statusChangedTemplate,
  jobAlertTemplate,
  resumeUpdatedTemplate,
  welcomeProfileSetupTemplate,
  applicationReceivedRecruiterTemplate,
  formatDateTime,
};

