import * as MailComposer from 'expo-mail-composer';
import { Alert } from 'react-native';
import { ADMIN_CONTACT_EMAIL } from '../../env';

/**
 * Send email using device's default email app
 */
export const sendEmail = async (to, subject, body, options = {}) => {
  try {
    const isAvailable = await MailComposer.isAvailableAsync();
    
    if (!isAvailable) {
      Alert.alert(
        'Email Not Available',
        'No email app is configured on this device. Please set up an email account in your device settings.',
        [{ text: 'OK' }]
      );
      return { success: false, message: 'Email not available' };
    }

    const mailOptions = {
      recipients: Array.isArray(to) ? to : [to],
      subject: subject,
      body: body,
      isHtml: false,
      ...options
    };

    const result = await MailComposer.composeAsync(mailOptions);
    
    if (result.status === 'sent') {
      return { success: true, message: 'Email sent successfully' };
    } else if (result.status === 'cancelled') {
      return { success: false, message: 'Email cancelled by user' };
    } else {
      return { success: false, message: 'Email failed to send' };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Send contact admin email
 */
export const sendContactAdminEmail = async (userEmail, userName, message) => {
  const adminEmail = ADMIN_CONTACT_EMAIL;
  const subject = `Contact from Coyote Alert App - ${userName}`;
  const body = `You have received a message from a Coyote Alert app user:\n\n` +
    `User: ${userName} (${userEmail})\n` +
    `Message:\n${message}\n\n` +
    `---\n` +
    `This message was sent from the Coyote Alert mobile app.`;
  
  return await sendEmail(adminEmail, subject, body, {
    cc: [userEmail] // CC the user so they have a copy
  });
};

/**
 * Check if email is available on device
 */
export const isEmailAvailable = async () => {
  try {
    return await MailComposer.isAvailableAsync();
  } catch (error) {
    console.error('Error checking email availability:', error);
    return false;
  }
};




