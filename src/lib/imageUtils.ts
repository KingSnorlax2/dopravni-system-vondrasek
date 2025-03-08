import sharp from 'sharp';

/**
 * Process image with various optimization options
 */
export async function processImage(buffer: Buffer, options: { maxWidth?: number; maxHeight?: number; quality?: number; format?: string; fit?: string } = {}) {
  const {
    maxWidth = 1500,
    maxHeight = 1500,
    quality = 85,
    format = 'webp',
    fit = 'inside'
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Process image
    const processed = sharp(buffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: fit as keyof sharp.FitEnum,
        withoutEnlargement: true
      });
    
    // Apply format with appropriate settings
    if (format === 'webp') {
      return processed.webp({ quality }).toBuffer();
    } else if (format === 'jpeg' || format === 'jpg') {
      return processed.jpeg({ quality }).toBuffer();
    } else if (format === 'png') {
      return processed.png({ quality: Math.min(100, quality + 5) }).toBuffer();
    } else {
      return processed.webp({ quality }).toBuffer();
    }
  } catch (error) {
    console.error('Image processing error:', error);
    // Return original if processing fails
    return buffer;
  }
}

/**
 * Generate a thumbnail with optimal settings
 */
export async function generateThumbnail(buffer: Buffer, options: { width?: number; height?: number; quality?: number; fit?: string } = {}) {
  const {
    width = 300,
    height = 200,
    quality = 75,
    fit = 'cover'
  } = options;

  return processImage(buffer, {
    maxWidth: width,
    maxHeight: height,
    quality,
    format: 'webp',
    fit
  });
}

/**
 * Advanced image processing for various use cases
 */
export const imageProcessor = {
  // Create a low-quality preview for fast loading
  createPreview: async (buffer: Buffer) => {
    return sharp(buffer)
      .resize(40, 40, { fit: 'inside' })
      .blur(3)
      .webp({ quality: 20 })
      .toBuffer();
  },
  
  // Optimize image for gallery display
  optimizeForGallery: async (buffer: Buffer) => {
    return processImage(buffer, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 80
    });
  },
  
  // Create high-quality version for full-screen view
  createHighQuality: async (buffer: Buffer) => {
    return processImage(buffer, {
      maxWidth: 1800,
      maxHeight: 1200,
      quality: 90
    });
  }
}; 