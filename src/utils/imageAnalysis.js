import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { OPENAI_API_KEY, OPENAI_CONFIG } from '../config/aiConfig';

/**
 * Image Analysis Utilities for Coyote Identification and Health Assessment
 */

/**
 * Request camera and media library permissions
 */
export async function requestImagePermissions() {
  try {
    // Request camera permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraPermission.status === 'granted',
      media: mediaPermission.status === 'granted'
    };
  } catch (error) {
    console.error('Error requesting image permissions:', error);
    return { camera: false, media: false };
  }
}

/**
 * Show image picker options (camera or gallery)
 */
export async function showImagePicker() {
  try {
    const permissions = await requestImagePermissions();
    
    if (!permissions.camera && !permissions.media) {
      throw new Error('Camera and media library permissions are required for image analysis');
    }

    // For now, we'll use the image picker directly
    // In a production app, you might want to show an action sheet with camera/gallery options
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Reduce quality for faster upload
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
}

/**
 * Launch camera to take a photo
 */
export async function launchCamera() {
  try {
    const permissions = await requestImagePermissions();
    
    if (!permissions.camera) {
      throw new Error('Camera permission is required to take photos');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error launching camera:', error);
    throw error;
  }
}

/**
 * Launch camera to record a video
 * @deprecated Video uploads are disabled. Use launchCamera() for photos only.
 */
export async function launchCameraForVideo() {
  throw new Error('Video uploads are not supported. Please use photo capture instead.');
}

/**
 * Show media picker for photos only (videos disabled)
 */
export async function showMediaPicker() {
  try {
    const permissions = await requestImagePermissions();
    
    if (!permissions.camera && !permissions.media) {
      throw new Error('Camera and media library permissions are required for media selection');
    }

    // Only allow images, not videos
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error showing media picker:', error);
    throw error;
  }
}

/**
 * Resize image for optimal API upload
 */
export async function resizeImageForUpload(imageUri) {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 1024 } }, // Resize to max width of 1024px
      ],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true, // We need base64 for OpenAI API
      }
    );

    return manipulatedImage;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}

/**
 * Analyze image using OpenAI Vision API for animal identification and health assessment
 */
