import emailjs from '@emailjs/browser';

// Types for lead data
export interface LeadData {
  type: string;
  value: string;
  name: string;
  provider?: string;
  source: string;
  monthlyBill: number;
  address: string;
  yearlyProduction?: number;
  panelCount?: number;
  systemSize?: string;
  timestamp: string;
}

// Initialize EmailJS (call once on app load)
export function initEmailJS() {
  try {
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (!publicKey) {
      console.warn('EmailJS: Missing VITE_EMAILJS_PUBLIC_KEY');
      return false;
    }
    
    emailjs.init(publicKey);
    console.log('✅ EmailJS initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ EmailJS initialization failed:', error);
    return false;
  }
}

// Send lead notification email
export async function sendLeadNotification(leadData: LeadData) {
  // Check if EmailJS is properly configured
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const notificationEmail = import.meta.env.VITE_NOTIFICATION_EMAIL;
  
  if (!serviceId || !templateId || !notificationEmail) {
    console.warn('EmailJS: Missing required environment variables');
    // Still save locally as backup
    saveLeadLocally(leadData);
    throw new Error('EmailJS configuration incomplete');
  }

  // Prepare template parameters
  const templateParams = {
    to_email: notificationEmail,
    from_name: leadData.name || 'Unknown Lead',
    contact_type: leadData.type,
    contact_value: leadData.value,
    monthly_bill: leadData.monthlyBill,
    address: leadData.address || 'Not specified',
    timestamp: new Date(leadData.timestamp).toLocaleString('en-GB', { 
      timeZone: 'Europe/Malta',
      dateStyle: 'full',
      timeStyle: 'short'
    }),
    yearly_production: leadData.yearlyProduction?.toFixed(0) || 'N/A',
    panel_count: leadData.panelCount || 'N/A',
    system_size: leadData.systemSize || 'N/A',
    source: leadData.source,
    provider: leadData.provider || 'manual',
    
    // Additional metadata
    deployment: 'Railway Production',
    referrer: typeof window !== 'undefined' ? window.location.href : 'N/A',
    user_agent: typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'N/A'
  };

  try {
    console.log('📧 Sending lead notification email...');
    
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams
    );
    
    console.log('✅ Lead notification sent successfully:', response);
    
    // Also save to localStorage as backup
    saveLeadLocally(leadData);
    
    return response;
  } catch (error) {
    console.error('❌ Email send failed:', error);
    
    // Always save to localStorage as backup when email fails
    saveLeadLocally(leadData);
    
    // Re-throw error so caller can handle it
    throw error;
  }
}

// Backup function to save leads locally
function saveLeadLocally(leadData: LeadData) {
  if (typeof window !== 'undefined') {
    try {
      const existingLeads = JSON.parse(localStorage.getItem('solarLeads') || '[]');
      const leadWithBackup = {
        ...leadData,
        savedAt: new Date().toISOString(),
        backupReason: 'Email service unavailable'
      };
      
      existingLeads.push(leadWithBackup);
      localStorage.setItem('solarLeads', JSON.stringify(existingLeads));
      
      console.log('💾 Lead saved to localStorage as backup');
    } catch (error) {
      console.error('❌ Failed to save lead to localStorage:', error);
    }
  }
}

// Utility function to get all locally stored leads
export function getStoredLeads(): LeadData[] {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem('solarLeads') || '[]');
    } catch (error) {
      console.error('❌ Failed to retrieve stored leads:', error);
      return [];
    }
  }
  return [];
}

// Utility function to clear stored leads (for admin use)
export function clearStoredLeads(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('solarLeads');
    console.log('🗑️ Stored leads cleared');
  }
}

// Test function to verify EmailJS configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const testLead: LeadData = {
      type: 'test',
      value: 'test@example.com',
      name: 'Test User',
      source: 'configuration-test',
      monthlyBill: 100,
      address: 'Test Address, Malta',
      yearlyProduction: 5000,
      panelCount: 20,
      systemSize: '9.0 kW',
      timestamp: new Date().toISOString()
    };

    await sendLeadNotification(testLead);
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    return false;
  }
}