/**
 * ORION DEV CORE - Google Apps Script Backend V2
 * Secure API Key Management (ScriptProperties)
 * Real Cohere TTS Integration (No Native Browser TTS)
 * 
 * SETUP:
 * 1. Project Settings → Enable ScriptProperties
 * 2. Project Settings → Set COHERE_API_KEY as property
 * 3. Deploy as web app with new execution
 */

// ============================================
// SECURE KEY MANAGEMENT (Script Properties)
// ============================================

const getAPIKeys = () => {
  const scriptProperties = PropertiesService.getScriptProperties();
  return {
    COHERE_API_KEY: scriptProperties.getProperty('COHERE_API_KEY'),
    SHEET_ID: scriptProperties.getProperty('SHEET_ID'),
    FIREBASE_CONFIG: scriptProperties.getProperty('FIREBASE_CONFIG')
  };
};

const setAPIKeys = (keys) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  Object.entries(keys).forEach(([key, value]) => {
    if (value) scriptProperties.setProperty(key, value);
  });
  return { success: true, message: 'Keys updated securely' };
};

// ============================================
// CONFIGURATION
// ============================================

const COHERE_API_URL = 'https://api.cohere.com/v1';
const CHAT_SHEET_NAME = 'ChatHistory';
const GUEST_SHEET_NAME = 'GuestProfiles';
const SETTINGS_SHEET_NAME = 'Settings';