export async function analyzeAnimalImage(imageUri) {
  try {
    console.log('🖼️ Starting animal image analysis for:', imageUri);
    
    // Check if API key is available
    if (!OPENAI_API_KEY || OPENAI_API_KEY.includes('YOUR_OPENAI_API_KEY')) {
      throw new Error('OpenAI API key is not configured properly');
    }
    
    // Resize image for optimal upload
    console.log('📏 Resizing image...');
    const resizedImage = await resizeImageForUpload(imageUri);
    
    if (!resizedImage.base64) {
      throw new Error('Failed to process image for analysis');
    }
    
    console.log('✅ Image processed, base64 length:', resizedImage.base64.length);

    // Prepare the vision analysis prompt with detailed request
    const analysisPrompt = `You are an expert wildlife biologist and animal identification specialist. Analyze this image carefully and identify the animal shown. Be confident in your assessment - even if the image is blurry or partially obscured, provide your best identification based on visible characteristics.

Your response must include:

1. COMMON NAME: Start with "COMMON NAME: [species name]" - use the everyday name people would use (e.g., "Coyote", "Raccoon", "Bobcat", "Gray Wolf", "Red Fox")

2. SCIENTIFIC NAME: On the next line, provide "SCIENTIFIC NAME: [Latin binomial]" (e.g., "Canis latrans", "Procyon lotor", "Lynx rufus", "Canis lupus", "Vulpes vulpes")

3. KEY INFORMATION: Follow with bullet points in this EXACT format:
   - Category: Description
   
   For example:
   - Size: Medium-sized canids, similar to a German shepherd or collie, with males being slightly larger than females.
   - Appearance: Grayish-brown coat with reddish-brown legs, large pointed ears, and a bushy tail with a black tip.
   - Habitat: Highly adaptable, found in forests, deserts, grasslands, and increasingly in urban and suburban areas.
   - Diet: Opportunistic omnivores that feed on small mammals, birds, insects, fruits, and occasionally human refuse.
   - Behavior: Primarily nocturnal and crepuscular, often heard howling and yipping at dawn and dusk.
   - Safety: Generally avoid humans but can become bold if fed; maintain distance and never approach.

IMPORTANT: Always provide an identification. Even if the image is unclear, make your best assessment based on visible features like body shape, ear size, tail appearance, coloration patterns, and overall proportions. Common animals to consider include: coyotes, foxes, wolves, raccoons, bobcats, mountain lions, deer, rabbits, squirrels, birds, and domestic pets.

Return your response in this exact format:
COMMON NAME: [name]
SCIENTIFIC NAME: [name]

- Category: Description
- Category: Description
- Category: Description
(Continue with 6-8 bullet points)

Be thorough and educational. Each bullet point should start with a category name followed by a colon, then a detailed description. Cover aspects like size, appearance, habitat, diet, behavior, reproduction, lifespan, conservation status, and safety tips.`;

    // Call OpenAI Vision API
    console.log('🤖 Calling OpenAI Vision API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.vision.model,
        max_tokens: OPENAI_CONFIG.vision.maxTokens,
        temperature: OPENAI_CONFIG.vision.temperature,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${resizedImage.base64}`,
                  detail: 'high' // Use high detail for better analysis
                }
              }
            ]
          }
        ]
      })
    });

    console.log('📡 API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      throw new Error(`Vision API error: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('📋 API Result received, choices:', result.choices?.length);
    
    if (!result.choices || result.choices.length === 0) {
      throw new Error('No analysis results returned from Vision API');
    }

    const analysis = result.choices[0].message.content;
    console.log('📝 Analysis text length:', analysis.length);
    console.log('📝 Analysis text content:', analysis);
    
    console.log('✅ Animal image analysis completed');
    
    // Parse the analysis to extract structured data
    console.log('🔍 Parsing analysis result...');
    const structuredAnalysis = parseAnalysisResult(analysis);
    console.log('📊 Structured analysis:', structuredAnalysis);
    
    return {
      success: true,
      analysis: analysis,
      structured: structuredAnalysis,
      imageUri: resizedImage.uri,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error analyzing animal image:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Parse analysis result to extract structured data
 */
function parseAnalysisResult(analysisText) {
  try {
    const analysis = analysisText.toLowerCase();
    
    // Extract common name
    let animalType = 'unknown';
    const commonNameMatch = analysisText.match(/COMMON NAME:\s*([^\n]+)/i);
    if (commonNameMatch) {
      animalType = commonNameMatch[1].trim().toLowerCase();
    }
    
    // Extract scientific name
    let scientificName = '';
    const scientificNameMatch = analysisText.match(/SCIENTIFIC NAME:\s*([^\n]+)/i);
    if (scientificNameMatch) {
      scientificName = scientificNameMatch[1].trim();
    }
    
    // Extract description - everything after the headers
    let description = '';
    
    // First try to find content after SCIENTIFIC NAME
    const scientificNameMatch2 = analysisText.match(/SCIENTIFIC NAME:[^\n]+\n+([\s\S]+)/i);
    if (scientificNameMatch2) {
      description = scientificNameMatch2[1].trim();
    } else {
      // Fallback: try to find paragraphs after common/scientific name by splitting
      const sections = analysisText.split(/COMMON NAME:|SCIENTIFIC NAME:/i);
      if (sections.length > 2) {
        description = sections.slice(2).join(' ').trim();
      } else if (sections.length === 2) {
        // If only one header found, get content after it
        description = sections[1].split(/\n/).slice(1).join(' ').trim();
      }
    }
    
    // If still no description, use the entire analysis text
    if (!description || description.trim().length === 0) {
      description = analysisText.trim();
    }
    
    // Extract confidence levels if mentioned
    const confidenceMatches = analysis.match(/confidence[:\s]*(\d+)%?/g) || [];
    const confidences = confidenceMatches.map(match => {
      const num = match.match(/(\d+)/);
      return num ? parseInt(num[1]) : 0;
    });
    
    // Fallback: If no structured format found, try old parsing
    if (animalType === 'unknown') {
      const commonAnimals = ['coyote', 'fox', 'wolf', 'deer', 'raccoon', 'bear', 'mountain lion', 'bobcat', 'opossum', 'skunk', 'dog', 'cat', 'bird', 'squirrel', 'rabbit', 'ground squirrel', 'gray wolf', 'red fox', 'gray fox', 'kit fox', 'arctic fox', 'coyote', 'gray wolf', 'mexican wolf', 'timber wolf', 'black bear', 'grizzly bear', 'brown bear', 'polar bear', 'mountain lion', 'cougar', 'puma', 'bobcat', 'lynx', 'canada lynx', 'bobcat', 'raccoon', 'ringtail', 'coatimundi', 'opossum', 'skunk', 'striped skunk', 'spotted skunk', 'badger', 'weasel', 'mink', 'otter', 'beaver', 'porcupine', 'groundhog', 'woodchuck', 'prairie dog', 'chipmunk', 'squirrel', 'tree squirrel', 'ground squirrel', 'flying squirrel', 'rabbit', 'cottontail', 'jackrabbit', 'hare', 'deer', 'white-tailed deer', 'mule deer', 'elk', 'moose', 'antelope', 'pronghorn', 'bighorn sheep', 'mountain goat', 'domestic dog', 'domestic cat', 'feral cat', 'stray dog'];
      
      // Look for the most confident match
      let bestMatch = '';
      let maxConfidence = 0;
      
      for (const animal of commonAnimals) {
        const animalLower = animal.toLowerCase();
        const analysisLower = analysis.toLowerCase();
        
        // Check for positive mentions
        if (analysisLower.includes(animalLower)) {
          // Avoid negative mentions
          if (!analysisLower.includes(`not a ${animalLower}`) && 
              !analysisLower.includes(`unlikely to be a ${animalLower}`) &&
              !analysisLower.includes(`not ${animalLower}`) &&
              !analysisLower.includes(`doesn't appear to be a ${animalLower}`)) {
            
            // Calculate confidence based on context
            let confidence = 1;
            if (analysisLower.includes(`appears to be a ${animalLower}`)) confidence += 2;
            if (analysisLower.includes(`looks like a ${animalLower}`)) confidence += 2;
            if (analysisLower.includes(`identified as a ${animalLower}`)) confidence += 3;
            if (analysisLower.includes(`this is a ${animalLower}`)) confidence += 3;
            if (analysisLower.includes(`definitely a ${animalLower}`)) confidence += 4;
            
            if (confidence > maxConfidence) {
              maxConfidence = confidence;
              bestMatch = animalLower;
            }
          }
        }
      }
      
      if (bestMatch) {
        animalType = bestMatch;
      }
    }
    
    // Final fallback: if still unknown, try to extract from the beginning of the description
    if (animalType === 'unknown' && description) {
      const firstSentence = description.split('.')[0].toLowerCase();
      const commonAnimals = ['coyote', 'fox', 'wolf', 'deer', 'raccoon', 'bear', 'bobcat', 'dog', 'cat', 'bird', 'squirrel', 'rabbit'];
      
      for (const animal of commonAnimals) {
        if (firstSentence.includes(animal)) {
          animalType = animal;
          break;
        }
      }
    }
    
    // Check if it's specifically a coyote for backwards compatibility
    const isCoyote = animalType === 'coyote';
    
    // Determine health status
    let healthStatus = 'unknown';
    if (analysis.includes('healthy') || analysis.includes('good condition')) {
      healthStatus = 'healthy';
    } else if (analysis.includes('unhealthy') || analysis.includes('concerning') || 
               analysis.includes('mange') || analysis.includes('injured')) {
      healthStatus = 'unhealthy';
    } else if (analysis.includes('poor condition') || analysis.includes('distress')) {
      healthStatus = 'poor';
    }
    
    // Check for urgent concerns
    const hasUrgentConcerns = analysis.includes('contact animal control') || 
                             analysis.includes('rabies') || 
                             analysis.includes('aggressive') ||
                             analysis.includes('immediate');
    
    // Extract behavior information
    let behavior = 'Not observed';
    if (analysis.includes('aggressive') || analysis.includes('threatening')) {
      behavior = 'Aggressive/Threatening';
    } else if (analysis.includes('friendly') || analysis.includes('docile')) {
      behavior = 'Friendly/Docile';
    } else if (analysis.includes('fearful') || analysis.includes('scared')) {
      behavior = 'Fearful/Anxious';
    } else if (analysis.includes('normal') || analysis.includes('typical')) {
      behavior = 'Normal behavior';
    }

    // Use the description we extracted earlier, or provide a fallback
    if (!description || description.trim().length === 0) {
      description = 'Animal analysis completed.';
    }

    return {
      animalType: animalType,
      scientificName: scientificName,
      isCoyote: isCoyote, // Keep for backwards compatibility
      identificationConfidence: confidences[0] || 0,
      healthStatus: healthStatus,
      healthConfidence: confidences[1] || confidences[0] || 0,
      hasUrgentConcerns: hasUrgentConcerns,
      avgConfidence: confidences.length > 0 ? 
        confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
      // Add fields that the UI expects
      confidence: confidences[0] || 0,
      health: healthStatus,
      behavior: behavior,
      description: description
    };
  } catch (error) {
    console.error('Error parsing analysis result:', error);
    return {
      animalType: 'unknown',
      isCoyote: false,
      identificationConfidence: 0,
      healthStatus: 'unknown',
      healthConfidence: 0,
      hasUrgentConcerns: false,
      avgConfidence: 0,
      // Add fields that the UI expects
      confidence: 0,
      health: 'unknown',
      behavior: 'Not observed',
      description: 'Analysis failed to parse results.'
    };
  }
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use analyzeAnimalImage instead
 */
export async function analyzeCoyoteImage(imageUri) {
  return await analyzeAnimalImage(imageUri);
}

/**
 * Get a quick summary for chat display
 */
export function getAnalysisSummary(analysisResult) {
  if (!analysisResult.success) {
    return `❌ Image analysis failed: ${analysisResult.error}`;
  }

  const { structured, analysis } = analysisResult;
  
  let summary = '';
  
  // Animal identification
  const animalEmojis = {
    'dog': '🐕',
    'cat': '🐱',
    'coyote': '🐺',
    'fox': '🦊',
    'wolf': '🐺',
    'deer': '🦌',
    'raccoon': '🦝',
    'bird': '🐦',
    'squirrel': '🐿️',
    'rabbit': '🐰',
    'bear': '🐻',
    'mountain lion': '🦁',
    'bobcat': '🐱',
    'opossum': '🐀',
    'skunk': '🦨',
    'unknown': '🐾'
  };
  
  const animalEmoji = animalEmojis[structured.animalType] || '🐾';
  const animalName = structured.animalType.toUpperCase();
  
  summary += `${animalEmoji} **${animalName} IDENTIFIED** (${structured.identificationConfidence}% confidence)\n\n`;
  
  // Health assessment
  const healthEmoji = {
    'healthy': '✅',
    'unhealthy': '⚠️',
    'poor': '🚨',
    'unknown': '❓'
  };
  
  summary += `${healthEmoji[structured.healthStatus] || '❓'} **Health**: ${structured.healthStatus.toUpperCase()}`;
  if (structured.healthConfidence > 0) {
    summary += ` (${structured.healthConfidence}% confidence)`;
  }
  summary += '\n\n';
  
  // Urgent concerns
  if (structured.hasUrgentConcerns) {
    const isWildlife = ['coyote', 'fox', 'wolf', 'bear', 'mountain lion', 'bobcat'].includes(structured.animalType);
    const contactService = isWildlife ? 'wildlife services' : 'animal control';
    summary += `🚨 **URGENT**: Contact ${contactService} immediately!\n\n`;
  }
  
  // Add first few lines of detailed analysis
  const analysisLines = analysis.split('\n').slice(0, 3);
  summary += analysisLines.join('\n');
  
  return summary;
}

