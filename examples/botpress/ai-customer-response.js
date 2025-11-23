/**
 * Botpress Custom Action: AI Customer Response
 * 
 * Installation:
 * 1. In Botpress Studio, go to Code Editor
 * 2. Create new action: actions/ai-customer-response.js
 * 3. Paste this code
 * 4. Use in your flows
 * 
 * Usage in Flow:
 * - Add "Execute Code" node
 * - Select "ai-customer-response" action
 * - Access results via temp variables:
 *   - temp.aiResponse
 *   - temp.aiSentiment
 *   - temp.aiCategory
 *   - temp.aiConfidence
 *   - temp.shouldEscalate
 */

/**
 * @title AI Customer Service Response
 * @category Customer Service
 * @description Gets AI-powered response for customer inquiry
 * @author PrintShop OS
 */

const axios = require('axios');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://strapi:1337';
const AI_TIMEOUT = 30000; // 30 seconds

const aiAssist = async () => {
  // Get inquiry text from user message
  const inquiryText = event.payload.text || event.preview;
  const userId = event.target;
  const channelId = event.channel;

  // Initialize temp variables with defaults
  temp.aiResponse = null;
  temp.aiSentiment = 'neutral';
  temp.aiCategory = 'general';
  temp.aiConfidence = 0;
  temp.shouldEscalate = false;
  temp.escalationReason = null;
  temp.suggestedResponses = [];
  temp.aiError = false;

  // Skip if no text
  if (!inquiryText || inquiryText.trim().length === 0) {
    bp.logger.warn('No inquiry text provided');
    temp.aiError = true;
    temp.aiResponse = 'I did not receive your message. Could you please try again?';
    return;
  }

  try {
    bp.logger.info(`Processing inquiry from user ${userId}: "${inquiryText}"`);

    // Call AI service via Strapi
    const response = await axios.post(
      `${STRAPI_URL}/api/customer-service/ai-assist`,
      {
        inquiry_text: inquiryText,
        customer_id: userId,
        channel: 'chat',
      },
      {
        timeout: AI_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      const aiData = response.data.data;

      // Store AI response in temp variables
      temp.aiResponse = aiData.response_text;
      temp.aiSentiment = aiData.sentiment;
      temp.aiCategory = aiData.category;
      temp.aiConfidence = aiData.confidence;
      temp.shouldEscalate = aiData.should_escalate;
      temp.escalationReason = aiData.escalation_reason;
      temp.suggestedResponses = aiData.suggested_responses || [];

      bp.logger.info(
        `AI response generated - Category: ${temp.aiCategory}, ` +
        `Sentiment: ${temp.aiSentiment}, Confidence: ${temp.aiConfidence}`
      );

      // Save to user attributes for history
      const attributes = {
        lastInquiryCategory: temp.aiCategory,
        lastSentiment: temp.aiSentiment,
        lastInteractionTime: new Date().toISOString(),
      };

      await bp.users.updateAttributes(channelId, userId, attributes);

      // Log event for analytics
      await bp.events.saveUserEvent({
        botId: event.botId,
        channel: event.channel,
        target: event.target,
        type: 'ai_response_generated',
        payload: {
          inquiry: inquiryText,
          category: temp.aiCategory,
          sentiment: temp.aiSentiment,
          confidence: temp.aiConfidence,
          escalated: temp.shouldEscalate,
        },
      });

      // If escalation needed, log that too
      if (temp.shouldEscalate) {
        bp.logger.warn(
          `Escalation triggered for user ${userId}: ${temp.escalationReason}`
        );

        await bp.events.saveUserEvent({
          botId: event.botId,
          channel: event.channel,
          target: event.target,
          type: 'escalation_triggered',
          payload: {
            reason: temp.escalationReason,
            sentiment: temp.aiSentiment,
            inquiry: inquiryText,
          },
        });
      }
    } else {
      throw new Error('AI service returned unsuccessful response');
    }
  } catch (error) {
    bp.logger.error('AI assist error:', error.message);
    temp.aiError = true;
    temp.shouldEscalate = true;
    temp.escalationReason = 'AI service error';

    // Provide fallback response
    if (error.code === 'ECONNREFUSED') {
      temp.aiResponse =
        'I apologize, but our AI assistant is temporarily unavailable. ' +
        'Let me connect you with a team member who can help.';
    } else if (error.code === 'ETIMEDOUT') {
      temp.aiResponse =
        'I apologize for the delay. Let me connect you with a team member ' +
        'who can assist you right away.';
    } else {
      temp.aiResponse =
        'I apologize, but I need to connect you with a human agent for assistance.';
    }

    // Log error event
    await bp.events.saveUserEvent({
      botId: event.botId,
      channel: event.channel,
      target: event.target,
      type: 'ai_error',
      payload: {
        error: error.message,
        inquiry: inquiryText,
      },
    });
  }
};

return aiAssist();