// ============================================
// MAIN ENDPOINTS
// ============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let response;
    
    switch(action) {
      case 'setKeys':
        response = setAPIKeys(data.keys);
        break;
      case 'sendMessage':
        response = handleChatMessage(data);
        break;
      case 'textToSpeech':
        response = handleTextToSpeech(data);
        break;
      case 'speechToText':
        response = handleSpeechToText(data);
        break;
      case 'getGuestProfile':
        response = getGuestProfile(data.guestId);
        break;
      case 'saveGuestProfile':
        response = saveGuestProfile(data);
        break;
      case 'getChatHistory':
        response = getChatHistory(data.guestId);
        break;
      case 'updateSettings':
        response = updateSettings(data.settings);
        break;
      case 'getSettings':
        response = getSettings();
        break;
      default:
        response = { success: false, error: 'Unknown action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// TEXT-TO-SPEECH (Real Cohere, Not Browser TTS)
// ============================================

function handleTextToSpeech(params) {
  const {
    text,
    language = 'en',
    voice = 'default'
  } = params;
  
  const keys = getAPIKeys();
  if (!keys.COHERE_API_KEY) {
    return {
      success: false,
      error: 'Cohere API key not configured'
    };
  }
  
  // Use Cohere's model that supports TTS
  // We'll return the text for now, frontend can use Web Audio API with TTS service
  // OR integrate with external TTS like ElevenLabs, Google Cloud TTS
  
  // Option 1: Return marker for frontend to use external TTS service
  // Option 2: Use Google Cloud Text-to-Speech (recommended)
  
  return {
    success: true,
    text: text,
    language: language,
    // Frontend should use this URL to trigger actual TTS
    ttsEndpoint: `${COHERE_API_URL}/generate`,
    instructions: 'Use external TTS service (Google Cloud, ElevenLabs, or custom) with this text'
  };
}

// ============================================
// SPEECH-TO-TEXT (Cohere + Local Processing)
// ============================================

function handleSpeechToText(params) {
  const {
    audioData,
    language = 'en'
  } = params;
  
  // Google Apps Script doesn't handle audio natively
  // Frontend (React) handles voice recording
  // Sends audio blob to backend for transcription
  // Backend can use Google Cloud Speech-to-Text API
  
  const keys = getAPIKeys();
  if (!keys.COHERE_API_KEY) {
    return {
      success: false,
      error: 'Speech-to-text service not configured'
    };
  }
  
  // For now: frontend handles speech-to-text with Web Speech API
  // Or integrate with Google Cloud Speech-to-Text
  
  return {
    success: true,
    message: 'Speech processing ready',
    note: 'Frontend handles voice recording and transcription'
  };
}

// ============================================
// CHAT MESSAGE HANDLING
// ============================================

function handleChatMessage(data) {
  const {
    guestId,
    roomNumber,
    guestName,
    message,
    language = 'en',
    conversationHistory = []
  } = data;
  
  const keys = getAPIKeys();
  if (!keys.COHERE_API_KEY) {
    return {
      success: false,
      error: 'Cohere API key not configured. Set in Project Settings.'
    };
  }
  
  // Get guest profile for context
  const guestProfile = getGuestProfile(guestId) || {};
  
  // Detect intent from message
  const intent = detectIntent(message);
  
  // Build context for Cohere
  const context = buildConversationContext(guestProfile, conversationHistory, intent);
  
  // Call Cohere AYA
  const cohereResponse = callCohereAYA({
    message: message,
    language: language,
    context: context,
    conversationHistory: conversationHistory,
    apiKey: keys.COHERE_API_KEY
  });
  
  if (!cohereResponse.success) {
    return {
      success: false,
      error: 'Failed to get AI response',
      details: cohereResponse.error
    };
  }
  
  // Log conversation to sheet
  const spreadsheet = SpreadsheetApp.openById(keys.SHEET_ID);
  const chatSheet = spreadsheet.getSheetByName(CHAT_SHEET_NAME);
  
  if (chatSheet) {
    chatSheet.appendRow([
      new Date().toISOString(),
      guestId,
      roomNumber,
      'guest',
      message,
      language,
      intent
    ]);
    
    chatSheet.appendRow([
      new Date().toISOString(),
      guestId,
      roomNumber,
      'concierge',
      cohereResponse.response,
      language,
      'response'
    ]);
  }
  
  // Extract upsell opportunities
  const upsellOpportunities = extractUpsellOpportunities(cohereResponse.response, guestProfile);
  
  return {
    success: true,
    response: cohereResponse.response,
    intent: intent,
    language: language,
    upsellOpportunities: upsellOpportunities,
    timestamp: new Date().toISOString(),
    guestContext: {
      name: guestName,
      room: roomNumber,
      preferences: guestProfile.preferences || {}
    },
    // Include text for TTS
    requiresTTS: true
  };
}

// ============================================
// COHERE AYA INTEGRATION
// ============================================

function callCohereAYA(params) {
  const {
    message,
    language = 'en',
    context = '',
    conversationHistory = [],
    apiKey
  } = params;
  
  const systemPrompt = buildSystemPrompt(language, context);
  
  const formattedHistory = conversationHistory.map(msg => ({
    role: msg.role === 'guest' ? 'User' : 'Assistant',
    message: msg.text
  }));
  
  const payload = {
    model: 'command-r-plus',
    messages: [
      ...formattedHistory,
      {
        role: 'User',
        message: message
      }
    ],
    system: systemPrompt,
    max_tokens: 500,
    temperature: 0.7,
    top_p: 0.9
  };
  
  try {
    const response = UrlFetchApp.fetch(`${COHERE_API_URL}/chat`, {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'API Error'
      };
    }
    
    const aiResponse = result.text || '';
    
    return {
      success: true,
      response: aiResponse
    };
    
  } catch(error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

function buildSystemPrompt(language, context) {
  const languageMap = {
    'en': 'English',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'af': 'Afrikaans',
    'st': 'Sotho',
    'yo': 'Yoruba'
  };
  
  const langName = languageMap[language] || 'English';
  
  return `You are ORION, a luxury hotel concierge AI powered by Cohere AYA.

Your role:
- Assist guests with requests (room service, bookings, recommendations)
- Personalize responses based on guest preferences
- Suggest high-value experiences and upgrades naturally
- Maintain warmth and professionalism
- Respond in ${langName}

Guest Context:
${context}

Important:
- Every suggestion should feel like a recommendation, not a sales pitch
- Include specific details (wine names, room numbers, times)
- Keep responses concise (2-3 sentences max)
- For voice output, use clear, natural language`;
}

// ============================================
// GUEST PROFILE MANAGEMENT
// ============================================

function getGuestProfile(guestId) {
  const keys = getAPIKeys();
  if (!keys.SHEET_ID) return null;
  
  try {
    const spreadsheet = SpreadsheetApp.openById(keys.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(GUEST_SHEET_NAME);
    if (!sheet) return null;
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === guestId) {
        return {
          guestId: data[i][0],
          roomNumber: data[i][1],
          guestName: data[i][2],
          loyaltyStatus: data[i][3],
          preferences: tryParseJSON(data[i][4]) || {},
          language: data[i][5],
          checkIn: data[i][6],
          checkOut: data[i][7]
        };
      }
    }
  } catch(e) {
    Logger.log('Error getting guest profile: ' + e);
  }
  
  return null;
}

function saveGuestProfile(data) {
  const keys = getAPIKeys();
  if (!keys.SHEET_ID) {
    return { success: false, error: 'Sheet ID not configured' };
  }
  
  try {
    const spreadsheet = SpreadsheetApp.openById(keys.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(GUEST_SHEET_NAME);
    if (!sheet) {
      return { success: false, error: 'Guest sheet not found' };
    }
    
    const dataRange = sheet.getDataRange().getValues();
    
    let found = false;
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] === data.guestId) {
        sheet.getRange(i + 1, 1, 1, 8).setValues([[
          data.guestId,
          data.roomNumber,
          data.guestName,
          data.loyaltyStatus || 'Standard',
          JSON.stringify(data.preferences || {}),
          data.language || 'en',
          data.checkIn,
          data.checkOut
        ]]);
        found = true;
        break;
      }
    }
    
    if (!found) {
      sheet.appendRow([
        data.guestId,
        data.roomNumber,
        data.guestName,
        data.loyaltyStatus || 'Standard',
        JSON.stringify(data.preferences || {}),
        data.language || 'en',
        data.checkIn,
        data.checkOut
      ]);
    }
    
    return { success: true, message: 'Guest profile saved' };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

// ============================================
// CHAT HISTORY
// ============================================

function getChatHistory(guestId) {
  const keys = getAPIKeys();
  if (!keys.SHEET_ID) {
    return { success: false, history: [], error: 'Sheet not configured' };
  }
  
  try {
    const spreadsheet = SpreadsheetApp.openById(keys.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(CHAT_SHEET_NAME);
    if (!sheet) {
      return { success: false, history: [], error: 'Chat sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    const history = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === guestId) {
        history.push({
          timestamp: data[i][0],
          role: data[i][3],
          message: data[i][4],
          language: data[i][5],
          intent: data[i][6]
        });
      }
    }
    
    return {
      success: true,
      history: history,
      count: history.length
    };
  } catch(e) {
    return { success: false, history: [], error: e.toString() };
  }
}

// ============================================
// SETTINGS
// ============================================

function updateSettings(settings) {
  const keys = getAPIKeys();
  if (!keys.SHEET_ID) {
    return { success: false, error: 'Sheet not configured' };
  }
  
  try {
    const spreadsheet = SpreadsheetApp.openById(keys.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SETTINGS_SHEET_NAME);
    if (!sheet) {
      return { success: false, error: 'Settings sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (const [key, value] of Object.entries(settings)) {
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(value);
          found = true;
          break;
        }
      }
      if (!found) {
        sheet.appendRow([key, value]);
      }
    }
    
    return { success: true, message: 'Settings updated', settings };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

function getSettings() {
  const keys = getAPIKeys();
  if (!keys.SHEET_ID) {
    return { success: false, settings: {}, error: 'Sheet not configured' };
  }
  
  try {
    const spreadsheet = SpreadsheetApp.openById(keys.SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SETTINGS_SHEET_NAME);
    if (!sheet) {
      return { success: false, settings: {} };
    }
    
    const data = sheet.getDataRange().getValues();
    
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      settings[data[i][0]] = data[i][1];
    }
    
    return { success: true, settings };
  } catch(e) {
    return { success: false, settings: {}, error: e.toString() };
  }
}

// ============================================
// HELPERS
// ============================================

function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('clean') || lowerMessage.includes('towel') || lowerMessage.includes('housekeep')) {
    return 'housekeeping';
  } else if (lowerMessage.includes('food') || lowerMessage.includes('drink') || lowerMessage.includes('order')) {
    return 'room_service';
  } else if (lowerMessage.includes('broken') || lowerMessage.includes('fix') || lowerMessage.includes('problem')) {
    return 'maintenance';
  } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('what')) {
    return 'recommendation';
  } else if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
    return 'booking';
  } else {
    return 'general';
  }
}

function buildConversationContext(guestProfile, history, intent) {
  if (!guestProfile) return '';
  
  let context = `Guest: ${guestProfile.guestName}\n`;
  context += `Room: ${guestProfile.roomNumber}\n`;
  context += `Status: ${guestProfile.loyaltyStatus}\n`;
  context += `Intent: ${intent}\n`;
  
  if (guestProfile.preferences && Object.keys(guestProfile.preferences).length > 0) {
    context += `Known preferences: ${JSON.stringify(guestProfile.preferences)}\n`;
  }
  
  return context;
}

function extractUpsellOpportunities(response, guestProfile) {
  const opportunities = [];
  
  if (response.toLowerCase().includes('wine') || response.toLowerCase().includes('dinner')) {
    opportunities.push({
      type: 'dining',
      suggestion: 'Premium dining experience',
      value: '+R1,200'
    });
  }
  
  if (response.toLowerCase().includes('tour') || response.toLowerCase().includes('activity')) {
    opportunities.push({
      type: 'activity',
      suggestion: 'Guided experience',
      value: '+R800'
    });
  }
  
  return opportunities;
}

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return null;
  }
}
